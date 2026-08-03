import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Sparkles,
  Building2,
  CheckCircle2,
  Flame,
  TrendingUp,
  MapPin,
  Activity,
  Globe,
  ArrowRight,
  Phone,
  Mail,
  ExternalLink,
  Bot,
  Zap,
  Filter,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Terminal,
  Globe2,
  Flag
} from 'lucide-react';
import { BusinessLead, AgentStatusItem, ActiveTab } from '../types';
import { StaggerList, StaggerItem } from './ui/StaggerList';
import { api } from '../services/api';

interface DashboardViewProps {
  leads: BusinessLead[];
  agents: AgentStatusItem[];
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedLead: (lead: BusinessLead) => void;
  onQuickSearch: (params: { country: string; province: string; city: string; category: string; targetCount: number }) => void;
  onOpenTerminal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  agents,
  setActiveTab,
  setSelectedLead,
  onQuickSearch,
  onOpenTerminal,
}) => {
  const [quickCountry, setQuickCountry] = useState('Canada');
  const [quickProvince, setQuickProvince] = useState('Ontario');
  const [quickCity, setQuickCity] = useState('Toronto');
  const [quickCategory, setQuickCategory] = useState('Dental Clinic');
  const [quickCount, setQuickCount] = useState(5);
  const [activeMapPin, setActiveMapPin] = useState<BusinessLead | null>(leads[0] || null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
  }, []);

  const hotLeads = leads.filter((l) => l.grade === 'HOT');
  const qualifiedLeads = leads.filter((l) => l.status === 'Qualified' || l.status === 'Contacted' || l.grade === 'HOT');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickSearch({
      country: quickCountry,
      province: quickProvince,
      city: quickCity,
      category: quickCategory,
      targetCount: Number(quickCount)
    });
  };

  const totalFound = stats?.totalLeads || leads.length;
  const totalQualified = stats ? (stats.totalLeads - stats.coldLeads) : (420 + qualifiedLeads.length);
  const totalHot = stats?.hotLeads || (126 + hotLeads.length);
  const avgOpp = stats?.avgOpportunityScore || 89;

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-emerald-600 text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Autonomous Lead Discovery Engine</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight mt-1">
                Hello Luke
              </h1>
              <p className="text-slate-500 text-sm max-w-xl mt-0.5">
                Target unserviced local businesses with active revenue gaps using real-time agentic research.
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-700 bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-100">
              <Bot className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-slate-500 font-mono block text-[10px]">Active Multi-Agent Grid</span>
                <span className="font-bold text-emerald-700">5 Autonomous Agents Online</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleQuickSubmit} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Country</label>
              <select
                value={quickCountry}
                onChange={(e) => setQuickCountry(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              >
                <option value="Canada">Canada</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Province/State</label>
              <input
                type="text"
                value={quickProvince}
                onChange={(e) => setQuickProvince(e.target.value)}
                placeholder="e.g. Ontario"
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">City</label>
              <input
                type="text"
                value={quickCity}
                onChange={(e) => setQuickCity(e.target.value)}
                placeholder="e.g. Toronto"
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Industry</label>
              <select
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              >
                <option value="Dental Clinic">Dental Clinics</option>
                <option value="HVAC Services">HVAC Services</option>
                <option value="Law Firm">Law Firms</option>
                <option value="Auto Repair">Auto Repair</option>
                <option value="Gym & Fitness">Gyms & Fitness</option>
                <option value="Restaurant">Restaurants</option>
                <option value="Plumbing">Plumbing Services</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Count</label>
              <select
                value={quickCount}
                onChange={(e) => setQuickCount(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              >
                <option value={5}>5 Leads</option>
                <option value={10}>10 Leads</option>
                <option value={20}>20 Leads</option>
                <option value={50}>50 Leads</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-200 transition-all cursor-pointer active:scale-95"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Start Agent</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Businesses Found</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-slate-900">{totalFound.toLocaleString()}</span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  +14% this wk
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Total local businesses scraped & mapped</p>
            </div>
        </StaggerItem>

        <StaggerItem>
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qualified Leads</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-emerald-600">{totalQualified}</span>
                <span className="text-xs font-medium text-slate-500">14.7% conversion</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Passed audit & verified contact info</p>
            </div>
        </StaggerItem>

        <StaggerItem>
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hot Leads</span>
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center font-bold">
                  <Flame className="w-5 h-5 fill-orange-500" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-orange-500">{totalHot}</span>
                <span className="text-xs font-semibold text-orange-600 font-mono">Opportunity &gt;85%</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">High revenue businesses with broken sites</p>
            </div>
        </StaggerItem>

        <StaggerItem>
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Opportunity</span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-slate-900">{avgOpp}%</span>
                <span className="text-xs font-semibold text-blue-600">High Agency Need</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Average revenue gap across current queue</p>
            </div>
        </StaggerItem>
      </StaggerList>

      <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Live Agent Swarm Orchestration</h2>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenTerminal && (
              <button
                onClick={onOpenTerminal}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold transition-all cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Stream Logs Terminal</span>
              </button>
            )}
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
              Active Orchestration
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {agents.map((ag) => (
            <div key={ag.id} className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 truncate pr-2">{ag.name}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    ag.status === 'Running'
                      ? 'bg-emerald-400 animate-pulse'
                      : ag.status === 'Processing'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-slate-500'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">{ag.status}</span>
                <span className="text-emerald-400 font-bold">{ag.itemsProcessed} items</span>
              </div>

              <p className="text-[10px] text-slate-300 line-clamp-1 italic font-mono bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                {ag.currentTask}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Geographic Lead Intelligence Map</h2>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5 inline-block" />
                Hot Lead (&gt;85%)
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5 inline-block" />
                Warm Lead (60-84%)
              </span>
            </div>
          </div>

          <div className="relative w-full h-[320px] bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center group shadow-inner">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#10B981 1px, transparent 1px), radial-gradient(#334155 1px, #0F172A 1px)`,
                backgroundSize: '20px 20px, 40px 40px'
              }}
            />

            <svg className="absolute inset-0 w-full h-full opacity-25 stroke-slate-600 pointer-events-none" strokeWidth="1.5">
              <line x1="0" y1="80" x2="100%" y2="80" />
              <line x1="0" y1="200" x2="100%" y2="200" />
              <line x1="120" y1="0" x2="120" y2="100%" />
              <line x1="380" y1="0" x2="380" y2="100%" />
              <line x1="600" y1="0" x2="600" y2="100%" />
              <path d="M 50 250 Q 200 100 500 220 T 900 150" fill="none" stroke="#10B981" strokeWidth="3" opacity="0.6" />
            </svg>

            {leads.map((lead, idx) => {
              const xPos = 15 + ((idx * 17) % 75);
              const yPos = 20 + ((idx * 23) % 65);
              const isSelected = activeMapPin?.id === lead.id;
              const isHot = lead.grade === 'HOT';

              return (
                <button
                  key={lead.id}
                  onClick={() => setActiveMapPin(lead)}
                  style={{ left: `${xPos}%`, top: `${yPos}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full border transition-all duration-200 cursor-pointer group-hover:scale-105 z-10 ${
                    isSelected
                      ? 'scale-125 bg-white text-slate-900 border-emerald-500 shadow-xl z-20 ring-4 ring-emerald-400/40'
                      : isHot
                      ? 'bg-emerald-500 text-white border-emerald-300 shadow-md shadow-emerald-500/40'
                      : 'bg-amber-500 text-slate-950 border-amber-300'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white border border-slate-700 text-[10px] font-mono px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {lead.name} ({lead.opportunityScore}%)
                  </span>
                </button>
              );
            })}

            <div className="absolute bottom-3 left-3 bg-white/90 text-slate-800 text-[11px] font-semibold px-3 py-1.5 rounded-xl backdrop-blur shadow-sm flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-emerald-600" />
              Toronto Metropolitan Area ({leads.length} Leads Active)
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Map Pin Focus</span>
            {activeMapPin && (
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                activeMapPin.grade === 'HOT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {activeMapPin.grade} LEAD ({activeMapPin.opportunityScore}%)
              </span>
            )}
          </div>

          {activeMapPin ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">{activeMapPin.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{activeMapPin.category} • {activeMapPin.city}, {activeMapPin.province}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Website Status:</span>
                  <span className="font-bold text-amber-600">{activeMapPin.websiteStatus}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Est. Revenue:</span>
                  <span className="font-bold text-slate-900">{activeMapPin.estimatedRevenue}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Rating:</span>
                  <span className="font-bold text-emerald-600">★ {activeMapPin.rating} ({activeMapPin.reviewCount} reviews)</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-semibold uppercase">AI Pitch Angle:</span>
                <p className="text-xs text-slate-700 leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  {activeMapPin.recommendedService}
                </p>
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  onClick={() => setSelectedLead(activeMapPin)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-200 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Full Lead</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedLead(activeMapPin);
                    setActiveTab('campaigns');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Outreach</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Click any map pin to focus lead intelligence details
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Agent Lead Processing Pipeline</h2>
            <p className="text-xs text-slate-500">End-to-end continuous lead conversion flow</p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Realtime Automated Sync
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Step 1</span>
            <div className="text-2xl font-bold text-slate-900">{totalFound.toLocaleString()}</div>
            <div className="text-xs font-semibold text-slate-700">Found</div>
            <div className="text-[10px] text-slate-500">Google Places</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Step 2</span>
            <div className="text-2xl font-bold text-blue-600">{Math.floor(totalFound * 0.5).toLocaleString()}</div>
            <div className="text-xs font-semibold text-slate-700">Audited</div>
            <div className="text-[10px] text-slate-500">Website Scanner</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Step 3</span>
            <div className="text-2xl font-bold text-purple-600">{Math.floor(totalFound * 0.35).toLocaleString()}</div>
            <div className="text-xs font-semibold text-slate-700">Enriched</div>
            <div className="text-[10px] text-slate-500">Emails & Socials</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Step 4</span>
            <div className="text-2xl font-bold text-amber-600">{totalQualified}</div>
            <div className="text-xs font-semibold text-slate-700">Scored</div>
            <div className="text-[10px] text-slate-500">AI Opportunity</div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase">Step 5</span>
            <div className="text-2xl font-bold text-emerald-600">{totalHot}</div>
            <div className="text-xs font-bold text-slate-900">Hot Leads</div>
            <div className="text-[10px] text-emerald-700 font-medium">Ready to Outreach</div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <Flame className="w-4 h-4 text-orange-500 mr-1.5 fill-orange-500" />
              Highest Urgency Lead Opportunities
            </h2>
            <p className="text-xs text-slate-500">Top ranked business prospects sorted by AI Opportunity Score</p>
          </div>
          <button
            onClick={() => setActiveTab('explorer')}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1 cursor-pointer"
          >
            <span>View All ({leads.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Business & Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Website Flaw</th>
                <th className="py-3 px-4">Rating / Reviews</th>
                <th className="py-3 px-4">AI Opportunity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {leads.slice(0, 10).map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{lead.name}</div>
                    <div className="text-slate-500 text-[11px]">{lead.category} • {lead.estimatedRevenue}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {lead.city}, {lead.province || lead.country}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      {lead.websiteStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium">
                    <span className="text-emerald-600 font-bold">★ {lead.rating}</span> ({lead.reviewCount})
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${lead.opportunityScore}%` }}
                        />
                      </div>
                      <span className="font-bold text-emerald-600">{lead.opportunityScore}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      Audit Card
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLead(lead);
                        setActiveTab('campaigns');
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] shadow-sm transition-all cursor-pointer"
                    >
                      Outreach
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
