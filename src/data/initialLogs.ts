import { TerminalLog } from '../types';

export const INITIAL_TERMINAL_LOGS: TerminalLog[] = [
  {
    id: 'log-1',
    timestamp: '04:28:12.102',
    agent: 'Google Places Discovery',
    level: 'info',
    message: 'Initializing geospatial viewport query for Toronto, ON (Radius: 25km)...'
  },
  {
    id: 'log-2',
    timestamp: '04:28:12.450',
    agent: 'Google Places Discovery',
    level: 'success',
    message: 'Discovered 42 business records matching category "Dental Clinic" & "HVAC".'
  },
  {
    id: 'log-3',
    timestamp: '04:28:13.010',
    agent: 'Website Analyzer',
    level: 'info',
    message: 'Starting HTTP/SSL check on apex.dentaltoronto.ca...'
  },
  {
    id: 'log-4',
    timestamp: '04:28:13.820',
    agent: 'Website Analyzer',
    level: 'warning',
    message: 'Lighthouse PageSpeed score is low (48/100). Mobile FCP is 4.2s (WordPress 5.2 detected).'
  },
  {
    id: 'log-5',
    timestamp: '04:28:14.210',
    agent: 'Contact & Email Finder',
    level: 'info',
    message: 'Querying public WHOIS & social records for Dr. Robert Vance...'
  },
  {
    id: 'log-6',
    timestamp: '04:28:14.890',
    agent: 'Contact & Email Finder',
    level: 'success',
    message: 'Enriched verified email (dr.apex@apexdentaltoronto.ca) and WhatsApp endpoint.'
  },
  {
    id: 'log-7',
    timestamp: '04:28:15.340',
    agent: 'AI Opportunity Scoring',
    level: 'info',
    message: 'Executing Gemini 3.6 Flash reasoning model for revenue bottleneck evaluation...'
  },
  {
    id: 'log-8',
    timestamp: '04:28:15.910',
    agent: 'AI Opportunity Scoring',
    level: 'success',
    message: 'Assigned Opportunity Score: 92/100 [Grade: HOT]. High priority redesign candidate.'
  },
  {
    id: 'log-9',
    timestamp: '04:28:16.400',
    agent: 'Website Analyzer',
    level: 'info',
    message: 'Connecting to domain www.summithvacontario.ca...'
  },
  {
    id: 'log-10',
    timestamp: '04:28:17.020',
    agent: 'Website Analyzer',
    level: 'warning',
    message: 'Website domain parked or missing active CMS! Pure Google Business Profile lead.'
  },
  {
    id: 'log-11',
    timestamp: '04:28:17.650',
    agent: 'AI Opportunity Scoring',
    level: 'success',
    message: 'Summit HVAC scored 96/100 [Grade: HOT]. Est. uncollected digital revenue: $1.5M+.'
  },
  {
    id: 'log-12',
    timestamp: '04:28:18.200',
    agent: 'Website Analyzer',
    level: 'error',
    message: 'Domain precisionautovan.ca failed SSL verification (Expired TLS Certificate).'
  },
  {
    id: 'log-13',
    timestamp: '04:28:18.880',
    agent: 'Export & CRM Dispatch',
    level: 'info',
    message: 'Standby mode active. All 6 enriched leads ready for campaign sequence generation.'
  }
];
