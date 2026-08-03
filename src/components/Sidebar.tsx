import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Bot,
  Building2,
  Globe2,
  Target,
  Send,
  BarChart3,
  Download,
  Mail,
  CheckSquare,
  Cpu,
  Settings,
  Radio,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Map,
  Terminal,
  X,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onToggle: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  totalLeadsCount: number;
  hotLeadsCount: number;
  isAgentRunning: boolean;
  terminalLogsCount: number;
  onToggleTerminal?: () => void;
}

interface NavGroup {
  label: string;
  items: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string | number }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onToggle,
  isCollapsed,
  onToggleCollapse,
  totalLeadsCount,
  hotLeadsCount,
  isAgentRunning,
  terminalLogsCount,
  onToggleTerminal,
}) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navGroups: NavGroup[] = [
    {
      label: 'Discover',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <Layers className="w-[18px] h-[18px]" /> },
        { id: 'search', label: 'Agent Search', icon: <Bot className="w-[18px] h-[18px]" />, badge: isAgentRunning ? 'LIVE' : undefined },
        { id: 'explorer', label: 'Businesses', icon: <Building2 className="w-[18px] h-[18px]" />, badge: totalLeadsCount },
        { id: 'analyzer', label: 'Website Scanner', icon: <Globe2 className="w-[18px] h-[18px]" /> },
      ],
    },
    {
      label: 'Jobs',
      items: [
        { id: 'jobs', label: 'Job Search', icon: <Sparkles className="w-[18px] h-[18px]" />, badge: 'NEW' },
        { id: 'job-map', label: 'Global Map', icon: <Map className="w-[18px] h-[18px]" /> },
      ],
    },
    {
      label: 'Intelligence',
      items: [
        { id: 'intelligence', label: 'AI Scoring', icon: <Target className="w-[18px] h-[18px]" />, badge: `${hotLeadsCount} Hot` },
        { id: 'campaigns', label: 'Campaigns', icon: <Send className="w-[18px] h-[18px]" /> },
        { id: 'outreach', label: 'Outreach', icon: <Mail className="w-[18px] h-[18px]" /> },
        { id: 'approvals', label: 'Approvals', icon: <CheckSquare className="w-[18px] h-[18px]" /> },
      ],
    },
    {
      label: 'Analytics',
      items: [
        { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-[18px] h-[18px]" /> },
        { id: 'exports', label: 'Exports & CRM', icon: <Download className="w-[18px] h-[18px]" /> },
      ],
    },
    {
      label: 'System',
      items: [
        { id: 'agents-memory', label: 'Agent Memory', icon: <Cpu className="w-[18px] h-[18px]" />, badge: 'MCP' },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-[18px] h-[18px]" /> },
      ],
    },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 72 : 260,
          x: isDesktop ? 0 : (isOpen ? 0 : -280),
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 bottom-0 bg-white border-r border-slate-200/80 z-50 flex flex-col lg:translate-x-0 lg:static lg:z-auto"
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => { setActiveTab('dashboard'); if (window.innerWidth < 1024) onToggle(); }}>
            <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
              <path d="M44 16C36 16 30 22 30 30C30 38 36 44 44 44C48 44 50 42 50 38C50 42 48 42 44 42C38 42 34 36 34 30C34 24 38 18 44 18C48 18 50 20 50 24C50 20 48 16 44 16Z" fill="#1a56db" />
              <rect x="8" y="26" width="14" height="4" rx="2" fill="#00bfff" />
              <rect x="8" y="34" width="10" height="4" rx="2" fill="#00bfff" />
              <circle cx="18" cy="20" r="2.5" fill="#00bfff" />
              <circle cx="18" cy="44" r="2.5" fill="#00bfff" />
            </svg>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <span className="font-bold text-[15px] tracking-tight text-slate-900">ColdRunners</span>
                  <span className="ml-1.5 text-[9px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-bold">BI</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors lg:hidden">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
          {navGroups.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? 'mt-6' : ''}>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400"
                  >
                    {group.label}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); if (window.innerWidth < 1024) onToggle(); }}
                      whileTap={{ scale: 0.97 }}
                      className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group relative ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-500 rounded-r-full"
                          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        />
                      )}
                      <span className={isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}>
                        {item.icon}
                      </span>
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex-1 text-left overflow-hidden whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!isCollapsed && item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                            item.badge === 'LIVE'
                              ? 'bg-emerald-500 text-white animate-pulse'
                              : item.badge === 'NEW'
                              ? 'bg-blue-500 text-white'
                              : item.badge === 'MCP'
                              ? 'bg-purple-100 text-purple-700'
                              : isActive
                              ? 'bg-emerald-200/60 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-100 p-2 space-y-1">
          {onToggleTerminal && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onToggleTerminal}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all`}
              title={isCollapsed ? 'Open Agent Terminal Logs' : undefined}
            >
              <Terminal className="w-[18px] h-[18px] text-slate-400" />
              <AnimatePresence>
                {!isCollapsed && (
                  <>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 text-left"
                    >
                      Terminal
                    </motion.span>
                    <span className="text-[10px] bg-slate-900 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full font-mono">
                      {terminalLogsCount}
                    </span>
                  </>
                )}
              </AnimatePresence>
            </motion.button>
          )}
          
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center px-3 py-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
};
