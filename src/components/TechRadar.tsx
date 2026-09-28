'use client';

import React from 'react';
import {
  Shield,
  Mail,
  Server,
  Code,
  LineChart,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { ReconReport, FactEntry } from '@/lib/types';

interface TechRadarProps {
  report: ReconReport;
  onFactClick: (fact: FactEntry) => void;
}

export const TechRadar: React.FC<TechRadarProps> = ({ report, onFactClick }) => {
  const { dnsAudit, httpAudit, atsAudit, auditLedger } = report;

  const findFact = (idPrefix: string) => {
    return auditLedger.facts.find((f) => f.id.includes(idPrefix));
  };

  return (
    <div className="w-full space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Email Hygiene */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-zinc-400">EMAIL HYGIENE</span>
            <Mail className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{dnsAudit.emailSecurityGrade}</span>
            <span className="text-xs text-zinc-400 font-mono">
              {dnsAudit.hasDmarc ? `DMARC: ${dnsAudit.dmarcPolicy.toUpperCase()}` : 'No DMARC'}
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-400 truncate">
            Provider: <strong className="text-zinc-200">{dnsAudit.mailProvider}</strong>
          </p>
        </div>

        {/* Edge / DNS */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-zinc-400">EDGE & DNS ROUTING</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{dnsAudit.cdnDnsProvider}</div>
          <p className="mt-2 text-xs text-zinc-400 truncate">
            Ingress: <strong className="text-zinc-200">{httpAudit.serverHeader || 'Managed Edge'}</strong>
          </p>
        </div>

        {/* Engineering Headcount */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-zinc-400">HIRING VELOCITY</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{atsAudit.totalOpenRoles}</span>
            <span className="text-xs text-zinc-400 font-mono">Open Roles</span>
          </div>
          <p className="mt-2 text-xs text-zinc-400 truncate">
            ATS:{' '}
            <strong className="text-zinc-200">
              {atsAudit.provider !== 'none' ? atsAudit.provider.toUpperCase() : 'Not Disclosed'}
            </strong>
          </p>
        </div>

        {/* Verified Facts */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-zinc-400">AUDIT PROOF RATIO</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {(auditLedger.verificationRatio * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-zinc-400 font-mono">Deterministic</span>
          </div>
          <p className="mt-2 text-xs text-zinc-400 truncate">
            <strong className="text-emerald-400">{auditLedger.deterministicCount}</strong> verified proofs
          </p>
        </div>
      </div>

      {/* Detected Tech Stack Grid */}
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Detected Technical Instrumentation</h3>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {httpAudit.detectedTechnologies.length} Stack Signatures Identified
          </span>
        </div>

        {httpAudit.detectedTechnologies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {httpAudit.detectedTechnologies.map((tech) => {
              const fact = findFact(tech.name.replace(/[^a-z0-9]/gi, '_').toUpperCase());
              return (
                <div
                  key={tech.name}
                  onClick={() => fact && onFactClick(fact)}
                  className={`p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 hover:border-emerald-500/40 transition flex items-start justify-between cursor-pointer group`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-100 group-hover:text-emerald-300 transition">
                        {tech.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                        {tech.category}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-zinc-500 mt-1.5 truncate max-w-[200px]">
                      {tech.proofSnippet}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    HTTP Verified
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 font-mono py-4 text-center">
            No standard public telemetry script tags detected on root landing page.
          </p>
        )}
      </div>

      {/* Engineering Hiring Keywords & Roles */}
      {atsAudit.provider !== 'none' && (
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">Engineering Architecture Needs (via Public ATS)</h3>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {atsAudit.engineeringRoles.length} Tech Roles Harvested
            </span>
          </div>

          {/* Top Tech Keywords */}
          {atsAudit.topEngineeringKeywords.length > 0 && (
            <div className="mb-4">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">
                Mandatory Architecture Keywords in Job Specs:
              </span>
              <div className="flex flex-wrap gap-2">
                {atsAudit.topEngineeringKeywords.map((item) => (
                  <span
                    key={item.keyword}
                    className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-1.5"
                  >
                    <span className="font-semibold text-emerald-400">{item.keyword}</span>
                    <span className="text-[10px] text-zinc-500">×{item.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Active Job Titles */}
          <div className="space-y-2 mt-4">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
              Sample Technical Requisitions:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {atsAudit.engineeringRoles.slice(0, 6).map((role) => (
                <div
                  key={role.id}
                  className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-medium text-zinc-200">{role.title}</p>
                    <p className="text-[11px] font-mono text-zinc-500">{role.location} · {role.department}</p>
                  </div>
                  {role.keyTechKeywords.length > 0 && (
                    <div className="hidden sm:flex gap-1">
                      {role.keyTechKeywords.slice(0, 2).map((k) => (
                        <span key={k} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
