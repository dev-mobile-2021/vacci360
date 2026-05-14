const NOW = Date.now();
const DAY = 86_400_000;

export type MicroPlanStatus =
  | 'draft' | 'generated' | 'adjusted' | 'submitted'
  | 'validated' | 'rejected' | 'in_execution' | 'closed';

export type DayItinerary = {
  day: number;
  date: Date;
  teamId: string;
  facilityStart: string;
  villages: {
    villageId: string;
    villageName: string;
    order: number;
    estimatedArrival: string;
    estimatedDuration: number;
    targetChildren: number;
    distanceFromPrev: number;
    nomadOpportunityId?: string;
  }[];
  totalDistanceKm: number;
  totalDurationMin: number;
  fuelEstimatedLiters: number;
  hasNomadStop: boolean;
};

export type ResourceConflict = {
  type: 'team' | 'stock';
  resourceId: string;
  conflictingPlanId: string;
  conflictingPlanName: string;
  detectedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
};

export type PlanVersion = {
  versionNumber: number;
  createdAt: Date;
  createdBy: string;
  label: string;
  itineraries: DayItinerary[];
  changes?: string[];
};

export type UrgentAdjustment = {
  id: string;
  triggeredAt: Date;
  triggeredBy: string;
  reason: string;
  affectedTeamId: string;
  villagesReassigned: string[];
  toTeamId?: string;
  status: 'pending' | 'applied' | 'rejected';
};

export type MicroPlan = {
  id: string;
  name: string;
  campaignId: string;
  provinceId: string;
  districtId?: string;
  createdBy: string;
  status: MicroPlanStatus;

  generationParams: {
    targetVillages: string[];
    availableTeams: string[];
    startDate: Date;
    endDate: Date;
    antigens: string[];
    includeNomadOpportunities: boolean;
    nomadOpportunitiesIncluded: string[];
  };

  versions: PlanVersion[];
  activeVersionIndex: number;

  systemProposal: {
    generatedAt: Date;
    totalDays: number;
    totalVillages: number;
    nomadStopsCount: number;
    estimatedCoverage: number;
    estimatedCost: number;
    estimatedFuelLiters: number;
    score: { coverage: number; cost: number; feasibility: number };
  };

  resourceConflicts: ResourceConflict[];

  submittedAt?: Date;
  submittedBy?: string;
  validatedAt?: Date;
  validatedBy?: string;
  rejectedAt?: Date;
  rejectedReason?: string;

  executionStartDate?: Date;
  executionProgress?: {
    villagesVisited: number;
    villagesTotal: number;
    childrenVaccinated: number;
    daysCompleted: number;
    urgentAdjustments: UrgentAdjustment[];
  };
};

// ─── Shared itinerary stubs ────────────────────────────────────────────────────

const itinerary_t01_d1: DayItinerary = {
  day: 1, date: new Date(NOW + 2 * DAY), teamId: 'team-lac-01',
  facilityStart: 'CS Bol',
  villages: [
    { villageId: 'v-bol-01', villageName: 'Karal', order: 1, estimatedArrival: '08:00', estimatedDuration: 90, targetChildren: 45, distanceFromPrev: 0 },
    { villageId: 'v-bol-02', villageName: 'Ngueli', order: 2, estimatedArrival: '09:45', estimatedDuration: 75, targetChildren: 38, distanceFromPrev: 8 },
    { villageId: 'v-bol-03', villageName: 'Tchitchiga', order: 3, estimatedArrival: '11:30', estimatedDuration: 60, targetChildren: 29, distanceFromPrev: 12 },
  ],
  totalDistanceKm: 35, totalDurationMin: 420, fuelEstimatedLiters: 18, hasNomadStop: false,
};

