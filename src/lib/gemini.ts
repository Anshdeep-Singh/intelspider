import {
  AuditLedger,
  DnsAuditResult,
  ExecutiveBattlecard,
  HttpTechAuditResult,
  AtsAuditResult,
} from './types';
import { verifyBattlecardGrounding } from './audit/verifier';

export async function generateGroundedBattlecard(
  domain: string,
  dnsAudit: DnsAuditResult,
  httpAudit: HttpTechAuditResult,
  atsAudit: AtsAuditResult,
  ledger: AuditLedger,
  geminiApiKey?: string
): Promise<ExecutiveBattlecard> {
  const companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const llmResult = await callGeminiLLM(domain, companyName, dnsAudit, httpAudit, atsAudit, ledger, apiKey);
      if (llmResult) {
        // Run audit verification on LLM output
        llmResult.auditSummary = verifyBattlecardGrounding(llmResult, ledger);
        return llmResult;
      }
    } catch (err) {
      console.warn('Gemini LLM call failed or timed out, falling back to deterministic synthesis:', err);
    }
  }

  // Deterministic Grounded Synthesizer (Zero-Hallucination, 100% Fact-Tethered)
  return buildDeterministicBattlecard(domain, companyName, dnsAudit, httpAudit, atsAudit, ledger);
}

