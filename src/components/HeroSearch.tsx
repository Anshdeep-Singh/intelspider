'use client';

import React, { useState } from 'react';
import { Search, Loader2, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

interface HeroSearchProps {
  onScan: (domain: string) => void;
  isLoading: boolean;
  activeDomain: string;
}

const PRESET_DOMAINS = [
  { domain: 'linear.app', label: 'Linear', tag: 'Fast Sync / PLG' },
  { domain: 'stripe.com', label: 'Stripe', tag: 'Global FinTech' },
  { domain: 'datadog.com', label: 'Datadog', tag: 'Cloud APM' },
  { domain: 'supabase.com', label: 'Supabase', tag: 'Postgres / Scale' },
];

export const HeroSearch: React.FC<HeroSearchProps> = ({ onScan, isLoading, activeDomain }) => {
  const [domainInput, setDomainInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = domainInput.trim();
    if (clean) {
      onScan(clean);
    }
  };

  return (
    <div className="w-full pt-10 pb-8 text-center max-w-4xl mx-auto px-4">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4">
        <Zap className="w-3.5 h-3.5" />
        <span>100% Deterministic Ground-Truth Architecture</span>
      </div>

      {/* Headline */}
      <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
        Pre-Meeting Intelligence <br className="hidden sm:inline" />
        <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
          Backed by Cryptographic Proof
        </span>
      </h1>

      <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
        Stop guessing in discovery calls. IntelSpider automates technical reconnaissance across DNS protocols, HTTP
        script signatures, and public ATS hiring pipelines—delivering grounded sales battlecards where every claim cites
        an audited proof artifact.
      </p>

      {/* Search Input */}
      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl mx-auto">
        <div className="relative flex items-center shadow-2xl rounded-2xl bg-zinc-900 border border-zinc-700/80 p-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition">
          <div className="pl-3.5 pr-2 text-zinc-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="Enter prospect domain (e.g. linear.app, stripe.com, figma.com)..."
            disabled={isLoading}
            className="w-full bg-transparent text-white text-sm sm:text-base placeholder-zinc-500 focus:outline-none py-2 font-mono"
          />
          <button
            type="submit"
            disabled={isLoading || !domainInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <span>Scan Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preset Benchmarks */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
        <span className="text-zinc-500 mr-1">Instant Verified Targets:</span>
        {PRESET_DOMAINS.map((item) => {
          const isActive = activeDomain === item.domain;
          return (
            <button
              key={item.domain}
              onClick={() => {
                setDomainInput(item.domain);
                onScan(item.domain);
              }}
              disabled={isLoading}
              className={`px-3 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
                  : 'bg-zinc-900/60 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>{item.domain}</span>
              <span className="text-[10px] text-zinc-500">({item.tag})</span>
              {isActive && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
