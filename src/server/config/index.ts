import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  apiKeys: {
    gemini: process.env.GEMINI_API_KEY || '',
    googlePlaces: process.env.GOOGLE_PLACES_API_KEY || '',
    firecrawl: process.env.FIRECRAWL_API_KEY || '',
    hunter: process.env.HUNTER_API_KEY || '',
    apollo: process.env.APOLLO_API_KEY || '',
    clearbit: process.env.CLEARBIT_API_KEY || '',
    pagespeed: process.env.GOOGLE_PAGESPEED_API_KEY || '',
  },

  database: {
    path: process.env.DB_PATH || './data/coldrunners.db',
  },

  agents: {
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_AGENTS || '5', 10),
    timeout: parseInt(process.env.AGENT_TIMEOUT || '30000', 10),
    retryAttempts: parseInt(process.env.AGENT_RETRY_ATTEMPTS || '3', 10),
  },

  search: {
    defaultRadius: 25,
    defaultTargetCount: 300,
    minRating: 4.3,
    minReviews: 50,
  },

  export: {
    outputDir: process.env.EXPORT_DIR || './exports',
  },
};

export type Config = typeof config;
