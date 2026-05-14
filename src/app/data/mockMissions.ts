const NOW = Date.now();
const DAY = 86_400_000;
const H = 3_600_000;

export type MissionStatus = 'planned' | 'in_progress' | 'completed' | 'issue' | 'interrupted';

export type TeamPosition = {
  teamId: string;
  lat: number;
  lng: number;
  timestamp: Date;
  speed: number;
  heading: number;
  accuracy: number;
  signalStrength: 'good' | 'weak' | 'lost';
};

export type FieldReport = {
  id: string;
  missionId: string;
  teamId: string;
  villageId: string;
  villageName: string;
  reportedAt: Date;
  reportedBy: string;
  type: 'arrival' | 'departure' | 'issue' | 'completion' | 'nomad_contact';
  vaccinations?: {
    antigen: string;
    dosesGiven: number;
    dosesWasted: number;
    children: number;
  }[];
  issue?: {
    type: 'road_blocked' | 'team_sick' | 'cold_chain' | 'security' | 'community_refusal' | 'other';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    actionTaken?: string;
  };
  nomadContact?: {
    groupType: 'seasonal_nomad' | 'displaced' | 'refugee';
    estimatedPopulation: number;
    estimatedChildren: number;
    location: { lat: number; lng: number; description: string };
    windowAvailable: string;
    notes: string;
    opportunityCreated: boolean;
    opportunityId?: string;
  };
  geofenceCompliant: boolean;
};

export type Mission = {
  id: string;
  microPlanId: string;
  teamId: string;
  teamName: string;
  status: MissionStatus;
  startDate: Date;
  endDate: Date;
  planned: {
    villages: { id: string; name: string; targetChildren: number; plannedArrival: string }[];
    totalDays: number;
    targetChildren: number;
    distanceKm: number;
  };
  actual: {
    villagesVisited: string[];
    villagesSkipped: { villageId: string; villageName: string; reason: string }[];
    childrenVaccinated: number;
    distanceKm: number;
    daysCompleted: number;
  };
  conformanceScore: number;
  routePositions: TeamPosition[];
  currentPositionIndex: number;
  fieldReports: FieldReport[];
  geofenceAlerts: {
    id: string;
    triggeredAt: Date;
    teamId: string;
    expectedZone: string;
    actualPosition: { lat: number; lng: number };
    resolved: boolean;
    resolvedAt?: Date;
    resolvedBy?: string;
    resolution?: string;
  }[];
};

// ─── GPS route generators ──────────────────────────────────────────────────────

function buildRoute(
  teamId: string,
  startLat: number,
  startLng: number,
  count: number,
  signal: 'good' | 'weak' | 'lost' = 'good',
): TeamPosition[] {
  const positions: TeamPosition[] = [];
  let lat = startLat;
  let lng = startLng;
  for (let i = 0; i < count; i++) {
    lat += (Math.random() - 0.48) * 0.015;
    lng += (Math.random() - 0.45) * 0.018;
    const sig: TeamPosition['signalStrength'] =
      i > count - 4 ? signal : i > count / 2 ? 'good' : 'good';
    positions.push({
      teamId,
      lat: parseFloat(lat.toFixed(5)),
      lng: parseFloat(lng.toFixed(5)),
      timestamp: new Date(NOW - (count - i) * 8 * 60_000),
      speed: Math.round(20 + Math.random() * 40),
      heading: Math.round(Math.random() * 360),
      accuracy: Math.round(3 + Math.random() * 12),
      signalStrength: sig,
    });
  }
  return positions;
}

// ─── Shared field reports helpers ─────────────────────────────────────────────

const vacc = (antigen: string, given: number, wasted = 0, children?: number) => ({
  antigen, dosesGiven: given, dosesWasted: wasted, children: children ?? Math.round(given * 0.9),
});

// ─── Missions data ─────────────────────────────────────────────────────────────

