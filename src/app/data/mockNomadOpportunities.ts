const NOW = Date.now();
const DAY = 86_400_000;

export type NomadGroupType = 'seasonal_nomad' | 'displaced' | 'refugee';

export type NomadOpportunity = {
  id: string;
  groupType: NomadGroupType;
  estimatedPopulation: number;
  estimatedChildren: number;
  location: { lat: number; lng: number; description: string };
  windowStart: Date;
  windowEnd: Date;
  confidenceLevel: 'high' | 'medium' | 'low';
  dataSource: string;
  accessConstraints: string[];
  nearestFacilityId: string;
  nearestFacilityName: string;
  distanceKm: number;
  status: 'identified' | 'planned' | 'executed' | 'missed';
  accessLevel: 'public' | 'restricted';
  linkedMicroPlanId?: string;
  teamsAvailableInWindow: string[];
};

export const GROUP_TYPE_LABEL: Record<NomadGroupType, string> = {
  seasonal_nomad: 'Nomade saisonnier',
  displaced: 'Déplacé',
  refugee: 'Réfugié',
};

export const GROUP_TYPE_COLOR: Record<NomadGroupType, string> = {
  seasonal_nomad: 'bg-amber-100 text-amber-700',
  displaced: 'bg-stone-100 text-stone-600',
  refugee: 'bg-slate-100 text-slate-600',
};

export const CONFIDENCE_LABEL: Record<'high' | 'medium' | 'low', string> = {
  high: 'Élevée',
  medium: 'Moyenne',
  low: 'Faible',
};

export const CONFIDENCE_COLOR: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-success/10 text-success-700',
  medium: 'bg-warning/10 text-warning-700',
  low: 'bg-danger/10 text-danger-700',
};

export const STATUS_LABEL: Record<NomadOpportunity['status'], string> = {
  identified: 'Identifiée',
  planned: 'Planifiée',
  executed: 'Exécutée',
  missed: 'Manquée',
};

