import { useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { ScopeSelector } from './ScopeSelector';
import { UserMenu } from './UserMenu';
import { NotificationDrawer } from './NotificationDrawer';
import { useNotifications } from '../../lib/notifications';

export function Header() {
  const { unreadCount } = useNotifications();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const badge = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-stone-200 flex items-center gap-6 px-6">
        <div className="flex items-baseline gap-2 shrink-0">
          <span className="text-[18px] font-semibold text-primary-700 tracking-tight">VACCI360</span>
          <span className="text-[11px] text-stone-500">v1.0</span>
        </div>

        <ScopeSelector />

        <div className="flex-1 max-w-[480px]">
          <Input
            type="search"
            placeholder="Rechercher village, formation, équipe…"
            leftIcon={<Search size={16} />}
            rightSlot={
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-stone-200 bg-stone-50 text-[11px] text-stone-500 font-mono">
                Ctrl K
              </kbd>
            }
            aria-label="Recherche globale"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lue${unreadCount > 1 ? 's' : ''})` : ''}`}
            onClick={() => setDrawerOpen(true)}
            className="relative size-10 grid place-items-center rounded-full text-stone-600 hover:bg-stone-100"
          >
            <Bell size={20} />
            {badge && (
              <span
                aria-hidden
                className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-semibold grid place-items-center"
              >
                {badge}
              </span>
            )}
          </button>
          <UserMenu />
        </div>
      </header>
      <NotificationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
