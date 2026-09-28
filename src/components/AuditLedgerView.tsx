'use client';

import React, { useState } from 'react';
import { ShieldCheck, Search, Hash, Filter, CheckCircle2, Copy, Check, Eye } from 'lucide-react';
import { AuditLedger, FactEntry, FactCategory } from '@/lib/types';

interface AuditLedgerViewProps {
  ledger: AuditLedger;
  onFactClick: (fact: FactEntry) => void;
}

export const AuditLedgerView: React.FC<AuditLedgerViewProps> = ({ ledger, onFactClick }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);

  const categories = ['ALL', 'INFRASTRUCTURE', 'SECURITY', 'TECH_STACK', 'HIRING_SIGNALS'];

  const filteredFacts = ledger.facts.filter((fact) => {
    const matchesCategory = selectedCategory === 'ALL' || fact.category === selectedCategory;
    const matchesSearch =
      fact.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fact.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fact.rawProof.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopyIntegrityHash = () => {
    navigator.clipboard.writeText(ledger.auditIntegrityHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getLevelBadge = (level: string) => {
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
    <div className="w-full space-y-6">
      {/* Cryptographic Seal Banner */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Cryptographic Audit Integrity Seal</h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  VERIFIED IMMUTABLE
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Every assertion in this dossier is anchored to an audited, non-hallucinated fact hash.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-400">
            <Hash className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[180px] sm:max-w-[240px] text-zinc-300 select-all">
              {ledger.auditIntegrityHash}
            </span>
            <button
              onClick={handleCopyIntegrityHash}
              className="text-emerald-400 hover:text-emerald-300 p-1 transition"
              title="Copy Audit Hash"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Verification Ratio Bar */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-zinc-500 uppercase tracking-wider block text-[10px]">Total Ingested Facts</span>
            <span className="text-lg font-bold text-white font-mono">{ledger.totalFacts}</span>
          </div>
          <div>
            <span className="text-zinc-500 uppercase tracking-wider block text-[10px]">Deterministic Proofs</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{ledger.deterministicCount} (100% Authoritative)</span>
          </div>
          <div>
            <span className="text-zinc-500 uppercase tracking-wider block text-[10px]">Grounding Verification Ratio</span>
            <span className="text-lg font-bold text-cyan-400 font-mono">{(ledger.verificationRatio * 100).toFixed(0)}% Tethered</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search proof or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Facts Table */}
      <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Fact Identifier</th>
                <th className="py-3 px-4">Verification Level</th>
                <th className="py-3 px-4">Assertion & Label</th>
                <th className="py-3 px-4">Deterministic Raw Artifact</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredFacts.length > 0 ? (
                filteredFacts.map((fact) => (
                  <tr
                    key={fact.id}
                    onClick={() => onFactClick(fact)}
                    className="hover:bg-zinc-800/40 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                      {fact.id}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border font-semibold ${getLevelBadge(fact.verificationLevel)}`}>
                        {fact.verificationLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-zinc-200">
                      {fact.label}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm truncate text-emerald-400/90">
                      {fact.rawProof}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFactClick(fact);
                        }}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                        title="View Artifact"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    No facts found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
