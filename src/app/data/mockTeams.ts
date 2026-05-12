import { createPrng } from './prng';
import { getFacilities } from './mockFacilities';
import type {
  Team, TeamMember, TeamMemberRole, VehicleType, TeamStatus, EquipmentItem, WeeklySchedule,
} from '../types/team';

const FIRST_NAMES = [
  'Hassan', 'Aïcha', 'Mahamat', 'Fatimé', 'Issa', 'Halimé', 'Adoum', 'Mariam',
  'Brahim', 'Zara', 'Abakar', 'Achta', 'Ousmane', 'Khadidja', 'Moussa', 'Hawa',
  'Saleh', 'Amina', 'Yacoub', 'Roukaya', 'Idriss', 'Foulmata', 'Tahir', 'Ngabaye',
];
const LAST_NAMES = [
  'Abdoulaye', 'Mahamat', 'Souleyman', 'Adoum', 'Brahim', 'Ali', 'Hassan',
  'Saleh', 'Issa', 'Tidjani', 'Bichara', 'Djimet', 'Ngarmadji', 'Nadjingar',
];

function phoneNumber(rng: ReturnType<typeof createPrng>): string {
  const a = rng.int(60, 99);
  const b = rng.int(10, 99);
  const c = rng.int(10, 99);
  const d = rng.int(10, 99);
  return `+235 ${a} ${b} ${c} ${d}`;
}

