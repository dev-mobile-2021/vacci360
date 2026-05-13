import type { RolePermissions } from '../types';

export const MODULES = ['Référentiel', 'Cartographie', 'Planification', 'Supervision', 'Logistique', 'Nomades', 'VacciBot', 'Administration'] as const;
export const ACTIONS = ['Voir', 'Créer', 'Modifier', 'Supprimer', 'Valider', 'Exporter'] as const;

export const rolePresets: Record<string, RolePermissions> = {
  admin: Object.fromEntries(
    MODULES.map(m => [m, Object.fromEntries(ACTIONS.map(a => [a, 'FULL']))])
  ),

  gestionnaire_national: {
    'Référentiel': { Voir: 'FULL', Créer: 'FULL', Modifier: 'FULL', Supprimer: 'FULL', Valider: 'FULL', Exporter: 'FULL' },
    'Cartographie': { Voir: 'FULL', Créer: 'FULL', Modifier: 'FULL', Supprimer: 'FULL', Valider: 'FULL', Exporter: 'FULL' },
    'Planification': { Voir: 'FULL', Créer: 'FULL', Modifier: 'FULL', Supprimer: 'FULL', Valider: 'FULL', Exporter: 'FULL' },
    'Supervision': { Voir: 'READ_ALL', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'READ_ALL' },
    'Logistique': { Voir: 'FULL', Créer: 'FULL', Modifier: 'FULL', Supprimer: 'FULL', Valider: 'READ_ALL', Exporter: 'FULL' },
    'Nomades': { Voir: 'FULL', Créer: 'FULL', Modifier: 'FULL', Supprimer: 'FULL', Valider: 'FULL', Exporter: 'FULL' },
    'VacciBot': { Voir: 'FULL', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
    'Administration': { Voir: 'HIDDEN', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
  },

  gestionnaire_provincial: {
    'Référentiel': { Voir: 'FULL', Créer: 'FULL', Modifier: 'FULL', Supprimer: 'FULL', Valider: 'READ_OWN', Exporter: 'FULL' },
    'Cartographie': { Voir: 'FULL', Créer: 'FULL', Modifier: 'FULL', Supprimer: 'FULL', Valider: 'READ_OWN', Exporter: 'FULL' },
    'Planification': { Voir: 'FULL', Créer: 'FULL', Modifier: 'FULL', Supprimer: 'FULL', Valider: 'READ_OWN', Exporter: 'FULL' },
    'Supervision': { Voir: 'FULL', Créer: 'READ_OWN', Modifier: 'READ_OWN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'FULL' },
    'Logistique': { Voir: 'FULL', Créer: 'FULL', Modifier: 'FULL', Supprimer: 'FULL', Valider: 'READ_OWN', Exporter: 'FULL' },
    'Nomades': { Voir: 'FULL', Créer: 'FULL', Modifier: 'FULL', Supprimer: 'FULL', Valider: 'READ_OWN', Exporter: 'FULL' },
    'VacciBot': { Voir: 'FULL', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
    'Administration': { Voir: 'HIDDEN', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
  },

  superviseur_district: {
    'Référentiel': { Voir: 'READ_OWN', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'READ_OWN' },
    'Cartographie': { Voir: 'READ_OWN', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'READ_OWN' },
    'Planification': { Voir: 'READ_OWN', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'READ_OWN' },
    'Supervision': { Voir: 'FULL', Créer: 'FULL', Modifier: 'FULL', Supprimer: 'FULL', Valider: 'FULL', Exporter: 'FULL' },
    'Logistique': { Voir: 'READ_OWN', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'READ_OWN' },
    'Nomades': { Voir: 'HIDDEN', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
    'VacciBot': { Voir: 'FULL', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
    'Administration': { Voir: 'HIDDEN', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
  },

  analyste: {
    'Référentiel': { Voir: 'READ_ALL', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'READ_ALL' },
    'Cartographie': { Voir: 'READ_ALL', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'READ_ALL' },
    'Planification': { Voir: 'READ_ALL', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'READ_ALL' },
    'Supervision': { Voir: 'READ_ALL', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'READ_ALL' },
    'Logistique': { Voir: 'READ_ALL', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'READ_ALL' },
    'Nomades': { Voir: 'READ_ALL', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'READ_ALL' },
    'VacciBot': { Voir: 'FULL', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
    'Administration': { Voir: 'HIDDEN', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
  },

  agent_terrain: {
    'Référentiel': { Voir: 'READ_OWN', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
    'Cartographie': { Voir: 'READ_OWN', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
    'Planification': { Voir: 'READ_OWN', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
    'Supervision': { Voir: 'FULL', Créer: 'FULL', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
    'Logistique': { Voir: 'READ_OWN', Créer: 'FULL', Modifier: 'FULL', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
    'Nomades': { Voir: 'HIDDEN', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
    'VacciBot': { Voir: 'FULL', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
    'Administration': { Voir: 'HIDDEN', Créer: 'HIDDEN', Modifier: 'HIDDEN', Supprimer: 'HIDDEN', Valider: 'HIDDEN', Exporter: 'HIDDEN' },
  },
};

export function getDefaultPermissions(role: string): RolePermissions {
  return rolePresets[role] || rolePresets.agent_terrain;
}
