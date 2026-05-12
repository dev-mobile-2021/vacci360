import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  X, AlertTriangle, AlertCircle, Info, CheckCircle2, Sparkles, BellOff,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import {
  formatRelative,
  useNotifications,
  type AppNotification,
  type NotificationType,
} from '../../lib/notifications';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = 'all' | 'unread' | 'archived';

const ICONS: Record<NotificationType, LucideIcon> = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
  success: CheckCircle2,
  ai: Sparkles,
};

const ICON_COLORS: Record<NotificationType, string> = {
  critical: 'text-danger bg-danger-50',
  warning: 'text-warning bg-warning-50',
  info: 'text-info bg-info-50',
  success: 'text-success bg-success-50',
  ai: 'text-ai bg-ai-50',
};

export function NotificationDrawer({ open, onClose }: Props) {
  const {
    notifications, unreadCount, archivedCount, totalCount,
    markAsRead, markAllAsRead, archiveNotification,
  } = useNotifications();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = notifications.filter((n) => {
    if (tab === 'archived') return n.archived;
    if (n.archived) return false;
    if (tab === 'unread') return !n.read;
    return true;
  });

  function handleClick(n: AppNotification) {
    if (!n.read) markAsRead(n.id);
    if (n.actionUrl) {
      navigate(n.actionUrl);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Notifications">
      <div
        className="absolute inset-0 bg-black/40 animate-[fade-in_200ms_ease-out]"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="absolute right-0 top-0 h-full w-[420px] max-w-full bg-white shadow-xl flex flex-col animate-[slide-left_200ms_ease-out]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h3 className="text-stone-900">Notifications</h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={unreadCount === 0}
              onClick={markAllAsRead}
              className="text-[13px] px-2 py-1 rounded-md text-stone-600 hover:bg-stone-100 disabled:text-stone-400 disabled:hover:bg-transparent"
            >
              Tout marquer comme lu
            </button>
            <button
              type="button"
              aria-label="Fermer le panneau"
              onClick={onClose}
              className="size-8 grid place-items-center rounded-md text-stone-500 hover:bg-stone-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex border-b border-stone-200 px-2">
          <TabBtn active={tab === 'all'} onClick={() => setTab('all')}>
            Toutes ({totalCount})
          </TabBtn>
          <TabBtn active={tab === 'unread'} onClick={() => setTab('unread')}>
            Non lues ({unreadCount})
          </TabBtn>
          <TabBtn active={tab === 'archived'} onClick={() => setTab('archived')}>
            Archivées ({archivedCount})
          </TabBtn>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 py-16">
              <BellOff size={48} className="text-stone-400" strokeWidth={1.5} />
              <h4 className="mt-4 text-stone-800">Vous êtes à jour</h4>
              <p className="mt-1 text-stone-600 text-[13px]">
                Aucune notification dans cette catégorie pour le moment.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {filtered.map((n) => (
                <li key={n.id}>
                  <NotificationRow
                    notification={n}
                    onClick={() => handleClick(n)}
                    onArchive={tab === 'archived' ? undefined : () => archiveNotification(n.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <style>{`
        @keyframes slide-left {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors',
        active
          ? 'border-primary text-primary-700'
          : 'border-transparent text-stone-600 hover:text-stone-800',
      )}
    >
      {children}
    </button>
  );
}

function NotificationRow({
  notification,
  onClick,
  onArchive,
}: {
  notification: AppNotification;
  onClick: () => void;
  onArchive?: () => void;
}) {
  const Icon = ICONS[notification.type];
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3 flex gap-3 hover:bg-stone-50 transition-colors group"
    >
      <span className="shrink-0 pt-0.5">
        <span
          className={cn(
            'size-2 rounded-full inline-block',
            notification.read ? 'bg-transparent' : 'bg-primary',
          )}
          aria-label={notification.read ? 'lue' : 'non lue'}
        />
      </span>
      <span
        className={cn(
          'shrink-0 size-9 rounded-md grid place-items-center',
          ICON_COLORS[notification.type],
        )}
      >
        <Icon size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[14px] font-semibold text-stone-800 truncate">
            {notification.title}
          </div>
          <span className="text-[11px] text-stone-500 shrink-0 mt-0.5">
            {formatRelative(notification.timestamp)}
          </span>
        </div>
        <p className="text-[13px] text-stone-600 mt-0.5 line-clamp-2">
          {notification.description}
        </p>
        <div className="mt-1 flex items-center gap-3">
          {notification.actionUrl && (
            <span className="text-[13px] text-primary-700 font-medium">
              {notification.actionLabel ?? 'Voir détail'} →
            </span>
          )}
          {onArchive && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onArchive();
                }
              }}
              className="text-[12px] text-stone-500 hover:text-stone-800 opacity-0 group-hover:opacity-100 transition"
            >
              Archiver
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
