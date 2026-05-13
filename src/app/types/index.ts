export type Role =
  | 'admin'
  | 'gestionnaire_national'
  | 'gestionnaire_provincial'
  | 'superviseur_district'
  | 'agent_terrain'
  | 'analyste';

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin Système',
  gestionnaire_national: 'Gestionnaire PEV National',
  gestionnaire_provincial: 'Gestionnaire Provincial',
  superviseur_district: 'Superviseur District',
  agent_terrain: 'Agent Terrain',
  analyste: 'Analyste Données',
};

export const ROLE_SHORT: Record<Role, string> = {
  admin: 'AD',
  gestionnaire_national: 'GN',
  gestionnaire_provincial: 'GP',
  superviseur_district: 'SD',
  agent_terrain: 'AT',
  analyste: 'AN',
};

export type PermissionState = 'FULL' | 'READ_ALL' | 'READ_OWN' | 'HIDDEN';

export type RolePermissions = {
  [module: string]: {
    [action: string]: PermissionState;
  };
};

export type ScopeLevel = 'national' | 'provincial' | 'district';

export interface Scope {
  id: string;
  level: ScopeLevel;
  name: string;
  parentId?: string;
  stats: {
    districts: number;
    villages: number;
    formations: number;
  };
}

export type UserStatus = 'active' | 'suspended' | 'pending_activation' | 'disabled';

export interface User {
  id: string;
  email: string;
  name: string;
  initials: string;
  role: Role;
  avatar: string | null;
  phone?: string;
  function?: string;
  /** scope ids accessibles par l'utilisateur */
  scopeIds: string[];
  status: UserStatus;
  permissions: RolePermissions;
  mfaEnabled: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  createdBy: string;
}

export interface Notification {
  id: string;
  type: 'alert' | 'info' | 'success' | 'warning' | 'ai';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  important?: boolean;
  href?: string;
}
