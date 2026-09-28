import { AtsAuditResult, EngineeringRole, FactEntry } from '../types';
import { sha256 } from '../utils/hash';

const TECH_KEYWORD_MATCHERS = [
  'Kubernetes',
  'Docker',
  'AWS',
  'GCP',
  'Azure',
  'Terraform',
  'Kafka',
  'TypeScript',
  'Python',
  'Go',
  'Golang',
  'Rust',
  'PostgreSQL',
  'Snowflake',
  'Databricks',
  'ClickHouse',
  'Redis',
  'GraphQL',
  'Next.js',
  'React',
  'PyTorch',
  'LLM',
  'OpenAI',
  'FastAPI',
];

export async function runAtsAudit(rawDomain: string): Promise<{ audit: AtsAuditResult; facts: FactEntry[] }> {
  const domain = rawDomain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim().toLowerCase();
  const slug = domain.split('.')[0];
  const now = new Date().toISOString();
  const facts: FactEntry[] = [];

  let provider: AtsAuditResult['provider'] = 'none';
  let totalOpenRoles = 0;
  let rawJobs: any[] = [];

  // 1. Try Greenhouse Public API
  try {
    const ghRes = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`, {
      signal: AbortSignal.timeout(4000),
    });
    if (ghRes.ok) {
      const ghData = await ghRes.json();
      if (ghData.jobs && Array.isArray(ghData.jobs) && ghData.jobs.length > 0) {
        provider = 'greenhouse';
        totalOpenRoles = ghData.jobs.length;
        rawJobs = ghData.jobs.map((j: any) => ({
          id: String(j.id),
          title: j.title,
          location: j.location?.name || 'Remote',
          url: j.absolute_url || '',
          department: (j.departments && j.departments[0]?.name) || 'Engineering',
          content: j.title, // Title string to scan keywords
        }));
      }
    }
  } catch {
    // Continue to Lever
  }

  // 2. Try Lever Public API if Greenhouse not found
  if (provider === 'none') {
    try {
      const leverRes = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`, {
        signal: AbortSignal.timeout(4000),
      });
      if (leverRes.ok) {
        const leverData = await leverRes.json();
        if (Array.isArray(leverData) && leverData.length > 0) {
          provider = 'lever';
          totalOpenRoles = leverData.length;
          rawJobs = leverData.map((j: any) => ({
            id: j.id,
            title: j.text,
            location: j.categories?.location || 'Remote',
            url: j.hostedUrl || '',
            department: j.categories?.team || 'Engineering',
            content: `${j.text} ${j.descriptionPlain || ''}`,
          }));
        }
      }
    } catch {
      // No public ATS found
    }
  }

  // 3. Filter for Engineering & Tech Roles
  const engPattern = /(engineer|developer|architect|infrastructure|devops|sre|security|data|platform|machine learning|ai|backend|frontend|fullstack)/i;
  const engineeringRoles: EngineeringRole[] = [];
  const keywordCounts: Record<string, number> = {};

  for (const job of rawJobs) {
    const isEng = engPattern.test(job.title) || engPattern.test(job.department);
    const textToScan = `${job.title} ${job.content || ''}`;
    const detectedKeywords: string[] = [];

    for (const kw of TECH_KEYWORD_MATCHERS) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(textToScan)) {
        detectedKeywords.push(kw);
        keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
      }
    }

    if (isEng || detectedKeywords.length > 0) {
      engineeringRoles.push({
        id: job.id,
        title: job.title,
        location: job.location,
        url: job.url,
        department: job.department,
        keyTechKeywords: detectedKeywords,
      });
    }
  }

  // 4. Sort top keywords
  const topEngineeringKeywords = Object.entries(keywordCounts)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 5. Determine Velocity
  let hiringVelocityIndex: AtsAuditResult['hiringVelocityIndex'] = 'No Public Postings';
  if (totalOpenRoles > 25) {
    hiringVelocityIndex = 'Aggressive Expansion';
  } else if (totalOpenRoles > 5) {
    hiringVelocityIndex = 'Steady Engineering Growth';
  } else if (totalOpenRoles > 0) {
    hiringVelocityIndex = 'Selective Replacement';
  }

  // 6. Generate Facts
  if (provider !== 'none') {
    const rawProof = `${provider.toUpperCase()} ATS Board: ${totalOpenRoles} open roles (${engineeringRoles.length} technical)`;
    facts.push({
      id: `FACT_ATS_BOARD_${slug.toUpperCase()}`,
      category: 'HIRING_SIGNALS',
      label: `Public ATS: ${provider.toUpperCase()} (${totalOpenRoles} Total Postings)`,
      verificationLevel: 'ATS_API_VERIFIED',
      rawProof,
      source: `Public ATS API (${provider})`,
      sha256: await sha256(rawProof),
      timestamp: now,
      confidence: 100,
    });

    if (engineeringRoles.length > 0) {
      const topRole = engineeringRoles[0];
      const roleProof = `Role: "${topRole.title}" in ${topRole.location}`;
      facts.push({
        id: `FACT_ATS_TOP_ROLE_${topRole.id}`,
        category: 'HIRING_SIGNALS',
        label: `Active Headcount Need: ${topRole.title}`,
        verificationLevel: 'ATS_API_VERIFIED',
        rawProof: roleProof,
        source: `Public ${provider.toUpperCase()} Job Listing`,
        sha256: await sha256(roleProof),
        timestamp: now,
        confidence: 100,
      });
    }

    if (topEngineeringKeywords.length > 0) {
      const kwList = topEngineeringKeywords.slice(0, 4).map((k) => `${k.keyword} (${k.count})`).join(', ');
      const kwProof = `Top Tech Mentions in Job Specs: ${kwList}`;
      facts.push({
        id: `FACT_ATS_STACK_KEYWORDS_${slug.toUpperCase()}`,
        category: 'TECH_STACK',
        label: `Core Tech Stack in Hiring Specs: ${topEngineeringKeywords.slice(0, 3).map((k) => k.keyword).join(', ')}`,
        verificationLevel: 'ATS_API_VERIFIED',
        rawProof: kwProof,
        source: `Aggregated ${provider.toUpperCase()} Job Descriptions`,
        sha256: await sha256(kwProof),
        timestamp: now,
        confidence: 100,
      });
    }
  }

  const audit: AtsAuditResult = {
    provider,
    slug: provider !== 'none' ? slug : null,
    totalOpenRoles,
    engineeringRoles: engineeringRoles.slice(0, 15),
    topEngineeringKeywords,
    hiringVelocityIndex,
  };

  return { audit, facts };
}
