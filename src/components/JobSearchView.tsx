import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MapPin,
  Briefcase,
  Globe,
  Filter,
  X,
  ChevronDown,
  Building2,
  Clock,
  DollarSign,
  Users,
  Zap,
  TrendingUp,
  Star,
  ExternalLink,
  Loader2,
  Map,
  List,
  SlidersHorizontal,
} from 'lucide-react';
import { JobListing, JobSearchCriteria, JobType, JobExperienceLevel, JobContractType } from '../types';
import { api } from '../services/api';
import { INITIAL_JOBS } from '../data/mockJobs';
import { GLOBAL_CITIES, TOP_HIRING_COMPANIES, TECH_ROLES, TECH_SKILLS, REGIONS } from '../data/globalCities';
import { JobSearchLoader, SkeletonJobGrid } from './ui/JobSearchLoader';
import { StaggerList, StaggerItem } from './ui/StaggerList';

interface JobSearchViewProps {
  onOpenMap?: () => void;
}

export const JobSearchView: React.FC<JobSearchViewProps> = ({ onOpenMap }) => {
  const [jobs, setJobs] = useState<JobListing[]>(INITIAL_JOBS);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchSource, setSearchSource] = useState<string>('initial');

  const [criteria, setCriteria] = useState<JobSearchCriteria>({
    query: 'software engineer',
    location: '',
    country: '',
    jobType: 'all',
    experienceLevel: 'all',
    contractType: 'all',
    salaryMin: 0,
    technologies: [],
    remoteOnly: false,
    maxResults: 20,
  });

  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setSearchSource('searching');

    try {
      const result = await api.searchJobs(criteria);
      setJobs(result.jobs);
      setSearchSource(result.source);
    } catch (err) {
      console.error('Job search failed:', err);
      setJobs(INITIAL_JOBS);
      setSearchSource('fallback');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSearch = (role: string) => {
    setCriteria({ ...criteria, query: role });
    setTimeout(() => handleSearch(), 100);
  };

  const handleCityClick = (cityName: string, country: string) => {
    setCriteria({ ...criteria, location: cityName, country });
    setTimeout(() => handleSearch(), 100);
  };

  const handleCompanyClick = (companyName: string) => {
    setCriteria({ ...criteria, query: `${companyName} software engineer` });
    setTimeout(() => handleSearch(), 100);
  };

  const clearFilters = () => {
    setCriteria({
      query: 'software engineer',
      location: '',
      country: '',
      jobType: 'all',
      experienceLevel: 'all',
      contractType: 'all',
      salaryMin: 0,
      technologies: [],
      remoteOnly: false,
      maxResults: 20,
    });
  };

  const activeFiltersCount = [
    criteria.jobType !== 'all',
    criteria.experienceLevel !== 'all',
    criteria.contractType !== 'all',
    criteria.salaryMin > 0,
    criteria.technologies.length > 0,
    criteria.remoteOnly,
    criteria.location !== '',
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 text-xs font-semibold tracking-wider uppercase mb-2">
              <Globe className="w-3.5 h-3.5" />
              <span>Global Tech Job Search</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Find Remote & Technical Jobs Worldwide
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Search software engineering roles across top cities in Australia, Japan, Canada, Sweden, Mexico, and more.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
            >
              <Map className="w-5 h-5" />
            </button>
            {onOpenMap && (
              <button
                onClick={onOpenMap}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 text-sm font-medium"
              >
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">View Map</span>
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={criteria.query}
                onChange={(e) => setCriteria({ ...criteria, query: e.target.value })}
                placeholder="Job title, skills, or company..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="flex-1 md:max-w-xs relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={criteria.location}
                onChange={(e) => setCriteria({ ...criteria, location: e.target.value })}
                placeholder="City or country..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:bg-slate-300 transition-all font-medium flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/30"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>Search Jobs</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border transition-all flex items-center space-x-2 text-sm font-medium ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={criteria.remoteOnly}
                onChange={(e) => setCriteria({ ...criteria, remoteOnly: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">Remote Only</span>
            </label>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Job Type</label>
                    <select
                      value={criteria.jobType}
                      onChange={(e) => setCriteria({ ...criteria, jobType: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="all">All Types</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Experience Level</label>
                    <select
                      value={criteria.experienceLevel}
                      onChange={(e) => setCriteria({ ...criteria, experienceLevel: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="all">All Levels</option>
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior</option>
                      <option value="lead">Lead/Principal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Contract Type</label>
                    <select
                      value={criteria.contractType}
                      onChange={(e) => setCriteria({ ...criteria, contractType: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="all">All Contracts</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="freelance">Freelance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Min Salary (USD)</label>
                    <input
                      type="number"
                      value={criteria.salaryMin || ''}
                      onChange={(e) => setCriteria({ ...criteria, salaryMin: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Technologies</label>
                  <div className="flex flex-wrap gap-2">
                    {TECH_SKILLS.slice(0, 15).map((tech) => (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => {
                          const newTech = criteria.technologies.includes(tech)
                            ? criteria.technologies.filter((t) => t !== tech)
                            : [...criteria.technologies, tech];
                          setCriteria({ ...criteria, technologies: newTech });
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          criteria.technologies.includes(tech)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Quick Search</span>
            </h3>
            <div className="space-y-2">
              {TECH_ROLES.slice(0, 8).map((role) => (
                <button
                  key={role}
                  onClick={() => handleQuickSearch(role)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>Top Cities</span>
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {GLOBAL_CITIES.filter((c) => c.techHub).slice(0, 12).map((city) => (
                <button
                  key={`${city.name}-${city.country}`}
                  onClick={() => handleCityClick(city.name, city.country)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors flex items-center justify-between"
                >
                  <span>{city.name}</span>
                  <span className="text-xs text-slate-500">{city.country}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-purple-500" />
              <span>Top Companies</span>
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {TOP_HIRING_COMPANIES.slice(0, 10).map((company) => (
                <button
                  key={company.name}
                  onClick={() => handleCompanyClick(company.name)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors flex items-center justify-between"
                >
                  <span>{company.name}</span>
                  <span className="text-xs text-slate-500">{company.openPositions} jobs</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-slate-900">
                {isLoading ? 'Searching...' : `${jobs.length} Jobs Found`}
              </h2>
              {!isLoading && searchSource !== 'initial' && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                  {searchSource}
                </span>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <JobSearchLoader message="Searching global opportunities..." />
              <SkeletonJobGrid count={6} />
            </div>
          ) : (
            <StaggerList className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
              {jobs.map((job) => (
                <StaggerItem key={job.id}>
                  <JobCard job={job} onClick={() => setSelectedJob(job)} compact={viewMode === 'list'} />
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedJob && (
          <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

const JobCard: React.FC<{ job: JobListing; onClick: () => void; compact?: boolean }> = ({ job, onClick, compact }) => {
  const jobTypeColors = {
    remote: 'bg-emerald-100 text-emerald-700',
    hybrid: 'bg-blue-100 text-blue-700',
    onsite: 'bg-amber-100 text-amber-700',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer ${
        job.isFeatured ? 'ring-2 ring-emerald-400' : ''
      } ${compact ? 'flex items-start space-x-4' : ''}`}
    >
      <div className={compact ? 'flex-1' : ''}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
              {job.company.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">{job.title}</h3>
              <p className="text-sm text-slate-600">{job.company}</p>
            </div>
          </div>
          {job.isFeatured && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center space-x-1">
              <Star className="w-3 h-3" />
              <span>Featured</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
          <span className={`px-2 py-1 rounded-full font-medium ${jobTypeColors[job.jobType]}`}>
            {job.jobType}
          </span>
          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
            {job.experienceLevel}
          </span>
          <span className="flex items-center space-x-1 text-slate-600">
            <MapPin className="w-3 h-3" />
            <span>{job.location}</span>
          </span>
        </div>

        {!compact && (
          <>
            <p className="text-sm text-slate-600 line-clamp-2 mb-3">{job.description}</p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {job.technologies.slice(0, 4).map((tech) => (
                <span key={tech} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md">
                  {tech}
                </span>
              ))}
              {job.technologies.length > 4 && (
                <span className="px-2 py-1 text-slate-500 text-xs">+{job.technologies.length - 4}</span>
              )}
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-3 text-xs text-slate-600">
            {job.salary && (
              <span className="flex items-center space-x-1">
                <DollarSign className="w-3 h-3" />
                <span>{job.salary}</span>
              </span>
            )}
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{job.postedAt}</span>
            </span>
          </div>
          {job.applicantCount && (
            <span className="flex items-center space-x-1 text-xs text-slate-500">
              <Users className="w-3 h-3" />
              <span>{job.applicantCount} applicants</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const JobDetailModal: React.FC<{ job: JobListing; onClose: () => void }> = ({ job, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-2xl">
              {job.company.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{job.title}</h2>
              <p className="text-lg text-slate-600">{job.company}</p>
              <div className="flex items-center space-x-3 mt-2 text-sm text-slate-600">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Posted {job.postedAt}</span>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              job.jobType === 'remote' ? 'bg-emerald-100 text-emerald-700' :
              job.jobType === 'hybrid' ? 'bg-blue-100 text-blue-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {job.jobType}
            </span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
              {job.experienceLevel}
            </span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
              {job.contractType}
            </span>
            {job.salary && (
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                {job.salary}
              </span>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-2">About the Role</h3>
            <p className="text-slate-700 leading-relaxed">{job.description}</p>
          </div>

          {job.requirements.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start space-x-2 text-slate-700">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.technologies.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {job.technologies.map((tech) => (
                  <span key={tech} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.benefits.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Benefits</h3>
              <ul className="space-y-2">
                {job.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start space-x-2 text-slate-700">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.applicationUrl && (
            <a
              href={job.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium text-center flex items-center justify-center space-x-2"
            >
              <span>Apply Now</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <div className="pt-4 border-t border-slate-200 text-sm text-slate-600">
            <p>Source: {job.source}</p>
            {job.applicantCount && <p>{job.applicantCount} applicants</p>}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
