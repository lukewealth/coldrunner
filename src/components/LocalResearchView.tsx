import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Sparkles,
  Bot,
  Globe,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ArrowRight,
  RotateCw,
  MessageCircle,
  Zap,
  Terminal,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
  Brain,
  Layers,
  Activity,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './ui/Toast';
import { Skeleton } from './ui/Skeleton';

interface ResearchSession {
  id: string;
  question: string;
  result?: {
    answer: string;
    sources: { title: string; url: string; snippet: string }[];
    steps: { iteration: number; action: string; query?: string; findings?: string[]; reasoning?: string }[];
    model: string;
    confidence: number;
    followUpSuggestions: string[];
  };
  createdAt: string;
  durationMs?: number;
  sourceCount?: number;
}

export const LocalResearchView: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [currentSession, setCurrentSession] = useState<ResearchSession | null>(null);
  const [history, setHistory] = useState<ResearchSession[]>([]);
  const [localStatus, setLocalStatus] = useState<any>(null);
  const [activePanel, setActivePanel] = useState<'answer' | 'sources' | 'steps'>('answer');
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const { addToast } = useToast();
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
    loadLocalStatus();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await api.getResearchHistory();
      setHistory(data.sessions || []);
    } catch {}
  };

  const loadLocalStatus = async () => {
    try {
      const data = await api.getLocalResearchStatus();
      setLocalStatus(data);
    } catch {}
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isResearching) return;

    setIsResearching(true);
    setCurrentSession(null);
    setActivePanel('answer');

    try {
      const data = await api.askResearch(question.trim());
      setCurrentSession(data);
      loadHistory();
      addToast({ type: 'success', title: 'Research Complete', message: `Found ${data.result?.sources?.length || 0} sources` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Research Failed', message: err.message || 'Could not complete research' });
    } finally {
      setIsResearching(false);
    }
  };

  const handleFollowUp = async (followUpQuestion: string) => {
    if (!currentSession || isResearching) return;

    setIsResearching(true);
    setQuestion(followUpQuestion);
    setActivePanel('answer');

    try {
      const data = await api.askFollowup(currentSession.id, followUpQuestion);
      setCurrentSession(data);
      loadHistory();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Follow-up Failed', message: err.message });
    } finally {
      setIsResearching(false);
    }
  };

  const handleCopyAnswer = () => {
    if (currentSession?.result?.answer) {
      navigator.clipboard.writeText(currentSession.result.answer);
      setCopiedAnswer(true);
      setTimeout(() => setCopiedAnswer(false), 2000);
    }
  };

  const handleLoadSession = async (id: string) => {
    try {
      const data = await api.getResearchSession(id);
      setCurrentSession(data);
      setQuestion(data.question);
      setActivePanel('answer');
    } catch {}
  };

  const getStatusColor = (available: boolean) =>
    available ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200';

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'search': return <Search className="w-3.5 h-3.5 text-blue-500" />;
      case 'analyze': return <Brain className="w-3.5 h-3.5 text-purple-500" />;
      case 'synthesize': return <Sparkles className="w-3.5 h-3.5 text-emerald-500" />;
      case 'done': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      default: return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider">
              <Bot className="w-4 h-4" />
              <span>Local AI Research Agent</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Autonomous Research Engine</h1>
            <p className="text-xs text-slate-500 max-w-xl">
              Ask any question. Local LLM (Ollama) + SearXNG recursively research and synthesize answers with cited sources. No cloud API keys needed.
            </p>
          </div>

          {localStatus && (
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center space-x-1 ${getStatusColor(localStatus.searxng.available)}`}>
                <Globe className="w-3 h-3" />
                <span>SearXNG {localStatus.searxng.available ? 'Online' : 'Offline'}</span>
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center space-x-1 ${getStatusColor(localStatus.ollama.available)}`}>
                <Cpu className="w-3 h-3" />
                <span>Ollama {localStatus.ollama.available ? 'Online' : 'Offline'}</span>
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleAsk} className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything... e.g. 'What are the best HVAC marketing strategies for 2026?'"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isResearching || !question.trim()}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResearching ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-white" />
                <span>Researching...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white text-white" />
                <span>Research</span>
              </>
            )}
          </button>
        </form>

        {localStatus && !localStatus.searxng.available && !localStatus.ollama.available && (
          <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold">Local services offline.</span> Run{' '}
              <code className="bg-amber-100 px-1 rounded font-mono text-[11px]">docker compose up -d</code>{' '}
              to start SearXNG and Ollama. The agent will work with degraded functionality.
            </div>
          </div>
        )}
      </div>

      {isResearching && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Researching: "{question}"</div>
                <div className="text-xs text-slate-500">Agent is searching the web and synthesizing findings...</div>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full animate-progress-indeterminate" style={{ width: '60%' }} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton variant="rectangular" height={200} />
            <Skeleton variant="rectangular" height={200} />
          </div>
        </div>
      )}

      {currentSession && !isResearching && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Research Complete</div>
                  <div className="text-xs text-slate-500 flex items-center space-x-3">
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" />{currentSession.durationMs ? `${(currentSession.durationMs / 1000).toFixed(1)}s` : 'N/A'}</span>
                    <span className="flex items-center"><Layers className="w-3 h-3 mr-1" />{currentSession.result?.sources?.length || 0} sources</span>
                    <span className="flex items-center"><Zap className="w-3 h-3 mr-1" />{currentSession.result?.model || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  (currentSession.result?.confidence || 0) >= 80
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}>
                  Confidence: {currentSession.result?.confidence || 0}%
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <button
                onClick={() => setActivePanel('answer')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activePanel === 'answer' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Answer</span>
              </button>
              <button
                onClick={() => setActivePanel('sources')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activePanel === 'sources' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Sources ({currentSession.result?.sources?.length || 0})</span>
              </button>
              <button
                onClick={() => setActivePanel('steps')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activePanel === 'steps' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Agent Steps ({currentSession.result?.steps?.length || 0})</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activePanel === 'answer' && (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4"
                >
                  <div ref={answerRef} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 relative">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Synthesized Answer</span>
                      <button
                        onClick={handleCopyAnswer}
                        className="text-xs text-emerald-600 font-semibold flex items-center hover:underline cursor-pointer"
                      >
                        {copiedAnswer ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                        {copiedAnswer ? 'Copied!' : 'Copy Answer'}
                      </button>
                    </div>
                    <div className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                      {currentSession.result?.answer || 'No answer generated.'}
                    </div>
                  </div>

                  {currentSession.result?.followUpSuggestions?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Follow-up Questions</span>
                      <div className="flex flex-wrap gap-2">
                        {currentSession.result.followUpSuggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleFollowUp(suggestion)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-emerald-200 transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span>{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activePanel === 'sources' && (
                <motion.div
                  key="sources"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  {currentSession.result?.sources?.map((source, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 hover:border-emerald-300 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-blue-600 hover:underline flex items-center"
                        >
                          {source.title || source.url}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">#{i + 1}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{source.snippet}</p>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{source.url}</div>
                    </div>
                  ))}
                  {(!currentSession.result?.sources || currentSession.result.sources.length === 0) && (
                    <div className="text-center py-8 text-slate-400 text-xs">No sources found for this query.</div>
                  )}
                </motion.div>
              )}

              {activePanel === 'steps' && (
                <motion.div
                  key="steps"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  {currentSession.result?.steps?.map((step, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center space-x-2">
                        {getActionIcon(step.action)}
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Iteration {step.iteration}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">{step.action}</span>
                      </div>
                      {step.query && (
                        <div className="text-xs text-slate-700">
                          <span className="text-slate-400 font-semibold">Query:</span> {step.query}
                        </div>
                      )}
                      {step.findings && step.findings.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-semibold">Findings:</span>
                          {step.findings.map((f, j) => (
                            <div key={j} className="text-[11px] text-slate-600 pl-3 border-l-2 border-slate-200">{f}</div>
                          ))}
                        </div>
                      )}
                      {step.reasoning && (
                        <div className="text-xs text-slate-600 italic">
                          <span className="text-slate-400 font-semibold not-italic">Reasoning:</span> {step.reasoning}
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {!isResearching && !currentSession && history.length > 0 && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Research Sessions</h2>
          </div>
          <div className="space-y-2">
            {history.slice(0, 10).map((session) => (
              <button
                key={session.id}
                onClick={() => handleLoadSession(session.id)}
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between hover:border-emerald-300 transition-all cursor-pointer text-left"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{session.question}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(session.createdAt).toLocaleString()} &middot; {session.durationMs ? `${(session.durationMs / 1000).toFixed(1)}s` : 'N/A'} &middot; {session.sourceCount || 0} sources
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
