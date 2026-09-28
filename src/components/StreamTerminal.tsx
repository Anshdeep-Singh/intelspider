'use client';

import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Shield, Cpu } from 'lucide-react';
import { ReconStreamEvent, FactEntry } from '@/lib/types';

interface StreamTerminalProps {
  logs: string[];
  factsDiscovered: FactEntry[];
  currentProgress: number;
  isStreaming: boolean;
  onFactClick: (fact: FactEntry) => void;
}

export const StreamTerminal: React.FC<StreamTerminalProps> = ({
  logs,
  factsDiscovered,
  currentProgress,
  isStreaming,
  onFactClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (logs.length === 0 && !isStreaming) return null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mb-8">
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl">
        {/* Terminal Title Bar */}
        <div className="px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="h-4 w-px bg-zinc-700 mx-1" />
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-medium text-zinc-300">
              Live Recon Execution Stream & Provenance Ledger
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isStreaming && (
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Running Collectors...</span>
              </div>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-zinc-400 hover:text-white transition p-1"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-900 h-1">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-1 transition-all duration-300"
            style={{ width: `${currentProgress}%` }}
          />
        </div>

        {/* Terminal Content */}
        {isExpanded && (
          <div className="p-4 bg-zinc-950 font-mono text-xs max-h-60 overflow-y-auto space-y-1.5 scrollbar-thin">
            {logs.map((log, index) => (
              <div key={index} className="flex items-start gap-2 text-zinc-300 leading-relaxed">
                <span className="text-zinc-600 select-none">&gt;</span>
                <span>{log}</span>
              </div>
            ))}

            {factsDiscovered.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-900">
                <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>Real-Time Discovered Facts ({factsDiscovered.length}):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {factsDiscovered.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => onFactClick(f)}
                      className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 text-[11px] text-emerald-400 transition flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{f.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
