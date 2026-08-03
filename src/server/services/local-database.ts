import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { BusinessLead, SearchCriteria, WorkflowLog } from '../types';

const DB_DIR = path.join(process.cwd(), 'data', 'local-store');

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

class LocalDatabaseService {
  private databases: Map<string, Database.Database> = new Map();

  async initialize(): Promise<void> {
    ensureDir();
  }

  private getDb(ip: string): Database.Database {
    const hash = hashIp(ip);
    if (!this.databases.has(hash)) {
      const dbPath = path.join(DB_DIR, `user_${hash}.db`);
      const db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
      this.initTables(db);
      this.databases.set(hash, db);
    }
    return this.databases.get(hash)!;
  }

  private initTables(db: Database.Database): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS exported_leads (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        exported_at TEXT DEFAULT (datetime('now')),
        export_format TEXT,
        owner_ip TEXT
      );

      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        criteria TEXT,
        lead_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        criteria TEXT,
        result_count INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
      CREATE INDEX IF NOT EXISTS idx_exported_leads_exported ON exported_leads(exported_at);
    `);
  }

  saveLeads(ip: string, leads: BusinessLead[]): void {
    const db = this.getDb(ip);
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO leads (id, data, updated_at)
      VALUES (?, ?, datetime('now'))
    `);

    const transaction = db.transaction((items: BusinessLead[]) => {
      for (const lead of items) {
        stmt.run(lead.id, JSON.stringify(lead));
      }
    });

    transaction(leads);
  }

  getLead(ip: string, id: string): BusinessLead | undefined {
    const db = this.getDb(ip);
    const row = db.prepare('SELECT data FROM leads WHERE id = ?').get(id) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : undefined;
  }

  getAllLeads(ip: string): BusinessLead[] {
    const db = this.getDb(ip);
    const rows = db.prepare('SELECT data FROM leads ORDER BY created_at DESC').all() as { data: string }[];
    return rows.map(r => JSON.parse(r.data));
  }

  updateLead(ip: string, id: string, updates: Partial<BusinessLead>): BusinessLead | undefined {
    const db = this.getDb(ip);
    const existing = this.getLead(ip, id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates, lastUpdated: new Date().toISOString().split('T')[0] };
    db.prepare(`UPDATE leads SET data = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(JSON.stringify(updated), id);
    return updated;
  }

  deleteLead(ip: string, id: string): boolean {
    const db = this.getDb(ip);
    const result = db.prepare('DELETE FROM leads WHERE id = ?').run(id);
    return result.changes > 0;
  }

  searchLeads(ip: string, query: {
    grade?: string;
    category?: string;
    city?: string;
    websiteStatus?: string;
    minScore?: number;
    status?: string;
  }): BusinessLead[] {
    const leads = this.getAllLeads(ip);
    return leads.filter((lead) => {
      if (query.grade && lead.grade !== query.grade) return false;
      if (query.category && lead.category !== query.category) return false;
      if (query.city && lead.city.toLowerCase() !== query.city.toLowerCase()) return false;
      if (query.websiteStatus && lead.websiteStatus !== query.websiteStatus) return false;
      if (query.minScore && lead.opportunityScore < query.minScore) return false;
      if (query.status && lead.status !== query.status) return false;
      return true;
    });
  }

  advancedSearch(ip: string, query: {
    searchTerm?: string;
    grades?: string[];
    categories?: string[];
    cities?: string[];
    websiteStatuses?: string[];
    minScore?: number;
    maxScore?: number;
    minRating?: number;
    minReviews?: number;
    status?: string[];
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): { leads: BusinessLead[]; total: number } {
    let results = this.getAllLeads(ip);

    if (query.searchTerm) {
      const term = query.searchTerm.toLowerCase();
      results = results.filter((l) =>
        l.name.toLowerCase().includes(term) ||
        l.category.toLowerCase().includes(term) ||
        l.city.toLowerCase().includes(term) ||
        l.email.toLowerCase().includes(term) ||
        (l.ownerName && l.ownerName.toLowerCase().includes(term))
      );
    }
    if (query.grades && query.grades.length > 0) {
      results = results.filter((l) => query.grades!.includes(l.grade));
    }
    if (query.categories && query.categories.length > 0) {
      results = results.filter((l) => query.categories!.includes(l.category));
    }
    if (query.cities && query.cities.length > 0) {
      results = results.filter((l) => query.cities!.some((c) => c.toLowerCase() === l.city.toLowerCase()));
    }
    if (query.websiteStatuses && query.websiteStatuses.length > 0) {
      results = results.filter((l) => query.websiteStatuses!.includes(l.websiteStatus));
    }
    if (query.minScore !== undefined) {
      results = results.filter((l) => l.opportunityScore >= query.minScore!);
    }
    if (query.maxScore !== undefined) {
      results = results.filter((l) => l.opportunityScore <= query.maxScore!);
    }
    if (query.minRating !== undefined) {
      results = results.filter((l) => l.rating >= query.minRating!);
    }
    if (query.minReviews !== undefined) {
      results = results.filter((l) => l.reviewCount >= query.minReviews!);
    }
    if (query.status && query.status.length > 0) {
      results = results.filter((l) => query.status!.includes(l.status));
    }

    const total = results.length;

    if (query.sortBy) {
      const dir = query.sortDir === 'asc' ? 1 : -1;
      results.sort((a, b) => {
        const aVal = (a as any)[query.sortBy!];
        const bVal = (b as any)[query.sortBy!];
        if (typeof aVal === 'string') return aVal.localeCompare(bVal) * dir;
        return ((aVal as number) - (bVal as number)) * dir;
      });
    }

    const offset = query.offset || 0;
    const limit = query.limit || 100;
    results = results.slice(offset, offset + limit);

    return { leads: results, total };
  }

  batchUpdateStatus(ip: string, ids: string[], status: string): { updated: number; leads: BusinessLead[] } {
    let updated = 0;
    const leads: BusinessLead[] = [];
    for (const id of ids) {
      const result = this.updateLead(ip, id, { status: status as any });
      if (result) {
        updated++;
        leads.push(result);
      }
    }
    return { updated, leads };
  }

  batchDelete(ip: string, ids: string[]): { deleted: number } {
    let deleted = 0;
    for (const id of ids) {
      if (this.deleteLead(ip, id)) deleted++;
    }
    return { deleted };
  }

  saveWorkflow(ip: string, criteria: SearchCriteria, leads: BusinessLead[], logs: WorkflowLog[]): string {
    const db = this.getDb(ip);
    const id = `wf-${Date.now()}`;
    db.prepare('INSERT INTO workflows (id, criteria, lead_count) VALUES (?, ?, ?)')
      .run(id, JSON.stringify(criteria), leads.length);
    return id;
  }

  getWorkflow(ip: string, id: string) {
    const db = this.getDb(ip);
    const row = db.prepare('SELECT * FROM workflows WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      criteria: JSON.parse(row.criteria),
      leadCount: row.lead_count,
      createdAt: row.created_at,
    };
  }

  getAllWorkflows(ip: string) {
    const db = this.getDb(ip);
    const rows = db.prepare('SELECT * FROM workflows ORDER BY created_at DESC').all() as any[];
    return rows.map(row => ({
      id: row.id,
      criteria: JSON.parse(row.criteria),
      leadCount: row.lead_count,
      createdAt: row.created_at,
    }));
  }

  addSearchHistory(ip: string, criteria: SearchCriteria, resultCount: number): void {
    const db = this.getDb(ip);
    db.prepare('INSERT INTO search_history (criteria, result_count) VALUES (?, ?)')
      .run(JSON.stringify(criteria), resultCount);
  }

  getSearchHistory(ip: string) {
    const db = this.getDb(ip);
    const rows = db.prepare('SELECT * FROM search_history ORDER BY created_at DESC LIMIT 100').all() as any[];
    return rows.map(row => ({
      criteria: JSON.parse(row.criteria),
      resultCount: row.result_count,
      timestamp: row.created_at,
    }));
  }

  getStats(ip: string) {
    const leads = this.getAllLeads(ip);
    return {
      totalLeads: leads.length,
      hotLeads: leads.filter((l) => l.grade === 'HOT').length,
      warmLeads: leads.filter((l) => l.grade === 'WARM').length,
      coldLeads: leads.filter((l) => l.grade === 'COLD').length,
      totalWorkflows: this.getAllWorkflows(ip).length,
      totalSearches: this.getSearchHistory(ip).length,
      categories: [...new Set(leads.map((l) => l.category))],
      cities: [...new Set(leads.map((l) => l.city))],
      avgOpportunityScore: leads.length > 0
        ? Math.round(leads.reduce((sum, l) => sum + l.opportunityScore, 0) / leads.length)
        : 0,
    };
  }

  // Export and flush: archive leads then remove from active
  exportAndFlush(ip: string, leadIds: string[], format: string): { archived: number; flushed: number } {
    const db = this.getDb(ip);
    let archived = 0;
    let flushed = 0;

    const transaction = db.transaction(() => {
      for (const id of leadIds) {
        const lead = this.getLead(ip, id);
        if (lead) {
          // Archive to exported_leads
          db.prepare(`
            INSERT OR REPLACE INTO exported_leads (id, data, export_format, owner_ip)
            VALUES (?, ?, ?, ?)
          `).run(id, JSON.stringify(lead), format, ip);
          archived++;

          // Flush from active leads
          db.prepare('DELETE FROM leads WHERE id = ?').run(id);
          flushed++;
        }
      }
    });

    transaction();
    return { archived, flushed };
  }

  // Get exported/archived leads
  getExportedLeads(ip: string, limit = 100): BusinessLead[] {
    const db = this.getDb(ip);
    const rows = db.prepare('SELECT data, exported_at FROM exported_leads WHERE owner_ip = ? ORDER BY exported_at DESC LIMIT ?')
      .all(ip, limit) as { data: string }[];
    return rows.map(r => JSON.parse(r.data));
  }

  // Restore lead from archive
  restoreLead(ip: string, id: string): BusinessLead | undefined {
    const db = this.getDb(ip);
    const row = db.prepare('SELECT data FROM exported_leads WHERE id = ? AND owner_ip = ?').get(id, ip) as { data: string } | undefined;
    if (!row) return undefined;

    const lead = JSON.parse(row.data);
    this.saveLeads(ip, [lead]);
    db.prepare('DELETE FROM exported_leads WHERE id = ?').run(id);
    return lead;
  }

  // Clear all data for an IP
  clearAll(ip: string): void {
    const db = this.getDb(ip);
    db.exec('DELETE FROM leads; DELETE FROM exported_leads; DELETE FROM workflows; DELETE FROM search_history;');
  }

  // Get database file size for diagnostics
  getDbSize(ip: string): number {
    const hash = hashIp(ip);
    const dbPath = path.join(DB_DIR, `user_${hash}.db`);
    if (fs.existsSync(dbPath)) {
      return fs.statSync(dbPath).size;
    }
    return 0;
  }

  // Close all database connections
  closeAll(): void {
    for (const db of this.databases.values()) {
      db.close();
    }
    this.databases.clear();
  }
}

export const localDatabase = new LocalDatabaseService();
