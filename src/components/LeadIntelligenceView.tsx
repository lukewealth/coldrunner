import React, { useState } from 'react';
import { 
  Target, 
  Sliders, 
  Flame, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  Award,
  Layers
} from 'lucide-react';
import { BusinessLead } from '../types';
import { HeroStarRating, OpportunityStars, ScoreBadge } from './ui/HeroStar';

interface LeadIntelligenceViewProps {
  leads: BusinessLead[];
}

export const LeadIntelligenceView: React.FC<LeadIntelligenceViewProps> = ({ leads }) => {
  const [weights, setWeights] = useState({
    websiteQuality: 35,
    reviewGap: 25,
    techDeficit: 20,
    revenuePotential: 12,
    socialActivity: 8
  });

  const totalWeight = (Object.values(weights) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>Lead Intelligence Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">AI Opportunity Score Algorithm</h1>
            <p className="text-xs text-slate-500">
              Customize weighting factors to score leads based on your agency's specific services (Web, SEO, AI, CRM).
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Total Weight: {totalWeight}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Custom Weight Tuner (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Scoring Weight Matrix</h2>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Factor 1 */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-800">Website Health & Speed Flaw</span>
                <span className="text-emerald-600 font-bold">{weights.websiteQuality}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                value={weights.websiteQuality}
                onChange={(e) => setWeights({ ...weights, websiteQuality: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
              <p className="text-[10px] text-slate-500">Scores page load bottlenecks, SSL certificate errors, and mobile UX flaws.</p>
            </div>

            {/* Factor 2 */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-800">Review & Local Goodwill Gap</span>
                <span className="text-emerald-600 font-bold">{weights.reviewGap}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={weights.reviewGap}
                onChange={(e) => setWeights({ ...weights, reviewGap: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
              <p className="text-[10px] text-slate-500">High review count (50+) with an outdated website creates huge sales urgency.</p>
            </div>

            {/* Factor 3 */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-800">Missing AI & Tech Stack Deficit</span>
                <span className="text-emerald-600 font-bold">{weights.techDeficit}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={weights.techDeficit}
                onChange={(e) => setWeights({ ...weights, techDeficit: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
              <p className="text-[10px] text-slate-500">Lacks automated booking, online intake widgets, or AI chatbots.</p>
            </div>

            {/* Factor 4 */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-800">Estimated Revenue Brackets</span>
                <span className="text-emerald-600 font-bold">{weights.revenuePotential}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={weights.revenuePotential}
                onChange={(e) => setWeights({ ...weights, revenuePotential: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
              <p className="text-[10px] text-slate-500">Higher weight for businesses generating $1M+ annual revenue.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Lead Score Rankings (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Scored Lead Distribution</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">{leads.length} Qualified Leads</span>
          </div>

          <div className="space-y-3">
            {leads.map((lead) => (
              <div key={lead.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{lead.name}</span>
                    <ScoreBadge score={lead.opportunityScore} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lead.category} • {lead.city} • Est. {lead.estimatedRevenue}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <OpportunityStars score={lead.opportunityScore} size="xs" />
                    <HeroStarRating
                      rating={lead.rating}
                      size="xs"
                      color="amber"
                      showValue={true}
                      showCount={true}
                      reviewCount={lead.reviewCount}
                    />
                  </div>
                </div>

                <div className="text-right ml-4">
                  <span className="text-xs text-slate-400 block font-medium">Need Urgency</span>
                  <span className="text-xs font-bold text-emerald-600">{lead.recommendedService}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
