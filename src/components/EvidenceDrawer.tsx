'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Copy, Check, ExternalLink, Hash, Database, Clock } from 'lucide-react';
import { FactEntry } from '@/lib/types';

interface EvidenceDrawerProps {
  fact: FactEntry | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ fact, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!fact) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(fact.sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'CRYPTOGRAPHIC_DNS':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'HTTP_HEADER_VERIFIED':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'DOM_SIGNATURE_VERIFIED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'ATS_API_VERIFIED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Verified Ground-Truth Artifact</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Fact ID & Category */}
          <div className="mt-5 space-y-4">
            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                Fact Identifier
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-white bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
                  {fact.id}
                </span>
                <span
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-full border font-semibold ${getBadgeColor(
                    fact.verificationLevel
                  )}`}
                >
                  {fact.verificationLevel}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                Assertion Label
              </span>
              <p className="text-sm text-zinc-200 font-medium bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
                {fact.label}
              </p>
            </div>

            {/* Raw Artifact / Cryptographic Proof */}
            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                Deterministic Raw Proof
              </span>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 font-mono text-xs text-emerald-300 break-all whitespace-pre-wrap leading-relaxed">
                {fact.rawProof}
              </div>
            </div>

            {/* Source & Authority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-mono mb-1">
                  <Database className="w-3.5 h-3.5 text-zinc-400" />
                  <span>PROVENANCE SOURCE</span>
                </div>
                <p className="text-xs text-zinc-300 font-mono truncate" title={fact.source}>
                  {fact.source}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-mono mb-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>AUDIT TIMESTAMP</span>
                </div>
                <p className="text-xs text-zinc-300 font-mono truncate">{fact.timestamp}</p>
              </div>
            </div>

            {/* SHA-256 Proof Hash */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SHA-256 INTEGRITY HASH</span>
                </span>
                <button
                  onClick={handleCopyHash}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 font-mono text-[11px] text-zinc-400 break-all select-all">
                {fact.sha256}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-zinc-800 text-center">
          <p className="text-[11px] text-zinc-500 font-mono">
            Cryptographically sealed and immutable. Cited in sales battlecards without hallucination.
          </p>
        </div>
      </div>
    </div>
  );
};
