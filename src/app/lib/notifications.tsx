import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { buildMockNotifications } from '../data/mockNotifications';

export type NotificationType = 'critical' | 'warning' | 'info' | 'success' | 'ai';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  archived?: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  archivedCount: number;
  totalCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  archiveNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    buildMockNotifications(),
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const archiveNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, archived: true, read: true } : n)),
    );
  }, []);

  const active = notifications.filter((n) => !n.archived);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount: active.filter((n) => !n.read).length,
      archivedCount: notifications.filter((n) => n.archived).length,
      totalCount: active.length,
      markAsRead,
      markAllAsRead,
      archiveNotification,
    }),
    [notifications, active, markAsRead, markAllAsRead, archiveNotification],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'hier';
  if (d < 7) return `il y a ${d} jours`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