const itinerary_t01_d2: DayItinerary = {
  day: 2, date: new Date(NOW + 3 * DAY), teamId: 'team-lac-01',
  facilityStart: 'CS Bol',
  villages: [
    { villageId: 'v-bol-04', villageName: 'Madirom', order: 1, estimatedArrival: '07:45', estimatedDuration: 80, targetChildren: 52, distanceFromPrev: 0 },
    { villageId: 'v-bol-05', villageName: 'Koundoul', order: 2, estimatedArrival: '09:30', estimatedDuration: 70, targetChildren: 41, distanceFromPrev: 11 },
    { villageId: 'v-nomad-1', villageName: 'Zone nomade Ouest-Lac', order: 3, estimatedArrival: '11:15', estimatedDuration: 50, targetChildren: 30, distanceFromPrev: 6, nomadOpportunityId: 'nopp-001' },
  ],
  totalDistanceKm: 42, totalDurationMin: 450, fuelEstimatedLiters: 22, hasNomadStop: true,
};

const itinerary_t02_d1: DayItinerary = {
  day: 1, date: new Date(NOW + 2 * DAY), teamId: 'team-lac-02',
  facilityStart: 'CS Baga Sola',
  villages: [
    { villageId: 'v-baga-01', villageName: 'Doum', order: 1, estimatedArrival: '08:15', estimatedDuration: 85, targetChildren: 48, distanceFromPrev: 0 },
    { villageId: 'v-baga-02', villageName: 'Kouro', order: 2, estimatedArrival: '10:05', estimatedDuration: 65, targetChildren: 33, distanceFromPrev: 9 },
    { villageId: 'v-baga-03', villageName: 'Gama', order: 3, estimatedArrival: '11:30', estimatedDuration: 60, targetChildren: 27, distanceFromPrev: 7 },
  ],
  totalDistanceKm: 38, totalDurationMin: 390, fuelEstimatedLiters: 19, hasNomadStop: false,
};

// ─── Plans ─────────────────────────────────────────────────────────────────────

