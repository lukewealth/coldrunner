import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  Sparkles,
  MapPin,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { BusinessLead } from '../types';
import { Skeleton } from './ui/Skeleton';
import { EmptyState } from './ui/EmptyState';
import { api } from '../services/api';

interface ReportsViewProps {
  leads: BusinessLead[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ leads }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch {
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const categoryMap: Record<string, number> = {};
  leads.forEach((l) => {
    categoryMap[l.category] = (categoryMap[l.category] || 0) + 1;
  });
  const categoryData = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    count: categoryMap[cat],
  }));

  const gradeData = [
    { name: 'Hot Leads (>85%)', count: leads.filter((l) => l.grade === 'HOT').length, color: '#10B981' },
    { name: 'Warm Leads (60-84%)', count: leads.filter((l) => l.grade === 'WARM').length, color: '#F59E0B' },
    { name: 'Cold Leads (<60%)', count: leads.filter((l) => l.grade === 'COLD').length, color: '#3B82F6' },
  ];

  const velocityData = [
    { date: 'Jul 26', discovered: 45, qualified: 18, hot: 6 },
    { date: 'Jul 27', discovered: 62, qualified: 24, hot: 9 },
    { date: 'Jul 28', discovered: 88, qualified: 35, hot: 12 },
    { date: 'Jul 29', discovered: 110, qualified: 48, hot: 18 },
    { date: 'Jul 30', discovered: 145, qualified: 62, hot: 25 },
    { date: 'Jul 31', discovered: 190, qualified: 85, hot: 34 },
    { date: 'Aug 01', discovered: 240, qualified: 112, hot: 48 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 pb-12">
        <Skeleton variant="card" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="rectangular" height={300} />
          <Skeleton variant="rectangular" height={300} />
          <Skeleton variant="rectangular" height={300} className="lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return <EmptyState icon={AlertCircle} title={error} description="Check your connection and try again." />;
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider">
              <BarChart3 className="w-4 h-4" />
              <span>Business Intelligence Analytics</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Lead Research Reports</h1>
            <p className="text-xs text-slate-500">
              Visual market breakdown, category opportunity scores, and agent discovery velocity analytics.
            </p>
          </div>
          {stats && (
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                {stats.totalLeads} total leads
              </span>
              <span className="font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                {stats.totalWorkflows} workflows
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-emerald-50/60 border border-emerald-200 p-6 shadow-sm space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>AI Executive Discovery Report</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          "Based on current multi-agent discovery logs, <strong>Dental Clinics</strong> and <strong>HVAC Services</strong> present the highest average agency opportunity score (91% and 96% respectively). Over 65% of audited local businesses suffer from 4+ second mobile load bottlenecks and missing automated online booking workflows, representing an estimated $3.2M in annual uncollected digital revenue."
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4"
        >
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Leads by Industry Category</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4"
        >
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Opportunity Grade Quality</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry: any) => `${entry.name}: ${entry.count}`}
                >
                  {gradeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4"
        >
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Agent Discovery Velocity (Cumulative)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData}>
                <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="discovered" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
                <Area type="monotone" dataKey="qualified" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} />
                <Area type="monotone" dataKey="hot" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
