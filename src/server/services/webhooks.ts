import { WebhookSubscription, OutreachEvent, OutreachEventType } from '../types';
import { eventBus } from './event-bus';
import crypto from 'crypto';

export class WebhookService {
  private subscriptions: Map<string, WebhookSubscription> = new Map();
  private deliveryLog: { id: string; subscriptionId: string; event: string; status: 'success' | 'failed'; timestamp: Date; error?: string }[] = [];

  constructor() {
    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    eventBus.onAll(async (event: OutreachEvent) => {
      await this.deliverEvent(event);
    });
  }

  createSubscription(params: {
    url: string;
    events: OutreachEventType[];
    platform: WebhookSubscription['platform'];
  }): WebhookSubscription {
    const id = `wh-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const secret = crypto.randomBytes(32).toString('hex');

    const subscription: WebhookSubscription = {
      id,
      url: params.url,
      secret,
      events: params.events,
      platform: params.platform,
      active: true,
      createdAt: new Date(),
      deliveryCount: 0,
      failureCount: 0,
    };

    this.subscriptions.set(id, subscription);
    return subscription;
  }

  updateSubscription(id: string, updates: Partial<Pick<WebhookSubscription, 'url' | 'events' | 'active'>>): WebhookSubscription | null {
    const sub = this.subscriptions.get(id);
    if (!sub) return null;

    if (updates.url !== undefined) sub.url = updates.url;
    if (updates.events !== undefined) sub.events = updates.events;
    if (updates.active !== undefined) sub.active = updates.active;

    return sub;
  }

  deleteSubscription(id: string): boolean {
    return this.subscriptions.delete(id);
  }

  getSubscription(id: string): WebhookSubscription | undefined {
    return this.subscriptions.get(id);
  }

  getAllSubscriptions(): WebhookSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  private async deliverEvent(event: OutreachEvent): Promise<void> {
    const matchingSubs = Array.from(this.subscriptions.values()).filter(
      sub => sub.active && sub.events.includes(event.type)
    );

    for (const sub of matchingSubs) {
      await this.deliverToSubscription(sub, event);
    }
  }

  private async deliverToSubscription(sub: WebhookSubscription, event: OutreachEvent): Promise<void> {
    const payload = {
      event: event.type,
      timestamp: event.timestamp.toISOString(),
      leadId: event.leadId,
      campaignId: event.campaignId,
      data: event.data,
    };

    const signature = crypto
      .createHmac('sha256', sub.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const deliveryId = `dlv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(sub.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ColdRunners-Event': event.type,
          'X-ColdRunners-Signature': signature,
          'X-ColdRunners-Delivery-Id': deliveryId,
          'User-Agent': 'ColdRunners-Webhook/1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      sub.deliveryCount++;
      sub.lastTriggeredAt = new Date();

      this.deliveryLog.push({
        id: deliveryId,
        subscriptionId: sub.id,
        event: event.type,
        status: response.ok ? 'success' : 'failed',
        timestamp: new Date(),
        error: response.ok ? undefined : `HTTP ${response.status}`,
      });

      if (!response.ok) {
        sub.failureCount++;
      }
    } catch (err: any) {
      sub.deliveryCount++;
      sub.failureCount++;

      this.deliveryLog.push({
        id: deliveryId,
        subscriptionId: sub.id,
        event: event.type,
        status: 'failed',
        timestamp: new Date(),
        error: err.message,
      });
    }
  }

  getDeliveryLog(limit: number = 50): typeof this.deliveryLog {
    return this.deliveryLog.slice(-limit).reverse();
  }

  testDelivery(subscriptionId: string): { success: boolean; error?: string } {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) return { success: false, error: 'Subscription not found' };

    const testEvent: OutreachEvent = {
      id: `evt-test-${Date.now()}`,
      type: 'lead.ready',
      timestamp: new Date(),
      data: {
        test: true,
        message: 'This is a test webhook delivery from ColdRunners',
        business: {
          name: 'Test Business',
          city: 'Toronto',
          category: 'Restaurant',
          opportunityScore: 85,
        },
      },
    };

    this.deliverToSubscription(sub, testEvent);
    return { success: true };
  }
}

export const webhookService = new WebhookService();
