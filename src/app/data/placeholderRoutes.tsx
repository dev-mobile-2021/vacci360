import {
  Bell, TrendingUp,
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
  { path: '/logistique/previsions', icon: TrendingUp, title: 'Prévisions logistiques',
    description: 'Planification des besoins futurs basée sur les tendances de consommation.',
    sprintName: 'Sprint 7' },
];
