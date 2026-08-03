import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RotateCw,
  Cpu,
  Zap,
  ArrowRight,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Skeleton } from './ui/Skeleton';
import { api } from '../services/api';
import { useToast } from './ui/Toast';

export const WebsiteAnalyzerView: React.FC = () => {
  const [url, setUrl] = useState('apexdentaltoronto.ca');
  const [isScanning, setIsScanning] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const { addToast } = useToast();

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isScanning) return;

    setIsScanning(true);
    try {
      const data = await api.analyzeWebsite(url);
      setAuditResult(data);
      addToast({ type: 'success', title: 'Audit Complete', message: `Analyzed ${url}` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Audit Failed', message: err.message || 'Could not analyze website' });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider">
              <Globe className="w-4 h-4" />
              <span>Live Website Scanner Agent</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Website & Tech Stack Audit</h1>
            <p className="text-xs text-slate-500">
              Run real-time PageSpeed, SEO, technology stack, and revenue bottleneck diagnostics on any business website.
            </p>
          </div>
        </div>

        <form onSubmit={handleScan} className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website domain or URL (e.g. summithvac.ca)..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isScanning}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-200 transition-all cursor-pointer active:scale-95"
          >
            {isScanning ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-white" />
                <span>Auditing Website...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white text-white" />
                <span>Run AI Audit</span>
              </>
            )}
          </button>
        </form>
      </div>

      {isScanning && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
          <Skeleton variant="rectangular" height={80} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton variant="rectangular" height={200} />
            <Skeleton variant="rectangular" height={200} />
          </div>
        </div>
      )}

      {auditResult && !isScanning && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 text-center space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Performance</span>
              <div className={`text-3xl font-black ${auditResult.performance < 50 ? 'text-red-600' : 'text-emerald-600'}`}>
                {auditResult.performance}/100
              </div>
              <p className="text-[11px] text-slate-500">{(auditResult.loadTimeMs / 1000).toFixed(1)}s load time</p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 text-center space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SEO Score</span>
              <div className="text-3xl font-black text-amber-600">
                {auditResult.seo}/100
              </div>
              <p className="text-[11px] text-slate-500">Local Search Health</p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 text-center space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Accessibility</span>
              <div className="text-3xl font-black text-blue-600">
                {auditResult.accessibility}/100
              </div>
              <p className="text-[11px] text-slate-500">Mobile Friendly</p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 text-center space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security & SSL</span>
              <div className="text-3xl font-black text-emerald-600 flex items-center justify-center pt-1">
                {auditResult.hasSSL ? <ShieldCheck className="w-8 h-8 text-emerald-600" /> : <AlertTriangle className="w-8 h-8 text-red-600" />}
              </div>
              <p className="text-[11px] text-slate-500">{auditResult.hasSSL ? 'Valid Certificate' : 'Missing SSL'}</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block flex items-center">
              <Cpu className="w-4 h-4 text-emerald-600 mr-1.5" />
              Detected Technologies
            </span>
            <div className="flex flex-wrap gap-2">
              {auditResult.techStack?.map((t: string) => (
                <span key={t} className="bg-slate-50 border border-slate-200 text-slate-800 px-3 py-1 rounded-xl text-xs font-semibold">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-red-50/50 border border-red-200 p-6 shadow-sm space-y-3">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                Key Technical Bottlenecks
              </span>
              <ul className="space-y-2 text-xs text-slate-700">
                {auditResult.issues?.map((iss: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-red-600 font-bold mr-2">•</span>
                    <span>{iss}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl bg-emerald-50/50 border border-emerald-200 p-6 shadow-sm space-y-3">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                High Impact Agency Solutions
              </span>
              <ul className="space-y-2 text-xs text-slate-700">
                {auditResult.opportunities?.map((opp: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-emerald-600 font-bold mr-2">•</span>
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block flex items-center">
              <Sparkles className="w-4 h-4 text-emerald-600 mr-1.5" />
              Generated Agency Proposal Pitch
            </span>
            <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200">
              "{auditResult.agencyProposalPitch}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
