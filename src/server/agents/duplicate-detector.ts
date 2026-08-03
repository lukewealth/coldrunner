import { Agent, AgentContext, AgentResult } from './types';
import { BusinessLead } from '../types';

export class DuplicateDetectorAgent implements Agent {
  type = 'duplicate-detector' as const;
  name = 'Duplicate Detection Agent';
  description = 'Detects and removes duplicate businesses based on phone, name, address, website, and Place ID';

  async execute(context: AgentContext): Promise<AgentResult> {
    const { leads, onLog } = context;
    const initialCount = leads.length;

    onLog({ agent: this.name, level: 'info', message: `Running duplicate detection on ${initialCount} leads...` });

    const uniqueLeads = this.deduplicate(leads);
    const removedCount = initialCount - uniqueLeads.length;

    onLog({
      agent: this.name,
      level: removedCount > 0 ? 'success' : 'info',
      message: removedCount > 0
        ? `Removed ${removedCount} duplicates. ${uniqueLeads.length} unique leads remaining.`
        : `No duplicates found. All ${initialCount} leads are unique.`,
    });

    context.leads = uniqueLeads;

    return { success: true, leads: uniqueLeads, itemsProcessed: initialCount };
  }

  private deduplicate(leads: BusinessLead[]): BusinessLead[] {
    const seen = new Map<string, BusinessLead>();

    for (const lead of leads) {
      const keys = this.generateKeys(lead);
      let isDuplicate = false;

      for (const key of keys) {
        if (seen.has(key)) {
          isDuplicate = true;
          const existing = seen.get(key)!;
          if (lead.opportunityScore > existing.opportunityScore) {
            seen.set(key, lead);
          }
          break;
        }
      }

      if (!isDuplicate) {
        const primaryKey = keys[0] || `fallback-${lead.id}`;
        seen.set(primaryKey, lead);
      }
    }

    return Array.from(seen.values());
  }

  private generateKeys(lead: BusinessLead): string[] {
    const keys: string[] = [];

    if (lead.placeId) keys.push(`place:${lead.placeId}`);
    if (lead.phone) keys.push(`phone:${this.normalizePhone(lead.phone)}`);
    if (lead.website) keys.push(`website:${this.normalizeWebsite(lead.website)}`);
    if (lead.name && lead.address) {
      keys.push(`nameaddr:${lead.name.toLowerCase().substring(0, 20)}:${lead.address.toLowerCase().substring(0, 20)}`);
    }
    if (lead.email) keys.push(`email:${lead.email.toLowerCase()}`);

    return keys;
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  }

  private normalizeWebsite(website: string): string {
    return website.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace('www.', '').toLowerCase();
  }
}
