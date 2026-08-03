import { OutreachEvent, OutreachEventType } from '../types';

type EventHandler = (event: OutreachEvent) => void | Promise<void>;

export class EventBus {
  private handlers: Map<OutreachEventType, Set<EventHandler>> = new Map();
  private history: OutreachEvent[] = [];
  private maxHistory = 1000;

  on(eventType: OutreachEventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  onAll(handler: EventHandler): () => void {
    const allTypes: OutreachEventType[] = [
      'search.started', 'search.completed', 'business.discovered',
      'business.qualified', 'contact.enriched', 'website.analyzed',
      'opportunity.scored', 'lead.ready', 'campaign.created',
      'email.generated', 'email.approved', 'email.sent',
      'reply.received', 'meeting.booked', 'proposal.generated',
    ];

    const unsubs = allTypes.map(type => this.on(type, handler));
    return () => unsubs.forEach(u => u());
  }

  async emit(eventType: OutreachEventType, data: Record<string, any> = {}, leadId?: string, campaignId?: string): Promise<void> {
    const event: OutreachEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: eventType,
      timestamp: new Date(),
      leadId,
      campaignId,
      data,
    };

    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const promises: Promise<void>[] = [];
      for (const handler of handlers) {
        try {
          const result = handler(event);
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (err) {
          console.error(`Event handler error for ${eventType}:`, err);
        }
      }
      await Promise.allSettled(promises);
    }
  }

  getHistory(filter?: { type?: OutreachEventType; leadId?: string; limit?: number }): OutreachEvent[] {
    let events = [...this.history];

    if (filter?.type) {
      events = events.filter(e => e.type === filter.type);
    }
    if (filter?.leadId) {
      events = events.filter(e => e.leadId === filter.leadId);
    }

    const limit = filter?.limit || 100;
    return events.slice(-limit).reverse();
  }

  getEventCounts(): Record<OutreachEventType, number> {
    const counts: Record<string, number> = {};
    for (const event of this.history) {
      counts[event.type] = (counts[event.type] || 0) + 1;
    }
    return counts as Record<OutreachEventType, number>;
  }

  clear(): void {
    this.history = [];
  }
}

export const eventBus = new EventBus();
