import { AuditLedger, ExecutiveBattlecard } from '../types';

export function verifyBattlecardGrounding(
  battlecard: ExecutiveBattlecard,
  ledger: AuditLedger
): ExecutiveBattlecard['auditSummary'] {
  const factMap = new Map(ledger.facts.map((f) => [f.id, f]));
  const verifiedCitations = new Set<string>();
  const invalidCitations = new Set<string>();
  const alerts: string[] = [];

  function checkCitations(citedIds: string[], context: string) {
    if (!citedIds || citedIds.length === 0) {
      alerts.push(`Unverified Claim Warning: ${context} has no grounding citations.`);
      return;
    }

    for (const id of citedIds) {
      if (factMap.has(id)) {
        verifiedCitations.add(id);
      } else {
        invalidCitations.add(id);
        alerts.push(`Hallucination Detected: ${context} cites non-existent Fact ID '${id}'.`);
      }
    }
  }

  // Also scan raw text for [FACT_...] tokens
  function extractTokens(text: string): string[] {
    const matches = text.match(/\[(FACT_[A-Z0-9_]+)\]/g);
    if (!matches) return [];
    return matches.map((m) => m.slice(1, -1));
  }

  // 1. Audit Persona Hooks
  const personas = [
    { name: 'CTO Hook', data: battlecard.personaHooks.cto },
    { name: 'VP Engineering Hook', data: battlecard.personaHooks.vpEngineering },
    { name: 'CRO Hook', data: battlecard.personaHooks.cro },
  ];

  for (const p of personas) {
    const textTokens = [...extractTokens(p.data.thesis), ...extractTokens(p.data.hook)];
    const allIds = Array.from(new Set([...(p.data.citedFactIds || []), ...textTokens]));
    p.data.citedFactIds = allIds;
    checkCitations(allIds, p.name);
  }

  // 2. Audit Discovery Questions
  for (let i = 0; i < battlecard.highStakesDiscoveryQuestions.length; i++) {
    const q = battlecard.highStakesDiscoveryQuestions[i];
    const textTokens = [...extractTokens(q.question), ...extractTokens(q.rationale)];
    const allIds = Array.from(new Set([...(q.citedFactIds || []), ...textTokens]));
    q.citedFactIds = allIds;
    checkCitations(allIds, `Discovery Question #${i + 1}`);
  }

  // 3. Audit Competitive Landmines
  for (let i = 0; i < battlecard.competitiveLandmines.length; i++) {
    const lm = battlecard.competitiveLandmines[i];
    const textTokens = [...extractTokens(lm.landmine), ...extractTokens(lm.counterStrategy)];
    const allIds = Array.from(new Set([...(lm.citedFactIds || []), ...textTokens]));
    lm.citedFactIds = allIds;
    checkCitations(allIds, `Competitive Landmine #${i + 1}`);
  }

  const verifiedCitationCount = verifiedCitations.size;
  const unverifiedClaimsCount = invalidCitations.size + (alerts.length - invalidCitations.size);
  const totalClaims = verifiedCitationCount + unverifiedClaimsCount;

  const groundingScore = totalClaims > 0 ? Math.round((verifiedCitationCount / totalClaims) * 100) : 100;

  return {
    groundingScore,
    verifiedCitationCount,
    unverifiedClaimsCount,
    hallucinationAlerts: alerts,
  };
}
