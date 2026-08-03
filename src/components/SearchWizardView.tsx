import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Search, 
  Terminal, 
  Zap, 
  Sliders, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Play, 
  RotateCw, 
  Building2, 
  MapPin, 
  Flame, 
  ArrowRight,
  Filter,
  Loader2
} from 'lucide-react';
import { BusinessLead, SearchFilterCriteria, TerminalLog, ActiveTab } from '../types';
import { api } from '../services/api';

interface SearchWizardViewProps {
  onExecuteSearch: (criteria: SearchFilterCriteria) => Promise<BusinessLead[]>;
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedLead: (lead: BusinessLead) => void;
}

export const SearchWizardView: React.FC<SearchWizardViewProps> = ({
  onExecuteSearch,
  setActiveTab,
  setSelectedLead,
}) => {
  const [criteria, setCriteria] = useState<SearchFilterCriteria>({
    country: 'Canada',
    province: 'Ontario',
    city: 'Toronto',
    radiusKm: 25,
    category: 'Dental Clinic',
    minRating: 3.5,
    minReviews: 10,
    targetCount: 5,
    websiteStatusFilter: 'All Flaws',
    revenueEstimateFilter: 'All Ranges',
    socialActivityFilter: 'All Levels',
    minOpportunityScore: 70,
    targetJobTitle: 'Owner / Managing Partner',
    searchPurpose: 'Website Redesign & AI Lead Capture',
    techStackFilter: 'All Tech Stacks',
    aiPromptQuery: 'Find high-intent Dental and HVAC businesses in Toronto with outdated websites, targeting Owners and HR contacts for website redesign.'
  });

  const [isSearching, setIsSearching] = useState(false);
  const [logs, setLogs] = useState<TerminalLog[]>([
    { id: '1', timestamp: '04:17:02', agent: 'Master Planner', level: 'info', message: 'Agentic Swarm Engine initialized. Ready for research query.' },
    { id: '2', timestamp: '04:17:05', agent: 'Research Coordinator', level: 'info', message: 'MCP Agent Bridge linked to Gemini 3.6 Flash & Web Scraper.' }
  ]);
  const [currentStep, setCurrentStep] = useState<string>('Idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [discoveredLeads, setDiscoveredLeads] = useState<BusinessLead[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const addLog = (agent: string, level: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const logObj: TerminalLog = { id: `log-${Date.now()}-${Math.random()}`, timestamp: timeStr, agent, level, message };
    setLogs((prev) => [...prev, logObj]);
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleApplyPromptPreset = (presetText: string, categoryVal: string, purposeVal: string) => {
    setCriteria({
      ...criteria,
      aiPromptQuery: presetText,
      category: categoryVal,
      searchPurpose: purposeVal
    });
  };

  const handleStartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSearching) return;

    setIsSearching(true);
    setProgressPercent(0);
    setCurrentStep('Initializing');
    setDiscoveredLeads([]);

    addLog('Master Planner', 'info', `Initializing multi-source search for ${criteria.category} in ${criteria.city}`);
    addLog('SearXNG Agent', 'info', `Querying Google, Bing, DuckDuckGo, Brave via SearXNG metasearch...`);

    try {
      const webResults = await api.searchWeb(`${criteria.category} in ${criteria.city} ${criteria.province}`, 10);
      if (webResults.results.length > 0) {
        addLog('SearXNG Agent', 'success', `Found ${webResults.results.length} web results via ${webResults.engines.join(', ')}`);
        setProgressPercent(15);
      } else {
        addLog('SearXNG Agent', 'warning', 'No web results from SearXNG, using fallback engines');
        setProgressPercent(10);
      }
    } catch {
      addLog('SearXNG Agent', 'warning', 'SearXNG unavailable, falling back to DuckDuckGo + Wikipedia');
      setProgressPercent(10);
    }

    addLog('SurfSense Agent', 'info', `Querying Google Maps for ${criteria.category} businesses...`);
    try {
      const mapsResults = await api.searchMaps(`${criteria.category} near ${criteria.city}`, `${criteria.city}, ${criteria.province}`);
      if (mapsResults.results.length > 0) {
        addLog('SurfSense Agent', 'success', `Found ${mapsResults.results.length} businesses via Google Maps (${mapsResults.source})`);
      } else {
        addLog('SurfSense Agent', 'info', 'No Google Maps results, will use Places API');
      }
      setProgressPercent(25);
    } catch {
      addLog('SurfSense Agent', 'warning', 'SurfSense Maps unavailable, using Google Places API');
      setProgressPercent(25);
    }

    const controller = api.runSearchStream(
      criteria,
      (log) => {
        const timeStr = new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false });
        const logObj: TerminalLog = {
          id: log.id,
          timestamp: timeStr,
          agent: log.agent,
          level: log.level,
          message: log.message,
        };
        setLogs((prev) => [...prev, logObj]);
      },
      (progress) => {
        setCurrentStep(progress.step);
        setProgressPercent(Math.max(25, progress.percent));
      },
      (lead) => {
        setDiscoveredLeads((prev) => [...prev, lead]);
      },
      (complete) => {
        setIsSearching(false);
        addLog('Master Planner', 'success', `Stream complete: ${complete.totalLeads} leads discovered from ${complete.source || 'multiple sources'}`);
      },
      (error) => {
        setIsSearching(false);
        addLog('Master Planner', 'error', `Stream error: ${error.message}`);
      }
    );

    abortControllerRef.current = controller;
  };

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsSearching(false);
      addLog('Master Planner', 'warning', 'Search cancelled by user');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider">
              <Bot className="w-4 h-4" />
              <span>Multi-Agent Lead Research Wizard</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Autonomous Agent Search</h1>
            <p className="text-xs text-slate-500 max-w-xl">
              Configure target filters to launch autonomous research agents across Google Places, web crawlers, and Gemini AI.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Agent Mode:</span>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
              Gemini 3.6 Flash + Places
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Large Search Wizard Form (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Target Criteria</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Progressive Filters</span>
          </div>

          <form onSubmit={handleStartSearch} className="space-y-4 text-xs">
            {/* Natural Language Search Target AI Input */}
            <div className="space-y-2 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-emerald-800 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                  Search Target AI Input (Agentic Prompt)
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">Gemini 3.6 Flash</span>
              </div>
              <textarea
                rows={3}
                value={criteria.aiPromptQuery || ''}
                onChange={(e) => setCriteria({ ...criteria, aiPromptQuery: e.target.value })}
                placeholder="e.g. Find high-value Dental Clinics in Toronto with missing SSL or slow websites, targeting Owners and HR contacts for website redesign..."
                className="w-full bg-white border border-emerald-200 text-slate-900 font-medium rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed shadow-2xs"
              />
              
              {/* Preset Triggers */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold mr-1">Quick Prompts:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPromptPreset('Find Dental Clinics in Toronto with slow mobile sites for redesign', 'Dental Clinic', 'Website Redesign & AI Lead Capture')}
                  className="bg-white hover:bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-emerald-200/80 transition-all cursor-pointer"
                >
                  Dental Redesign
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPromptPreset('Find HVAC Contractors in Mississauga needing SEO and local maps ranking', 'HVAC Services', 'SEO Growth & Google Maps Ranking')}
                  className="bg-white hover:bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-emerald-200/80 transition-all cursor-pointer"
                >
                  HVAC SEO
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPromptPreset('Find Law Firms in Manhattan for sales automation & cold email outreach', 'Law Firm', 'Email Marketing & Outreach')}
                  className="bg-white hover:bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-emerald-200/80 transition-all cursor-pointer"
                >
                  Legal Email Pitch
                </button>
              </div>
            </div>

            {/* Geography & Location */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase text-emerald-700 block">1. Geography & Location</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 text-[10px] font-semibold uppercase mb-1">Country</label>
                  <select
                    value={criteria.country}
                    onChange={(e) => setCriteria({ ...criteria, country: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-900 font-medium rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Canada">Canada</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-semibold uppercase mb-1">Province/State</label>
                  <input
                    type="text"
                    value={criteria.province}
                    onChange={(e) => setCriteria({ ...criteria, province: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-900 font-medium rounded-xl p-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 text-[10px] font-semibold uppercase mb-1">City</label>
                  <input
                    type="text"
                    value={criteria.city}
                    onChange={(e) => setCriteria({ ...criteria, city: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-900 font-medium rounded-xl p-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-semibold uppercase mb-1">Radius ({criteria.radiusKm} km)</label>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={criteria.radiusKm}
                    onChange={(e) => setCriteria({ ...criteria, radiusKm: Number(e.target.value) })}
                    className="w-full accent-emerald-500 mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Industry, Job Title, & Search Purpose */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase text-emerald-700 block">2. Industry, Job Title, & Search Purpose</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 text-[10px] font-semibold uppercase mb-1">Target Industry</label>
                  <select
                    value={criteria.category}
                    onChange={(e) => setCriteria({ ...criteria, category: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-900 font-medium rounded-xl p-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Dental Clinic">Dental Clinics</option>
                    <option value="HVAC Services">HVAC Services</option>
                    <option value="Law Firm">Law Firms</option>
                    <option value="Auto Repair">Auto Repair</option>
                    <option value="Gym & Fitness">Gyms & Fitness</option>
                    <option value="Restaurant">Restaurants</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Accounting Firm">Accounting Firms</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="Software / SaaS">Software & SaaS</option>
                    <option value="Medical Practice">Medical Practices</option>
                    <option value="Commercial Construction">Commercial Construction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-semibold uppercase mb-1">Target Contact Job</label>
                  <select
                    value={criteria.targetJobTitle}
                    onChange={(e) => setCriteria({ ...criteria, targetJobTitle: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-900 font-medium rounded-xl p-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Owner / Managing Partner">Owner / Managing Partner</option>
                    <option value="CEO / Founder">CEO / Founder</option>
                    <option value="HR Manager / Talent Lead">HR Lead / Talent Director</option>
                    <option value="CMO / Marketing Director">CMO / Marketing Director</option>
                    <option value="General Operations Manager">General Manager</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 text-[10px] font-semibold uppercase mb-1">Search Purpose / Service Goal</label>
                  <select
                    value={criteria.searchPurpose}
                    onChange={(e) => setCriteria({ ...criteria, searchPurpose: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-900 font-medium rounded-xl p-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Website Redesign & AI Lead Capture">Website Design & Speed</option>
                    <option value="SEO Growth & Google Maps Ranking">SEO & Maps Optimization</option>
                    <option value="Email Marketing & Outreach">Email Marketing & Pitch</option>
                    <option value="Sales Automation & AI Chatbot">Sales Automation & Chatbot</option>
                    <option value="Leads Generation & Cold Pitch">Lead Gen & Cold Pipeline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-semibold uppercase mb-1">Target Volume</label>
                  <select
                    value={criteria.targetCount}
                    onChange={(e) => setCriteria({ ...criteria, targetCount: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 text-slate-900 font-medium rounded-xl p-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={5}>5 Leads</option>
                    <option value={10}>10 Leads</option>
                    <option value={20}>20 Leads</option>
                    <option value={50}>50 Leads</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Opportunity & Tech Matrix Qualification */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase text-emerald-700 block">3. Flaw & Tech Matrix Qualification</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 text-[10px] font-semibold uppercase mb-1">Website Flaw Filter</label>
                  <select
                    value={criteria.websiteStatusFilter}
                    onChange={(e) => setCriteria({ ...criteria, websiteStatusFilter: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-900 font-medium rounded-xl p-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="All Flaws">All Website Flaws</option>
                    <option value="Missing">No Website / Parked Domain</option>
                    <option value="Outdated">Outdated / Legacy Theme</option>
                    <option value="Slow Speed">Slow Load Speed (&gt;4s)</option>
                    <option value="Broken SSL">Broken SSL / Security Warning</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-semibold uppercase mb-1">Tech Stack Filter</label>
                  <select
                    value={criteria.techStackFilter}
                    onChange={(e) => setCriteria({ ...criteria, techStackFilter: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-900 font-medium rounded-xl p-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="All Tech Stacks">All Tech Stacks</option>
                    <option value="Legacy WordPress">Legacy WordPress</option>
                    <option value="Wix / Squarespace">Wix / Squarespace</option>
                    <option value="Unencrypted HTTP">No SSL (HTTP Only)</option>
                    <option value="Slow Speed">Slow Load Time (&gt;4s)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-semibold uppercase mb-1">Min Opportunity Score Threshold</label>
                <select
                  value={criteria.minOpportunityScore}
                  onChange={(e) => setCriteria({ ...criteria, minOpportunityScore: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 text-slate-900 font-medium rounded-xl p-2 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                >
                  <option value={60}>60% + (Warm Leads - Good Potential)</option>
                  <option value={75}>75% + (High Urgency - Immediate Need)</option>
                  <option value={85}>85% + (Hot Leads - Urgent Pitch)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={isSearching}
                className={`w-full font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-emerald-200 active:scale-98 ${
                  isSearching
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    <span>Agent Execution in Progress...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white text-white" />
                    <span>Launch Autonomous Research Agent</span>
                  </>
                )}
              </button>

              {isSearching && (
                <button
                  type="button"
                  onClick={handleCancelSearch}
                  className="w-full font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                >
                  <span>Cancel Search</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side: Live Terminal View & Discovered Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Agent Status Bar */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Live Agent Terminal View</h2>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-semibold text-slate-500">
                  Status: <span className="text-emerald-600 font-bold">{currentStep}</span>
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Terminal Output Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-inner font-mono text-xs text-slate-300 h-[280px] overflow-y-auto space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2 leading-relaxed">
                <span className="text-slate-500 text-[10px] min-w-[55px] pt-0.5">[{log.timestamp}]</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase min-w-[110px] text-center ${
                  log.agent === 'Google Places Agent' ? 'bg-blue-500/20 text-blue-300' :
                  log.agent === 'Website Analyzer' ? 'bg-purple-500/20 text-purple-300' :
                  log.agent === 'Opportunity Scoring Agent' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {log.agent}
                </span>
                <span className={`flex-1 ${
                  log.level === 'error' ? 'text-red-400 font-bold' :
                  log.level === 'warning' ? 'text-amber-300' :
                  log.level === 'success' ? 'text-emerald-300 font-medium' :
                  'text-slate-300'
                }`}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Discovered Leads Stream Output */}
          {discoveredLeads.length > 0 && (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4 animate-fade-in border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                    <Sparkles className="w-4 h-4 text-emerald-600 mr-1.5" />
                    Agent Search Results ({discoveredLeads.length} Leads Discovered)
                  </h3>
                  <p className="text-xs text-slate-500">Enriched with AI opportunity scores & service pitch recommendations</p>
                </div>
                <button
                  onClick={() => setActiveTab('explorer')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1 cursor-pointer transition-all shadow-sm"
                >
                  <span>View All in Explorer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {discoveredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between hover:border-emerald-500 transition-all"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{lead.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {lead.websiteStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {lead.address} • {lead.phone} • {lead.estimatedRevenue}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-medium">Opportunity</span>
                        <span className="text-sm font-bold text-emerald-600">{lead.opportunityScore}%</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setActiveTab('explorer');
                        }}
                        className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
