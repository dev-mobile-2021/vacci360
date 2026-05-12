export type GeoLevel =
  | 'country'
  | 'province'
  | 'department'
  | 'sub_prefecture'
  | 'canton'
  | 'village';

export interface GeoNode {
  id: string;
  level: GeoLevel;
  name: string;
  code: string;
  parentId: string | null;
  population: number;
  centroidLat: number;
  centroidLng: number;
  childrenCount: number;
}

export const GEO_LEVEL_LABEL: Record<GeoLevel, string> = {
  country: 'Pays',
  province: 'Province',
  department: 'Département',
  sub_prefecture: 'Sous-préfecture',
  canton: 'Canton',
  village: 'Village',
};

export const GEO_LEVEL_ORDER: GeoLevel[] = [
  'country',
  'province',
  'department',
  'sub_prefecture',
  'canton',
  'village',
];
