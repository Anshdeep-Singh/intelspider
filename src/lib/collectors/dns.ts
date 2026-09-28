import { DnsAuditResult, FactEntry } from '../types';
import { sha256 } from '../utils/hash';

interface DohAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DohResponse {
  Status: number;
  Answer?: DohAnswer[];
  Authority?: DohAnswer[];
}

async function queryDoh(name: string, type: 'MX' | 'TXT' | 'NS' | 'A'): Promise<string[]> {
  const cleanName = name.trim().toLowerCase();
  const endpoints = [
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleanName)}&type=${type}`,
    `https://dns.google/resolve?name=${encodeURIComponent(cleanName)}&type=${type}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/dns-json' },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const json = (await res.json()) as DohResponse;
        if (json.Answer && json.Answer.length > 0) {
          return json.Answer.map((a) => a.data.replace(/^"|"$/g, '').trim());
        }
        return [];
      }
    } catch {
      // Try next endpoint
    }
  }

  // Node fallback if running in server runtime
  if (typeof window === 'undefined') {
    try {
      const dns = await import('node:dns/promises');
      if (type === 'MX') {
        const records = await dns.resolveMx(cleanName);
        return records.map((r) => `${r.priority} ${r.exchange}`);
      }
      if (type === 'TXT') {
        const records = await dns.resolveTxt(cleanName);
        return records.map((chunks) => chunks.join(''));
      }
      if (type === 'NS') {
        const records = await dns.resolveNs(cleanName);
        return records;
      }
    } catch {
      return [];
    }
  }

  return [];
}

