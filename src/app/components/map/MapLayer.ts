export type LayerId =
  | 'villages'
  | 'facilities'
  | 'isochrones'
  | 'connectivity'
  | 'nomads'
  | 'displaced'
  | 'coverage'
  | 'campaigns';

export interface MapLayer {
  id: LayerId;
  label: string;
  icon: string;
  color: string;
  visible: boolean;
  toggleable: boolean;
  disclaimer?: string;
}

export const DEFAULT_LAYERS: MapLayer[] = [
  { id: 'villages', label: 'Villages', icon: '🏘️', color: '#1E5BA8', visible: true, toggleable: false },
  { id: 'facilities', label: 'Formations sanitaires', icon: '🏥', color: '#7C3AED', visible: true, toggleable: true },
  { id: 'isochrones', label: 'Isochrones', icon: '⏱️', color: '#1E5BA8', visible: false, toggleable: true },
  { id: 'connectivity', label: 'Connectivité réseau', icon: '📶', color: '#16A34A', visible: false, toggleable: true },
  { id: 'coverage', label: 'Zones sans couverture', icon: '🔴', color: '#DC2626', visible: true, toggleable: false },
  { id: 'nomads', label: 'Nomades saisonniers', icon: '🐪', color: '#D97706', visible: false, toggleable: true },
  { id: 'displaced', label: 'Déplacés / Réfugiés', icon: '⛺', color: '#78716C', visible: false, toggleable: true, disclaimer: 'Données anonymisées' },
  { id: 'campaigns', label: 'Campagnes en cours', icon: '📋', color: '#0891B2', visible: false, toggleable: true },
];

export const DTC3_COVERAGE_THRESHOLDS = [
  { min: 95, max: 100, label: '>95% (OMS cible)', color: '#16A34A', bg: '#DCFCE7' },
  { min: 85, max: 95, label: '85–95%', color: '#4ADE80', bg: '#F0FDF4' },
  { min: 70, max: 85, label: '70–85%', color: '#EAB308', bg: '#FEFCE8' },
  { min: 50, max: 70, label: '50–70%', color: '#D97706', bg: '#FFFBEB' },
  { min: 0, max: 50, label: '<50% (critique)', color: '#DC2626', bg: '#FEF2F2' },
];

export function getDtc3Color(dtc3: number): string {
  if (dtc3 >= 95) return '#16A34A';
  if (dtc3 >= 85) return '#4ADE80';
  if (dtc3 >= 70) return '#EAB308';
  if (dtc3 >= 50) return '#D97706';
  return '#DC2626';
}

export type TransportMode = 'foot' | 'bike' | 'motorbike' | '4x4' | 'pirogue';
export type Season = 'dry' | 'wet';

// Speed in km/h per transport mode and season
export const TRANSPORT_SPEEDS: Record<TransportMode, Record<Season, number>> = {
  '4x4': { dry: 60, wet: 25 },
  motorbike: { dry: 40, wet: 15 },
  bike: { dry: 15, wet: 8 },
  foot: { dry: 5, wet: 3 },
  pirogue: { dry: 10, wet: 10 },
};

export const TRANSPORT_LABELS: Record<TransportMode, string> = {
  '4x4': '4x4',
  motorbike: 'Moto',
  bike: 'Vélo',
  foot: 'À pied',
  pirogue: 'Pirogue',
};

export const TRANSPORT_ICONS: Record<TransportMode, string> = {
  '4x4': '🚗',
  motorbike: '🏍️',
  bike: '🚴',
  foot: '🚶',
  pirogue: '🚣',
};

export function calcIsochroneRadiusKm(transport: TransportMode, season: Season, durationMin: number): number {
  const speedKmh = TRANSPORT_SPEEDS[transport][season];
  return speedKmh * (durationMin / 60);
}