function buildDeterministicBattlecard(
  domain: string,
  companyName: string,
  dns: DnsAuditResult,
  http: HttpTechAuditResult,
  ats: AtsAuditResult,
  ledger: AuditLedger
): ExecutiveBattlecard {
  const facts = ledger.facts;
  const mxFact = facts.find((f) => f.id.startsWith('FACT_DNS_MX'));
  const dmarcFact = facts.find((f) => f.id.startsWith('FACT_SEC_DMARC'));
  const spfFact = facts.find((f) => f.id.startsWith('FACT_SEC_SPF'));
  const cdnFact = facts.find((f) => f.id.startsWith('FACT_DNS_NS'));
  const vercelFact = facts.find((f) => f.id.startsWith('FACT_INFRA_VERCEL'));
  const serverFact = facts.find((f) => f.id.startsWith('FACT_INFRA_SERVER'));

  const cdpFact = facts.find((f) => f.id.includes('SEGMENT') || f.id.includes('RUDDERSTACK'));
  const analyticsFact = facts.find((f) => f.id.includes('POSTHOG') || f.id.includes('AMPLITUDE') || f.id.includes('MIXPANEL'));
  const obsFact = facts.find((f) => f.id.includes('DATADOG') || f.id.includes('SENTRY') || f.id.includes('FULLSTORY'));
  const chatFact = facts.find((f) => f.id.includes('INTERCOM') || f.id.includes('ZENDESK') || f.id.includes('HUBSPOT'));

  const atsBoardFact = facts.find((f) => f.id.startsWith('FACT_ATS_BOARD'));
  const atsRoleFact = facts.find((f) => f.id.startsWith('FACT_ATS_TOP_ROLE'));
  const atsKwFact = facts.find((f) => f.id.startsWith('FACT_ATS_STACK_KEYWORDS'));

  // Determine maturity tier
  let estimatedEngMaturity: ExecutiveBattlecard['targetProfile']['estimatedEngMaturity'] = 'Mid-Market Modern';
  if (ats.totalOpenRoles > 20 || dns.emailSecurityGrade === 'A+' && obsFact) {
    estimatedEngMaturity = 'Enterprise Tier 1';
  } else if (ats.totalOpenRoles > 5 || vercelFact) {
    estimatedEngMaturity = 'High-Growth Scaleup';
  }

  // 1. CTO Hook
  const ctoCitations: string[] = [];
  let ctoThesis = `Modern cloud infrastructure utilizing ${cdnFact ? dns.cdnDnsProvider : 'distributed edge routing'}`;
  let ctoHook = `We noticed ${companyName}'s edge infrastructure is routed via ${dns.cdnDnsProvider}.`;
  if (cdnFact) ctoCitations.push(cdnFact.id);

  if (dmarcFact) {
    ctoCitations.push(dmarcFact.id);
    if (dns.dmarcPolicy === 'reject') {
      ctoHook += ` With strict DMARC enforcement (${dns.dmarcPolicy.toUpperCase()} policy [${dmarcFact.id}]), your team maintains high security hygiene.`;
    } else {
      ctoHook += ` Note: DMARC is currently set to ${dns.dmarcPolicy.toUpperCase()} [${dmarcFact.id}], exposing outbound corporate comms to spoofing risk.`;
    }
  }

  if (obsFact) {
    ctoCitations.push(obsFact.id);
    ctoHook += ` Observed client-side observability through [${obsFact.id}].`;
  }

  // 2. VP Engineering Hook
  const vpCitations: string[] = [];
  let vpThesis = `Engineering capacity scaling with ${ats.totalOpenRoles} open roles`;
  let vpHook = `With ${ats.totalOpenRoles} active openings on ${ats.provider.toUpperCase()} [${atsBoardFact ? atsBoardFact.id : 'N/A'}], engineering is prioritizing team bandwidth.`;
  if (atsBoardFact) vpCitations.push(atsBoardFact.id);

  if (atsRoleFact && ats.engineeringRoles.length > 0) {
    vpCitations.push(atsRoleFact.id);
    const topRole = ats.engineeringRoles[0];
    vpHook += ` Specifically hiring for "${topRole.title}" [${atsRoleFact.id}].`;
  }

  if (atsKwFact && ats.topEngineeringKeywords.length > 0) {
    vpCitations.push(atsKwFact.id);
    const kwNames = ats.topEngineeringKeywords.slice(0, 3).map((k) => k.keyword).join(', ');
    vpHook += ` Core architecture specifications frequently mandate ${kwNames} [${atsKwFact.id}].`;
  }

  // 3. CRO Hook
  const croCitations: string[] = [];
  let croThesis = `Revenue operations and digital conversion pipeline`;
  let croHook = `${companyName} handles corporate messaging via ${dns.mailProvider}`;
  if (mxFact) {
    croCitations.push(mxFact.id);
    croHook += ` [${mxFact.id}].`;
  }

  if (chatFact) {
    croCitations.push(chatFact.id);
    croHook += ` Customer engagement is powered by [${chatFact.id}], allowing direct funnel attribution.`;
  }

  if (cdpFact) {
    croCitations.push(cdpFact.id);
    croHook += ` Data pipeline is unified using [${cdpFact.id}].`;
  }

  // High-Stakes Discovery Questions
  const highStakesDiscoveryQuestions = [
    {
      question: `How are you managing authentication and data isolation given your reliance on ${dns.cdnDnsProvider} edge routing?`,
      rationale: `Target is utilizing ${dns.cdnDnsProvider} for global DNS and DDoS protection.`,
      targetPersona: 'CTO' as const,
      citedFactIds: cdnFact ? [cdnFact.id] : [],
    },
    {
      question: atsRoleFact && ats.engineeringRoles[0]
        ? `What bottleneck are you solving with your recent hire for ${ats.engineeringRoles[0].title}?`
        : `How does your current tooling pipeline support your engineering sprint velocity?`,
      rationale: `Identified active engineering requisition on public ATS board.`,
      targetPersona: 'VP_ENG' as const,
      citedFactIds: atsRoleFact ? [atsRoleFact.id] : (atsBoardFact ? [atsBoardFact.id] : []),
    },
    {
      question: cdpFact
        ? `With ${cdpFact.label} handling customer telemetry, what is your biggest hurdle synchronizing user events to your CRM?`
        : `How cleanly does user telemetry flow between your web client and sales stack?`,
      rationale: `Evaluates sales and marketing data pipeline coherence.`,
      targetPersona: 'CRO' as const,
      citedFactIds: cdpFact ? [cdpFact.id] : (mxFact ? [mxFact.id] : []),
    },
  ];

  // Competitive Landmines
  const competitiveLandmines = [
    {
      landmine: `Assuming ${companyName} has an unmanaged email infrastructure.`,
      counterStrategy: `Acknowledge their ${dns.mailProvider} setup and DMARC policy (${dns.dmarcPolicy}) upfront to build technical credibility.`,
      citedFactIds: [mxFact?.id, dmarcFact?.id].filter(Boolean) as string[],
    },
    {
      landmine: `Pitching generic monitoring or APM tools without acknowledging existing instrumentation.`,
      counterStrategy: `Reference their active telemetry stack [${obsFact?.id || 'client-side RUM'}] and frame the conversation around gaps in root-cause triage rather than replacing their existing agent.`,
      citedFactIds: obsFact ? [obsFact.id] : [],
    },
  ];

  const battlecard: ExecutiveBattlecard = {
    targetDomain: domain,
    companyName,
    targetProfile: {
      summary: `${companyName} is an active technology organization operating on modern web infrastructure (${http.detectedTechnologies.map((t) => t.name).join(', ') || 'Modern Edge'}).`,
      primaryOffering: `Enterprise software / digital services with web presence at ${domain}`,
      cloudFootprint: `${dns.cdnDnsProvider} Edge + ${dns.mailProvider} Core`,
      estimatedEngMaturity,
    },
    personaHooks: {
      cto: { thesis: ctoThesis, hook: ctoHook, citedFactIds: ctoCitations },
      vpEngineering: { thesis: vpThesis, hook: vpHook, citedFactIds: vpCitations },
      cro: { thesis: croThesis, hook: croHook, citedFactIds: croCitations },
    },
    highStakesDiscoveryQuestions,
    competitiveLandmines,
    auditSummary: {
      groundingScore: 100,
      verifiedCitationCount: facts.length,
      unverifiedClaimsCount: 0,
      hallucinationAlerts: [],
    },
  };

  battlecard.auditSummary = verifyBattlecardGrounding(battlecard, ledger);
  return battlecard;
}

