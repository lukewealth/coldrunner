import React, { useState } from 'react';
import { Logo, Wordmark } from './Logo';
import { Copy, Check } from 'lucide-react';

export const BrandShowcaseView: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const colors = [
    { name: 'Primary Blue', hex: '#1a56db', variable: '--color-primary' },
    { name: 'Cyan Accent', hex: '#00bfff', variable: '--color-accent' },
    { name: 'Professional Gray', hex: '#CBD5E1', variable: '--color-gray' },
    { name: 'Opportunity Yellow', hex: '#FBBF24', variable: '--color-opportunity' },
    { name: 'Slate 900', hex: '#0F172A', variable: '--color-dark' },
    { name: 'White', hex: '#FFFFFF', variable: '--color-white' },
  ];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider">
          <span>Brand Identity System</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">ColdRunners Logo & Visual Identity</h1>
        <p className="text-xs text-slate-500 max-w-xl">
          Logo design featuring a dynamic "C" with speed lines and sparkle, representing autonomous AI agents collaborating through a network at high velocity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 space-y-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Primary Icon</h2>
          <div className="flex items-center justify-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
            <Logo size={128} variant="blue" />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>SVG Vector</span>
            <span>64 x 64 viewBox</span>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900 p-8 shadow-sm ring-1 ring-slate-800 space-y-6">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Dark Mode</h2>
          <div className="flex items-center justify-center py-8 bg-slate-950 rounded-2xl border border-slate-800">
            <Logo size={128} variant="white" />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>White on Dark</span>
            <span>For dark backgrounds</span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 space-y-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Animated (Active Agents)</h2>
        <div className="flex items-center justify-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
          <Logo size={128} variant="blue" animated={true} />
        </div>
        <p className="text-xs text-slate-500 text-center">
          Center "C" pulses to indicate active intelligence. Sparkle animates to suggest continuous discovery. Speed lines represent rapid data processing.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 space-y-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Wordmark Lockup</h2>
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-center py-6 bg-white rounded-2xl border border-slate-200">
            <Wordmark height={48} variant="light" />
          </div>
          <div className="flex items-center justify-center py-6 bg-slate-900 rounded-2xl border border-slate-800">
            <Wordmark height={48} variant="dark" />
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 space-y-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Scale Test</h2>
        <div className="flex items-end justify-center space-x-8 py-8 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="text-center space-y-2">
            <Logo size={16} variant="blue" />
            <span className="text-[10px] text-slate-400 font-mono block">16px</span>
          </div>
          <div className="text-center space-y-2">
            <Logo size={24} variant="blue" />
            <span className="text-[10px] text-slate-400 font-mono block">24px</span>
          </div>
          <div className="text-center space-y-2">
            <Logo size={32} variant="blue" />
            <span className="text-[10px] text-slate-400 font-mono block">32px</span>
          </div>
          <div className="text-center space-y-2">
            <Logo size={48} variant="blue" />
            <span className="text-[10px] text-slate-400 font-mono block">48px</span>
          </div>
          <div className="text-center space-y-2">
            <Logo size={64} variant="blue" />
            <span className="text-[10px] text-slate-400 font-mono block">64px</span>
          </div>
          <div className="text-center space-y-2">
            <Logo size={96} variant="blue" />
            <span className="text-[10px] text-slate-400 font-mono block">96px</span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 space-y-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Color Palette</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {colors.map((c) => (
            <button
              key={c.hex}
              onClick={() => handleCopy(c.hex, c.hex)}
              className="flex items-center space-x-3 p-3 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group"
            >
              <div
                className="w-10 h-10 rounded-xl border border-slate-200 shadow-sm"
                style={{ backgroundColor: c.hex }}
              />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">{c.name}</div>
                <div className="text-[10px] font-mono text-slate-500 flex items-center">
                  {c.hex}
                  {copied === c.hex ? (
                    <Check className="w-3 h-3 ml-1 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3 ml-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Design Principles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Speed', desc: 'Speed lines represent rapid AI processing and autonomous discovery.' },
            { label: 'Intelligence', desc: 'The sparkle/star symbolizes AI-powered insights and brilliance.' },
            { label: 'Motion', desc: 'Animated elements suggest continuous autonomous agent operation.' },
            { label: 'Trust', desc: 'Enterprise-grade precision with modern gradient aesthetics.' },
          ].map((p) => (
            <div key={p.label} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-blue-700">{p.label}</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
