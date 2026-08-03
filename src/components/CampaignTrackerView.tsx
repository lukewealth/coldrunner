import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Send,
  Pause,
  Play,
  Trash2,
  Users,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  TrendingUp,
  BarChart3,
  Plus,
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Campaign, OutreachAnalytics, BusinessLead } from '../types';
import { api } from '../services/api';
import { useToast } from './ui/Toast';

interface CampaignTrackerViewProps {
  leads: BusinessLead[];
}

export const CampaignTrackerView: React.FC<CampaignTrackerViewProps> = ({ leads }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [analytics, setAnalytics] = useState<OutreachAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [campData, analyticsData] = await Promise.all([
        api.getCampaigns(),
        api.getOutreachAnalytics(),
      ]);
      setCampaigns(campData.campaigns || []);
      setAnalytics(analyticsData);
    } catch {
      // silent
    }
    setLoading(false);
  };

  const handleActivate = async (id: string) => {
    try {
      await api.activateCampaign(id);
      addToast({ type: 'success', title: 'Campaign Activated' });
      fetchData();
    } catch {
      addToast({ type: 'error', title: 'Failed to activate campaign' });
    }
  };

  const handlePause = async (id: string) => {
    try {
      await api.pauseCampaign(id);
      addToast({ type: 'info', title: 'Campaign Paused' });
      fetchData();
    } catch {
      addToast({ type: 'error', title: 'Failed to pause campaign' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCampaign(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      addToast({ type: 'info', title: 'Campaign Deleted' });
    } catch {
      addToast({ type: 'error', title: 'Failed to delete campaign' });
    }
  };

  const handleCreateCampaign = async () => {
    const hotLeads = leads.filter(l => l.grade === 'HOT').slice(0, 10);
    if (hotLeads.length === 0) {
      addToast({ type: 'error', title: 'No HOT leads available' });
      return;
    }

    try {
      await api.createCampaign({
        name: `Campaign ${new Date().toLocaleDateString()}`,
        leads: hotLeads,
        channels: ['email'],
        sequenceSteps: 3,
      });
      setShowCreate(false);
      addToast({ type: 'success', title: 'Campaign Created', message: `${hotLeads.length} HOT leads added` });
      fetchData();
    } catch {
      addToast({ type: 'error', title: 'Failed to create campaign' });
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'paused': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'draft': return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-3 h-3" />;
      case 'paused': return <Pause className="w-3 h-3" />;
      case 'draft': return <Clock className="w-3 h-3" />;
      case 'completed': return <CheckCircle2 className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
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
          <h2 className="text-2xl font-bold text-slate-900">Campaign Tracker</h2>
          <p className="text-sm text-slate-500 mt-1">Monitor outreach campaigns and track engagement metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={fetchData}
            className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreate(true)}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </motion.button>
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Qualified', value: analytics.qualifiedLeads, icon: <Users className="w-4 h-4" />, color: 'text-blue-600' },
            { label: 'Prepared', value: analytics.messagesPrepared, icon: <Mail className="w-4 h-4" />, color: 'text-purple-600' },
            { label: 'Approved', value: analytics.messagesApproved, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-600' },
            { label: 'Sent', value: analytics.messagesSent, icon: <Send className="w-4 h-4" />, color: 'text-indigo-600' },
            { label: 'Meetings', value: analytics.meetingsBooked, icon: <Calendar className="w-4 h-4" />, color: 'text-amber-600' },
            { label: 'Active', value: analytics.activeCampaigns, icon: <Activity className="w-4 h-4" />, color: 'text-rose-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className={`flex items-center space-x-2 mb-2 ${stat.color}`}>
                {stat.icon}
                <span className="text-xs font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 mb-3">Create Campaign from HOT Leads</h3>
          <p className="text-sm text-slate-500 mb-4">
            This will create a 3-step email campaign for your top {Math.min(leads.filter(l => l.grade === 'HOT').length, 10)} HOT leads with AI-personalized messages.
          </p>
          <div className="flex items-center space-x-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateCampaign}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
            >
              Create Campaign
            </motion.button>
            <button
              onClick={() => setShowCreate(false)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {campaigns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Send className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No campaigns yet</h3>
          <p className="text-sm text-slate-500 mt-1">Create your first outreach campaign to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map(campaign => (
            <motion.div
              key={campaign.id}
              layout
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-semibold text-slate-900">{campaign.name}</h3>
                      <span className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-medium border ${statusColor(campaign.status)}`}>
                        {statusIcon(campaign.status)}
                        <span>{campaign.status}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Created {new Date(campaign.createdAt).toLocaleDateString()} &middot; {campaign.leadIds.length} leads &middot; {campaign.messages.length} messages
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {campaign.status === 'draft' && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleActivate(campaign.id)}
                        className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        <Play className="w-3 h-3" />
                        <span>Activate</span>
                      </motion.button>
                    )}
                    {campaign.status === 'active' && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePause(campaign.id)}
                        className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        <Pause className="w-3 h-3" />
                        <span>Pause</span>
                      </motion.button>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(campaign.id)}
                      className="flex items-center space-x-1.5 bg-white hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200"
                    >
                      <Trash2 className="w-3 h-3" />
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Leads', value: campaign.stats.totalLeads },
                    { label: 'Prepared', value: campaign.stats.messagesPrepared },
                    { label: 'Approved', value: campaign.stats.messagesApproved },
                    { label: 'Sent', value: campaign.stats.messagesSent },
                    { label: 'Meetings', value: campaign.stats.meetingsBooked },
                  ].map(stat => (
                    <div key={stat.label} className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-3 mt-4">
                  <span className="text-xs text-slate-500">Channels:</span>
                  {campaign.channels.map(ch => (
                    <span key={ch} className="flex items-center space-x-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                      {ch === 'email' && <Mail className="w-3 h-3" />}
                      {ch === 'linkedin' && <MessageSquare className="w-3 h-3" />}
                      {ch === 'whatsapp' && <Phone className="w-3 h-3" />}
                      <span>{ch}</span>
                    </span>
                  ))}
                  <span className="text-xs text-slate-500 ml-2">
                    {campaign.sequenceSteps}-step sequence
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