async function callGeminiLLM(
  domain: string,
  companyName: string,
  dns: DnsAuditResult,
  http: HttpTechAuditResult,
  ats: AtsAuditResult,
  ledger: AuditLedger,
  apiKey: string
): Promise<ExecutiveBattlecard | null> {
  const factListText = ledger.facts
    .map((f) => `• [${f.id}] (${f.verificationLevel}): ${f.label} | PROOF: "${f.rawProof}"`)
    .join('\n');

  const prompt = `You are the Lead Systems Architect and Enterprise B2B Reconnaissance Agent for IntelSpider.
You are preparing an Executive Pre-Meeting Battlecard for an upcoming strategic discovery call with ${companyName} (${domain}).

CRITICAL ANTI-HALLUCINATION DIRECTIVE:
1. Every persona hook, discovery question, and competitive landmine MUST cite one or more verified Fact IDs from the Fact Ledger below using the exact bracket format: [FACT_ID].
2. NEVER invent non-existent metrics, fake tools, or hypothetical stats. If a fact is not in the ledger, do not invent it.
3. Every claim must directly anchor to a verified technical artifact.

VERIFIED FACT LEDGER (GROUND TRUTH):
${factListText}

RETURN STRICT JSON ONLY matching this exact TypeScript structure:
{
  "targetDomain": "${domain}",
  "companyName": "${companyName}",
  "targetProfile": {
    "summary": "2-3 sentences summarizing business and tech architecture grounded in facts",
    "primaryOffering": "Core value proposition",
    "cloudFootprint": "Summary of DNS, CDN, and mail footprint",
    "estimatedEngMaturity": "Enterprise Tier 1" | "High-Growth Scaleup" | "Mid-Market Modern" | "Legacy Hybrid"
  },
  "personaHooks": {
    "cto": {
      "thesis": "Strategic focus thesis for CTO",
      "hook": "Concise pitch hook citing [FACT_ID]",
      "citedFactIds": ["FACT_ID"]
    },
    "vpEngineering": {
      "thesis": "Strategic focus thesis for VP Engineering",
      "hook": "Concise pitch hook citing [FACT_ID]",
      "citedFactIds": ["FACT_ID"]
    },
    "cro": {
      "thesis": "Strategic focus thesis for CRO/Revenue leader",
      "hook": "Concise pitch hook citing [FACT_ID]",
      "citedFactIds": ["FACT_ID"]
    }
  },
  "highStakesDiscoveryQuestions": [
    {
      "question": "Sharp, non-obvious question citing [FACT_ID]",
      "rationale": "Why this question tests their architecture or strategy",
      "targetPersona": "CTO" | "VP_ENG" | "CRO",
      "citedFactIds": ["FACT_ID"]
    }
  ],
  "competitiveLandmines": [
    {
      "landmine": "Trap or assumption to avoid",
      "counterStrategy": "How to steer citing [FACT_ID]",
      "citedFactIds": ["FACT_ID"]
    }
  ]
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
      signal: AbortSignal.timeout(12000),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error('Gemini API Error:', res.status, errText);
    return null;
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  const parsed = JSON.parse(rawText) as ExecutiveBattlecard;
  parsed.targetDomain = domain;
  parsed.companyName = companyName;
  return parsed;
}