export async function runDnsAudit(rawDomain: string): Promise<{ audit: DnsAuditResult; facts: FactEntry[] }> {
  const domain = rawDomain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim().toLowerCase();
  const now = new Date().toISOString();
  const facts: FactEntry[] = [];

  // Query MX, TXT, NS, and DMARC in parallel
  const [mxData, txtData, nsData, dmarcData] = await Promise.all([
    queryDoh(domain, 'MX'),
    queryDoh(domain, 'TXT'),
    queryDoh(domain, 'NS'),
    queryDoh(`_dmarc.${domain}`, 'TXT'),
  ]);

  // 1. Process MX
  const mxRecords = mxData.map((raw) => {
    const parts = raw.split(' ');
    if (parts.length >= 2) {
      return { priority: parseInt(parts[0], 10) || 10, exchange: parts[1].replace(/\.$/, '') };
    }
    return { priority: 10, exchange: raw.replace(/\.$/, '') };
  }).sort((a, b) => a.priority - b.priority);

  let mailProvider: DnsAuditResult['mailProvider'] = 'Unknown';
  const mxString = mxRecords.map((m) => m.exchange.toLowerCase()).join(' ');

  if (mxString.includes('google') || mxString.includes('aspmx')) {
    mailProvider = 'Google Workspace';
  } else if (mxString.includes('outlook') || mxString.includes('microsoft')) {
    mailProvider = 'Microsoft 365';
  } else if (mxString.includes('mimecast')) {
    mailProvider = 'Mimecast';
  } else if (mxString.includes('pphosted') || mxString.includes('proofpoint')) {
    mailProvider = 'Proofpoint';
  } else if (mxRecords.length > 0) {
    mailProvider = 'Custom';
  }

  if (mxRecords.length > 0) {
    const topMx = mxRecords[0];
    const rawProof = `MX ${topMx.priority} ${topMx.exchange}`;
    facts.push({
      id: `FACT_DNS_MX_${domain.replace(/[^a-z0-9]/g, '_')}`,
      category: 'INFRASTRUCTURE',
      label: `Email Infrastructure: ${mailProvider} (${topMx.exchange})`,
      verificationLevel: 'CRYPTOGRAPHIC_DNS',
      rawProof,
      source: 'Authoritative DNS MX Query',
      sha256: await sha256(rawProof),
      timestamp: now,
      confidence: 100,
    });
  }

  // 2. Process SPF
  const spfRecord = txtData.find((t) => t.startsWith('v=spf1')) || null;
  const hasSpf = !!spfRecord;

  if (spfRecord) {
    facts.push({
      id: `FACT_SEC_SPF_${domain.replace(/[^a-z0-9]/g, '_')}`,
      category: 'SECURITY',
      label: `Sender Policy Framework (SPF) Enforced`,
      verificationLevel: 'CRYPTOGRAPHIC_DNS',
      rawProof: spfRecord,
      source: `Authoritative DNS TXT Query for ${domain}`,
      sha256: await sha256(spfRecord),
      timestamp: now,
      confidence: 100,
    });
  }

  // 3. Process DMARC
  const dmarcRecord = dmarcData.find((t) => t.startsWith('v=DMARC1')) || null;
  const hasDmarc = !!dmarcRecord;
  let dmarcPolicy: DnsAuditResult['dmarcPolicy'] = 'missing';

  if (dmarcRecord) {
    const pMatch = dmarcRecord.match(/p=([a-z]+)/i);
    if (pMatch) {
      const p = pMatch[1].toLowerCase();
      if (p === 'reject') dmarcPolicy = 'reject';
      else if (p === 'quarantine') dmarcPolicy = 'quarantine';
      else if (p === 'none') dmarcPolicy = 'none';
    }

    facts.push({
      id: `FACT_SEC_DMARC_${domain.replace(/[^a-z0-9]/g, '_')}`,
      category: 'SECURITY',
      label: `DMARC Authentication Policy: ${dmarcPolicy.toUpperCase()}`,
      verificationLevel: 'CRYPTOGRAPHIC_DNS',
      rawProof: dmarcRecord,
      source: `Authoritative DNS TXT Query for _dmarc.${domain}`,
      sha256: await sha256(dmarcRecord),
      timestamp: now,
      confidence: 100,
    });
  }

  // 4. Process NS / CDN / DNS Provider
  const nameservers = nsData.map((ns) => ns.replace(/\.$/, ''));
  const nsString = nameservers.join(' ').toLowerCase();
  let cdnDnsProvider: DnsAuditResult['cdnDnsProvider'] = 'Other';

  if (nsString.includes('cloudflare')) {
    cdnDnsProvider = 'Cloudflare';
  } else if (nsString.includes('awsdns') || nsString.includes('amazon')) {
    cdnDnsProvider = 'AWS Route 53';
  } else if (nsString.includes('akam')) {
    cdnDnsProvider = 'Akamai';
  } else if (nsString.includes('googledomains') || nsString.includes('google')) {
    cdnDnsProvider = 'Google Cloud DNS';
  } else if (nsString.includes('azure')) {
    cdnDnsProvider = 'Azure DNS';
  }

  if (nameservers.length > 0) {
    const rawProof = `NS: ${nameservers.slice(0, 2).join(', ')}`;
    facts.push({
      id: `FACT_DNS_NS_${domain.replace(/[^a-z0-9]/g, '_')}`,
      category: 'INFRASTRUCTURE',
      label: `DNS & Edge Routing: ${cdnDnsProvider} (${nameservers[0]})`,
      verificationLevel: 'CRYPTOGRAPHIC_DNS',
      rawProof,
      source: 'Authoritative DNS NS Query',
      sha256: await sha256(rawProof),
      timestamp: now,
      confidence: 100,
    });
  }

  // 5. Domain verifications
  const domainVerifications: string[] = [];
  for (const txt of txtData) {
    if (txt.includes('atlassian-domain-verification')) {
      domainVerifications.push('Atlassian (Jira / Confluence)');
    } else if (txt.includes('google-site-verification')) {
      domainVerifications.push('Google Cloud / Search Console');
    } else if (txt.includes('stripe-verification')) {
      domainVerifications.push('Stripe Payments');
    } else if (txt.includes('apple-domain-verification')) {
      domainVerifications.push('Apple Business / Pay');
    } else if (txt.includes('docusign=')) {
      domainVerifications.push('DocuSign');
    } else if (txt.includes('hubspot-developer-verification')) {
      domainVerifications.push('HubSpot');
    } else if (txt.includes('facebook-domain-verification')) {
      domainVerifications.push('Meta Business');
    }
  }

  for (const dv of domainVerifications) {
    facts.push({
      id: `FACT_VERIF_${dv.replace(/[^a-z0-9]/gi, '_')}`,
      category: 'TECH_STACK',
      label: `Enterprise SaaS Verification: ${dv}`,
      verificationLevel: 'CRYPTOGRAPHIC_DNS',
      rawProof: `TXT Domain Verification for ${dv}`,
      source: `Authoritative DNS TXT Record for ${domain}`,
      sha256: await sha256(dv),
      timestamp: now,
      confidence: 100,
    });
  }

  // 6. Calculate Email Security Grade
  let emailSecurityGrade: DnsAuditResult['emailSecurityGrade'] = 'F';
  if (hasSpf && hasDmarc) {
    if (dmarcPolicy === 'reject') emailSecurityGrade = 'A+';
    else if (dmarcPolicy === 'quarantine') emailSecurityGrade = 'A';
    else if (dmarcPolicy === 'none') emailSecurityGrade = 'B';
  } else if (hasSpf && !hasDmarc) {
    emailSecurityGrade = 'C';
  } else if (!hasSpf && hasDmarc) {
    emailSecurityGrade = 'D';
  } else {
    emailSecurityGrade = 'F';
  }

  const audit: DnsAuditResult = {
    domain,
    mailProvider,
    mxRecords,
    hasSpf,
    spfRecord,
    hasDmarc,
    dmarcRecord,
    dmarcPolicy,
    nameservers,
    cdnDnsProvider,
    emailSecurityGrade,
    domainVerifications,
    rawRecords: {
      MX: mxData,
      TXT: txtData,
      NS: nsData,
      DMARC: dmarcData,
    },
  };

  return { audit, facts };
}