export const mockMissions: Mission[] = [

  // ── 1. in_progress — avec nomad_contact non documenté ──────────────────────
  {
    id: 'msn-001',
    microPlanId: 'plan-007',
    teamId: 'team-lac-01',
    teamName: 'Équipe Mobile Bol-A',
    status: 'in_progress',
    startDate: new Date(NOW - 2 * DAY),
    endDate: new Date(NOW + 5 * DAY),
    planned: {
      villages: [
        { id: 'v-bol-01', name: 'Karal', targetChildren: 45, plannedArrival: '08:00' },
        { id: 'v-bol-02', name: 'Ngueli', targetChildren: 38, plannedArrival: '10:00' },
        { id: 'v-bol-03', name: 'Tchitchiga', targetChildren: 29, plannedArrival: '12:00' },
        { id: 'v-bol-04', name: 'Madirom', targetChildren: 52, plannedArrival: '14:00' },
        { id: 'v-bol-05', name: 'Koundoul', targetChildren: 41, plannedArrival: '08:00' },
        { id: 'v-bol-06', name: 'Nguigmi', targetChildren: 33, plannedArrival: '10:30' },
        { id: 'v-bol-07', name: 'Liwa-Est', targetChildren: 28, plannedArrival: '13:00' },
      ],
      totalDays: 7,
      targetChildren: 266,
      distanceKm: 148,
    },
    actual: {
      villagesVisited: ['v-bol-01', 'v-bol-02', 'v-bol-03'],
      villagesSkipped: [],
      childrenVaccinated: 98,
      distanceKm: 52,
      daysCompleted: 1,
    },
    conformanceScore: 87,
    currentPositionIndex: 14,
    routePositions: buildRoute('team-lac-01', 13.462, 14.718, 25, 'good'),
    fieldReports: [
      {
        id: 'fr-001-1', missionId: 'msn-001', teamId: 'team-lac-01',
        villageId: 'v-bol-01', villageName: 'Karal',
        reportedAt: new Date(NOW - 2 * DAY + 8 * H),
        reportedBy: 'Hassan Abdoulaye', type: 'arrival',
        vaccinations: [vacc('DTC', 41, 1)],
        geofenceCompliant: true,
      },
      {
        id: 'fr-001-2', missionId: 'msn-001', teamId: 'team-lac-01',
        villageId: 'v-bol-02', villageName: 'Ngueli',
        reportedAt: new Date(NOW - 2 * DAY + 10 * H),
        reportedBy: 'Hassan Abdoulaye', type: 'completion',
        vaccinations: [vacc('DTC', 35, 0, 35)],
        geofenceCompliant: true,
      },
      {
        id: 'fr-001-3', missionId: 'msn-001', teamId: 'team-lac-01',
        villageId: 'v-bol-03', villageName: 'Tchitchiga',
        reportedAt: new Date(NOW - DAY + 9 * H),
        reportedBy: 'Hassan Abdoulaye', type: 'nomad_contact',
        geofenceCompliant: true,
        nomadContact: {
          groupType: 'seasonal_nomad',
          estimatedPopulation: 280,
          estimatedChildren: 56,
          location: { lat: 13.49, lng: 14.65, description: '12 km au nord de Tchitchiga, rive est' },
          windowAvailable: 'J+2 à J+8',
          notes: "Groupe de bergers Buduma en transit. Femmes et enfants présents. Accessible tôt le matin.",
          opportunityCreated: false,
        },
      },
    ],
    geofenceAlerts: [
      {
        id: 'geo-001-1', triggeredAt: new Date(NOW - DAY + 11 * H),
        teamId: 'team-lac-01', expectedZone: 'Zone Bol-Nord',
        actualPosition: { lat: 13.51, lng: 14.78 },
        resolved: true, resolvedAt: new Date(NOW - DAY + 11.5 * H),
        resolvedBy: 'Hassan Abdoulaye', resolution: 'Détour route inondée',
      },
    ],
  },

  // ── 2. in_progress — signal faible ─────────────────────────────────────────
  {
    id: 'msn-002',
    microPlanId: 'plan-006',
    teamId: 'team-lac-02',
    teamName: 'Équipe Mobile Baga-B',
    status: 'in_progress',
    startDate: new Date(NOW - 1 * DAY),
    endDate: new Date(NOW + 4 * DAY),
    planned: {
      villages: [
        { id: 'v-baga-01', name: 'Doum', targetChildren: 48, plannedArrival: '07:45' },
        { id: 'v-baga-02', name: 'Kouro', targetChildren: 33, plannedArrival: '10:00' },
        { id: 'v-baga-03', name: 'Gama', targetChildren: 27, plannedArrival: '12:30' },
        { id: 'v-baga-04', name: 'Tataverom', targetChildren: 61, plannedArrival: '07:30' },
        { id: 'v-baga-05', name: 'Koundjourou', targetChildren: 39, plannedArrival: '11:00' },
        { id: 'v-baga-06', name: 'Daboua', targetChildren: 44, plannedArrival: '14:00' },
      ],
      totalDays: 5,
      targetChildren: 252,
      distanceKm: 123,
    },
    actual: {
      villagesVisited: ['v-baga-01', 'v-baga-02'],
      villagesSkipped: [{ villageId: 'v-baga-03', villageName: 'Gama', reason: 'Route coupée — inondation' }],
      childrenVaccinated: 74,
      distanceKm: 38,
      daysCompleted: 1,
    },
    conformanceScore: 72,
    currentPositionIndex: 10,
    routePositions: buildRoute('team-lac-02', 13.622, 14.283, 22, 'weak'),
    fieldReports: [
      {
        id: 'fr-002-1', missionId: 'msn-002', teamId: 'team-lac-02',
        villageId: 'v-baga-01', villageName: 'Doum',
        reportedAt: new Date(NOW - DAY + 8 * H),
        reportedBy: 'Fatimé Brahim', type: 'completion',
        vaccinations: [vacc('Rotavirus', 44, 2), vacc('DTC', 44, 0)],
        geofenceCompliant: true,
      },
      {
        id: 'fr-002-2', missionId: 'msn-002', teamId: 'team-lac-02',
        villageId: 'v-baga-03', villageName: 'Gama',
        reportedAt: new Date(NOW - DAY + 10 * H),
        reportedBy: 'Fatimé Brahim', type: 'issue',
        geofenceCompliant: false,
        issue: {
          type: 'road_blocked',
          description: "Route principale inondée sur 3 km. Impossibilité de traverser avec le véhicule.",
          severity: 'medium',
          actionTaken: 'Retour au village précédent, mise en attente.',
        },
      },
      {
        id: 'fr-002-3', missionId: 'msn-002', teamId: 'team-lac-02',
        villageId: 'v-baga-04', villageName: 'Tataverom',
        reportedAt: new Date(NOW - 6 * H),
        reportedBy: 'Fatimé Brahim', type: 'nomad_contact',
        geofenceCompliant: true,
        nomadContact: {
          groupType: 'displaced',
          estimatedPopulation: 450,
          estimatedChildren: 90,
          location: { lat: 13.64, lng: 14.31, description: 'Camp informel au bord de la route, 5 km est de Tataverom' },
          windowAvailable: 'J+1 à J+10',
          notes: "Familles déplacées suite aux inondations. Pas de soins depuis 3 semaines.",
          opportunityCreated: false,
        },
      },
    ],
    geofenceAlerts: [
      {
        id: 'geo-002-1', triggeredAt: new Date(NOW - DAY + 10.5 * H),
        teamId: 'team-lac-02', expectedZone: 'Zone Baga-Sola',
        actualPosition: { lat: 13.65, lng: 14.21 },
        resolved: false,
      },
    ],
  },

  // ── 3. in_progress — conforme ───────────────────────────────────────────────
  {
    id: 'msn-003',
    microPlanId: 'plan-003',
    teamId: 'team-lac-05',
    teamName: "Équipe Mobile Karal-E",
    status: 'in_progress',
    startDate: new Date(NOW - 3 * DAY),
    endDate: new Date(NOW + 2 * DAY),
    planned: {
      villages: [
        { id: 'v-kar-01', name: 'Bol-Centre', targetChildren: 55, plannedArrival: '08:00' },
        { id: 'v-kar-02', name: 'Ngouri', targetChildren: 42, plannedArrival: '10:30' },
        { id: 'v-kar-03', name: 'Kindji', targetChildren: 38, plannedArrival: '13:00' },
        { id: 'v-kar-04', name: 'Selem', targetChildren: 30, plannedArrival: '08:00' },
        { id: 'v-kar-05', name: 'Matafo', targetChildren: 47, plannedArrival: '11:00' },
      ],
      totalDays: 5,
      targetChildren: 212,
      distanceKm: 98,
    },
    actual: {
      villagesVisited: ['v-kar-01', 'v-kar-02', 'v-kar-03', 'v-kar-04'],
      villagesSkipped: [],
      childrenVaccinated: 158,
      distanceKm: 78,
      daysCompleted: 3,
    },
    conformanceScore: 94,
    currentPositionIndex: 18,
    routePositions: buildRoute('team-lac-05', 13.395, 14.695, 24, 'good'),
    fieldReports: [
      {
        id: 'fr-003-1', missionId: 'msn-003', teamId: 'team-lac-05',
        villageId: 'v-kar-01', villageName: 'Bol-Centre',
        reportedAt: new Date(NOW - 3 * DAY + 9 * H),
        reportedBy: 'Mahamat Tidjani', type: 'completion',
        vaccinations: [vacc('BCG', 50, 1, 50), vacc('DTC', 50, 0, 50)],
        geofenceCompliant: true,
      },
      {
        id: 'fr-003-2', missionId: 'msn-003', teamId: 'team-lac-05',
        villageId: 'v-kar-02', villageName: 'Ngouri',
        reportedAt: new Date(NOW - 2 * DAY + 11 * H),
        reportedBy: 'Mahamat Tidjani', type: 'completion',
        vaccinations: [vacc('BCG', 40, 0, 40)],
        geofenceCompliant: true,
      },
    ],
    geofenceAlerts: [],
  },

  // ── 4. in_progress — signal perdu par moments ───────────────────────────────
  {
    id: 'msn-004',
    microPlanId: 'plan-004',
    teamId: 'team-lac-07',
    teamName: 'Équipe Mobile Massenya-G',
    status: 'in_progress',
    startDate: new Date(NOW - 2 * DAY),
    endDate: new Date(NOW + 3 * DAY),
    planned: {
      villages: [
        { id: 'v-mas-01', name: 'Massenya-Nord', targetChildren: 62, plannedArrival: '08:00' },
        { id: 'v-mas-02', name: 'Korbol', targetChildren: 38, plannedArrival: '10:00' },
        { id: 'v-mas-03', name: 'Bousso-Est', targetChildren: 45, plannedArrival: '13:00' },
        { id: 'v-mas-04', name: 'Mangalmé', targetChildren: 54, plannedArrival: '08:30' },
        { id: 'v-mas-05', name: 'Niellim', targetChildren: 40, plannedArrival: '11:30' },
      ],
      totalDays: 5,
      targetChildren: 239,
      distanceKm: 112,
    },
    actual: {
      villagesVisited: ['v-mas-01', 'v-mas-02'],
      villagesSkipped: [],
      childrenVaccinated: 87,
      distanceKm: 45,
      daysCompleted: 2,
    },
    conformanceScore: 78,
    currentPositionIndex: 8,
    routePositions: buildRoute('team-lac-07', 12.381, 15.037, 20, 'lost'),
    fieldReports: [
      {
        id: 'fr-004-1', missionId: 'msn-004', teamId: 'team-lac-07',
        villageId: 'v-mas-01', villageName: 'Massenya-Nord',
        reportedAt: new Date(NOW - 2 * DAY + 9 * H),
        reportedBy: 'Idriss Bichara', type: 'completion',
        vaccinations: [vacc('Rougeole', 58, 2, 58)],
        geofenceCompliant: true,
      },
    ],
    geofenceAlerts: [
      {
        id: 'geo-004-1', triggeredAt: new Date(NOW - DAY + 14 * H),
        teamId: 'team-lac-07', expectedZone: 'Zone Massenya',
        actualPosition: { lat: 12.40, lng: 15.11 },
        resolved: false,
      },
    ],
  },

  // ── 5. completed — score 95% ────────────────────────────────────────────────
  {
    id: 'msn-005',
    microPlanId: 'plan-008',
    teamId: 'team-lac-04',
    teamName: "Équipe Mobile Baga-D",
    status: 'completed',
    startDate: new Date(NOW - 8 * DAY),
    endDate: new Date(NOW - 2 * DAY),
    planned: {
      villages: [
        { id: 'v-baga-06', name: 'Baga-Nord', targetChildren: 60, plannedArrival: '08:00' },
        { id: 'v-baga-07', name: 'Baga-Sud', targetChildren: 45, plannedArrival: '11:00' },
        { id: 'v-baga-08', name: 'Kouri', targetChildren: 38, plannedArrival: '14:00' },
        { id: 'v-baga-09', name: 'Mangaré', targetChildren: 55, plannedArrival: '08:30' },
      ],
      totalDays: 6, targetChildren: 198, distanceKm: 87,
    },
    actual: {
      villagesVisited: ['v-baga-06', 'v-baga-07', 'v-baga-08', 'v-baga-09'],
      villagesSkipped: [],
      childrenVaccinated: 189,
      distanceKm: 89,
      daysCompleted: 6,
    },
    conformanceScore: 95,
    currentPositionIndex: 24,
    routePositions: buildRoute('team-lac-04', 13.62, 14.28, 24),
    fieldReports: [
      {
        id: 'fr-005-1', missionId: 'msn-005', teamId: 'team-lac-04',
        villageId: 'v-baga-09', villageName: 'Mangaré',
        reportedAt: new Date(NOW - 2 * DAY + 16 * H),
        reportedBy: 'Zara Adoum', type: 'completion',
        vaccinations: [vacc('VPO', 53, 1, 53), vacc('DTC', 53, 0, 53)],
        geofenceCompliant: true,
      },
    ],
    geofenceAlerts: [],
  },

  // ── 6. completed — score 89% ────────────────────────────────────────────────
  {
    id: 'msn-006',
    microPlanId: 'plan-006',
    teamId: 'team-lac-09',
    teamName: 'Équipe Mobile Kanem-I',
    status: 'completed',
    startDate: new Date(NOW - 10 * DAY),
    endDate: new Date(NOW - 4 * DAY),
    planned: {
      villages: [
        { id: 'v-mao-04', name: 'Mao-Centre', targetChildren: 72, plannedArrival: '08:00' },
        { id: 'v-mao-05', name: 'Nokou', targetChildren: 48, plannedArrival: '11:00' },
        { id: 'v-mao-06', name: 'Chedra', targetChildren: 35, plannedArrival: '14:00' },
        { id: 'v-mao-07', name: 'Bir Alali', targetChildren: 41, plannedArrival: '08:00' },
        { id: 'v-mao-08', name: 'Moussoro', targetChildren: 58, plannedArrival: '11:30' },
      ],
      totalDays: 6, targetChildren: 254, distanceKm: 132,
    },
    actual: {
      villagesVisited: ['v-mao-04', 'v-mao-05', 'v-mao-06', 'v-mao-08'],
      villagesSkipped: [{ villageId: 'v-mao-07', villageName: 'Bir Alali', reason: 'Refus communautaire' }],
      childrenVaccinated: 218,
      distanceKm: 115,
      daysCompleted: 6,
    },
    conformanceScore: 89,
    currentPositionIndex: 22,
    routePositions: buildRoute('team-lac-09', 14.12, 15.31, 22),
    fieldReports: [
      {
        id: 'fr-006-1', missionId: 'msn-006', teamId: 'team-lac-09',
        villageId: 'v-mao-07', villageName: 'Bir Alali',
        reportedAt: new Date(NOW - 6 * DAY + 9 * H),
        reportedBy: 'Ousmane Djimet', type: 'issue',
        geofenceCompliant: true,
        issue: {
          type: 'community_refusal',
          description: "Chef de village refuse l'accès suite à rumeur sur effets secondaires.",
          severity: 'medium',
          actionTaken: "Médiation communautaire tentée — échec. Signalement au GP.",
        },
      },
    ],
    geofenceAlerts: [],
  },

  // ── 7. completed — score 72% ────────────────────────────────────────────────
  {
    id: 'msn-007',
    microPlanId: 'plan-005',
    teamId: 'team-lac-08',
    teamName: 'Équipe Mobile Bol-H',
    status: 'completed',
    startDate: new Date(NOW - 12 * DAY),
    endDate: new Date(NOW - 6 * DAY),
    planned: {
      villages: [
        { id: 'v-bol-10', name: 'Bol-Plage', targetChildren: 50, plannedArrival: '08:00' },
        { id: 'v-bol-11', name: 'Kiskira', targetChildren: 35, plannedArrival: '10:30' },
        { id: 'v-bol-12', name: 'Darak', targetChildren: 42, plannedArrival: '13:30' },
        { id: 'v-bol-13', name: 'Ngelewa', targetChildren: 28, plannedArrival: '08:30' },
        { id: 'v-bol-14', name: 'Bagassola', targetChildren: 65, plannedArrival: '11:00' },
      ],
      totalDays: 6, targetChildren: 220, distanceKm: 105,
    },
    actual: {
      villagesVisited: ['v-bol-10', 'v-bol-11', 'v-bol-12'],
      villagesSkipped: [
        { villageId: 'v-bol-13', villageName: 'Ngelewa', reason: 'Inondation zone' },
        { villageId: 'v-bol-14', villageName: 'Bagassola', reason: "Manque de temps J3" },
      ],
      childrenVaccinated: 118,
      distanceKm: 72,
      daysCompleted: 6,
    },
    conformanceScore: 72,
    currentPositionIndex: 20,
    routePositions: buildRoute('team-lac-08', 13.46, 14.72, 20),
    fieldReports: [],
    geofenceAlerts: [],
  },

  // ── 8. completed — score 55% ────────────────────────────────────────────────
  {
    id: 'msn-008',
    microPlanId: 'plan-002',
    teamId: 'team-lac-03',
    teamName: 'Équipe Mobile Kanem-C',
    status: 'completed',
    startDate: new Date(NOW - 20 * DAY),
    endDate: new Date(NOW - 14 * DAY),
    planned: {
      villages: [
        { id: 'v-mao-01', name: 'Mao-Nord', targetChildren: 80, plannedArrival: '07:30' },
        { id: 'v-mao-02', name: 'Salal', targetChildren: 55, plannedArrival: '10:00' },
        { id: 'v-mao-03', name: 'Mondo', targetChildren: 45, plannedArrival: '13:00' },
      ],
      totalDays: 5, targetChildren: 180, distanceKm: 93,
    },
    actual: {
      villagesVisited: ['v-mao-01'],
      villagesSkipped: [
        { villageId: 'v-mao-02', villageName: 'Salal', reason: 'Équipe malade J2' },
        { villageId: 'v-mao-03', villageName: 'Mondo', reason: 'Mission interrompue' },
      ],
      childrenVaccinated: 67,
      distanceKm: 28,
      daysCompleted: 3,
    },
    conformanceScore: 55,
    currentPositionIndex: 15,
    routePositions: buildRoute('team-lac-03', 14.09, 15.22, 15),
    fieldReports: [
      {
        id: 'fr-008-1', missionId: 'msn-008', teamId: 'team-lac-03',
        villageId: 'v-mao-02', villageName: 'Salal',
        reportedAt: new Date(NOW - 18 * DAY + 8 * H),
        reportedBy: 'Khadidja Nadjingar', type: 'issue',
        geofenceCompliant: true,
        issue: {
          type: 'team_sick',
          description: "2 membres de l'équipe présentent des symptômes de paludisme. Retour au CS.",
          severity: 'high',
          actionTaken: 'Retour au CS de Mao pour consultation médicale.',
        },
      },
    ],
    geofenceAlerts: [],
  },

  // ── 9. issue — critique non résolu ─────────────────────────────────────────
  {
    id: 'msn-009',
    microPlanId: 'plan-001',
    teamId: 'team-lac-06',
    teamName: 'Équipe Mobile Massenya-F',
    status: 'issue',
    startDate: new Date(NOW - 1 * DAY),
    endDate: new Date(NOW + 4 * DAY),
    planned: {
      villages: [
        { id: 'v-bol-15', name: 'Bol-Marché', targetChildren: 70, plannedArrival: '08:00' },
        { id: 'v-bol-16', name: 'Bol-Plage-Nord', targetChildren: 45, plannedArrival: '11:00' },
        { id: 'v-bol-17', name: 'Bol-Haï-Arabe', targetChildren: 38, plannedArrival: '14:00' },
      ],
      totalDays: 5, targetChildren: 153, distanceKm: 78,
    },
    actual: {
      villagesVisited: ['v-bol-15'],
      villagesSkipped: [],
      childrenVaccinated: 52,
      distanceKm: 12,
      daysCompleted: 1,
    },
    conformanceScore: 60,
    currentPositionIndex: 5,
    routePositions: buildRoute('team-lac-06', 13.462, 14.72, 18),
    fieldReports: [
      {
        id: 'fr-009-1', missionId: 'msn-009', teamId: 'team-lac-06',
        villageId: 'v-bol-16', villageName: 'Bol-Plage-Nord',
        reportedAt: new Date(NOW - 4 * H),
        reportedBy: 'Saleh Ali', type: 'issue',
        geofenceCompliant: false,
        issue: {
          type: 'security',
          description: "Incident sécuritaire signalé sur la route de Bol-Plage-Nord. Véhicule intercepté par groupe armé non identifié. Équipe saine et sauve mais immobilisée.",
          severity: 'critical',
        },
      },
    ],
    geofenceAlerts: [
      {
        id: 'geo-009-1', triggeredAt: new Date(NOW - 4 * H),
        teamId: 'team-lac-06', expectedZone: 'Zone Bol',
        actualPosition: { lat: 13.48, lng: 14.75 },
        resolved: false,
      },
    ],
  },

  // ── 10. issue — chaîne du froid critique ───────────────────────────────────
  {
    id: 'msn-010',
    microPlanId: 'plan-003',
    teamId: 'team-lac-10',
    teamName: 'Équipe Mobile Kanem-J',
    status: 'issue',
    startDate: new Date(NOW - 2 * DAY),
    endDate: new Date(NOW + 3 * DAY),
    planned: {
      villages: [
        { id: 'v-kanem-01', name: 'Ngoura', targetChildren: 65, plannedArrival: '08:00' },
        { id: 'v-kanem-02', name: 'Liwa-Nord', targetChildren: 50, plannedArrival: '11:00' },
        { id: 'v-kanem-03', name: 'Raga', targetChildren: 42, plannedArrival: '14:00' },
      ],
      totalDays: 5, targetChildren: 157, distanceKm: 88,
    },
    actual: {
      villagesVisited: ['v-kanem-01'],
      villagesSkipped: [],
      childrenVaccinated: 48,
      distanceKm: 22,
      daysCompleted: 1,
    },
    conformanceScore: 62,
    currentPositionIndex: 6,
    routePositions: buildRoute('team-lac-10', 14.15, 15.32, 18),
    fieldReports: [
      {
        id: 'fr-010-1', missionId: 'msn-010', teamId: 'team-lac-10',
        villageId: 'v-kanem-02', villageName: 'Liwa-Nord',
        reportedAt: new Date(NOW - DAY + 11 * H),
        reportedBy: 'Moussa Bichara', type: 'issue',
        geofenceCompliant: true,
        issue: {
          type: 'cold_chain',
          description: "Porte-vaccins défectueuse — température montée à +12°C. Vaccins BCG et Rotavirus compromis. 180 doses potentiellement inutilisables.",
          severity: 'critical',
        },
      },
    ],
    geofenceAlerts: [],
  },

  // ── 11. planned ─────────────────────────────────────────────────────────────
  {
    id: 'msn-011',
    microPlanId: 'plan-006',
    teamId: 'team-lac-11',
    teamName: 'Équipe Mobile Kanem-K',
    status: 'planned',
    startDate: new Date(NOW + 2 * DAY),
    endDate: new Date(NOW + 7 * DAY),
    planned: {
      villages: [
        { id: 'v-kanem-04', name: 'Kelo', targetChildren: 58, plannedArrival: '08:00' },
        { id: 'v-kanem-05', name: 'Linia', targetChildren: 44, plannedArrival: '11:00' },
        { id: 'v-kanem-06', name: 'Tine', targetChildren: 36, plannedArrival: '14:00' },
      ],
      totalDays: 5, targetChildren: 138, distanceKm: 72,
    },
    actual: {
      villagesVisited: [], villagesSkipped: [], childrenVaccinated: 0, distanceKm: 0, daysCompleted: 0,
    },
    conformanceScore: 0,
    currentPositionIndex: 0,
    routePositions: [],
    fieldReports: [],
    geofenceAlerts: [],
  },

  // ── 12. planned ─────────────────────────────────────────────────────────────
  {
    id: 'msn-012',
    microPlanId: 'plan-004',
    teamId: 'team-lac-12',
    teamName: 'Équipe Mobile Hadjer-L',
    status: 'planned',
    startDate: new Date(NOW + 1 * DAY),
    endDate: new Date(NOW + 6 * DAY),
    planned: {
      villages: [
        { id: 'v-hadj-01', name: 'Massenya-Centre', targetChildren: 72, plannedArrival: '08:00' },
        { id: 'v-hadj-02', name: 'Bousso-Nord', targetChildren: 54, plannedArrival: '11:00' },
        { id: 'v-hadj-03', name: 'Melfi', targetChildren: 41, plannedArrival: '14:00' },
      ],
      totalDays: 5, targetChildren: 167, distanceKm: 95,
    },
    actual: {
      villagesVisited: [], villagesSkipped: [], childrenVaccinated: 0, distanceKm: 0, daysCompleted: 0,
    },
    conformanceScore: 0,
    currentPositionIndex: 0,
    routePositions: [],
    fieldReports: [],
    geofenceAlerts: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getMissionById(id: string): Mission | undefined {
  return mockMissions.find((m) => m.id === id);
}

export const MISSION_STATUS_LABEL: Record<MissionStatus, string> = {
  planned: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  issue: 'Incident',
  interrupted: 'Interrompue',
};

export const MISSION_STATUS_COLOR: Record<MissionStatus, string> = {
  planned: 'bg-stone-100 text-stone-600',
  in_progress: 'bg-primary/10 text-primary-700',
  completed: 'bg-success/10 text-success-700',
  issue: 'bg-danger/10 text-danger-700',
  interrupted: 'bg-warning/10 text-warning-700',
};
