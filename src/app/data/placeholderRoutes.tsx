import {
  Bell, Activity, TrendingUp,
  GitBranch, BellRing, Settings, FileSearch,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface PlaceholderRouteConfig {
  path: string;
  icon: LucideIcon;
  title: string;
  description: string;
  sprintName: string;
}

export const PLACEHOLDER_ROUTES: PlaceholderRouteConfig[] = [
  { path: '/alertes', icon: Bell, title: "Centre d'alertes",
    description: 'Configurez et consultez les alertes opérationnelles.',
    sprintName: 'Sprint 2' },
  { path: '/supervision', icon: Activity, title: 'Supervision',
    description: 'Suivi en temps réel des équipes mobiles et de leur conformité.',
    sprintName: 'Sprint 5 — Exécution' },
  { path: '/logistique/previsions', icon: TrendingUp, title: 'Prévisions logistiques',
    description: 'Planification des besoins futurs basée sur les tendances de consommation.',
    sprintName: 'Sprint 6' },
  { path: '/admin/workflow', icon: GitBranch, title: 'Workflow Engine',
    description: 'Configuration des workflows de validation.',
    sprintName: 'Sprint 6' },
  { path: '/admin/notifications', icon: BellRing, title: 'Configuration notifications',
    description: 'Règles et canaux de notification.',
    sprintName: 'Sprint 6' },
  { path: '/admin/parametres', icon: Settings, title: 'Paramètres système',
    description: 'Configuration globale de la plateforme.',
    sprintName: 'Sprint 6' },
  { path: '/admin/audit', icon: FileSearch, title: "Logs d'audit",
    description: 'Traçabilité des actions utilisateurs.',
    sprintName: 'Sprint 6' },
];
