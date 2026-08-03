import React from 'react';
import { motion } from 'motion/react';
import { 
  Bot, 
  Search, 
  Building2, 
  Globe2, 
  Target, 
  Send, 
  BarChart3, 
  Download, 
  Settings, 
  Zap,
  Sparkles,
  Layers,
  Terminal,
  Cpu,
  Wifi,
  WifiOff,
  Activity,
  Mail,
  CheckSquare
} from 'lucide-react';
import { ActiveTab } from '../types';
import { Logo } from './Logo';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  totalLeadsCount: number;
  hotLeadsCount: number;
  isAgentRunning: boolean;
  onToggleTerminal?: () => void;
  terminalLogsCount?: number;
  apiHealth?: 'ok' | 'degraded' | 'offline';
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalLeadsCount,
  hotLeadsCount,
  isAgentRunning,
  onToggleTerminal,
  terminalLogsCount = 0,
  apiHealth = 'ok',
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Layers className="w-4 h-4" /> },
    { id: 'search', label: 'Agent Search', icon: <Bot className="w-4 h-4" />, badge: isAgentRunning ? 'LIVE' : undefined },
    { id: 'explorer', label: 'Businesses', icon: <Building2 className="w-4 h-4" />, badge: totalLeadsCount },
    { id: 'analyzer', label: 'Website Scanner', icon: <Globe2 className="w-4 h-4" /> },
    { id: 'intelligence', label: 'AI Scoring', icon: <Target className="w-4 h-4" />, badge: `${hotLeadsCount} Hot` },
    { id: 'campaigns', label: 'Campaigns', icon: <Send className="w-4 h-4" /> },
    { id: 'outreach', label: 'Outreach', icon: <Mail className="w-4 h-4" /> },
    { id: 'approvals', label: 'Approvals', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'exports', label: 'Exports & CRM', icon: <Download className="w-4 h-4" /> },
    { id: 'agents-memory', label: 'Agent Memory', icon: <Cpu className="w-4 h-4" />, badge: 'MCP' },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const healthColor = apiHealth === 'ok' ? 'bg-emerald-500' : apiHealth === 'degraded' ? 'bg-amber-500' : 'bg-red-500';
  const HealthIcon = apiHealth === 'offline' ? WifiOff : Wifi;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="transition-transform hover:scale-105">
              <Logo size={40} variant="blue" animated={isAgentRunning} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">ColdRunners</span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  BI v3.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Agentic Business Intelligence</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200/60 font-semibold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-600' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        item.badge === 'LIVE'
                          ? 'bg-emerald-500 text-white font-bold animate-pulse'
                          : isActive
                          ? 'bg-emerald-200/60 text-emerald-800 font-bold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-3">
            {onToggleTerminal && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onToggleTerminal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-medium shadow-sm transition-all cursor-pointer ring-1 ring-slate-800"
                title="Open Agent Activity Terminal Stream"
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Terminal</span>
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full font-mono">
                  {terminalLogsCount}
                </span>
              </motion.button>
            )}

            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span className={`w-2 h-2 rounded-full ${healthColor} ${apiHealth === 'ok' ? '' : 'animate-pulse'}`} />
              <HealthIcon className="w-3 h-3 text-slate-400" />
              <span className="font-mono text-[11px] font-medium">
                {isAgentRunning ? 'Agents Active' : 'Agents Idle'}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('search')}
              className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-200 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Search</span>
            </motion.button>
          </div>
        </div>

        <div className="lg:hidden flex items-center space-x-2 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
                activeTab === item.id ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200' : 'text-slate-500'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
