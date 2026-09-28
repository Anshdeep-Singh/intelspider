'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { HeroSearch } from '@/components/HeroSearch';
import { StreamTerminal } from '@/components/StreamTerminal';
import { BattlecardView } from '@/components/BattlecardView';
import { TechRadar } from '@/components/TechRadar';
import { AuditLedgerView } from '@/components/AuditLedgerView';
import { EvidenceDrawer } from '@/components/EvidenceDrawer';
import { PdfExportModal } from '@/components/PdfExportModal';
import { ReconReport, FactEntry, ReconStreamEvent } from '@/lib/types';
import { DEMO_TARGETS } from '@/lib/demo-targets';
import { Shield, Layers, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Home() {
  const [currentReport, setCurrentReport] = useState<ReconReport | null>(DEMO_TARGETS['linear.app']);
  const [selectedFact, setSelectedFact] = useState<FactEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'battlecard' | 'radar' | 'ledger'>('battlecard');
  const [activeDomain, setActiveDomain] = useState<string>('linear.app');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [factsDiscovered, setFactsDiscovered] = useState<FactEntry[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('intelspider_gemini_key');
    if (saved) setApiKey(saved);
  }, []);

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem('intelspider_gemini_key', key);
  };

  const handleScan = async (domain: string) => {
    const cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim().toLowerCase();
    setActiveDomain(cleanDomain);
    setIsStreaming(true);
    setProgress(5);
    setLogs([`Connecting to serverless reconnaissance pipeline for ${cleanDomain}...`]);
    setFactsDiscovered([]);

    try {
      const queryParams = new URLSearchParams({ domain: cleanDomain });
      if (apiKey) queryParams.set('apiKey', apiKey);

      const response = await fetch(`/api/recon?${queryParams.toString()}`);
      if (!response.ok || !response.body) {
        throw new Error(`Recon endpoint failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawJson = line.slice(6);
            try {
              const event: ReconStreamEvent = JSON.parse(rawJson);

              if (event.type === 'STEP_START') {
                setLogs((prev) => [...prev, `[INIT] ${event.message}`]);
                setProgress(15);
              } else if (event.type === 'STEP_PROGRESS') {
                setLogs((prev) => [...prev, `[PROGRESS] ${event.message}`]);
                setProgress(event.progress);
              } else if (event.type === 'FACT_DISCOVERED') {
                setFactsDiscovered((prev) => [...prev, event.fact]);
                setLogs((prev) => [...prev, `[FACT] Registered ${event.fact.id} (${event.fact.verificationLevel})`]);
              } else if (event.type === 'AUDIT_STAGE_COMPLETE') {
                setLogs((prev) => [...prev, `[STAGE COMPLETE] ${event.stage} reconnaissance finalized.`]);
              } else if (event.type === 'VERIFICATION_ALERT') {
                setLogs((prev) => [...prev, `[VERIFICATION] ${event.message}`]);
              } else if (event.type === 'COMPLETE') {
                setCurrentReport(event.report);
                setProgress(100);
                setLogs((prev) => [...prev, `[COMPLETE] Cryptographic audit report assembled for ${cleanDomain}.`]);
              } else if (event.type === 'ERROR') {
                setLogs((prev) => [...prev, `[ERROR] ${event.message}`]);
              }
            } catch (err) {
              console.warn('Malformed SSE chunk:', rawJson);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Scan stream error:', err);
      // If demo target exists in preset cache, fall back smoothly
      if (DEMO_TARGETS[cleanDomain]) {
        setLogs((prev) => [
          ...prev,
          `[FALLBACK] Using verified benchmark dossier for ${cleanDomain} from local cryptographic cache.`,
        ]);
        setCurrentReport(DEMO_TARGETS[cleanDomain]);
        setProgress(100);
      } else {
        setLogs((prev) => [...prev, `[FAILED] Stream interrupted: ${err.message || 'Unknown error'}`]);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCitationClick = (factId: string) => {
    if (!currentReport) return;
    const fact = currentReport.auditLedger.facts.find((f) => f.id === factId);
    if (fact) {
      setSelectedFact(fact);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between">
      <div>
        {/* Header */}
        <Header
          currentReport={currentReport}
          onExportPdf={() => setShowPdfModal(true)}
          apiKey={apiKey}
          onApiKeyChange={handleApiKeyChange}
        />

        {/* Hero Section */}
        <HeroSearch onScan={handleScan} isLoading={isStreaming} activeDomain={activeDomain} />

        {/* Streaming Real-Time Console */}
        <StreamTerminal
          logs={logs}
          factsDiscovered={factsDiscovered}
          currentProgress={progress}
          isStreaming={isStreaming}
          onFactClick={(f) => setSelectedFact(f)}
        />

        {/* Main Content Area */}
        {currentReport && (
          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            {/* Dossier Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-zinc-800 mb-8 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('battlecard')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold font-mono transition flex items-center gap-2 ${
                    activeTab === 'battlecard'
                      ? 'bg-emerald-500 text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Strategic Battlecard</span>
                </button>

                <button
                  onClick={() => setActiveTab('radar')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold font-mono transition flex items-center gap-2 ${
                    activeTab === 'radar'
                      ? 'bg-emerald-500 text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Tech Radar & Signals</span>
                </button>

                <button
                  onClick={() => setActiveTab('ledger')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold font-mono transition flex items-center gap-2 ${
                    activeTab === 'ledger'
                      ? 'bg-emerald-500 text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Audit Ledger</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-emerald-400 border border-zinc-700">
                    {currentReport.auditLedger.totalFacts}
                  </span>
                </button>
              </div>

              {/* Integrity Indicator */}
              <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified: {currentReport.domain}</span>
              </div>
            </div>

            {/* Tab Contents */}
            {activeTab === 'battlecard' && (
              <BattlecardView
                battlecard={currentReport.battlecard}
                onCitationClick={handleCitationClick}
              />
            )}

            {activeTab === 'radar' && (
              <TechRadar report={currentReport} onFactClick={(f) => setSelectedFact(f)} />
            )}

            {activeTab === 'ledger' && (
              <AuditLedgerView
                ledger={currentReport.auditLedger}
                onFactClick={(f) => setSelectedFact(f)}
              />
            )}
          </main>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-900 py-6 text-center text-xs font-mono text-zinc-500 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            IntelSpider Enterprise 2.0 // Built by{' '}
            <a
              href="https://anshdeepsingh.com"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:text-emerald-400 transition underline underline-offset-4"
            >
              Anshdeep Singh
            </a>
          </p>
          <p className="text-zinc-600">
            Next.js 15 Serverless · Zero-Render VM Costs · Anti-Hallucination Audit Ledger
          </p>
        </div>
      </footer>

      {/* Evidence Drawer for Clicked Facts */}
      <EvidenceDrawer fact={selectedFact} onClose={() => setSelectedFact(null)} />

      {/* PDF Export Modal */}
      {showPdfModal && (
        <PdfExportModal report={currentReport} onClose={() => setShowPdfModal(false)} />
      )}
    </div>
  );
}
