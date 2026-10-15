import { RetroNotification } from '../types/notification.ts';

type NotificationListener = (
  notif: Omit<RetroNotification, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
) => void;

class NotificationBus {
  private listeners: Set<NotificationListener> = new Set();

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public emit(
    notif: Omit<RetroNotification, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
  ) {
    this.listeners.forEach(listener => {
      try {
        listener(notif);
      } catch (err) {
        console.error('Notification dispatch listener error:', err);
      }
    });
  }
}

export const notificationBus = new NotificationBus();