function initialsFor(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

function buildMembers(
  teamId: string,
  rng: ReturnType<typeof createPrng>,
  size: number,
  certifiedRatio: number,
): { members: TeamMember[]; leaderId: string } {
  const roles: TeamMemberRole[] = ['team_leader', 'nurse'];
  // Always: 1 leader + 1 nurse. Then fill with mix.
  const filler: TeamMemberRole[] = ['midwife', 'community_agent', 'community_agent', 'driver', 'nurse'];
  while (roles.length < size) roles.push(rng.pick(filler));

  const members: TeamMember[] = roles.map((role, i) => {
    const name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
    const certified = role === 'driver' ? rng.bool(0.5) : rng.bool(certifiedRatio);
    return {
      id: `${teamId}-m${i}`,
      name,
      role,
      phone: phoneNumber(rng),
      pevCertified: certified,
      certificationDate: certified
        ? new Date(2023 + rng.int(0, 2), rng.int(0, 11), rng.int(1, 28))
        : null,
      yearsOfExperience: rng.int(1, 18),
    };
  });

  return { members, leaderId: members[0].id };
}

function buildEquipment(
  rng: ReturnType<typeof createPrng>,
  vehicleType: VehicleType,
): EquipmentItem[] {
  const baseStatus = (p: number): EquipmentItem['status'] => {
    const r = rng.next();
    if (r < p * 0.85) return 'operational';
    if (r < p * 0.97) return 'damaged';
    return 'missing';
  };
  const items: EquipmentItem[] = [
    { type: 'cold_box', quantity: vehicleType === 'motorbike' ? 1 : 2, status: baseStatus(1) },
    { type: 'vaccine_carrier', quantity: rng.int(2, 4), status: baseStatus(1) },
    { type: 'gps_device', quantity: 1, status: baseStatus(0.9) },
    { type: 'tablet', quantity: 1, status: baseStatus(0.8) },
    { type: 'thermometer', quantity: 2, status: baseStatus(1) },
    { type: 'first_aid_kit', quantity: 1, status: baseStatus(1) },
  ];
  return items;
}

function buildSchedule(rng: ReturnType<typeof createPrng>): WeeklySchedule {
  return {
    monday: rng.bool(0.95),
    tuesday: rng.bool(0.95),
    wednesday: rng.bool(0.9),
    thursday: rng.bool(0.95),
    friday: rng.bool(0.9),
    saturday: rng.bool(0.4),
    sunday: false,
  };
}

const VEHICLE_PLATES = ['TD-1042', 'TD-1188', 'TD-1233', 'TD-1290', 'TD-1411', 'TD-1502', 'TD-1573', 'TD-1604',
  'TD-1709', 'TD-1814', 'TD-1922', 'TD-2017', 'TD-2103', 'TD-2244', 'TD-2310', 'TD-2389', 'TD-2455', 'TD-2531'];

const VEHICLE_MODELS: Record<VehicleType, string[]> = {
  '4x4': ['Toyota Hilux', 'Toyota Land Cruiser', 'Mitsubishi L200', 'Nissan Patrol'],
  motorbike: ['Yamaha AG100', 'Honda XR150', 'Suzuki DR125'],
  pirogue: ['Pirogue motorisée 8m', 'Pirogue motorisée 10m'],
  car: ['Toyota Corolla'],
  foot: ['—'],
};

const MISSION_NAMES = [
  'Riposte rougeole Bol Nord', 'Campagne DTC3 Liwa', 'Stratégie avancée Kaiga',
  'Visite rives Lac Tchad', 'Rattrapage Tagal', 'Sensibilisation Daboua',
];

let cache: Team[] | null = null;

function generate(): Team[] {
  if (cache) return cache;
  const rng = createPrng(424242);
  const allFacilities = getFacilities();
  // On vise la province du Lac.
  const lacFacilities = allFacilities.filter((f) => f.provinceId === 'td-lac');
  // Privilégier hôpitaux et centres de santé pour le rattachement.
  const sorted = [...lacFacilities].sort((a, b) => {
    const pref = { hospital: 0, health_center: 1, health_post: 2, health_house: 3 } as const;
    return pref[a.type] - pref[b.type];
  });

  // Distribution: 12 4x4 / 4 motorbike / 2 pirogue
  const vehicles: VehicleType[] = [
    ...Array(12).fill('4x4'),
    ...Array(4).fill('motorbike'),
    ...Array(2).fill('pirogue'),
  ] as VehicleType[];
  // Distribution statuts: 8 av, 6 om, 2 rest, 1 train, 1 unav
  const statuses: TeamStatus[] = [
    ...Array(8).fill('available'),
    ...Array(6).fill('on_mission'),
    ...Array(2).fill('resting'),
    'training', 'unavailable',
  ] as TeamStatus[];

  const teams: Team[] = [];
  for (let i = 0; i < 18; i++) {
    const facility = sorted[i % sorted.length];
    const id = `team-lac-${String(i + 1).padStart(2, '0')}`;
    const vehicleType = vehicles[i];
    const status = statuses[i];
    const cantonShort = facility.cantonId.split('-').slice(-1)[0]
      .replace(/(^|-)\w/g, (m) => m.toUpperCase());
    const letter = String.fromCharCode(65 + (i % 26));
    const code = `EM-${cantonShort.slice(0, 4).toUpperCase()}-${letter}`;
    const name = `Équipe Mobile ${cantonShort}-${letter}`;
    const size = rng.int(3, 6);
    const certifiedRatio = 0.9 + rng.next() * 0.1;
    const { members, leaderId } = buildMembers(id, rng, size, certifiedRatio);
    const onMission = status === 'on_mission';
    const startedAgoH = rng.int(4, 36);
    const now = Date.now();

    teams.push({
      id,
      name,
      code,
      homeFacilityId: facility.id,
      responsibleDistrict: facility.departmentId,
      members,
      membersCount: members.length,
      teamLeaderId: leaderId,
      vehicleType,
      vehicleId: vehicleType === 'foot' ? null : VEHICLE_PLATES[i],
      vehicleLabel: rng.pick(VEHICLE_MODELS[vehicleType]),
      equipment: buildEquipment(rng, vehicleType),
      status,
      currentMissionId: onMission ? `mis-${i + 1}` : null,
      currentMissionName: onMission ? rng.pick(MISSION_NAMES) : null,
      currentMissionStartedAt: onMission ? new Date(now - startedAgoH * 3600_000) : null,
      nextMissionStart: status === 'available'
        ? new Date(now + rng.int(2, 21) * 86400_000)
        : status === 'on_mission'
          ? null
          : new Date(now + rng.int(7, 30) * 86400_000),
      totalMissionsCompleted: rng.int(8, 60),
      totalVillagesCovered: rng.int(35, 220),
      totalChildrenVaccinated: rng.int(400, 2400),
      averageRating: Math.round((3.5 + rng.next() * 1.5) * 10) / 10,
      primaryInterventionZone: {
        cantons: [facility.cantonId],
        villagesCount: rng.int(15, 60),
      },
      weeklySchedule: buildSchedule(rng),
      createdAt: new Date(2023, rng.int(0, 11), rng.int(1, 28)),
      updatedAt: new Date(now - rng.int(1, 60) * 86400_000),
    });
  }

  cache = teams;
  return teams;
}

export function getTeams(): Team[] {
  return generate();
}

export function getTeam(id: string): Team | undefined {
  return generate().find((t) => t.id === id);
}

export function getTeamsForFacility(facilityId: string): Team[] {
  return generate().filter((t) => t.homeFacilityId === facilityId);
}

export function teamMemberInitials(name: string): string {
  return initialsFor(name);
}
