export type TeamStatus = 'available' | 'on_mission' | 'resting' | 'training' | 'unavailable';
export type VehicleType = 'motorbike' | 'car' | '4x4' | 'pirogue' | 'foot';
export type TeamMemberRole = 'team_leader' | 'nurse' | 'midwife' | 'community_agent' | 'driver';
export type EquipmentType =
  | 'cold_box' | 'vaccine_carrier' | 'gps_device' | 'tablet' | 'thermometer' | 'first_aid_kit';
export type EquipmentStatus = 'operational' | 'damaged' | 'missing';

export interface TeamMember {
  id: string;
  name: string;
  role: TeamMemberRole;
  phone: string;
  pevCertified: boolean;
  certificationDate: Date | null;
  yearsOfExperience: number;
}

export interface EquipmentItem {
  type: EquipmentType;
  quantity: number;
  status: EquipmentStatus;
}

export interface WeeklySchedule {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface Team {
  id: string;
  name: string;
  code: string;

  homeFacilityId: string;
  responsibleDistrict: string;

  members: TeamMember[];
  membersCount: number;
  teamLeaderId: string;

  vehicleType: VehicleType;
  vehicleId: string | null;
  vehicleLabel: string;
  equipment: EquipmentItem[];

  status: TeamStatus;
  currentMissionId: string | null;
  currentMissionName: string | null;
  currentMissionStartedAt: Date | null;
  nextMissionStart: Date | null;

  totalMissionsCompleted: number;
  totalVillagesCovered: number;
  totalChildrenVaccinated: number;
  averageRating: number;

  primaryInterventionZone: {
    cantons: string[];
    villagesCount: number;
  };

  weeklySchedule: WeeklySchedule;

  createdAt: Date;
  updatedAt: Date;
}

export const TEAM_STATUS_LABEL: Record<TeamStatus, string> = {
  available: 'Disponible',
  on_mission: 'En mission',
  resting: 'Au repos',
  training: 'En formation',
  unavailable: 'Indisponible',
};

export const VEHICLE_LABEL: Record<VehicleType, string> = {
  motorbike: 'Moto',
  car: 'Voiture',
  '4x4': '4×4',
  pirogue: 'Pirogue',
  foot: 'À pied',
};

export const ROLE_LABEL: Record<TeamMemberRole, string> = {
  team_leader: 'Chef d’équipe',
  nurse: 'Infirmier·ère',
  midwife: 'Sage-femme',
  community_agent: 'Agent communautaire',
  driver: 'Chauffeur',
};

export const EQUIPMENT_LABEL: Record<EquipmentType, string> = {
  cold_box: 'Glacière',
  vaccine_carrier: 'Porte-vaccins',
  gps_device: 'GPS',
  tablet: 'Tablette',
  thermometer: 'Thermomètre',
  first_aid_kit: 'Trousse de secours',
};
