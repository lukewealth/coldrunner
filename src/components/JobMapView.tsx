import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MapPin, Globe, Building2, Briefcase, X, ExternalLink, Loader2 } from 'lucide-react';
import { JobListing, GlobalCity } from '../types';
import { api } from '../services/api';
import { INITIAL_JOBS } from '../data/mockJobs';
import { GLOBAL_CITIES } from '../data/globalCities';
import { JobSearchLoader } from './ui/JobSearchLoader';

interface JobMapViewProps {
  onBack?: () => void;
}

export const JobMapView: React.FC<JobMapViewProps> = ({ onBack }) => {
  const [jobs, setJobs] = useState<JobListing[]>(INITIAL_JOBS);
  const [cities, setCities] = useState<GlobalCity[]>(GLOBAL_CITIES);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [selectedCity, setSelectedCity] = useState<GlobalCity | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    loadGoogleMaps();
  }, []);

  const loadGoogleMaps = () => {
    if (typeof window === 'undefined') return;

    if ((window as any).google?.maps) {
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapLoaded(true);
      initializeMap();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps');
      setMapLoaded(false);
    };
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || !(window as any).google?.maps) return;

    const map = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat: 20, lng: 0 },
      zoom: 2,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    mapInstanceRef.current = map;
    setMapLoaded(true);

    addJobMarkers(map, jobs);
    addCityMarkers(map, cities);
  };

  const addJobMarkers = (map: any, jobList: JobListing[]) => {
    if (!map || !(window as any).google?.maps) return;

    jobList.forEach((job) => {
      if (!job.lat || !job.lng) return;

      const marker = new (window as any).google.maps.Marker({
        position: { lat: job.lat, lng: job.lng },
        map,
        title: `${job.title} at ${job.company}`,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: job.isFeatured ? '#10b981' : '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${job.title}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">${job.company}</p>
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b;">${job.location}</p>
            ${job.salary ? `<p style="margin: 0; font-size: 11px; color: #10b981; font-weight: 600;">${job.salary}</p>` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        setSelectedJob(job);
      });
    });
  };

  const addCityMarkers = (map: any, cityList: GlobalCity[]) => {
    if (!map || !(window as any).google?.maps) return;

    cityList.forEach((city) => {
      if (!city.techHub) return;

      const marker = new (window as any).google.maps.Marker({
        position: { lat: city.lat, lng: city.lng },
        map,
        title: `${city.name}, ${city.country}`,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#8b5cf6',
          fillOpacity: 0.6,
          strokeColor: '#ffffff',
          strokeWeight: 1,
        },
      });

      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${city.name}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">${city.country}</p>
            <p style="margin: 0; font-size: 11px; color: #8b5cf6;">${city.topEmployers.slice(0, 3).join(', ')}</p>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        setSelectedCity(city);
      });
    });
  };

  const handleCityClick = (city: GlobalCity) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panTo({ lat: city.lat, lng: city.lng });
    mapInstanceRef.current.setZoom(10);
    setSelectedCity(city);
  };

  const handleJobClick = (job: JobListing) => {
    if (!mapInstanceRef.current || !job.lat || !job.lng) return;
    mapInstanceRef.current.panTo({ lat: job.lat, lng: job.lng });
    mapInstanceRef.current.setZoom(12);
    setSelectedJob(job);
  };

  const resetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setCenter({ lat: 20, lng: 0 });
    mapInstanceRef.current.setZoom(2);
    setSelectedJob(null);
    setSelectedCity(null);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-emerald-50 rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 text-xs font-semibold tracking-wider uppercase mb-2">
              <Globe className="w-3.5 h-3.5" />
              <span>Global Job Map</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Explore Tech Jobs Worldwide
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Visualize job opportunities across top tech hubs in Australia, Japan, Canada, Sweden, Mexico, and more.
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              Back to Search
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-purple-500" />
              <span>Tech Hubs</span>
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
              {cities.filter((c) => c.techHub).map((city) => (
                <button
                  key={`${city.name}-${city.country}`}
                  onClick={() => handleCityClick(city)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                    selectedCity?.name === city.name
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-slate-700 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  <span>{city.name}</span>
                  <span className="text-xs text-slate-500">{city.country}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-emerald-500" />
              <span>Featured Jobs</span>
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
              {jobs.filter((j) => j.isFeatured).map((job) => (
                <button
                  key={job.id}
                  onClick={() => handleJobClick(job)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedJob?.id === job.id
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  <div className="font-medium truncate">{job.title}</div>
                  <div className="text-xs text-slate-500 truncate">{job.company}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={resetView}
            className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
          >
            Reset Map View
          </button>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="relative" style={{ height: '600px' }}>
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                  <JobSearchLoader message="Loading map..." />
                </div>
              )}
              <div ref={mapRef} className="w-full h-full" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-slate-900">Featured Jobs</span>
              </div>
              <p className="text-xs text-slate-600">High-priority opportunities from top employers</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-slate-900">All Jobs</span>
              </div>
              <p className="text-xs text-slate-600">Complete list of available positions worldwide</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm font-medium text-slate-900">Tech Hubs</span>
              </div>
              <p className="text-xs text-slate-600">Major technology centers with high job density</p>
            </div>
          </div>
        </div>
      </div>

      {selectedJob && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-40"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">{selectedJob.title}</h3>
              <p className="text-sm text-slate-600">{selectedJob.company}</p>
            </div>
            <button
              onClick={() => setSelectedJob(null)}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2 text-slate-600">
              <MapPin className="w-4 h-4" />
              <span>{selectedJob.location}</span>
            </div>
            {selectedJob.salary && (
              <div className="text-emerald-600 font-medium">{selectedJob.salary}</div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {selectedJob.technologies.slice(0, 3).map((tech) => (
                <span key={tech} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md">
                  {tech}
                </span>
              ))}
            </div>
          </div>
          {selectedJob.applicationUrl && (
            <a
              href={selectedJob.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium text-center"
            >
              View Details
            </a>
          )}
        </motion.div>
      )}

      {selectedCity && !selectedJob && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-40"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{selectedCity.name}</h3>
              <p className="text-sm text-slate-600">{selectedCity.country}</p>
            </div>
            <button
              onClick={() => setSelectedCity(null)}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2 text-slate-600">
              <Building2 className="w-4 h-4" />
              <span>Top Employers:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedCity.topEmployers.slice(0, 5).map((employer) => (
                <span key={employer} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md">
                  {employer}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
