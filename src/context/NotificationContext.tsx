import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { RetroNotification, UrbanThresholdStatus } from '../types/notification.ts';
import { UrbanThresholdMonitor } from '../services/urbanThresholdMonitor.ts';
import { retroAudio } from '../utils/retroAudio.ts';
import { notificationBus } from '../services/notificationService.ts';
import { CityEntity } from '../types/city.ts';

interface NotificationContextType {
  notifications: RetroNotification[]; // Active un-dismissed popups
  history: RetroNotification[]; // Chronological archive
  unreadCount: number;
  soundEnabled: boolean;
  toggleSound: () => void;
  notify: (notif: Omit<RetroNotification, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => void;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;
  markAllAsRead: () => void;
  clearHistory: () => void;
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: (open: boolean) => void;
  triggerIncident: (type: 'FLASH_FLOOD' | 'POWER_BROWNOUT' | 'HOSPITAL_SURGE' | 'TRANSIT_GRIDLOCK' | 'RENT_HIKE_PROTEST') => void;
  thresholdStatuses: UrbanThresholdStatus[];
  evaluateThresholds: (entities: CityEntity[]) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const MAX_VISIBLE_POPUPS = 3;
const STORAGE_KEY_HISTORY = 'citymind_notification_history';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<RetroNotification[]>([]);
  const [history, setHistory] = useState<RetroNotification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return [];
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => retroAudio.isEnabled());
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [thresholdStatuses, setThresholdStatuses] = useState<UrbanThresholdStatus[]>([]);

  // Track acknowledged codes to prevent repeated alert spam
  const acknowledgedCodesRef = useRef<Set<string>>(new Set());

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, 100)));
    } catch {}
  }, [history]);

  const toggleSound = useCallback(() => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    retroAudio.setEnabled(next);
    retroAudio.play('CLICK');
  }, [soundEnabled]);

  const dismissNotification = useCallback((id: string) => {
    retroAudio.play('DISMISS');
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    retroAudio.play('DISMISS');
    setNotifications([]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setHistory(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch {}
  }, []);

  const notify = useCallback(
    (notifData: Omit<RetroNotification, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => {
      const id = notifData.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const timestamp = notifData.timestamp || new Date().toISOString();
      const newNotif: RetroNotification = {
        ...notifData,
        id,
        timestamp,
        read: false,
      };

      // Play authentic 8-bit sound effect based on severity
      retroAudio.play(newNotif.severity);

      // Add to visible popups (keep at most MAX_VISIBLE_POPUPS)
      setNotifications(prev => {
        // Prevent duplicate IDs
        const filtered = prev.filter(n => n.id !== id && n.code !== newNotif.code);
        return [newNotif, ...filtered].slice(0, MAX_VISIBLE_POPUPS);
      });

      // Append to persistent chronological history
      setHistory(prev => [newNotif, ...prev.filter(n => n.id !== id)]);

      // Auto-dismiss after durationMs (default 8000ms unless durationMs === 0)
      const duration = newNotif.durationMs !== undefined ? newNotif.durationMs : 8000;
      if (duration > 0) {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, duration);
      }
    },
    []
  );

  // Listen to global notificationBus events (from background services, CityContext, etc.)
  useEffect(() => {
    const unsubscribe = notificationBus.subscribe(notif => {
      notify(notif);
    });
    return unsubscribe;
  }, [notify]);

  const triggerIncident = useCallback(
    (type: 'FLASH_FLOOD' | 'POWER_BROWNOUT' | 'HOSPITAL_SURGE' | 'TRANSIT_GRIDLOCK' | 'RENT_HIKE_PROTEST') => {
      const incident = UrbanThresholdMonitor.createSimulatedIncident(type);
      notify(incident);
    },
    [notify]
  );

  const evaluateThresholds = useCallback(
    (entities: CityEntity[]) => {
      if (!entities || entities.length === 0) return;
      const statuses = UrbanThresholdMonitor.evaluateAllStatuses(entities);
      setThresholdStatuses(statuses);

      // Check for newly breached thresholds
      const breaches = UrbanThresholdMonitor.scanForBreaches(entities, acknowledgedCodesRef.current);
      breaches.forEach(breach => {
        acknowledgedCodesRef.current.add(breach.code);
        notify(breach);
      });
    },
    [notify]
  );

  const unreadCount = history.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        history,
        unreadCount,
        soundEnabled,
        toggleSound,
        notify,
        dismissNotification,
        dismissAll,
        markAllAsRead,
        clearHistory,
        isNotificationCenterOpen,
        setIsNotificationCenterOpen,
        triggerIncident,
        thresholdStatuses,
        evaluateThresholds,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
