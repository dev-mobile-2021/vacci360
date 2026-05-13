// Connectivity zones for Province du Lac — approximated as center + radius circles
// Bol is at 13.4658, 14.7136

export type ConnectivityZoneType = 'good' | 'intermittent' | 'none';

export interface ConnectivityZone {
  id: string;
  label: string;
  type: ConnectivityZoneType;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  operators?: string[];
}

export const CONNECTIVITY_COLORS: Record<ConnectivityZoneType, string> = {
  good: '#16A34A',
  intermittent: '#D97706',
  none: '#78716C',
};

// Zones listed largest-first so smaller zones render on top
export const mockConnectivityZones: ConnectivityZone[] = [
  {
    id: 'conn-none-lac',
    label: 'Zone sans réseau',
    type: 'none',
    centerLat: 13.45,
    centerLng: 14.40,
    radiusKm: 80,
  },
  {
    id: 'conn-intermittent-bol',
    label: 'Réseau intermittent',
    type: 'intermittent',
    centerLat: 13.4658,
    centerLng: 14.7136,
    radiusKm: 38,
    operators: ['Airtel', 'Tigo'],
  },
  {
    id: 'conn-good-bol',
    label: 'Bonne connectivité',
    type: 'good',
    centerLat: 13.4658,
    centerLng: 14.7136,
    radiusKm: 14,
    operators: ['Airtel', 'Tigo', 'Salam'],
  },
  {
    id: 'conn-intermittent-bagasola',
    label: 'Réseau intermittent — Bagasola',
    type: 'intermittent',
    centerLat: 13.32,
    centerLng: 14.50,
    radiusKm: 12,
    operators: ['Airtel'],
  },
  {
    id: 'conn-good-ngouboua',
    label: 'Bonne connectivité — Ngouboua',
    type: 'good',
    centerLat: 13.55,
    centerLng: 14.91,
    radiusKm: 8,
    operators: ['Tigo'],
  },
];
