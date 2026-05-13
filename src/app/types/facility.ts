import type { AccessibilityRating } from './village';

export type FacilityType = 'hospital' | 'health_center' | 'health_post' | 'health_house';
export type FacilityStatus = 'operational' | 'degraded' | 'closed' | 'under_construction';
export type VaccinationStrategy = 'fixed' | 'advanced' | 'mobile' | 'mixed';
export type Connectivity = 'good' | 'intermittent' | 'none';

export interface ColdChainEquipment {
  id: string;
  type: 'refrigerator' | 'freezer' | 'cold_box' | 'vaccine_carrier';
  brand: string;
  capacity: number;
  status: 'operational' | 'degraded' | 'broken' | 'maintenance';
  lastMaintenance: Date | null;
  nextMaintenanceDue: Date | null;
  installedDate: Date;
}

export interface StaffMember {
  name: string;
  role: 'doctor' | 'nurse' | 'midwife' | 'community_agent' | 'administrator' | 'driver';
  pevTrained: boolean;
  pevTrainingDate: Date | null;
}

export interface Facility {
  id: string;
  name: string;
  code: string;
  type: FacilityType;
  status: FacilityStatus;

  // Hiérarchie
  provinceId: string;
  /** Department id (anciennement districtId). */
  districtId: string;
  departmentId: string;
  subPrefectureId: string;
  cantonId: string;

  // Localisation
  lat: number;
  lng: number;
  address: string;

  // Personnel
  staff: StaffMember[];
  staffCount: number;
  pevTrainedCount: number;

  // Chaîne du froid
  coldChainEquipments: ColdChainEquipment[];
  coldChainCapacityDoses: number;
  /** Conservé pour rétrocompat avec d'anciens callers. */
  coldChainCapacity: number;
  coldChainOperational: boolean;

  // Desserte (peuplé après cross-link villages)
  villagesServed: number;
  populationCovered: number;
  targetPopulationUnder5: number;
  averageRadiusKm: number;

  // Activités PEV
  vaccinationStrategies: VaccinationStrategy[];
  sessionsPerMonth: number;
  lastSessionDate: Date | null;
  monthlyCoverage: {
    bcg: number;
    dtc1: number;
    dtc3: number;
    measles: number;
  };

  // Accessibilité
  roadAccess: {
    drySeasonAccess: AccessibilityRating;
    wetSeasonAccess: AccessibilityRating;
  };
  transportModesAvailable: ('foot' | 'bike' | 'motorbike' | '4x4' | 'pirogue')[];

  // Connectivité
  mobileNetwork: {
    available: boolean;
    quality: 'good' | 'intermittent' | 'poor';
    operators: string[];
  };
  hasInternet: boolean;
  connectivity: Connectivity;

  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt: Date | null;
  verifiedBy: string | null;
  dataQualityScore: number;
}

export const FACILITY_TYPE_LABEL: Record<FacilityType, string> = {
  hospital: 'Hôpital',
  health_center: 'Centre de santé',
  health_post: 'Poste de santé',
  health_house: 'Case de santé',
};

export const FACILITY_TYPE_SHORT: Record<FacilityType, string> = {
  hospital: 'H',
  health_center: 'CS',
  health_post: 'PS',
  health_house: 'CdS',
};

export const FACILITY_STATUS_LABEL: Record<FacilityStatus, string> = {
  operational: 'Opérationnelle',
  degraded: 'Dégradée',
  closed: 'Fermée',
  under_construction: 'En construction',
};

export const STRATEGY_LABEL: Record<VaccinationStrategy, string> = {
  fixed: 'Fixe',
  advanced: 'Avancée',
  mobile: 'Mobile',
  mixed: 'Mixte',
};
