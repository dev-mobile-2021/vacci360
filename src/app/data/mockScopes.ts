import type { Scope } from '../types';

export const MOCK_SCOPES: Scope[] = [
  {
    id: 'national',
    level: 'national',
    name: 'Tchad',
    stats: { districts: 23, villages: 12480, formations: 1842 },
  },
  // Provinces pilotes
  {
    id: 'prov-lac',
    level: 'provincial',
    name: 'Province du Lac',
    parentId: 'national',
    stats: { districts: 3, villages: 412, formations: 58 },
  },
  {
    id: 'prov-kanem',
    level: 'provincial',
    name: 'Province du Kanem',
    parentId: 'national',
    stats: { districts: 3, villages: 387, formations: 49 },
  },
  {
    id: 'prov-hadjer-lamis',
    level: 'provincial',
    name: 'Province du Hadjer-Lamis',
    parentId: 'national',
    stats: { districts: 2, villages: 298, formations: 41 },
  },
  // Districts pilotes
  {
    id: 'dist-bol',
    level: 'district',
    name: 'District de Bol',
    parentId: 'prov-lac',
    stats: { districts: 0, villages: 142, formations: 21 },
  },
  {
    id: 'dist-liwa',
    level: 'district',
    name: 'District de Liwa',
    parentId: 'prov-lac',
    stats: { districts: 0, villages: 138, formations: 19 },
  },
  {
    id: 'dist-ngouri',
    level: 'district',
    name: 'District de Ngouri',
    parentId: 'prov-lac',
    stats: { districts: 0, villages: 132, formations: 18 },
  },
  {
    id: 'dist-mao',
    level: 'district',
    name: 'District de Mao',
    parentId: 'prov-kanem',
    stats: { districts: 0, villages: 145, formations: 20 },
  },
  {
    id: 'dist-massakory',
    level: 'district',
    name: 'District de Massakory',
    parentId: 'prov-hadjer-lamis',
    stats: { districts: 0, villages: 156, formations: 22 },
  },
];

/** Toutes les provinces du Tchad (placeholder pour la liste complète référentiel) */
export const ALL_PROVINCES = [
  'Lac', 'Kanem', 'Hadjer-Lamis', 'Batha', 'Borkou', 'Chari-Baguirmi',
  'Ennedi', 'Guéra', 'Logone Occidental', 'Logone Oriental', 'Mandoul',
  'Mayo-Kebbi Est', 'Mayo-Kebbi Ouest', 'Moyen-Chari', 'Ouaddaï', 'Salamat',
  'Sila', 'Tandjilé', 'Tibesti', 'Wadi Fira', "N'Djamena",
];

export function findScope(scopeId: string): Scope | undefined {
  return MOCK_SCOPES.find((s) => s.id === scopeId);
}

export function getScopesForUser(scopeIds: string[]): Scope[] {
  return MOCK_SCOPES.filter((s) => scopeIds.includes(s.id));
}
