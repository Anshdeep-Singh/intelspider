'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  HelpCircle,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers,
} from 'lucide-react';
import { ExecutiveBattlecard, FactEntry } from '@/lib/types';

interface BattlecardViewProps {
  battlecard: ExecutiveBattlecard;
  onCitationClick: (factId: string) => void;
}

export const BattlecardView: React.FC<BattlecardViewProps> = ({ battlecard, onCitationClick }) => {
  const [activePersona, setActivePersona] = useState<'cto' | 'vpEngineering' | 'cro'>('cto');
  const { targetProfile, personaHooks, highStakesDiscoveryQuestions, competitiveLandmines, auditSummary } =
    battlecard;

  const renderCitationPill = (factId: string) => (
    <button
      key={factId}
      onClick={() => onCitationClick(factId)}
      className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 mx-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-mono font-medium text-emerald-400 hover:text-emerald-300 transition"
      title="Click to view verified proof artifact"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      <span>{factId}</span>
    </button>
  );

  const formatTextWithCitations = (text: string) => {
    // Replace [FACT_...] with clickable buttons
    const regex = /\[(FACT_[A-Z0-9_]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const factId = match[1];
      parts.push(renderCitationPill(factId));
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return (
    <div className="w-full space-y-6">
      {/* Target Profile Card */}
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
              Strategic Target Profile
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {battlecard.companyName} ({battlecard.targetDomain})
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
            {targetProfile.estimatedEngMaturity}
          </span>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed mb-4">{targetProfile.summary}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-800/80 text-xs font-mono">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-zinc-500 uppercase tracking-wider block text-[10px] mb-1">Core Offering</span>
            <span className="text-zinc-200">{targetProfile.primaryOffering}</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-zinc-500 uppercase tracking-wider block text-[10px] mb-1">
              Cloud & Perimeter Footprint
            </span>
            <span className="text-emerald-400 font-semibold">{targetProfile.cloudFootprint}</span>
          </div>
        </div>
      </div>

      {/* Buyer Persona Hooks */}
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Grounded Persona Hooks & Strategic Angles</h3>
          </div>
          <span className="text-xs font-mono text-zinc-500 hidden sm:inline">100% Fact-Tethered Angles</span>
        </div>

        {/* Persona Selectors */}
        <div className="flex items-center gap-2 mb-5 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setActivePersona('cto')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition ${
              activePersona === 'cto'
                ? 'bg-emerald-500 text-zinc-950 font-bold'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            CTO / Head of Infrastructure
          </button>
          <button
            onClick={() => setActivePersona('vpEngineering')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition ${
              activePersona === 'vpEngineering'
                ? 'bg-emerald-500 text-zinc-950 font-bold'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            VP Engineering / Dev Lead
          </button>
          <button
            onClick={() => setActivePersona('cro')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition ${
              activePersona === 'cro'
                ? 'bg-emerald-500 text-zinc-950 font-bold'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            CRO / Revenue Operations
          </button>
        </div>

        {/* Selected Persona Content */}
        {activePersona === 'cto' && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-3">
            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                Strategic Thesis
              </span>
              <h4 className="text-sm font-semibold text-white">{personaHooks.cto.thesis}</h4>
            </div>
            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                Pre-Meeting Pitch Hook
              </span>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {formatTextWithCitations(personaHooks.cto.hook)}
              </p>
            </div>
            {personaHooks.cto.citedFactIds.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-zinc-500">CITED PROOFS:</span>
                {personaHooks.cto.citedFactIds.map((id) => renderCitationPill(id))}
              </div>
            )}
          </div>
        )}

        {activePersona === 'vpEngineering' && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-3">
            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                Strategic Thesis
              </span>
              <h4 className="text-sm font-semibold text-white">{personaHooks.vpEngineering.thesis}</h4>
            </div>
            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                Pre-Meeting Pitch Hook
              </span>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {formatTextWithCitations(personaHooks.vpEngineering.hook)}
              </p>
            </div>
            {personaHooks.vpEngineering.citedFactIds.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-zinc-500">CITED PROOFS:</span>
                {personaHooks.vpEngineering.citedFactIds.map((id) => renderCitationPill(id))}
              </div>
            )}
          </div>
        )}

        {activePersona === 'cro' && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-3">
            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                Strategic Thesis
              </span>
              <h4 className="text-sm font-semibold text-white">{personaHooks.cro.thesis}</h4>
            </div>
            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                Pre-Meeting Pitch Hook
              </span>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {formatTextWithCitations(personaHooks.cro.hook)}
              </p>
            </div>
            {personaHooks.cro.citedFactIds.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-zinc-500">CITED PROOFS:</span>
                {personaHooks.cro.citedFactIds.map((id) => renderCitationPill(id))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* High-Stakes Discovery Questions */}
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">High-Stakes Discovery Questions</h3>
        </div>

        <div className="space-y-3">
          {highStakesDiscoveryQuestions.map((q, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                  Target: {q.targetPersona}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Question #{idx + 1}</span>
              </div>
              <p className="text-sm font-medium text-zinc-100 leading-relaxed">
                {formatTextWithCitations(q.question)}
              </p>
              <p className="text-xs text-zinc-400 italic">Rationale: {q.rationale}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Competitive Landmines */}
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">Competitive Landmines & Wedge Strategy</h3>
        </div>

        <div className="space-y-3">
          {competitiveLandmines.map((lm, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>LANDMINE #{idx + 1}</span>
              </div>
              <p className="text-xs text-zinc-300 font-medium">{lm.landmine}</p>
              <div className="pt-2 border-t border-zinc-900">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                  Verified Counter-Strategy:
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {formatTextWithCitations(lm.counterStrategy)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grounding & Verification Audit Summary */}
      <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Anti-Hallucination Audit Scorecard</h4>
              <p className="text-xs text-zinc-400">
                Automated post-generation verification validating citations against raw artifacts.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              {auditSummary.groundingScore}%
            </span>
            <span className="text-xs text-zinc-400 block font-mono">Grounded</span>
          </div>
        </div>

        {auditSummary.hallucinationAlerts.length > 0 && (
          <div className="mt-4 pt-3 border-t border-emerald-500/20 space-y-1">
            {auditSummary.hallucinationAlerts.map((alert, i) => (
              <p key={i} className="text-xs text-amber-400 font-mono">
                • {alert}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
