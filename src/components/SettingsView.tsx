import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  Bot, 
  ShieldCheck, 
  Key, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  Globe, 
  Terminal,
  Layers,
  Users,
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  RefreshCw,
  Calendar,
  AlertCircle,
  Save
} from 'lucide-react';
import { Skeleton } from './ui/Skeleton';
import { useToast } from './ui/Toast';
import { api } from '../services/api';

interface CronJob {
  id: string;
  name: string;
  criteria: any;
  schedule: string;
  enabled: boolean;
  createdAt: string;
  lastRun: string | null;
  nextRun: string;
  runCount: number;
  status: 'idle' | 'running' | 'completed' | 'error';
}

export const SettingsView: React.FC = () => {
  const { addToast } = useToast();
  const [agentToggles, setAgentToggles] = useState({
    googlePlaces: true,
    websiteAnalyzer: true,
    contactFinder: true,
    aiScoring: true,
    deduplication: true
  });
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [isLoadingCron, setIsLoadingCron] = useState(true);
  const [showNewCron, setShowNewCron] = useState(false);
  const [newCronName, setNewCronName] = useState('');
  const [newCronSchedule, setNewCronSchedule] = useState('0 9 * * 1');
  const [newCronCity, setNewCronCity] = useState('Toronto');
  const [newCronCategory, setNewCronCategory] = useState('Dental Clinic');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCronJobs();
  }, []);

  const loadCronJobs = async () => {
    try {
      const data = await api.getCronJobs();
      setCronJobs(data.jobs || []);
    } catch {
      // silent
    } finally {
      setIsLoadingCron(false);
    }
  };

  const handleCreateCron = async () => {
    if (!newCronName.trim()) return;
    setIsSaving(true);
    try {
      const job = await api.createCronJob({
        name: newCronName,
        criteria: {
          country: 'Canada',
          province: 'Ontario',
          city: newCronCity,
          radiusKm: 25,
          category: newCronCategory,
          minRating: 3.5,
          minReviews: 10,
          targetCount: 10,
          websiteStatusFilter: 'All Flaws',
          revenueEstimateFilter: 'All Ranges',
          socialActivityFilter: 'All Levels',
          minOpportunityScore: 70,
        },
        schedule: newCronSchedule,
        enabled: true,
      });
      setCronJobs((prev) => [...prev, job]);
      setShowNewCron(false);
      setNewCronName('');
      addToast({ type: 'success', title: 'Scheduled search created', message: `"${newCronName}" will run automatically` });
    } catch {
      addToast({ type: 'error', title: 'Failed to create scheduled search' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCron = async (job: CronJob) => {
    try {
      const updated = await api.updateCronJob(job.id, { enabled: !job.enabled });
      setCronJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
    } catch {
      addToast({ type: 'error', title: 'Failed to update scheduled search' });
    }
  };

  const handleRunCron = async (job: CronJob) => {
    try {
      await api.runCronJob(job.id);
      addToast({ type: 'success', title: `Running "${job.name}"`, message: 'Scheduled search executed successfully' });
      loadCronJobs();
    } catch {
      addToast({ type: 'error', title: `Failed to run "${job.name}"` });
    }
  };

  const handleDeleteCron = async (id: string) => {
    try {
      await api.deleteCronJob(id);
      setCronJobs((prev) => prev.filter((j) => j.id !== id));
      addToast({ type: 'info', title: 'Scheduled search deleted' });
    } catch {
      addToast({ type: 'error', title: 'Failed to delete scheduled search' });
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await api.updateSettings({ agentToggles });
      addToast({ type: 'success', title: 'Settings saved', message: 'Agent configuration updated' });
    } catch {
      addToast({ type: 'error', title: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider">
              <Settings className="w-4 h-4" />
              <span>Platform Configuration</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Workspace & Agent Settings</h1>
            <p className="text-xs text-slate-500">
              Manage agent swarm toggles, scheduled searches, and system configuration.
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Settings</span>
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Bot className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Autonomous Agent Orchestration</h2>
          </div>

          <div className="space-y-3">
            {([
              { key: 'googlePlaces', name: 'Google Places Discovery Agent', desc: 'Discovers local businesses & geocodes addresses' },
              { key: 'websiteAnalyzer', name: 'Website Analyzer & Lighthouse Worker', desc: 'Scans PageSpeed, SSL, & tech stack fingerprints' },
              { key: 'contactFinder', name: 'Contact & Decision Maker Discovery Agent', desc: 'Enriches owner names, emails, & WhatsApp links' },
              { key: 'aiScoring', name: 'AI Opportunity Scoring Agent', desc: 'Uses Gemini 3.6 Flash reasoning for pitch strategy' },
            ] as const).map((agent) => (
              <motion.div
                key={agent.key}
                whileHover={{ scale: 1.01 }}
                className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900 text-xs">{agent.name}</div>
                  <div className="text-[10px] text-slate-500 font-medium">{agent.desc}</div>
                </div>
                <button
                  onClick={() => setAgentToggles({ ...agentToggles, [agent.key]: !agentToggles[agent.key] })}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    agentToggles[agent.key] ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      agentToggles[agent.key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Cpu className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">MCP Agent Framework & System Health</h2>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Server Side Gemini API Key:</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Active (Injected)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Primary AI Reasoning Model:</span>
              <span className="text-xs font-bold text-slate-900">gemini-3.6-flash</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">MCP Agent Extensibility:</span>
              <span className="text-xs font-bold text-purple-700">Compliant Specification</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase block">Workspace Members</span>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Luke (Agency Founder - Owner)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduled Searches (Cron Jobs) */}
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Scheduled Agent Searches</h2>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewCron(!showNewCron)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Schedule</span>
          </motion.button>
        </div>

        {showNewCron && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl space-y-3"
          >
            <span className="text-[11px] font-bold uppercase text-emerald-800 block">Create Scheduled Search</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Job Name</label>
                <input
                  type="text"
                  value={newCronName}
                  onChange={(e) => setNewCronName(e.target.value)}
                  placeholder="e.g. Weekly Dental Leads"
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">City</label>
                <input
                  type="text"
                  value={newCronCity}
                  onChange={(e) => setNewCronCity(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Category</label>
                <select
                  value={newCronCategory}
                  onChange={(e) => setNewCronCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                >
                  <option value="Dental Clinic">Dental Clinics</option>
                  <option value="HVAC Services">HVAC Services</option>
                  <option value="Law Firm">Law Firms</option>
                  <option value="Auto Repair">Auto Repair</option>
                  <option value="Gym & Fitness">Gyms & Fitness</option>
                  <option value="Restaurant">Restaurants</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Schedule (Cron)</label>
                <input
                  type="text"
                  value={newCronSchedule}
                  onChange={(e) => setNewCronSchedule(e.target.value)}
                  placeholder="0 9 * * 1"
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCreateCron}
                disabled={isSaving || !newCronName.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                <span>Create Schedule</span>
              </button>
              <button
                onClick={() => setShowNewCron(false)}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {isLoadingCron ? (
          <div className="space-y-3">
            <Skeleton variant="rectangular" height={80} />
            <Skeleton variant="rectangular" height={80} />
          </div>
        ) : cronJobs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No scheduled searches yet. Create one to automate lead discovery.
          </div>
        ) : (
          <div className="space-y-3">
            {cronJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-xs">{job.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      job.status === 'running' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      job.status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                      job.enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {job.status === 'running' ? 'Running' : job.enabled ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {job.schedule}
                    </span>
                    <span>Runs: {job.runCount}</span>
                    {job.lastRun && <span>Last: {new Date(job.lastRun).toLocaleDateString()}</span>}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRunCron(job)}
                    className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <Play className="w-3 h-3" />
                    <span>Run Now</span>
                  </button>
                  <button
                    onClick={() => handleToggleCron(job)}
                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                      job.enabled
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {job.enabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    <span>{job.enabled ? 'Pause' : 'Resume'}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCron(job.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
