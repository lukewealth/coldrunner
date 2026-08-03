import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  X, 
  Minimize2, 
  Maximize2, 
  Pause, 
  Play, 
  Trash2, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  AlertCircle,
  ArrowDown,
  RefreshCw
} from 'lucide-react';
import { TerminalLog } from '../types';

interface TerminalLogsOverlayProps {
  logs: TerminalLog[];
  onClearLogs: () => void;
  onAddLog?: (log: TerminalLog) => void;
  isAgentRunning?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  activeTab?: string;
}

export const TerminalLogsOverlay: React.FC<TerminalLogsOverlayProps> = ({
  logs,
  onClearLogs,
  onAddLog,
  isAgentRunning = false,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  activeTab
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current && isOpen && !isMinimized) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, isOpen, isMinimized, selectedLevel, selectedAgent, searchQuery]);

  useEffect(() => {
    if (!isStreaming) return;

    const sampleSimulatedEvents: Omit<TerminalLog, 'id' | 'timestamp'>[] = [
      {
        agent: 'Google Places Discovery',
        level: 'info',
        message: 'Scanning regional GMB listings for key parameters & localized phone numbers...'
      },
      {
        agent: 'Website Analyzer',
        level: 'info',
        message: 'Checking TLS 1.3 handshake and response latency for target domain...'
      },
      {
        agent: 'Website Analyzer',
        level: 'warning',
        message: 'Detected missing OpenGraph meta tags and slow DOM Content Loaded (3.1s).'
      },
      {
        agent: 'Contact & Email Finder',
        level: 'success',
        message: 'Extracted primary contact email and verified LinkedIn business profile.'
      },
      {
        agent: 'AI Opportunity Scoring',
        level: 'info',
        message: 'Running Gemini 3.6 Flash opportunity gap evaluation on lead dataset...'
      },
      {
        agent: 'AI Opportunity Scoring',
        level: 'success',
        message: 'Lead Opportunity Score updated: 94/100 (High Conversion Urgency).'
      },
      {
        agent: 'Website Analyzer',
        level: 'error',
        message: 'SSL Certificate error: TLS handshake timeout on legacy hosting endpoint.'
      },
      {
        agent: 'Google Places Discovery',
        level: 'success',
        message: 'Geocoded 3 new verified local business prospects in target area.'
      }
    ];

    const interval = setInterval(() => {
      if (onAddLog && (isStreaming || isAgentRunning)) {
        const randomEvent = sampleSimulatedEvents[Math.floor(Math.random() * sampleSimulatedEvents.length)];
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
        
        onAddLog({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: timeStr,
          agent: randomEvent.agent,
          level: randomEvent.level,
          message: randomEvent.message
        });
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isStreaming, isAgentRunning, onAddLog]);

  const handleCopyLogs = () => {
    const formattedText = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.agent}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedLevel !== 'all' && log.level !== selectedLevel) return false;
    if (selectedAgent !== 'all' && log.agent !== selectedAgent) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.agent.toLowerCase().includes(q) ||
        log.timestamp.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const uniqueAgents = Array.from(new Set(logs.map((l) => l.agent)));

  const getLevelBadge = (level: TerminalLog['level']) => {
    switch (level) {
      case 'info':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Info className="w-3 h-3 text-sky-400" />
            <span>INFO</span>
          </span>
        );
      case 'success':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>SUCCESS</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>WARN</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertCircle className="w-3 h-3 text-red-400" />
            <span>ERROR</span>
          </span>
        );
      default:
        return null;
    }
  };

  const counts = {
    all: logs.length,
    info: logs.filter((l) => l.level === 'info').length,
    success: logs.filter((l) => l.level === 'success').length,
    warning: logs.filter((l) => l.level === 'warning').length,
    error: logs.filter((l) => l.level === 'error').length
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 bg-slate-900 text-slate-100 hover:bg-slate-800 px-4 py-2.5 rounded-2xl shadow-xl ring-1 ring-slate-700/80 text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
      >
        <Terminal className="w-4 h-4 text-emerald-400" />
        <span>Agent Terminal Logs</span>
        <span className="ml-1 text-[10px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-full font-mono">
          {logs.length}
        </span>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-3 bg-slate-950/95 text-slate-200 backdrop-blur-md p-3 px-4 rounded-2xl shadow-2xl border border-slate-800 ring-1 ring-emerald-500/30 animate-fade-in">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-xs font-bold text-white">Agent Swarm Stream</span>
          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
            {logs.length} entries
          </span>
        </div>

        <div className="flex items-center space-x-1 border-l border-slate-800 pl-2">
          <button
            onClick={() => setIsMinimized(false)}
            title="Expand Terminal"
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              if (externalOnClose) externalOnClose();
            }}
            title="Close Terminal"
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isExpanded
          ? 'inset-4 md:inset-8'
          : 'bottom-4 right-4 left-4 md:left-auto md:w-[680px] h-[480px]'
      } flex flex-col bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-slate-800/80 animate-fade-in font-sans text-slate-200`}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800/90 select-none">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                setIsOpen(false);
                if (externalOnClose) externalOnClose();
              }}
              className="w-3 h-3 rounded-full bg-red-500 hover:opacity-80 transition-opacity cursor-pointer"
              title="Close"
            />
            <button
              onClick={() => setIsMinimized(true)}
              className="w-3 h-3 rounded-full bg-amber-500 hover:opacity-80 transition-opacity cursor-pointer"
              title="Minimize"
            />
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-3 h-3 rounded-full bg-emerald-500 hover:opacity-80 transition-opacity cursor-pointer"
              title="Expand/Restore"
            />
          </div>

          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold font-mono tracking-wide text-white">
              Agent Swarm Live Stream Logs
            </span>
            {activeTab && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                Context: {activeTab.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              isStreaming
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title={isStreaming ? 'Pause streaming logs' : 'Resume streaming logs'}
          >
            {isStreaming ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Pause className="w-3 h-3" />
                <span className="hidden sm:inline">LIVE STREAM</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">PAUSED</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isExpanded ? 'Restore size' : 'Expand size'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              if (externalOnClose) externalOnClose();
            }}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-0.5">
          <button
            onClick={() => setSelectedLevel('all')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
              selectedLevel === 'all'
                ? 'bg-slate-100 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            ALL ({counts.all})
          </button>
          <button
            onClick={() => setSelectedLevel('info')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
              selectedLevel === 'info'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-sky-400 hover:bg-sky-500/10'
            }`}
          >
            INFO ({counts.info})
          </button>
          <button
            onClick={() => setSelectedLevel('success')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
              selectedLevel === 'success'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            SUCCESS ({counts.success})
          </button>
          <button
            onClick={() => setSelectedLevel('warning')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
              selectedLevel === 'warning'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            WARN ({counts.warning})
          </button>
          <button
            onClick={() => setSelectedLevel('error')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
              selectedLevel === 'error'
                ? 'bg-red-500 text-white font-bold'
                : 'text-red-400 hover:bg-red-500/10'
            }`}
          >
            ERROR ({counts.error})
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-mono rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Swarm Agents</option>
              {uniqueAgents.map((ag) => (
                <option key={ag} value={ag}>
                  {ag}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-36 sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter logs..."
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-[11px] font-mono pl-8 pr-2 py-1 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={handleCopyLogs}
            className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Copy filtered logs to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClearLogs}
            className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-red-500/20 hover:border-red-500/40 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
            title="Clear all terminal logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-xs leading-relaxed bg-slate-950 selection:bg-emerald-500 selection:text-slate-950 scrollbar-thin scrollbar-thumb-slate-800"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-slate-600 space-y-2">
            <Bot className="w-8 h-8 text-slate-700 animate-bounce" />
            <p className="text-xs font-mono">No agent terminal logs found matching criteria.</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-emerald-400 text-xs hover:underline cursor-pointer font-sans"
              >
                Clear filter query
              </button>
            )}
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={log.id || index}
              className="flex items-start space-x-2.5 group hover:bg-slate-900/40 p-1 rounded transition-colors"
            >
              <span className="text-[10px] text-slate-700 select-none w-6 text-right pt-0.5 font-mono">
                {index + 1}
              </span>

              <span className="text-[10px] text-slate-500 font-mono select-none pt-0.5 whitespace-nowrap">
                {log.timestamp}
              </span>

              <div className="pt-0.5 whitespace-nowrap">{getLevelBadge(log.level)}</div>

              <span className="text-[11px] font-bold text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800/80 whitespace-nowrap">
                {log.agent}
              </span>

              <span
                className={`flex-1 text-xs break-words ${
                  log.level === 'error'
                    ? 'text-red-300 font-semibold'
                    : log.level === 'warning'
                    ? 'text-amber-200'
                    : log.level === 'success'
                    ? 'text-emerald-300'
                    : 'text-slate-200'
                }`}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span>Agent Socket: Connected</span>
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">
            Showing {filteredLogs.length} of {logs.length} entries
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-3 h-3 accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px]">Auto-scroll</span>
          </label>

          {!autoScroll && (
            <button
              onClick={() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="text-emerald-400 hover:underline flex items-center text-[10px] cursor-pointer"
            >
              <ArrowDown className="w-3 h-3 mr-0.5" />
              Bottom
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