export const mockMicroPlans: MicroPlan[] = [

  // 1. Draft
  {
    id: 'plan-001',
    name: 'Micro-plan BCG — Bol Nord',
    campaignId: 'camp-001',
    provinceId: 'td-lac',
    districtId: 'td-lac-bol',
    createdBy: 'Dr. Aïcha Mahamat',
    status: 'draft',
    generationParams: {
      targetVillages: ['v-bol-01', 'v-bol-02', 'v-bol-03', 'v-bol-04'],
      availableTeams: ['team-lac-01'],
      startDate: new Date(NOW + 5 * DAY),
      endDate: new Date(NOW + 10 * DAY),
      antigens: ['BCG'],
      includeNomadOpportunities: false,
      nomadOpportunitiesIncluded: [],
    },
    versions: [
      {
        versionNumber: 1,
        createdAt: new Date(NOW - 2 * DAY),
        createdBy: 'Dr. Aïcha Mahamat',
        label: 'Brouillon initial',
        itineraries: [itinerary_t01_d1],
      },
      {
        versionNumber: 2,
        createdAt: new Date(NOW - 1 * DAY),
        createdBy: 'Dr. Aïcha Mahamat',
        label: 'Ajout villages Sud',
        itineraries: [itinerary_t01_d1, itinerary_t01_d2],
        changes: ['Ajout village Koundoul', 'Modification horaire départ J1'],
      },
    ],
    activeVersionIndex: 1,
    systemProposal: {
      generatedAt: new Date(NOW - 2 * DAY),
      totalDays: 4,
      totalVillages: 8,
      nomadStopsCount: 0,
      estimatedCoverage: 78,
      estimatedCost: 245000,
      estimatedFuelLiters: 62,
      score: { coverage: 78, cost: 82, feasibility: 85 },
    },
    resourceConflicts: [],
  },

  // 2. Draft
  {
    id: 'plan-002',
    name: 'Micro-plan VPO — Kanem Ouest',
    campaignId: 'camp-002',
    provinceId: 'td-kanem',
    districtId: 'td-kanem-mao',
    createdBy: 'Hassan Saleh',
    status: 'draft',
    generationParams: {
      targetVillages: ['v-mao-01', 'v-mao-02', 'v-mao-03'],
      availableTeams: ['team-lac-03', 'team-lac-04'],
      startDate: new Date(NOW + 8 * DAY),
      endDate: new Date(NOW + 14 * DAY),
      antigens: ['VPO'],
      includeNomadOpportunities: false,
      nomadOpportunitiesIncluded: [],
    },
    versions: [
      {
        versionNumber: 1,
        createdAt: new Date(NOW - 3 * DAY),
        createdBy: 'Hassan Saleh',
        label: 'Brouillon initial',
        itineraries: [itinerary_t02_d1],
      },
      {
        versionNumber: 2,
        createdAt: new Date(NOW - 1 * DAY),
        createdBy: 'Hassan Saleh',
        label: 'Révision zones prioritaires',
        itineraries: [itinerary_t02_d1, itinerary_t01_d1],
        changes: ['Ajout équipe team-lac-04', 'Suppression zone inaccessible v-mao-05'],
      },
    ],
    activeVersionIndex: 1,
    systemProposal: {
      generatedAt: new Date(NOW - 3 * DAY),
      totalDays: 5,
      totalVillages: 12,
      nomadStopsCount: 0,
      estimatedCoverage: 71,
      estimatedCost: 320000,
      estimatedFuelLiters: 85,
      score: { coverage: 71, cost: 76, feasibility: 80 },
    },
    resourceConflicts: [],
  },

  // 3. Generated
  {
    id: 'plan-003',
    name: 'Micro-plan DTC — Baga Sola',
    campaignId: 'camp-003',
    provinceId: 'td-lac',
    districtId: 'td-lac-baga-sola',
    createdBy: 'Fatimé Brahim',
    status: 'generated',
    generationParams: {
      targetVillages: ['v-baga-01', 'v-baga-02', 'v-baga-03', 'v-baga-04', 'v-baga-05'],
      availableTeams: ['team-lac-02', 'team-lac-05'],
      startDate: new Date(NOW + 3 * DAY),
      endDate: new Date(NOW + 8 * DAY),
      antigens: ['DTC'],
      includeNomadOpportunities: true,
      nomadOpportunitiesIncluded: ['nopp-002'],
    },
    versions: [
      {
        versionNumber: 1,
        createdAt: new Date(NOW - 6 * DAY),
        createdBy: 'Système',
        label: 'Proposition système',
        itineraries: [itinerary_t02_d1],
      },
      {
        versionNumber: 2,
        createdAt: new Date(NOW - 4 * DAY),
        createdBy: 'Fatimé Brahim',
        label: 'Révision manuelle GP',
        itineraries: [itinerary_t02_d1, {
          ...itinerary_t01_d2,
          day: 2, date: new Date(NOW + 4 * DAY), teamId: 'team-lac-05',
        }],
        changes: ['Intégration opportunité nomade nopp-002', 'Réorganisation J2'],
      },
    ],
    activeVersionIndex: 1,
    systemProposal: {
      generatedAt: new Date(NOW - 6 * DAY),
      totalDays: 5,
      totalVillages: 14,
      nomadStopsCount: 1,
      estimatedCoverage: 87,
      estimatedCost: 280000,
      estimatedFuelLiters: 71,
      score: { coverage: 87, cost: 88, feasibility: 82 },
    },
    resourceConflicts: [],
  },

  // 4. Adjusted
  {
    id: 'plan-004',
    name: 'Micro-plan Rougeole — Hadjer-Lamis',
    campaignId: 'camp-004',
    provinceId: 'td-hadjer-lamis',
    districtId: 'td-hadjer-lamis-massenya',
    createdBy: 'Mahamat Tidjani',
    status: 'adjusted',
    generationParams: {
      targetVillages: ['v-mas-01', 'v-mas-02', 'v-mas-03', 'v-mas-04', 'v-mas-05', 'v-mas-06'],
      availableTeams: ['team-lac-06', 'team-lac-07'],
      startDate: new Date(NOW + 4 * DAY),
      endDate: new Date(NOW + 9 * DAY),
      antigens: ['Rougeole'],
      includeNomadOpportunities: true,
      nomadOpportunitiesIncluded: ['nopp-003', 'nopp-004'],
    },
    versions: [
      {
        versionNumber: 1,
        createdAt: new Date(NOW - 10 * DAY),
        createdBy: 'Système',
        label: 'Proposition système',
        itineraries: [itinerary_t01_d1],
      },
      {
        versionNumber: 2,
        createdAt: new Date(NOW - 7 * DAY),
        createdBy: 'Mahamat Tidjani',
        label: 'Ajustement GP v1',
        itineraries: [itinerary_t01_d1, itinerary_t02_d1],
        changes: ['Déplacement village v-mas-04 au J2', 'Ajout arrêt nomade zone Est'],
      },
      {
        versionNumber: 3,
        createdAt: new Date(NOW - 3 * DAY),
        createdBy: 'Mahamat Tidjani',
        label: 'Ajustement GP v2',
        itineraries: [itinerary_t01_d1, itinerary_t01_d2, itinerary_t02_d1],
        changes: ['Intégration opportunité nopp-004', 'Réduction J1 team-lac-06', 'Rééquilibrage charges'],
      },
    ],
    activeVersionIndex: 2,
    systemProposal: {
      generatedAt: new Date(NOW - 10 * DAY),
      totalDays: 5,
      totalVillages: 18,
      nomadStopsCount: 2,
      estimatedCoverage: 91,
      estimatedCost: 310000,
      estimatedFuelLiters: 82,
      score: { coverage: 91, cost: 84, feasibility: 88 },
    },
    resourceConflicts: [],
  },

  // 5. Submitted — with 1 resource conflict
  {
    id: 'plan-005',
    name: 'Micro-plan PCV13 — Bol Central',
    campaignId: 'camp-005',
    provinceId: 'td-lac',
    districtId: 'td-lac-bol',
    createdBy: 'Idriss Bichara',
    status: 'submitted',
    generationParams: {
      targetVillages: ['v-bol-06', 'v-bol-07', 'v-bol-08', 'v-bol-09'],
      availableTeams: ['team-lac-01', 'team-lac-08'],
      startDate: new Date(NOW + 6 * DAY),
      endDate: new Date(NOW + 11 * DAY),
      antigens: ['PCV13'],
      includeNomadOpportunities: false,
      nomadOpportunitiesIncluded: [],
    },
    versions: [
      {
        versionNumber: 1,
        createdAt: new Date(NOW - 8 * DAY),
        createdBy: 'Système',
        label: 'Proposition système',
        itineraries: [itinerary_t01_d1],
      },
      {
        versionNumber: 2,
        createdAt: new Date(NOW - 5 * DAY),
        createdBy: 'Idriss Bichara',
        label: 'Ajustement avant soumission',
        itineraries: [itinerary_t01_d1, itinerary_t02_d1],
        changes: ['Ajout équipe team-lac-08', 'Optimisation itinéraire J1'],
      },
    ],
    activeVersionIndex: 1,
    systemProposal: {
      generatedAt: new Date(NOW - 8 * DAY),
      totalDays: 5,
      totalVillages: 16,
      nomadStopsCount: 0,
      estimatedCoverage: 84,
      estimatedCost: 295000,
      estimatedFuelLiters: 75,
      score: { coverage: 84, cost: 86, feasibility: 83 },
    },
    resourceConflicts: [
      {
        type: 'team',
        resourceId: 'team-lac-01',
        conflictingPlanId: 'plan-001',
        conflictingPlanName: 'Micro-plan BCG — Bol Nord',
        detectedAt: new Date(NOW - 2 * DAY),
      },
    ],
    submittedAt: new Date(NOW - 1 * DAY),
    submittedBy: 'Idriss Bichara',
  },

  // 6. Validated
  {
    id: 'plan-006',
    name: 'Micro-plan Rotavirus — Kanem Centre',
    campaignId: 'camp-006',
    provinceId: 'td-kanem',
    districtId: 'td-kanem-mao',
    createdBy: 'Zara Adoum',
    status: 'validated',
    generationParams: {
      targetVillages: ['v-mao-04', 'v-mao-05', 'v-mao-06', 'v-mao-07', 'v-mao-08'],
      availableTeams: ['team-lac-09', 'team-lac-10'],
      startDate: new Date(NOW + 1 * DAY),
      endDate: new Date(NOW + 6 * DAY),
      antigens: ['Rotavirus'],
      includeNomadOpportunities: true,
      nomadOpportunitiesIncluded: ['nopp-005'],
    },
    versions: [
      {
        versionNumber: 1,
        createdAt: new Date(NOW - 15 * DAY),
        createdBy: 'Système',
        label: 'Proposition système',
        itineraries: [itinerary_t02_d1],
      },
      {
        versionNumber: 2,
        createdAt: new Date(NOW - 12 * DAY),
        createdBy: 'Zara Adoum',
        label: 'Révision GP',
        itineraries: [itinerary_t02_d1, itinerary_t01_d1],
        changes: ['Intégration opportunité nomade nopp-005', 'Ajustement durée visite villages'],
      },
      {
        versionNumber: 3,
        createdAt: new Date(NOW - 9 * DAY),
        createdBy: 'Dr. Moussa Hassan',
        label: 'Validation GN',
        itineraries: [itinerary_t02_d1, itinerary_t01_d1],
        changes: ['Aucune modification — validation sans changement'],
      },
    ],
    activeVersionIndex: 2,
    systemProposal: {
      generatedAt: new Date(NOW - 15 * DAY),
      totalDays: 5,
      totalVillages: 19,
      nomadStopsCount: 1,
      estimatedCoverage: 93,
      estimatedCost: 335000,
      estimatedFuelLiters: 88,
      score: { coverage: 93, cost: 81, feasibility: 90 },
    },
    resourceConflicts: [],
    submittedAt: new Date(NOW - 11 * DAY),
    submittedBy: 'Zara Adoum',
    validatedAt: new Date(NOW - 8 * DAY),
    validatedBy: 'Dr. Moussa Hassan',
  },

  // 7. In execution — with 1 urgent adjustment pending
  {
    id: 'plan-007',
    name: 'Micro-plan DTC — Lac Sud',
    campaignId: 'camp-001',
    provinceId: 'td-lac',
    districtId: 'td-lac-bol',
    createdBy: 'Ousmane Djimet',
    status: 'in_execution',
    generationParams: {
      targetVillages: ['v-bol-10', 'v-bol-11', 'v-bol-12', 'v-bol-13', 'v-bol-14', 'v-bol-15', 'v-bol-16'],
      availableTeams: ['team-lac-02', 'team-lac-03'],
      startDate: new Date(NOW - 3 * DAY),
      endDate: new Date(NOW + 4 * DAY),
      antigens: ['DTC'],
      includeNomadOpportunities: true,
      nomadOpportunitiesIncluded: ['nopp-001', 'nopp-006'],
    },
    versions: [
      {
        versionNumber: 1,
        createdAt: new Date(NOW - 20 * DAY),
        createdBy: 'Système',
        label: 'Proposition système',
        itineraries: [itinerary_t02_d1],
      },
      {
        versionNumber: 2,
        createdAt: new Date(NOW - 17 * DAY),
        createdBy: 'Ousmane Djimet',
        label: 'Ajustement avant validation',
        itineraries: [itinerary_t02_d1, itinerary_t01_d2],
        changes: ['Intégration opportunité nopp-001', 'Réorganisation J3'],
      },
      {
        versionNumber: 3,
        createdAt: new Date(NOW - 4 * DAY),
        createdBy: 'Système',
        label: 'Ajustement urgent J1',
        itineraries: [itinerary_t02_d1, itinerary_t01_d2],
        changes: ["Route coupée vers v-bol-13 — réaffectation à team-lac-03", 'Nouveau départ 06:30'],
      },
    ],
    activeVersionIndex: 2,
    systemProposal: {
      generatedAt: new Date(NOW - 20 * DAY),
      totalDays: 7,
      totalVillages: 22,
      nomadStopsCount: 2,
      estimatedCoverage: 89,
      estimatedCost: 420000,
      estimatedFuelLiters: 110,
      score: { coverage: 89, cost: 79, feasibility: 86 },
    },
    resourceConflicts: [],
    submittedAt: new Date(NOW - 16 * DAY),
    submittedBy: 'Ousmane Djimet',
    validatedAt: new Date(NOW - 13 * DAY),
    validatedBy: 'Dr. Moussa Hassan',
    executionStartDate: new Date(NOW - 3 * DAY),
    executionProgress: {
      villagesVisited: 9,
      villagesTotal: 22,
      childrenVaccinated: 347,
      daysCompleted: 3,
      urgentAdjustments: [
        {
          id: 'adj-001',
          triggeredAt: new Date(NOW - 6 * 3600_000),
          triggeredBy: 'Équipe team-lac-02 (terrain)',
          reason: "Route coupée par inondation — village v-bol-14 inaccessible. Équipe bloquée depuis 14h00.",
          affectedTeamId: 'team-lac-02',
          villagesReassigned: ['v-bol-14', 'v-bol-15'],
          toTeamId: 'team-lac-03',
          status: 'pending',
        },
      ],
    },
  },

  // 8. Closed
  {
    id: 'plan-008',
    name: 'Micro-plan VPO — Baga Sola Clôturé',
    campaignId: 'camp-002',
    provinceId: 'td-lac',
    districtId: 'td-lac-baga-sola',
    createdBy: 'Khadidja Nadjingar',
    status: 'closed',
    generationParams: {
      targetVillages: ['v-baga-06', 'v-baga-07', 'v-baga-08', 'v-baga-09'],
      availableTeams: ['team-lac-04', 'team-lac-05'],
      startDate: new Date(NOW - 30 * DAY),
      endDate: new Date(NOW - 24 * DAY),
      antigens: ['VPO'],
      includeNomadOpportunities: false,
      nomadOpportunitiesIncluded: [],
    },
    versions: [
      {
        versionNumber: 1,
        createdAt: new Date(NOW - 45 * DAY),
        createdBy: 'Système',
        label: 'Proposition système',
        itineraries: [itinerary_t01_d1],
      },
      {
        versionNumber: 2,
        createdAt: new Date(NOW - 42 * DAY),
        createdBy: 'Khadidja Nadjingar',
        label: 'Ajustement final',
        itineraries: [itinerary_t01_d1, itinerary_t02_d1],
        changes: ['Ajout zone Est', 'Réduction durée journée type'],
      },
    ],
    activeVersionIndex: 1,
    systemProposal: {
      generatedAt: new Date(NOW - 45 * DAY),
      totalDays: 6,
      totalVillages: 17,
      nomadStopsCount: 0,
      estimatedCoverage: 82,
      estimatedCost: 260000,
      estimatedFuelLiters: 67,
      score: { coverage: 82, cost: 88, feasibility: 91 },
    },
    resourceConflicts: [],
    submittedAt: new Date(NOW - 40 * DAY),
    submittedBy: 'Khadidja Nadjingar',
    validatedAt: new Date(NOW - 38 * DAY),
    validatedBy: 'Dr. Moussa Hassan',
    executionStartDate: new Date(NOW - 30 * DAY),
    executionProgress: {
      villagesVisited: 17,
      villagesTotal: 17,
      childrenVaccinated: 612,
      daysCompleted: 6,
      urgentAdjustments: [],
    },
  },
];

export const MICROPLAN_STATUS_LABEL: Record<MicroPlanStatus, string> = {
  draft: 'Brouillon',
  generated: 'Généré',
  adjusted: 'Ajusté',
  submitted: 'Soumis',
  validated: 'Validé',
  rejected: 'Rejeté',
  in_execution: 'En exécution',
  closed: 'Clôturé',
};

export const MICROPLAN_STATUS_COLOR: Record<MicroPlanStatus, string> = {
  draft: 'bg-stone-100 text-stone-600',
  generated: 'bg-blue-100 text-blue-700',
  adjusted: 'bg-amber-100 text-amber-700',
  submitted: 'bg-orange-100 text-orange-700',
  validated: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  in_execution: 'bg-primary/10 text-primary-700',
  closed: 'bg-stone-200 text-stone-500',
};
