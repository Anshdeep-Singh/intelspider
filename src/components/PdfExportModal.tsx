'use client';

import React, { useRef, useState } from 'react';
import { X, Download, Loader2, Check, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReconReport } from '@/lib/types';

interface PdfExportModalProps {
  report: ReconReport | null;
  onClose: () => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({ report, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!report) return null;

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsExporting(true);

    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#09090b',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 mm
      const pageHeight = 297; // A4 mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`IntelSpider_Briefing_${report.domain.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Executive Pre-Meeting PDF Briefing</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Vector PDF...</span>
                </>
              ) : exportComplete ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF Document</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Preview */}
        <div className="flex-1 overflow-y-auto p-8 bg-zinc-900/40">
          <div
            ref={printRef}
            className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl max-w-3xl mx-auto text-zinc-200 font-sans space-y-6 shadow-2xl"
          >
            {/* Document Header */}
            <div className="border-b border-zinc-800 pb-5 flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                  INTELSPIDER 2.0 // STRATEGIC RECONNAISSANCE DOSSIER
                </span>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {report.battlecard.companyName} ({report.domain})
                </h1>
                <p className="text-xs text-zinc-400 font-mono mt-1">Generated: {report.timestamp}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {report.battlecard.targetProfile.estimatedEngMaturity}
                </span>
                <p className="text-[11px] font-mono text-zinc-500 mt-1">
                  SHA-256: {report.auditLedger.auditIntegrityHash.slice(0, 16)}...
                </p>
              </div>
            </div>

            {/* Profile Overview */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Account Architecture & Footprint
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{report.battlecard.targetProfile.summary}</p>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Cloud & Edge Perimeter:</span>
                  <span className="font-semibold text-white">{report.dnsAudit.cdnDnsProvider} + Ingress</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Email Hygiene & DMARC:</span>
                  <span className="font-semibold text-emerald-400">
                    Grade {report.dnsAudit.emailSecurityGrade} ({report.dnsAudit.mailProvider})
                  </span>
                </div>
              </div>
            </div>

            {/* Persona Hooks */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Verified Persona Hooks
              </h3>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  CTO / Head of Infrastructure Angle
                </span>
                <p className="text-xs font-semibold text-white">{report.battlecard.personaHooks.cto.thesis}</p>
                <p className="text-xs text-zinc-300 mt-1">{report.battlecard.personaHooks.cto.hook}</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                  VP Engineering Angle (Hiring Specs)
                </span>
                <p className="text-xs font-semibold text-white">{report.battlecard.personaHooks.vpEngineering.thesis}</p>
                <p className="text-xs text-zinc-300 mt-1">{report.battlecard.personaHooks.vpEngineering.hook}</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">
                  CRO / Revenue Operations Angle
                </span>
                <p className="text-xs font-semibold text-white">{report.battlecard.personaHooks.cro.thesis}</p>
                <p className="text-xs text-zinc-300 mt-1">{report.battlecard.personaHooks.cro.hook}</p>
              </div>
            </div>

            {/* Discovery Questions */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                High-Stakes Discovery Questions
              </h3>
              {report.battlecard.highStakesDiscoveryQuestions.map((q, i) => (
                <div key={i} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
                    <span>TARGET: {q.targetPersona}</span>
                    <span>Q#{i + 1}</span>
                  </div>
                  <p className="font-medium text-white">{q.question}</p>
                  <p className="text-zinc-400 italic text-[11px] mt-1">{q.rationale}</p>
                </div>
              ))}
            </div>

            {/* Audit Appendix */}
            <div className="pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Cryptographic Evidence Ledger Appendix ({report.auditLedger.totalFacts} Facts)
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {report.battlecard.auditSummary.groundingScore}% Tethered Proof
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                {report.auditLedger.facts.slice(0, 8).map((f) => (
                  <div key={f.id} className="p-2 rounded bg-zinc-900 border border-zinc-800 truncate">
                    <span className="font-bold text-emerald-400">{f.id}</span>: {f.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Document Footer */}
            <div className="pt-4 border-t border-zinc-800 text-center text-[10px] font-mono text-zinc-600">
              IntelSpider Enterprise // Zero-Hallucination Account Reconnaissance // Built for Technical Sales
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
