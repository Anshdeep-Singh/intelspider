import * as cheerio from 'cheerio';
import { HttpTechAuditResult, DetectedTechnology, FactEntry } from '../types';
import { sha256 } from '../utils/hash';

interface TechSignature {
  name: string;
  category: DetectedTechnology['category'];
  patterns: RegExp[];
  confidence: number;
}

const TECH_SIGNATURES: TechSignature[] = [
  // Frontend Frameworks
  {
    name: 'Next.js',
    category: 'Frontend',
    patterns: [/__NEXT_DATA__/i, /\/_next\/static\//i, /x-nextjs-cache/i],
    confidence: 100,
  },
  {
    name: 'React',
    category: 'Frontend',
    patterns: [/react\.production\.min\.js/i, /_reactRootContainer/i, /data-reactroot/i, /react-dom/i],
    confidence: 95,
  },
  {
    name: 'Nuxt.js / Vue',
    category: 'Frontend',
    patterns: [/__NUXT__/i, /\/_nuxt\//i, /vue\.runtime/i],
    confidence: 100,
  },
  {
    name: 'Webflow',
    category: 'Frontend',
    patterns: [/uploads-ssl\.webflow\.com/i, /data-wf-page/i, /webflow\.js/i],
    confidence: 100,
  },

  // Customer Data Platforms & Tag Managers
  {
    name: 'Segment CDP',
    category: 'TagManager',
    patterns: [/cdn\.segment\.com\/analytics\.js/i, /analytics\.load\(/i],
    confidence: 100,
  },
  {
    name: 'Google Tag Manager',
    category: 'TagManager',
    patterns: [/googletagmanager\.com\/gtm\.js/i, /GTM-[A-Z0-9]+/i],
    confidence: 100,
  },
  {
    name: 'RudderStack',
    category: 'TagManager',
    patterns: [/cdn\.rudderlabs\.com/i, /rudderanalytics/i],
    confidence: 100,
  },

  // Product Analytics
  {
    name: 'PostHog Product Analytics',
    category: 'Analytics',
    patterns: [/app\.posthog\.com/i, /posthog\.init\(/i, /cdn\.posthog\.com/i],
    confidence: 100,
  },
  {
    name: 'Mixpanel',
    category: 'Analytics',
    patterns: [/cdn\.mxpnl\.com/i, /mixpanel\.init/i],
    confidence: 100,
  },
  {
    name: 'Amplitude',
    category: 'Analytics',
    patterns: [/cdn\.amplitude\.com/i, /amplitude\.init/i],
    confidence: 100,
  },

  // Observability & Session Replay
  {
    name: 'Datadog RUM',
    category: 'Observability',
    patterns: [/datadog-rum/i, /datadoghq-browser-agent/i, /datadogRum\.init/i],
    confidence: 100,
  },
  {
    name: 'Sentry Error Tracking',
    category: 'Observability',
    patterns: [/browser\.sentry-cdn\.com/i, /sentry\.io/i, /Sentry\.init/i],
    confidence: 100,
  },
  {
    name: 'FullStory Session Replay',
    category: 'Observability',
    patterns: [/fullstory\.com\/s\/fs\.js/i, /window\['_fs_debug'\]/i],
    confidence: 100,
  },

  // Customer Chat & CRM
  {
    name: 'Intercom Messenger',
    category: 'Chat',
    patterns: [/widget\.intercom\.io/i, /intercomSettings/i],
    confidence: 100,
  },
  {
    name: 'HubSpot Inbound & CRM',
    category: 'CRM',
    patterns: [/js\.hs-scripts\.com/i, /js\.hsforms\.net/i, /hubspot\.com/i],
    confidence: 100,
  },
  {
    name: 'Zendesk Support',
    category: 'Chat',
    patterns: [/static\.zdassets\.com/i, /ekr\.zdassets\.com/i],
    confidence: 100,
  },

  // CDN & Hosting Edge
  {
    name: 'Cloudflare Edge & Security',
    category: 'CDN',
    patterns: [/challenges\.cloudflare\.com/i, /cf-cache-status/i, /cf-ray/i],
    confidence: 100,
  },
  {
    name: 'Vercel Edge Platform',
    category: 'CDN',
    patterns: [/x-vercel-id/i, /x-vercel-cache/i, /vercel\.app/i],
    confidence: 100,
  },
];

export async function runHttpAudit(rawDomain: string): Promise<{ audit: HttpTechAuditResult; facts: FactEntry[] }> {
  const domain = rawDomain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim().toLowerCase();
  const url = `https://${domain}`;
  const now = new Date().toISOString();
  const facts: FactEntry[] = [];

  let status = 0;
  const headers: Record<string, string> = {};
  let html = '';
  let finalUrl = url;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
    });

    status = res.status;
    finalUrl = res.url || url;

    res.headers.forEach((val, key) => {
      headers[key.toLowerCase()] = val;
    });

    // Extract HTML up to first 250KB for fast analysis
    const fullHtml = await res.text();
    html = fullHtml.slice(0, 250000);
  } catch (err: any) {
    // Graceful fallback if target domain blocks direct scrape
    status = 0;
  }

  // 1. Analyze Security Headers
  const hsts = !!headers['strict-transport-security'];
  const csp = !!headers['content-security-policy'];
  const xFrameOptions = headers['x-frame-options'] || null;
  const xContentTypeOptions = !!headers['x-content-type-options'];
  const serverHeader = headers['server'] || null;

  if (hsts) {
    const rawProof = `Strict-Transport-Security: ${headers['strict-transport-security']}`;
    facts.push({
      id: `FACT_SEC_HSTS_${domain.replace(/[^a-z0-9]/g, '_')}`,
      category: 'SECURITY',
      label: 'HTTP Strict Transport Security (HSTS) Active',
      verificationLevel: 'HTTP_HEADER_VERIFIED',
      rawProof,
      source: `HTTPS Response Header (${finalUrl})`,
      sha256: await sha256(rawProof),
      timestamp: now,
      confidence: 100,
    });
  }

  if (csp) {
    const rawProof = `Content-Security-Policy: ${headers['content-security-policy'].slice(0, 100)}...`;
    facts.push({
      id: `FACT_SEC_CSP_${domain.replace(/[^a-z0-9]/g, '_')}`,
      category: 'SECURITY',
      label: 'Content Security Policy (CSP) Enforced',
      verificationLevel: 'HTTP_HEADER_VERIFIED',
      rawProof,
      source: `HTTPS Response Header (${finalUrl})`,
      sha256: await sha256(rawProof),
      timestamp: now,
      confidence: 100,
    });
  }

  if (serverHeader) {
    const rawProof = `Server: ${serverHeader}`;
    facts.push({
      id: `FACT_INFRA_SERVER_${domain.replace(/[^a-z0-9]/g, '_')}`,
      category: 'INFRASTRUCTURE',
      label: `Web Ingress Server: ${serverHeader}`,
      verificationLevel: 'HTTP_HEADER_VERIFIED',
      rawProof,
      source: `HTTPS Response Header (${finalUrl})`,
      sha256: await sha256(rawProof),
      timestamp: now,
      confidence: 100,
    });
  }

  if (headers['x-vercel-id']) {
    const rawProof = `x-vercel-id: ${headers['x-vercel-id']}`;
    facts.push({
      id: `FACT_INFRA_VERCEL_${domain.replace(/[^a-z0-9]/g, '_')}`,
      category: 'INFRASTRUCTURE',
      label: 'Frontend Hosted on Vercel Edge Network',
      verificationLevel: 'HTTP_HEADER_VERIFIED',
      rawProof,
      source: `HTTPS Response Header (${finalUrl})`,
      sha256: await sha256(rawProof),
      timestamp: now,
      confidence: 100,
    });
  }

  // 2. Parse DOM with Cheerio & Detect Signatures
  const detectedTechnologies: DetectedTechnology[] = [];
  const headerCombined = Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  const inspectCorpus = `${headerCombined}\n${html}`;

  if (html) {
    const $ = cheerio.load(html);
    const scriptSrcs: string[] = [];
    $('script').each((_, el) => {
      const src = $(el).attr('src');
      if (src) scriptSrcs.push(src);
    });

    for (const tech of TECH_SIGNATURES) {
      for (const pattern of tech.patterns) {
        if (pattern.test(inspectCorpus)) {
          // Find matching proof snippet
          let snippet = '';
          const matchedSrc = scriptSrcs.find((s) => pattern.test(s));
          if (matchedSrc) {
            snippet = `<script src="${matchedSrc.slice(0, 150)}">`;
          } else {
            const match = inspectCorpus.match(pattern);
            snippet = match ? match[0].slice(0, 150) : pattern.source;
          }

          detectedTechnologies.push({
            name: tech.name,
            category: tech.category,
            matchedPattern: pattern.source,
            confidence: tech.confidence,
            proofSnippet: snippet,
          });

          facts.push({
            id: `FACT_TECH_${tech.name.replace(/[^a-z0-9]/gi, '_').toUpperCase()}`,
            category: 'TECH_STACK',
            label: `${tech.category}: ${tech.name}`,
            verificationLevel: 'DOM_SIGNATURE_VERIFIED',
            rawProof: snippet,
            source: `HTML DOM / HTTP Probe (${finalUrl})`,
            sha256: await sha256(snippet),
            timestamp: now,
            confidence: tech.confidence,
          });

          break; // Avoid duplicate detections for same tech
        }
      }
    }
  }

  const audit: HttpTechAuditResult = {
    domain,
    finalUrl,
    status,
    headers,
    securityHeaders: {
      hsts,
      csp,
      xFrameOptions,
      xContentTypeOptions,
    },
    serverHeader,
    detectedTechnologies,
  };

  return { audit, facts };
}
