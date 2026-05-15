import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronDown, User, Settings, HelpCircle, LogOut } from 'lucide-react';
import { Avatar } from '../ui/avatar';
import { useAuth } from '../../lib/auth';
import { ROLE_LABEL } from '../../types';

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full pr-2 hover:bg-stone-100 transition-colors"
      >
        <Avatar initials={user.initials} size={36} />
        <ChevronDown size={14} className="text-stone-500" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-stone-200 bg-white shadow-lg z-50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-stone-100">
            <div className="text-[14px] font-semibold text-stone-900 truncate">{user.name}</div>
            <div className="text-[12px] text-stone-500 truncate">{user.email}</div>
            <div className="mt-1 text-[11px] font-medium text-primary-700">
              {ROLE_LABEL[user.role]}
            </div>
          </div>
          <ul className="py-1">
            <MenuItem icon={<User size={16} />} onClick={() => { setOpen(false); navigate('/profile'); }}>
              Profil
            </MenuItem>
            <MenuItem icon={<Settings size={16} />} onClick={() => setOpen(false)}>
              Préférences
            </MenuItem>
            <MenuItem icon={<HelpCircle size={16} />} onClick={() => setOpen(false)}>
              Aide
            </MenuItem>
          </ul>
          <div className="border-t border-stone-100 py-1">
            <MenuItem
              icon={<LogOut size={16} />}
              tone="danger"
              onClick={() => {
                setOpen(false);
                logout();
                navigate('/login', { replace: true });
              }}
            >
              Déconnexion
            </MenuItem>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
  tone = 'default',
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  tone?: 'default' | 'danger';
}) {
  return (
    <li>
      <button
        type="button"
        role="menuitem"
        onClick={onClick}
        className={
          tone === 'danger'
            ? 'w-full flex items-center gap-3 px-4 py-2 text-[14px] text-danger hover:bg-danger-50'
            : 'w-full flex items-center gap-3 px-4 py-2 text-[14px] text-stone-700 hover:bg-stone-50'
        }
      >
        <span className="text-stone-500">{icon}</span>
        {children}
      </button>
    </li>
  );
}
