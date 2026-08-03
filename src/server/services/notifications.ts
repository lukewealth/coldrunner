export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationChannel = 'in_app' | 'email' | 'slack' | 'webhook';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: NotificationChannel;
  read: boolean;
  leadId?: string;
  campaignId?: string;
  actionUrl?: string;
  createdAt: Date;
  readAt?: Date;
}

class NotificationService {
  private notifications: Map<string, Notification> = new Map();
  private subscribers: Map<string, (notification: Notification) => void> = new Map();

  create(data: {
    type: NotificationType;
    title: string;
    message: string;
    channel?: NotificationChannel;
    leadId?: string;
    campaignId?: string;
    actionUrl?: string;
  }): Notification {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const notification: Notification = {
      id,
      type: data.type,
      title: data.title,
      message: data.message,
      channel: data.channel || 'in_app',
      read: false,
      leadId: data.leadId,
      campaignId: data.campaignId,
      actionUrl: data.actionUrl,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);

    this.subscribers.forEach((cb) => {
      try { cb(notification); } catch {}
    });

    return notification;
  }

  getAll(limit = 100): Notification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  getUnread(): Notification[] {
    return this.getAll().filter((n) => !n.read);
  }

  markRead(id: string): Notification | undefined {
    const notif = this.notifications.get(id);
    if (!notif) return undefined;
    notif.read = true;
    notif.readAt = new Date();
    return notif;
  }

  markAllRead(): number {
    let count = 0;
    this.notifications.forEach((n) => {
      if (!n.read) {
        n.read = true;
        n.readAt = new Date();
        count++;
      }
    });
    return count;
  }

  delete(id: string): boolean {
    return this.notifications.delete(id);
  }

  clearAll(): void {
    this.notifications.clear();
  }

  getUnreadCount(): number {
    return this.getUnread().length;
  }

  subscribe(subscriberId: string, callback: (notification: Notification) => void): () => void {
    this.subscribers.set(subscriberId, callback);
    return () => {
      this.subscribers.delete(subscriberId);
    };
  }

  notifyLeadDiscovered(leadName: string, city: string, leadId: string): Notification {
    return this.create({
      type: 'success',
      title: 'New Lead Discovered',
      message: `${leadName} in ${city} has been discovered and added to your pipeline.`,
      leadId,
    });
  }

  notifyLeadQualified(leadName: string, score: number, leadId: string): Notification {
    return this.create({
      type: score >= 85 ? 'success' : 'info',
      title: score >= 85 ? 'Hot Lead Qualified!' : 'Lead Qualified',
      message: `${leadName} scored ${score}/100 and has been qualified for outreach.`,
      leadId,
    });
  }

  notifyCampaignCreated(campaignName: string, leadCount: number, campaignId: string): Notification {
    return this.create({
      type: 'info',
      title: 'Campaign Created',
      message: `"${campaignName}" created with ${leadCount} leads. Messages are being prepared.`,
      campaignId,
    });
  }

  notifyMeetingBooked(leadName: string, campaignId: string): Notification {
    return this.create({
      type: 'success',
      title: 'Meeting Booked!',
      message: `A meeting has been scheduled with ${leadName}.`,
      campaignId,
    });
  }

  notifySearchCompleted(city: string, category: string, leadCount: number): Notification {
    return this.create({
      type: 'success',
      title: 'Agent Search Completed',
      message: `Discovered ${leadCount} ${category} leads in ${city}.`,
    });
  }

  notifyError(title: string, message: string): Notification {
    return this.create({
      type: 'error',
      title,
      message,
    });
  }
}

export const notificationService = new NotificationService();
