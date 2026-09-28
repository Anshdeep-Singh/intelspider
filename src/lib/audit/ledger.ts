import { AuditLedger, FactEntry } from '../types';
import { sha256 } from '../utils/hash';

export async function createAuditLedger(rawFacts: FactEntry[]): Promise<AuditLedger> {
  // Deduplicate by fact ID
  const seenIds = new Set<string>();
  const facts: FactEntry[] = [];

  for (const fact of rawFacts) {
    if (!seenIds.has(fact.id)) {
      seenIds.add(fact.id);
      facts.push(fact);
    }
  }

  const deterministicLevels = new Set([
    'CRYPTOGRAPHIC_DNS',
    'HTTP_HEADER_VERIFIED',
    'DOM_SIGNATURE_VERIFIED',
    'ATS_API_VERIFIED',
  ]);

  let deterministicCount = 0;
  let inferredCount = 0;

  for (const f of facts) {
    if (deterministicLevels.has(f.verificationLevel)) {
      deterministicCount++;
    } else {
      inferredCount++;
    }
  }

  const totalFacts = facts.length;
  const verificationRatio = totalFacts > 0 ? Number((deterministicCount / totalFacts).toFixed(3)) : 0;

  // Compute immutable integrity hash: sort fact sha256 hashes and hash the concatenated string
  const sortedHashes = facts.map((f) => f.sha256).sort().join(':');
  const auditIntegrityHash = await sha256(sortedHashes || 'EMPTY_LEDGER');

  return {
    facts,
    totalFacts,
    deterministicCount,
    inferredCount,
    verificationRatio,
    auditIntegrityHash,
  };
}
