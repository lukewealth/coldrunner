import { BusinessLead } from '../types';

export const INITIAL_LEADS: BusinessLead[] = [
  {
    id: 'lead-1',
    name: 'Apex Dental Care & Implant Center',
    category: 'Dental Clinic',
    country: 'Canada',
    province: 'Ontario',
    city: 'Toronto',
    address: '420 Yonge Street, Suite 300, Toronto, ON',
    lat: 43.6601,
    lng: -79.3852,
    phone: '+1 (416) 555-0192',
    email: 'dr.apex@apexdentaltoronto.ca',
    ownerName: 'Dr. Robert Vance',
    website: 'www.apexdentaltoronto.ca',
    websiteStatus: 'Outdated',
    rating: 3.8,
    reviewCount: 42,
    opportunityScore: 92,
    grade: 'HOT',
    status: 'New',
    estimatedRevenue: '$850k - $1.2M',
    companyBio: 'Apex Dental Care is a premier cosmetic and general dentistry practice in downtown Toronto, specializing in dental implants, Invisalign, and emergency dental care for working professionals and families.',
    hrContact: {
      name: 'Jessica Miller',
      email: 'careers@apexdentaltoronto.ca',
      title: 'Talent Acquisition & HR Lead',
      phone: '+1 (416) 555-0199'
    },
    socials: {
      facebook: 'facebook.com/apexdentalTO',
      instagram: 'instagram.com/apexdentaltoronto',
      linkedin: 'linkedin.com/company/apexdental-toronto',
      x: 'x.com/apexdentalTO',
      whatsapp: '+14165550192'
    },
    audit: {
      performance: 48,
      seo: 52,
      accessibility: 60,
      bestPractices: 65,
      mobileScore: 42,
      hasSSL: true,
      loadTimeMs: 4200,
      techStack: ['WordPress 5.2', 'jQuery 1.12', 'Apache', 'PHP 7.4'],
      issues: [
        'Non-responsive mobile tables cutting off appointment booking',
        'Lacks online patient intake form (PDF downloads only)',
        'Slow LCP (Largest Contentful Paint) at 4.2 seconds',
        'Missing Google Local Schema markup for dental emergency services'
      ],
      opportunities: [
        'Modern React/Next.js redesign with automated 24/7 online booking widget',
        'Local SEO optimization for high-ticket dental implants & Invisalign keywords',
        'AI WhatsApp booking assistant integration'
      ]
    },
    recommendedService: 'Website Redesign + AI Booking Chatbot + Local SEO',
    aiInsights: 'High revenue dental clinic with strong foot traffic but losing ~35% of mobile leads due to broken mobile layout and slow WordPress theme.',
    dataConfidence: 96,
    verificationStatus: 'Verified',
    lastUpdated: '2026-08-01',
    createdAt: '2026-07-28'
  },
  {
    id: 'lead-2',
    name: 'Summit Heating & Air Conditioning',
    category: 'HVAC Services',
    country: 'Canada',
    province: 'Ontario',
    city: 'Mississauga',
    address: '1850 Dundas St E, Mississauga, ON',
    lat: 43.6012,
    lng: -79.5789,
    phone: '+1 (905) 555-8392',
    email: 'info@summithvacontario.ca',
    ownerName: 'Mark Henderson',
    website: 'www.summithvacontario.ca',
    websiteStatus: 'Missing',
    rating: 4.6,
    reviewCount: 118,
    opportunityScore: 96,
    grade: 'HOT',
    status: 'Qualified',
    estimatedRevenue: '$1.5M - $2.5M',
    companyBio: 'Summit Heating & Air Conditioning delivers 24/7 residential and commercial HVAC installation, heat pump upgrades, and emergency furnace repairs across the Greater Toronto Area.',
    hrContact: {
      name: 'Samantha Vance',
      email: 'hr@summithvacontario.ca',
      title: 'Operations & HR Director',
      phone: '+1 (905) 555-8399'
    },
    socials: {
      facebook: 'facebook.com/summithvacmississauga',
      instagram: 'instagram.com/summithvac',
      linkedin: 'linkedin.com/company/summithvac',
      x: 'x.com/summithvac'
    },
    audit: {
      performance: 0,
      seo: 12,
      accessibility: 0,
      bestPractices: 0,
      mobileScore: 0,
      hasSSL: false,
      loadTimeMs: 0,
      techStack: ['No Active CMS', 'Domain Parked'],
      issues: [
        'No active website detected (Redirects to parked page)',
        'Relying purely on Google Business Profile & Yelp for leads',
        'Lacks online instant quote estimator for heat pumps & furnace replacement'
      ],
      opportunities: [
        'Complete high-converting website build with emergency dispatch booking',
        'Google Local Services Ads (LSA) setup and CRM sync',
        'Automated review management tool'
      ]
    },
    recommendedService: 'Complete Website Build + Instant Quote Estimator + CRM setup',
    aiInsights: 'Top-rated HVAC business doing $1.5M+ without a functional website! Prime opportunity for high-ticket custom website & automated dispatch software.',
    dataConfidence: 98,
    verificationStatus: 'Enriched',
    lastUpdated: '2026-07-31',
    createdAt: '2026-07-29'
  },
  {
    id: 'lead-3',
    name: 'Vanguard Legal Defense Partners',
    category: 'Law Firm',
    country: 'United States',
    province: 'New York',
    city: 'New York',
    address: '350 5th Ave, Suite 4800, New York, NY',
    lat: 40.7484,
    lng: -73.9857,
    phone: '+1 (212) 555-7711',
    email: 'contact@vanguarddefense.law',
    ownerName: 'Sarah Jenkins, Esq.',
    website: 'www.vanguarddefense.law',
    websiteStatus: 'Slow Speed',
    rating: 4.2,
    reviewCount: 64,
    opportunityScore: 84,
    grade: 'HOT',
    status: 'New',
    estimatedRevenue: '$3.0M - $5.0M',
    companyBio: 'Vanguard Legal Defense Partners is a top-tier litigation firm in Manhattan defending high-profile corporate clients and individuals in complex commercial disputes and federal cases.',
    hrContact: {
      name: 'David Sterling',
      email: 'recruiting@vanguarddefense.law',
      title: 'Partner & Chief People Officer',
      phone: '+1 (212) 555-7790'
    },
    socials: {
      linkedin: 'linkedin.com/in/sarahjenkinslaw',
      facebook: 'facebook.com/vanguardlaw',
      instagram: 'instagram.com/vanguardlaw',
      x: 'x.com/vanguardlaw'
    },
    audit: {
      performance: 35,
      seo: 74,
      accessibility: 58,
      bestPractices: 70,
      mobileScore: 38,
      hasSSL: true,
      loadTimeMs: 5100,
      techStack: ['Wix', 'Google Analytics 4', 'HubSpot Embed'],
      issues: [
        'Wix template causes severe 5.1s page load bottleneck',
        'No multi-language support (Spanish legal leads bouncing)',
        'Lead forms lack instant SMS response automation'
      ],
      opportunities: [
        'Migration from Wix to custom ultra-fast Next.js platform',
        'Bilingual AI Legal Assistant chatbot for instant consultation pre-qualification',
        'Advanced GEO & Local SEO optimization'
      ]
    },
    recommendedService: 'Wix to Next.js Migration + AI Legal Intake Assistant',
    aiInsights: 'High margin law firm spending on PPC ads but driving traffic to a sluggish Wix site. Redesign will instantly increase PPC conversion rates by 40%.',
    dataConfidence: 93,
    verificationStatus: 'Verified',
    lastUpdated: '2026-08-01',
    createdAt: '2026-07-30'
  },
  {
    id: 'lead-4',
    name: 'Precision Auto Works & Tuning',
    category: 'Auto Repair',
    country: 'Canada',
    province: 'British Columbia',
    city: 'Vancouver',
    address: '1240 E Hastings St, Vancouver, BC',
    lat: 49.2811,
    lng: -123.0782,
    phone: '+1 (604) 555-2244',
    email: 'service@precisionautovan.ca',
    ownerName: 'Dave Miller',
    website: 'www.precisionautovan.ca',
    websiteStatus: 'Broken SSL',
    rating: 4.8,
    reviewCount: 230,
    opportunityScore: 88,
    grade: 'HOT',
    status: 'New',
    estimatedRevenue: '$900k - $1.4M',
    companyBio: 'Precision Auto Works specializes in European import repair, high-performance engine tuning, and digital diagnostics in East Vancouver.',
    hrContact: {
      name: 'Carlos Ruiz',
      email: 'careers@precisionautovan.ca',
      title: 'Shop Manager & HR',
      phone: '+1 (604) 555-2249'
    },
    socials: {
      instagram: 'instagram.com/precisionautovan',
      facebook: 'facebook.com/precisionautovan',
      linkedin: 'linkedin.com/company/precisionautovan',
      x: 'x.com/precisionautovan'
    },
    audit: {
      performance: 58,
      seo: 45,
      accessibility: 62,
      bestPractices: 30,
      mobileScore: 50,
      hasSSL: false,
      loadTimeMs: 3400,
      techStack: ['Custom HTML', 'Bootstrap 3.3', 'Nginx'],
      issues: [
        'Expired SSL Certificate showing "Not Secure" browser warning',
        'Outdated 2015 Bootstrap layout',
        'No digital vehicle inspection status tracking for clients'
      ],
      opportunities: [
        'SSL fix + Modern mobile-first redesign with inspection portal',
        'Automated SMS vehicle service reminders',
        'Google Business Profile review sync'
      ]
    },
    recommendedService: 'SSL Security Repair + Modern Redesign + SMS Reminder System',
    aiInsights: 'Huge customer base with 230 reviews but losing new web visitors due to scary browser "Not Secure" warning on expired SSL certificate.',
    dataConfidence: 95,
    verificationStatus: 'Verified',
    lastUpdated: '2026-07-29',
    createdAt: '2026-07-27'
  },
  {
    id: 'lead-5',
    name: 'Iron Pulse Fitness & Athletics',
    category: 'Gym & Fitness',
    country: 'United States',
    province: 'California',
    city: 'Los Angeles',
    address: '8400 Melrose Ave, West Hollywood, CA',
    lat: 34.0837,
    lng: -118.3734,
    phone: '+1 (323) 555-9012',
    email: 'membership@ironpulsela.com',
    ownerName: 'Elena Rostova',
    website: 'www.ironpulsela.com',
    websiteStatus: 'Poor SEO',
    rating: 4.5,
    reviewCount: 175,
    opportunityScore: 78,
    grade: 'WARM',
    status: 'Contacted',
    estimatedRevenue: '$1.2M - $2.0M',
    companyBio: 'Iron Pulse Fitness is a boutique athletic facility in West Hollywood offering strength conditioning, group HIIT classes, and personal training.',
    hrContact: {
      name: 'Maya Lin',
      email: 'hr@ironpulsela.com',
      title: 'People Operations Manager',
      phone: '+1 (323) 555-9088'
    },
    socials: {
      instagram: 'instagram.com/ironpulsela',
      facebook: 'facebook.com/ironpulsela',
      linkedin: 'linkedin.com/company/ironpulse',
      x: 'x.com/ironpulsela'
    },
    audit: {
      performance: 82,
      seo: 41,
      accessibility: 75,
      bestPractices: 80,
      mobileScore: 78,
      hasSSL: true,
      loadTimeMs: 2100,
      techStack: ['Squarespace 7.1', 'Mindbody Embed'],
      issues: [
        'Zero H1/H2 meta tags for local "Gym West Hollywood" keywords',
        'Images missing ALT tags',
        'Mindbody iframe fails on mobile WebKit browsers'
      ],
      opportunities: [
        'SEO overhaul + custom native class scheduling integration',
        'Lead magnet funnel with free 3-day pass automation'
      ]
    },
    recommendedService: 'Local SEO Strategy + High Converting Gym Funnel',
    aiInsights: 'Visually attractive Squarespace site but virtually invisible on Google search for high intent Hollywood fitness searches.',
    dataConfidence: 91,
    verificationStatus: 'Verified',
    lastUpdated: '2026-07-30',
    createdAt: '2026-07-26'
  },
  {
    id: 'lead-6',
    name: 'Bella Vista Italian Trattoria',
    category: 'Restaurant',
    country: 'United States',
    province: 'Illinois',
    city: 'Chicago',
    address: '520 N Michigan Ave, Chicago, IL',
    lat: 41.8917,
    lng: -87.6248,
    phone: '+1 (312) 555-4321',
    email: 'reservations@bellavistachicago.com',
    ownerName: 'Giovanni Rossi',
    website: 'www.bellavistachicago.com',
    websiteStatus: 'Outdated',
    rating: 4.7,
    reviewCount: 310,
    opportunityScore: 89,
    grade: 'HOT',
    status: 'New',
    estimatedRevenue: '$2.0M - $3.5M',
    companyBio: 'Bella Vista Italian Trattoria serves authentic handmade pasta and wood-fired pizza on Magnificent Mile in downtown Chicago.',
    hrContact: {
      name: 'Marco Rossi',
      email: 'careers@bellavistachicago.com',
      title: 'General Manager & HR',
      phone: '+1 (312) 555-4399'
    },
    socials: {
      instagram: 'instagram.com/bellavistachi',
      facebook: 'facebook.com/bellavistachicago',
      linkedin: 'linkedin.com/company/bellavistachicago',
      x: 'x.com/bellavistachi'
    },
    audit: {
      performance: 40,
      seo: 48,
      accessibility: 50,
      bestPractices: 60,
      mobileScore: 35,
      hasSSL: true,
      loadTimeMs: 4800,
      techStack: ['WordPress 4.9', 'PDF Menu Plugin'],
      issues: [
        'Menu is an unsearchable 12MB PDF file (terrible mobile UX)',
        'No online table reservation platform (losing 3rd party commission money to OpenTable)',
        'Lacks OpenGraph preview card for social sharing'
      ],
      opportunities: [
        'Custom interactive online menu + direct Commission-Free Table Booking',
        'Catering quote request workflow with CRM integration'
      ]
    },
    recommendedService: 'Interactive Web Menu + Commission-Free Direct Reservation Engine',
    aiInsights: 'Prime Chicago downtown restaurant forcing users to download a heavy PDF menu on mobile. Huge immediate win to replace with interactive digital menu.',
    dataConfidence: 97,
    verificationStatus: 'Enriched',
    lastUpdated: '2026-08-01',
    createdAt: '2026-07-31'
  }
];

export const INITIAL_AGENTS = [
  { id: 'ag-1', name: 'Google Places Discovery Agent', status: 'Running' as const, color: 'green' as const, itemsProcessed: 2850, currentTask: 'Scanning Toronto, ON for Dental Clinics...' },
  { id: 'ag-2', name: 'Website Analyzer Agent', status: 'Running' as const, color: 'green' as const, itemsProcessed: 1420, currentTask: 'Auditing PageSpeed & Tech Stack on apexdentaltoronto.ca...' },
  { id: 'ag-3', name: 'Contact & Email Discovery Agent', status: 'Running' as const, color: 'green' as const, itemsProcessed: 980, currentTask: 'Enriching decision maker emails & WhatsApp links...' },
  { id: 'ag-4', name: 'AI Opportunity Scoring Agent', status: 'Processing' as const, color: 'amber' as const, itemsProcessed: 740, currentTask: 'Calculating revenue loss gap & rating service urgency...' },
  { id: 'ag-5', name: 'Export & CRM Dispatch Agent', status: 'Waiting' as const, color: 'gray' as const, itemsProcessed: 420, currentTask: 'Standby for outbound sequence export...' }
];
