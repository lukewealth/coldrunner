import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Eye, Mail, MessageSquare, Phone, Clock, Zap, Filter } from 'lucide-react';
import { OutreachMessage, BusinessLead } from '../types';

interface ApprovalQueueViewProps {
  leads: BusinessLead[];
}

export const ApprovalQueueView: React.FC<ApprovalQueueViewProps> = ({ leads }) => {
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'email' | 'linkedin' | 'whatsapp'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/outreach/pending');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (campaignId: string, messageId: string) => {
    try {
      await fetch(`/api/campaigns/${campaignId}/messages/${messageId}/approve`, { method: 'POST' });
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch {}
  };

  const handleReject = async (campaignId: string, messageId: string) => {
    try {
      await fetch(`/api/campaigns/${campaignId}/messages/${messageId}/reject`, { method: 'POST' });
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch {}
  };

  const handleApproveAll = async () => {
    for (const msg of filteredMessages) {
      await handleApprove(msg.campaignId, msg.id);
    }
  };

  const filteredMessages = filter === 'all'
    ? messages
    : messages.filter(m => m.channel === filter);

  const getLead = (leadId: string) => leads.find(l => l.id === leadId);

  const channelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-3.5 h-3.5" />;
      case 'linkedin': return <MessageSquare className="w-3.5 h-3.5" />;
      case 'whatsapp': return <Phone className="w-3.5 h-3.5" />;
      default: return <Mail className="w-3.5 h-3.5" />;
    }
  };

  const channelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'linkedin': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'whatsapp': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Approval Queue</h2>
          <p className="text-sm text-slate-500 mt-1">Review and approve AI-generated outreach messages before sending</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm font-mono text-slate-500">
            {messages.length} pending
          </span>
          {messages.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleApproveAll}
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-200 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve All</span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Filter className="w-4 h-4 text-slate-400" />
        {(['all', 'email', 'linkedin', 'whatsapp'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {f === 'all' ? 'All Channels' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filteredMessages.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">All caught up!</h3>
          <p className="text-sm text-slate-500 mt-1">No messages waiting for approval</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredMessages.map(msg => {
              const lead = getLead(msg.leadId);
              const isExpanded = expandedId === msg.id;

              return (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${channelColor(msg.channel)}`}>
                          {channelIcon(msg.channel)}
                          <span>{msg.channel}</span>
                        </span>
                        <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>Step {msg.sequenceStep}</span>
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {msg.wordCount} words
                        </span>
                      </div>
                    </div>

                    {lead && (
                      <div className="mb-3">
                        <h3 className="font-semibold text-slate-900">{lead.name}</h3>
                        <p className="text-xs text-slate-500">
                          {lead.category} &middot; {lead.city} &middot; Score: {lead.opportunityScore}%
                        </p>
                      </div>
                    )}

                    {msg.subject && (
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        Subject: {msg.subject}
                      </p>
                    )}

                    <div className={`text-sm text-slate-600 leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
                      {msg.body}
                    </div>

                    {msg.body.split('\n').length > 3 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-2 flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                      </button>
                    )}

                    <div className="mt-3 flex items-center space-x-4 text-xs text-slate-500">
                      <span><strong className="text-slate-700">Strength:</strong> {msg.strength}</span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-slate-500">
                      <span><strong className="text-slate-700">Opportunity:</strong> {msg.opportunity}</span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-slate-500">
                      <span><strong className="text-slate-700">Benefit:</strong> {msg.benefit}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 px-5 py-3 bg-slate-50 border-t border-slate-100">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleApprove(msg.campaignId, msg.id)}
                      className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReject(msg.campaignId, msg.id)}
                      className="flex items-center space-x-2 bg-white hover:bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </motion.button>
                    <div className="flex-1" />
                    <span className="text-xs text-slate-400 font-mono flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>AI Generated</span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
