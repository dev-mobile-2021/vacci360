import { useState } from 'react';
import { NavLink } from 'react-router';
import {
  BarChart2, Map, Bell, ClipboardList, Activity, Package, Tent,
  Globe, Building2, Users, UserCog, GitBranch, BellRing, Settings,
  FileSearch, ChevronLeft, ChevronRight, HelpCircle, House, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../lib/auth';
import type { Role } from '../../types';

interface NavItem {
  label: string;
  icon: LucideIcon;
  to: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
  /** rôles autorisés ; absent = tous */
  roles?: Role[];
}

const SECTIONS: NavSection[] = [
  {
    title: 'PILOTAGE',
    items: [
      { label: "Vue d'ensemble", icon: BarChart2, to: '/executif' },
      { label: 'VacciBot', icon: Sparkles, to: '/vaccibot' },
      { label: 'Carte', icon: Map, to: '/carte' },
      { label: 'Accessibilité', icon: Activity, to: '/carte/accessibilite' },
      { label: 'Alertes', icon: Bell, to: '/alertes' },
    ],
  },
  {
    title: 'ACTION',
    items: [
      { label: 'Micro-plans', icon: ClipboardList, to: '/planification' },
      { label: 'Supervision', icon: Activity, to: '/supervision' },
      { label: 'Logistique', icon: Package, to: '/logistique' },
      { label: 'Opportunités nomades', icon: Tent, to: '/nomades' },
    ],
  },
  {
    title: 'RÉFÉRENTIEL',
    items: [
      { label: 'Géographie', icon: Globe, to: '/referentiel/geographie' },
      { label: 'Villages', icon: House, to: '/referentiel/villages' },
      { label: 'Formations', icon: Building2, to: '/referentiel/formations' },
      { label: 'Équipes', icon: Users, to: '/referentiel/equipes' },
    ],
    roles: ['admin', 'gestionnaire_national', 'gestionnaire_provincial', 'analyste'],
  },
  {
    title: 'ADMINISTRATION',
    roles: ['admin'],
    items: [
      { label: 'Utilisateurs', icon: UserCog, to: '/admin/utilisateurs' },
      { label: 'Workflow Engine', icon: GitBranch, to: '/admin/workflow' },
      { label: 'Notifications', icon: BellRing, to: '/admin/notifications' },
      { label: 'Paramètres', icon: Settings, to: '/admin/parametres' },
      { label: 'Audit', icon: FileSearch, to: '/admin/audit' },
    ],
  },
];

export function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const role = user.role;
  const sections = SECTIONS.filter((s) => !s.roles || s.roles.includes(role));

  return (
    <aside
      className={cn(
        'shrink-0 h-screen sticky top-0 bg-stone-50 border-r border-stone-200 flex flex-col transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="h-16 flex items-center justify-end px-3 border-b border-stone-200">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Étendre la barre latérale' : 'Rétracter la barre latérale'}
          className="size-8 grid place-items-center rounded-md text-stone-500 hover:bg-stone-200 hover:text-stone-800"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <div className="px-4 mb-2 text-[11px] font-semibold tracking-wider text-stone-500">
                {section.title}
              </div>
            )}
            <ul className="space-y-0.5 px-2">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavItemLink item={item} collapsed={collapsed} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-stone-200 p-3 space-y-2">
        <div
          className={cn(
            'flex items-center gap-2 text-[12px] text-stone-600',
            collapsed && 'justify-center',
          )}
          title="Système opérationnel"
        >
          <span className="size-2 rounded-full bg-success" aria-hidden />
          {!collapsed && <span>Système opérationnel</span>}
        </div>
        {!collapsed && (
          <>
            <a
              href="#help"
              className="flex items-center gap-2 text-[13px] text-stone-600 hover:text-primary-700"
            >
              <HelpCircle size={14} />
              Aide & Documentation
            </a>
            <p className="text-[11px] text-stone-500 leading-tight">
              © Ministère Santé Publique · 2026
            </p>
          </>
        )}
      </div>
    </aside>
  );
}

function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-md text-[14px] transition-colors relative',
          collapsed ? 'h-10 justify-center' : 'h-10 px-3',
          isActive
            ? 'bg-primary-100 text-primary-800 font-medium'
            : 'text-stone-700 hover:bg-primary-50 hover:text-primary-700',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden
              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm bg-primary"
            />
          )}
          <Icon size={20} className="shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}
