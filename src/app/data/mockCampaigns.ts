const NOW = Date.now();
const DAY = 86_400_000;

export type CampaignStatus = 'planned' | 'in_progress' | 'completed' | 'issue';

export interface Campaign {
  id: string;
  name: string;
  antigen: string;
  provinceId: string;
  startDate: Date;
  endDate: Date;
  status: CampaignStatus;
  coverageTarget: number;
  coverageActual: number;
  villagesTargeted: number;
  villagesCovered: number;
  issueDescription?: string;
}

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  planned: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  issue: 'Problème',
};

export const CAMPAIGN_STATUS_TONE: Record<CampaignStatus, string> = {
  planned: 'info',
  in_progress: 'primary',
  completed: 'success',
  issue: 'danger',
};

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp-001',
    name: 'Campagne DTC3 Mai 2026',
    antigen: 'DTC3',
    provinceId: 'td-lac',
    startDate: new Date(NOW - 5 * DAY),
    endDate: new Date(NOW + 10 * DAY),
    status: 'in_progress',
    coverageTarget: 95,
    coverageActual: 72,
    villagesTargeted: 48,
    villagesCovered: 34,
  },
  {
    id: 'camp-002',
    name: 'Campagne ROR Avril 2026',
    antigen: 'Rougeole-Rubéole',
    provinceId: 'td-lac',
    startDate: new Date(NOW - 35 * DAY),
    endDate: new Date(NOW - 10 * DAY),
    status: 'completed',
    coverageTarget: 90,
    coverageActual: 88,
    villagesTargeted: 52,
    villagesCovered: 48,
  },
  {
    id: 'camp-003',
    name: 'Campagne BCG Neonatal',
    antigen: 'BCG',
    provinceId: 'td-lac',
    startDate: new Date(NOW - 60 * DAY),
    endDate: new Date(NOW - 30 * DAY),
    status: 'completed',
    coverageTarget: 85,
    coverageActual: 91,
    villagesTargeted: 55,
    villagesCovered: 52,
  },
  {
    id: 'camp-004',
    name: 'Campagne Polio OPV2 Juin 2026',
    antigen: 'Polio OPV2',
    provinceId: 'td-lac',
    startDate: new Date(NOW + 20 * DAY),
    endDate: new Date(NOW + 35 * DAY),
    status: 'planned',
    coverageTarget: 95,
    coverageActual: 0,
    villagesTargeted: 60,
    villagesCovered: 0,
  },
  {
    id: 'camp-005',
    name: 'Campagne DTC1 Kanem Mars 2026',
    antigen: 'DTC1',
    provinceId: 'td-kanem',
    startDate: new Date(NOW - 50 * DAY),
    endDate: new Date(NOW - 20 * DAY),
    status: 'issue',
    coverageTarget: 90,
    coverageActual: 54,
    villagesTargeted: 40,
    villagesCovered: 22,
    issueDescription: 'Rupture de stock vaccins semaine 2 — livraison retardée',
  },
  {
    id: 'camp-006',
    name: 'Campagne Méningite A Juillet 2026',
    antigen: 'Méningite A',
    provinceId: 'td-lac',
    startDate: new Date(NOW + 50 * DAY),
    endDate: new Date(NOW + 65 * DAY),
    status: 'planned',
    coverageTarget: 80,
    coverageActual: 0,
    villagesTargeted: 45,
    villagesCovered: 0,
  },
  {
    id: 'camp-007',
    name: 'Campagne DTC3 Hadjer-Lamis Fév. 2026',
    antigen: 'DTC3',
    provinceId: 'td-hadjer-lamis',
    startDate: new Date(NOW - 75 * DAY),
    endDate: new Date(NOW - 45 * DAY),
    status: 'completed',
    coverageTarget: 88,
    coverageActual: 83,
    villagesTargeted: 38,
    villagesCovered: 34,
  },
];