export const mockNomadOpportunities: NomadOpportunity[] = [
  // ─── 6 seasonal_nomad (public) ─────────────────────────────────────────────
  {
    id: 'nopp-001',
    groupType: 'seasonal_nomad',
    estimatedPopulation: 420,
    estimatedChildren: 85,
    location: { lat: 13.45, lng: 14.72, description: 'Zone pastorale Ouest-Lac, rive nord' },
    windowStart: new Date(NOW + 1 * DAY),
    windowEnd: new Date(NOW + 7 * DAY),
    confidenceLevel: 'high',
    dataSource: 'Rapport éleveurs — IRED',
    accessConstraints: [],
    nearestFacilityId: 'fac-td-lac-bol-0',
    nearestFacilityName: 'CS Bol',
    distanceKm: 14,
    status: 'planned',
    accessLevel: 'public',
    linkedMicroPlanId: 'plan-007',
    teamsAvailableInWindow: ['team-lac-01', 'team-lac-02'],
  },
  {
    id: 'nopp-002',
    groupType: 'seasonal_nomad',
    estimatedPopulation: 310,
    estimatedChildren: 62,
    location: { lat: 13.62, lng: 14.85, description: 'Corridor transhumance Baga Sola — Karal' },
    windowStart: new Date(NOW + 3 * DAY),
    windowEnd: new Date(NOW + 9 * DAY),
    confidenceLevel: 'high',
    dataSource: 'Données transhumance MSF',
    accessConstraints: [],
    nearestFacilityId: 'fac-td-lac-baga-sola-0',
    nearestFacilityName: 'CS Baga Sola',
    distanceKm: 9,
    status: 'planned',
    accessLevel: 'public',
    linkedMicroPlanId: 'plan-003',
    teamsAvailableInWindow: ['team-lac-05'],
  },
  {
    id: 'nopp-003',
    groupType: 'seasonal_nomad',
    estimatedPopulation: 180,
    estimatedChildren: 36,
    location: { lat: 12.38, lng: 15.04, description: 'Plaine alluviale Hadjer-Lamis Sud' },
    windowStart: new Date(NOW + 2 * DAY),
    windowEnd: new Date(NOW + 5 * DAY),
    confidenceLevel: 'medium',
    dataSource: 'Signalement agents terrain',
    accessConstraints: ['Piste praticable uniquement en saison sèche'],
    nearestFacilityId: 'fac-td-hadjer-lamis-massenya-0',
    nearestFacilityName: 'CS Massenya',
    distanceKm: 22,
    status: 'identified',
    accessLevel: 'public',
    linkedMicroPlanId: 'plan-004',
    teamsAvailableInWindow: ['team-lac-06'],
  },
  {
    id: 'nopp-004',
    groupType: 'seasonal_nomad',
    estimatedPopulation: 560,
    estimatedChildren: 112,
    location: { lat: 12.51, lng: 15.18, description: 'Pâturages Chari-Baguirmi, zone humide' },
    windowStart: new Date(NOW + 5 * DAY),
    windowEnd: new Date(NOW + 12 * DAY),
    confidenceLevel: 'high',
    dataSource: 'UNHCR Terrain — rapport mensuel',
    accessConstraints: [],
    nearestFacilityId: 'fac-td-hadjer-lamis-massenya-1',
    nearestFacilityName: 'CS Bousso',
    distanceKm: 18,
    status: 'identified',
    accessLevel: 'public',
    linkedMicroPlanId: 'plan-004',
    teamsAvailableInWindow: ['team-lac-07', 'team-lac-08'],
  },
  {
    id: 'nopp-005',
    groupType: 'seasonal_nomad',
    estimatedPopulation: 240,
    estimatedChildren: 48,
    location: { lat: 14.12, lng: 15.31, description: 'Zone pastorale Kanem Nord' },
    windowStart: new Date(NOW - 2 * DAY),
    windowEnd: new Date(NOW + 4 * DAY),
    confidenceLevel: 'medium',
    dataSource: 'Rapport coordinateurs régionaux',
    accessConstraints: ['Accès 4x4 uniquement'],
    nearestFacilityId: 'fac-td-kanem-mao-0',
    nearestFacilityName: 'CS Mao',
    distanceKm: 31,
    status: 'planned',
    accessLevel: 'public',
    linkedMicroPlanId: 'plan-006',
    teamsAvailableInWindow: ['team-lac-09', 'team-lac-10'],
  },
  {
    id: 'nopp-006',
    groupType: 'seasonal_nomad',
    estimatedPopulation: 390,
    estimatedChildren: 78,
    location: { lat: 13.27, lng: 14.55, description: 'Berges du Lac — zone de pêche saisonnière' },
    windowStart: new Date(NOW),
    windowEnd: new Date(NOW + 6 * DAY),
    confidenceLevel: 'low',
    dataSource: 'Observation directe agent terrain',
    accessConstraints: ['Zone inondable — accès aléatoire'],
    nearestFacilityId: 'fac-td-lac-bol-1',
    nearestFacilityName: 'CS Liwa',
    distanceKm: 12,
    status: 'planned',
    accessLevel: 'public',
    linkedMicroPlanId: 'plan-007',
    teamsAvailableInWindow: ['team-lac-03'],
  },

  // ─── 4 displaced (restricted) ──────────────────────────────────────────────
  {
    id: 'nopp-007',
    groupType: 'displaced',
    estimatedPopulation: 850,
    estimatedChildren: 210,
    location: { lat: 13.78, lng: 14.92, description: 'Site temporaire — Bol périphérie Nord' },
    windowStart: new Date(NOW - 5 * DAY),
    windowEnd: new Date(NOW + 20 * DAY),
    confidenceLevel: 'high',
    dataSource: 'OCHA — base données déplacés',
    accessConstraints: ['Coordination avec protection civile requise'],
    nearestFacilityId: 'fac-td-lac-bol-0',
    nearestFacilityName: 'CS Bol',
    distanceKm: 6,
    status: 'identified',
    accessLevel: 'restricted',
    teamsAvailableInWindow: ['team-lac-01', 'team-lac-02', 'team-lac-08'],
  },
  {
    id: 'nopp-008',
    groupType: 'displaced',
    estimatedPopulation: 620,
    estimatedChildren: 154,
    location: { lat: 12.90, lng: 15.42, description: 'Camp informel — Route nationale 1' },
    windowStart: new Date(NOW + 4 * DAY),
    windowEnd: new Date(NOW + 25 * DAY),
    confidenceLevel: 'high',
    dataSource: 'CICR — rapport confidentiel',
    accessConstraints: ['Escorte sécurité recommandée', 'Notification préalable chef de camp'],
    nearestFacilityId: 'fac-td-hadjer-lamis-massenya-0',
    nearestFacilityName: 'CS Massenya',
    distanceKm: 15,
    status: 'identified',
    accessLevel: 'restricted',
    teamsAvailableInWindow: ['team-lac-06', 'team-lac-07'],
  },
  {
    id: 'nopp-009',
    groupType: 'displaced',
    estimatedPopulation: 430,
    estimatedChildren: 107,
    location: { lat: 13.05, lng: 14.68, description: 'Rassemblement spontané — berges lac' },
    windowStart: new Date(NOW - 10 * DAY),
    windowEnd: new Date(NOW - 2 * DAY),
    confidenceLevel: 'medium',
    dataSource: 'UNHCR Terrain',
    accessConstraints: [],
    nearestFacilityId: 'fac-td-lac-baga-sola-0',
    nearestFacilityName: 'CS Baga Sola',
    distanceKm: 11,
    status: 'missed',
    accessLevel: 'restricted',
    teamsAvailableInWindow: [],
  },
  {
    id: 'nopp-010',
    groupType: 'displaced',
    estimatedPopulation: 290,
    estimatedChildren: 72,
    location: { lat: 14.05, lng: 15.55, description: 'Zone transit — Kanem frontière Niger' },
    windowStart: new Date(NOW + 8 * DAY),
    windowEnd: new Date(NOW + 15 * DAY),
    confidenceLevel: 'low',
    dataSource: 'Rapport OIM',
    accessConstraints: ['Zone sensible — validation GN obligatoire', 'Accompagnement humanitaire requis'],
    nearestFacilityId: 'fac-td-kanem-mao-0',
    nearestFacilityName: 'CS Mao',
    distanceKm: 45,
    status: 'identified',
    accessLevel: 'restricted',
    teamsAvailableInWindow: [],
  },

  // ─── 2 refugee (restricted) ────────────────────────────────────────────────
  {
    id: 'nopp-011',
    groupType: 'refugee',
    estimatedPopulation: 1200,
    estimatedChildren: 310,
    location: { lat: 13.55, lng: 14.38, description: 'Camp enregistré UNHCR — Bol Est' },
    windowStart: new Date(NOW - 15 * DAY),
    windowEnd: new Date(NOW + 45 * DAY),
    confidenceLevel: 'high',
    dataSource: 'UNHCR — liste enregistrement officielle',
    accessConstraints: ['Protocole UNHCR obligatoire', 'Vaccins à fournir par UNICEF'],
    nearestFacilityId: 'fac-td-lac-bol-0',
    nearestFacilityName: 'CS Bol',
    distanceKm: 4,
    status: 'executed',
    accessLevel: 'restricted',
    teamsAvailableInWindow: ['team-lac-01', 'team-lac-02', 'team-lac-03'],
  },
  {
    id: 'nopp-012',
    groupType: 'refugee',
    estimatedPopulation: 780,
    estimatedChildren: 198,
    location: { lat: 13.92, lng: 14.63, description: 'Site relocalisation — Kaya District' },
    windowStart: new Date(NOW + 6 * DAY),
    windowEnd: new Date(NOW + 30 * DAY),
    confidenceLevel: 'high',
    dataSource: 'HCR — données protection',
    accessConstraints: ['Autorisation préfectorale', 'Présence ONG partenaire requise'],
    nearestFacilityId: 'fac-td-lac-bol-2',
    nearestFacilityName: 'CS Kaya',
    distanceKm: 8,
    status: 'identified',
    accessLevel: 'restricted',
    teamsAvailableInWindow: ['team-lac-04', 'team-lac-05'],
  },
];
