import { NextRequest } from 'next/server';
import { runDnsAudit } from '@/lib/collectors/dns';
import { runHttpAudit } from '@/lib/collectors/http-fingerprint';
import { runAtsAudit } from '@/lib/collectors/ats';
import { createAuditLedger } from '@/lib/audit/ledger';
import { generateGroundedBattlecard } from '@/lib/gemini';
import { ReconReport, ReconStreamEvent } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get('domain');
  const format = searchParams.get('format');
  const apiKey = searchParams.get('apiKey') || undefined;

  if (!domain) {
    return new Response(JSON.stringify({ error: 'Missing domain parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim().toLowerCase();

  // If format=json, return standard JSON response
  if (format === 'json') {
    try {
      const [dnsResult, httpResult, atsResult] = await Promise.all([
        runDnsAudit(cleanDomain),
        runHttpAudit(cleanDomain),
        runAtsAudit(cleanDomain),
      ]);

      const allFacts = [...dnsResult.facts, ...httpResult.facts, ...atsResult.facts];
      const ledger = await createAuditLedger(allFacts);
      const battlecard = await generateGroundedBattlecard(
        cleanDomain,
        dnsResult.audit,
        httpResult.audit,
        atsResult.audit,
        ledger,
        apiKey
      );

      const report: ReconReport = {
        id: `recon_${Date.now()}_${cleanDomain.replace(/[^a-z0-9]/g, '_')}`,
        domain: cleanDomain,
        timestamp: new Date().toISOString(),
        dnsAudit: dnsResult.audit,
        httpAudit: httpResult.audit,
        atsAudit: atsResult.audit,
        auditLedger: ledger,
        battlecard,
      };

      return new Response(JSON.stringify(report), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Recon execution failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Otherwise, return Server-Sent Events (SSE) stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: ReconStreamEvent) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }

      try {
        sendEvent({
          type: 'STEP_START',
          step: 'INIT',
          message: `Initializing deterministic intelligence sweep for ${cleanDomain}...`,
          timestamp: Date.now(),
        });

        // Step 1: Parallel Deterministic Collectors
        sendEvent({
          type: 'STEP_PROGRESS',
          step: 'COLLECTORS',
          message: 'Dispatching DNS/DoH, HTTP Header, and Public ATS probes in parallel...',
          progress: 20,
        });

        const [dnsResult, httpResult, atsResult] = await Promise.all([
          runDnsAudit(cleanDomain).then((res) => {
            sendEvent({
              type: 'AUDIT_STAGE_COMPLETE',
              stage: 'DNS',
              data: {
                mailProvider: res.audit.mailProvider,
                dmarcPolicy: res.audit.dmarcPolicy,
                cdn: res.audit.cdnDnsProvider,
                grade: res.audit.emailSecurityGrade,
              },
            });
            for (const f of res.facts) {
              sendEvent({ type: 'FACT_DISCOVERED', fact: f });
            }
            return res;
          }),
          runHttpAudit(cleanDomain).then((res) => {
            sendEvent({
              type: 'AUDIT_STAGE_COMPLETE',
              stage: 'HTTP',
              data: {
                technologiesCount: res.audit.detectedTechnologies.length,
                technologies: res.audit.detectedTechnologies.map((t) => t.name),
                hsts: res.audit.securityHeaders.hsts,
              },
            });
            for (const f of res.facts) {
              sendEvent({ type: 'FACT_DISCOVERED', fact: f });
            }
            return res;
          }),
          runAtsAudit(cleanDomain).then((res) => {
            sendEvent({
              type: 'AUDIT_STAGE_COMPLETE',
              stage: 'ATS',
              data: {
                provider: res.audit.provider,
                totalOpenRoles: res.audit.totalOpenRoles,
                topKeywords: res.audit.topEngineeringKeywords.map((k) => k.keyword),
              },
            });
            for (const f of res.facts) {
              sendEvent({ type: 'FACT_DISCOVERED', fact: f });
            }
            return res;
          }),
        ]);

        // Step 2: Audit Ledger & Cryptographic Integrity Seal
        sendEvent({
          type: 'STEP_PROGRESS',
          step: 'AUDIT_SEAL',
          message: 'Deduplicating facts and minting cryptographic audit seal...',
          progress: 60,
        });

        const allFacts = [...dnsResult.facts, ...httpResult.facts, ...atsResult.facts];
        const ledger = await createAuditLedger(allFacts);

        sendEvent({
          type: 'AUDIT_STAGE_COMPLETE',
          stage: 'AUDIT',
          data: {
            totalFacts: ledger.totalFacts,
            deterministicCount: ledger.deterministicCount,
            verificationRatio: ledger.verificationRatio,
            integrityHash: ledger.auditIntegrityHash.slice(0, 16) + '...',
          },
        });

        // Step 3: Grounded LLM Reasoning & Anti-Hallucination Audit
        sendEvent({
          type: 'STEP_PROGRESS',
          step: 'REASONING',
          message: 'Synthesizing executive battlecard with strict [FACT_ID] grounding verification...',
          progress: 85,
        });

        const battlecard = await generateGroundedBattlecard(
          cleanDomain,
          dnsResult.audit,
          httpResult.audit,
          atsResult.audit,
          ledger,
          apiKey
        );

        const auditSummary = battlecard.auditSummary;
        if (auditSummary.groundingScore >= 80) {
          sendEvent({
            type: 'VERIFICATION_ALERT',
            alertType: 'PASSED',
            message: `Grounding Audit PASSED: ${auditSummary.groundingScore}% grounded (${auditSummary.verifiedCitationCount} citations verified, ${auditSummary.unverifiedClaimsCount} unverified).`,
          });
        } else {
          sendEvent({
            type: 'VERIFICATION_ALERT',
            alertType: 'WARNING',
            message: `Grounding Audit Notice: ${auditSummary.groundingScore}% grounded. Review evidence ledger.`,
          });
        }

        // Step 4: Final Assembly
        const report: ReconReport = {
          id: `recon_${Date.now()}_${cleanDomain.replace(/[^a-z0-9]/g, '_')}`,
          domain: cleanDomain,
          timestamp: new Date().toISOString(),
          dnsAudit: dnsResult.audit,
          httpAudit: httpResult.audit,
          atsAudit: atsResult.audit,
          auditLedger: ledger,
          battlecard,
        };

        sendEvent({
          type: 'COMPLETE',
          report,
        });

        controller.close();
      } catch (err: any) {
        sendEvent({
          type: 'ERROR',
          message: err.message || 'Stream processing error',
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
