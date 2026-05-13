const NOW = Date.now();
const DAY = 86_400_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export type AllocationStatus = 'draft' | 'reserved' | 'loaded' | 'in_mission' | 'returned';

export type Allocation = {
  id: string;
  campaignId: string;
  campaignName: string;
  teamId: string;
  teamName: string;
  facilityId: string;
  facilityName: string;
  vaccines: { antigenId: string; quantityReserved: number; quantityLoaded?: number }[];
  consumables: { type: string; quantity: number }[];
  fuelLiters: number;
  perDiem: number;
  status: AllocationStatus;
  reservedAt: Date;
  loadedAt?: Date;
  loadedConfirmedBy?: string;
  returnedAt?: Date;
  returnReport?: {
    dosesUsed: number;
    dosesReturned: number;
    dosesWasted: number;
    wasteReason?: string;
    materialsReturned: boolean;
  };
};

// ─── Labels ───────────────────────────────────────────────────────────────────

export const ALLOCATION_STATUS_LABEL: Record<AllocationStatus, string> = {
  draft: 'Brouillon',
  reserved: 'En attente chargement',
  loaded: 'Chargé',
  in_mission: 'En mission',
  returned: 'Retourné',
};

export const ALLOCATION_STATUS_COLOR: Record<AllocationStatus, string> = {
  draft: 'bg-stone-100 text-stone-600',
  reserved: 'bg-blue-100 text-blue-700',
  loaded: 'bg-amber-100 text-amber-700',
  in_mission: 'bg-primary/10 text-primary-700',
  returned: 'bg-success/10 text-success-700',
};

// ─── Equipment inventory (non-consumables for inventaire page) ────────────────

export type EquipmentCategory = 'cold_transport' | 'measurement' | 'communication' | 'transport' | 'other';

export type InventoryItem = {
  id: string;
  type: EquipmentCategory;
  designation: string;
  serialNumber: string;
  locationId: string;
  locationName: string;
  status: 'operational' | 'damaged' | 'missing';
  lastVerifiedAt: Date | null;
  assignedTeamId: string | null;
  assignedTeamName: string | null;
};

export const INVENTORY_STATUS_LABEL: Record<InventoryItem['status'], string> = {
  operational: 'Opérationnel',
  damaged: 'Endommagé',
  missing: 'Manquant',
};

export const EQUIPMENT_CATEGORY_LABEL: Record<EquipmentCategory, string> = {
  cold_transport: 'Transport froid',
  measurement: 'Mesure',
  communication: 'Communication',
  transport: 'Transport',
  other: 'Autre',
};

// ─── Allocations data (15 entries) ───────────────────────────────────────────

export const mockAllocations: Allocation[] = [
  // ── 5 reserved (en attente chargement) ──────────────────────────────────────
  {
    id: 'alloc-001',
    campaignId: 'camp-001',
    campaignName: 'Campagne DTC3 Mai 2026',
    teamId: 'team-lac-001',
    teamName: 'Équipe Mobile Bol 1',
    facilityId: 'fac-bol-cs-001',
    facilityName: 'CS Bol Centre',
    vaccines: [
      { antigenId: 'DTC', quantityReserved: 200 },
      { antigenId: 'BCG', quantityReserved: 100 },
    ],
    consumables: [
      { type: 'Seringues 0.5ml', quantity: 300 },
      { type: 'Coton', quantity: 200 },
      { type: 'Glacières', quantity: 2 },
    ],
    fuelLiters: 45,
    perDiem: 25000,
    status: 'reserved',
    reservedAt: new Date(NOW - 2 * DAY),
  },
  {
    id: 'alloc-002',
    campaignId: 'camp-001',
    campaignName: 'Campagne DTC3 Mai 2026',
    teamId: 'team-lac-002',
    teamName: 'Équipe Mobile Bol 2',
    facilityId: 'fac-bol-cs-001',
    facilityName: 'CS Bol Centre',
    vaccines: [
      { antigenId: 'DTC', quantityReserved: 150 },
      { antigenId: 'Rougeole', quantityReserved: 80 },
    ],
    consumables: [
      { type: 'Seringues 0.5ml', quantity: 230 },
      { type: 'Coton', quantity: 150 },
      { type: 'Porte-vaccins', quantity: 4 },
    ],
    fuelLiters: 38,
    perDiem: 25000,
    status: 'reserved',
    reservedAt: new Date(NOW - 1 * DAY),
  },
  {
    id: 'alloc-003',
    campaignId: 'camp-001',
    campaignName: 'Campagne DTC3 Mai 2026',
    teamId: 'team-lac-003',
    teamName: 'Équipe Mobile Ngouri',
    facilityId: 'fac-ngouri-cs-001',
    facilityName: 'CS Ngouri',
    vaccines: [
      { antigenId: 'DTC', quantityReserved: 180 },
      { antigenId: 'PCV13', quantityReserved: 60 },
    ],
    consumables: [
      { type: 'Seringues 0.5ml', quantity: 240 },
      { type: 'Glacières', quantity: 3 },
    ],
    fuelLiters: 60,
    perDiem: 25000,
    status: 'reserved',
    reservedAt: new Date(NOW - 3 * DAY),
  },
  {
    id: 'alloc-004',
    campaignId: 'camp-004',
    campaignName: 'Campagne Polio OPV2 Juin 2026',
    teamId: 'team-lac-004',
    teamName: 'Équipe Polio Bagasola',
    facilityId: 'fac-bagasola-ps-001',
    facilityName: 'PS Bagasola',
    vaccines: [
      { antigenId: 'VPO', quantityReserved: 240 },
    ],
    consumables: [
      { type: 'Marqueurs doigts', quantity: 500 },
      { type: 'Glacières', quantity: 2 },
    ],
    fuelLiters: 55,
    perDiem: 20000,
    status: 'reserved',
    reservedAt: new Date(NOW - 4 * DAY),
  },
  {
    id: 'alloc-005',
    campaignId: 'camp-001',
    campaignName: 'Campagne DTC3 Mai 2026',
    teamId: 'team-lac-005',
    teamName: 'Équipe Mobile Liwa',
    facilityId: 'fac-liwa-cds-001',
    facilityName: 'CdS Liwa Nord',
    vaccines: [
      { antigenId: 'DTC', quantityReserved: 120 },
      { antigenId: 'BCG', quantityReserved: 60 },
      { antigenId: 'Rotavirus', quantityReserved: 40 },
    ],
    consumables: [
      { type: 'Seringues 0.5ml', quantity: 220 },
      { type: 'Coton', quantity: 180 },
    ],
    fuelLiters: 70,
    perDiem: 25000,
    status: 'reserved',
    reservedAt: new Date(NOW - 1 * DAY),
  },

  // ── 4 loaded (chargement confirmé, pas encore en mission) ───────────────────
  {
    id: 'alloc-006',
    campaignId: 'camp-001',
    campaignName: 'Campagne DTC3 Mai 2026',
    teamId: 'team-lac-006',
    teamName: 'Équipe Mobile Kaya',
    facilityId: 'fac-bol-ps-002',
    facilityName: 'PS Kaya',
    vaccines: [
      { antigenId: 'DTC', quantityReserved: 100, quantityLoaded: 100 },
      { antigenId: 'BCG', quantityReserved: 50, quantityLoaded: 50 },
    ],
    consumables: [
      { type: 'Seringues 0.5ml', quantity: 150 },
      { type: 'Glacières', quantity: 2 },
    ],
    fuelLiters: 30,
    perDiem: 20000,
    status: 'loaded',
    reservedAt: new Date(NOW - 5 * DAY),
    loadedAt: new Date(NOW - 1 * DAY),
    loadedConfirmedBy: 'Mahamat Saleh (Chef équipe)',
  },
  {
    id: 'alloc-007',
    campaignId: 'camp-002',
    campaignName: 'Campagne ROR Avril 2026',
    teamId: 'team-lac-007',
    teamName: 'Équipe ROR Bol',
    facilityId: 'fac-bol-cs-001',
    facilityName: 'CS Bol Centre',
    vaccines: [
      { antigenId: 'Rougeole', quantityReserved: 160, quantityLoaded: 160 },
    ],
    consumables: [
      { type: 'Seringues 0.5ml', quantity: 160 },
      { type: 'Porte-vaccins', quantity: 3 },
    ],
    fuelLiters: 42,
    perDiem: 25000,
    status: 'loaded',
    reservedAt: new Date(NOW - 7 * DAY),
    loadedAt: new Date(NOW - 2 * DAY),
    loadedConfirmedBy: 'Aïcha Issa (Chef équipe)',
  },
  {
    id: 'alloc-008',
    campaignId: 'camp-005',
    campaignName: 'Campagne DTC1 Kanem Mars 2026',
    teamId: 'team-kanem-001',
    teamName: 'Équipe Kanem A',
    facilityId: 'fac-mao-cs-001',
    facilityName: 'CS Mao Centre',
    vaccines: [
      { antigenId: 'DTC', quantityReserved: 260, quantityLoaded: 260 },
      { antigenId: 'BCG', quantityReserved: 200, quantityLoaded: 200 },
    ],
    consumables: [
      { type: 'Seringues 0.5ml', quantity: 460 },
      { type: 'Glacières', quantity: 4 },
      { type: 'Coton', quantity: 300 },
    ],
    fuelLiters: 80,
    perDiem: 30000,
    status: 'loaded',
    reservedAt: new Date(NOW - 8 * DAY),
    loadedAt: new Date(NOW - 3 * DAY),
    loadedConfirmedBy: 'Brahim Ousmane (Chef équipe)',
  },
  {
    id: 'alloc-009',
    campaignId: 'camp-001',
    campaignName: 'Campagne DTC3 Mai 2026',
    teamId: 'team-lac-008',
    teamName: 'Équipe Mobile Mondo',
    facilityId: 'fac-mondo-ps-001',
    facilityName: 'PS Mondo',
    vaccines: [
      { antigenId: 'DTC', quantityReserved: 80, quantityLoaded: 75 },
      { antigenId: 'PCV13', quantityReserved: 40, quantityLoaded: 40 },
    ],
    consumables: [
      { type: 'Seringues 0.5ml', quantity: 115 },
      { type: 'Coton', quantity: 80 },
    ],
    fuelLiters: 50,
    perDiem: 20000,
    status: 'loaded',
    reservedAt: new Date(NOW - 6 * DAY),
    loadedAt: new Date(NOW - 2 * DAY),
    loadedConfirmedBy: 'Saleh Tidjani (Chef équipe)',
  },

  // ── 3 in_mission (actuellement sur le terrain) ───────────────────────────────
  {
    id: 'alloc-010',
    campaignId: 'camp-001',
    campaignName: 'Campagne DTC3 Mai 2026',
    teamId: 'team-lac-009',
    teamName: 'Équipe Mobile Ngouboua',
    facilityId: 'fac-bol-cds-003',
    facilityName: 'CdS Ngouboua',
    vaccines: [
      { antigenId: 'DTC', quantityReserved: 120, quantityLoaded: 120 },
      { antigenId: 'BCG', quantityReserved: 60, quantityLoaded: 58 },
    ],
    consumables: [
      { type: 'Seringues 0.5ml', quantity: 178 },
      { type: 'Glacières', quantity: 2 },
    ],
    fuelLiters: 35,
    perDiem: 25000,
    status: 'in_mission',
    reservedAt: new Date(NOW - 10 * DAY),
    loadedAt: new Date(NOW - 8 * DAY),
    loadedConfirmedBy: 'Idriss Foulmata (Chef équipe)',
  },
  {
    id: 'alloc-011',
    campaignId: 'camp-003',
    campaignName: 'Campagne BCG Neonatal',
    teamId: 'team-kanem-002',
    teamName: 'Équipe Kanem B',
    facilityId: 'fac-mao-ps-002',
    facilityName: 'PS Choukou',
    vaccines: [
      { antigenId: 'BCG', quantityReserved: 80, quantityLoaded: 80 },
    ],
    consumables: [
      { type: 'Seringues 0.1ml', quantity: 80 },
      { type: 'Porte-vaccins', quantity: 2 },
    ],
    fuelLiters: 40,
    perDiem: 20000,
    status: 'in_mission',
    reservedAt: new Date(NOW - 12 * DAY),
    loadedAt: new Date(NOW - 10 * DAY),
    loadedConfirmedBy: 'Ousmane Bichara (Chef équipe)',
  },
  {
    id: 'alloc-012',
    campaignId: 'camp-007',
    campaignName: 'Campagne DTC3 Hadjer-Lamis Fév. 2026',
    teamId: 'team-hadjer-001',
    teamName: 'Équipe Hadjer-Lamis A',
    facilityId: 'fac-bol-cs-001',
    facilityName: 'CS Bol Centre',
    vaccines: [
      { antigenId: 'DTC', quantityReserved: 180, quantityLoaded: 180 },
      { antigenId: 'BCG', quantityReserved: 90, quantityLoaded: 90 },
    ],
    consumables: [
      { type: 'Seringues 0.5ml', quantity: 270 },
      { type: 'Glacières', quantity: 3 },
      { type: 'Coton', quantity: 200 },
    ],
    fuelLiters: 65,
    perDiem: 30000,
    status: 'in_mission',
    reservedAt: new Date(NOW - 15 * DAY),
    loadedAt: new Date(NOW - 13 * DAY),
    loadedConfirmedBy: 'Zara Ngarmadji (Chef équipe)',
  },

  // ── 3 returned (restitutions validées) ───────────────────────────────────────
  {
    id: 'alloc-013',
    campaignId: 'camp-002',
    campaignName: 'Campagne ROR Avril 2026',
    teamId: 'team-lac-010',
    teamName: 'Équipe ROR Ngouri',
    facilityId: 'fac-ngouri-cs-001',
    facilityName: 'CS Ngouri',
    vaccines: [
      { antigenId: 'Rougeole', quantityReserved: 140, quantityLoaded: 140 },
    ],
    consumables: [
      { type: 'Seringues 0.5ml', quantity: 140 },
      { type: 'Glacières', quantity: 2 },
    ],
    fuelLiters: 50,
    perDiem: 25000,
    status: 'returned',
    reservedAt: new Date(NOW - 30 * DAY),
    loadedAt: new Date(NOW - 28 * DAY),
    loadedConfirmedBy: 'Tahir Djimet (Chef équipe)',
    returnedAt: new Date(NOW - 18 * DAY),
    returnReport: {
      dosesUsed: 118,
      dosesReturned: 14,
      dosesWasted: 8,
      wasteReason: 'Flacon entamé non utilisé',
      materialsReturned: true,
    },
  },
  {
    id: 'alloc-014',
    campaignId: 'camp-003',
    campaignName: 'Campagne BCG Neonatal',
    teamId: 'team-lac-011',
    teamName: 'Équipe BCG Bol',
    facilityId: 'fac-bol-cs-001',
    facilityName: 'CS Bol Centre',
    vaccines: [
      { antigenId: 'BCG', quantityReserved: 100, quantityLoaded: 100 },
    ],
    consumables: [
      { type: 'Seringues 0.1ml', quantity: 100 },
      { type: 'Porte-vaccins', quantity: 2 },
    ],
    fuelLiters: 30,
    perDiem: 20000,
    status: 'returned',
    reservedAt: new Date(NOW - 45 * DAY),
    loadedAt: new Date(NOW - 43 * DAY),
    loadedConfirmedBy: 'Hassan Adoum (Chef équipe)',
    returnedAt: new Date(NOW - 33 * DAY),
    returnReport: {
      dosesUsed: 92,
      dosesReturned: 8,
      dosesWasted: 0,
      materialsReturned: true,
    },
  },
  {
    id: 'alloc-015',
    campaignId: 'camp-005',
    campaignName: 'Campagne DTC1 Kanem Mars 2026',
    teamId: 'team-kanem-003',
    teamName: 'Équipe Kanem C',
    facilityId: 'fac-mao-cs-001',
    facilityName: 'CS Mao Centre',
    vaccines: [
      { antigenId: 'DTC', quantityReserved: 200, quantityLoaded: 200 },
      { antigenId: 'PCV13', quantityReserved: 80, quantityLoaded: 80 },
    ],
    consumables: [
      { type: 'Seringues 0.5ml', quantity: 280 },
      { type: 'Glacières', quantity: 3 },
    ],
    fuelLiters: 75,
    perDiem: 30000,
    status: 'returned',
    reservedAt: new Date(NOW - 60 * DAY),
    loadedAt: new Date(NOW - 58 * DAY),
    loadedConfirmedBy: 'Moussa Nadjingar (Chef équipe)',
    returnedAt: new Date(NOW - 45 * DAY),
    returnReport: {
      dosesUsed: 168,
      dosesReturned: 22,
      dosesWasted: 10,
      wasteReason: 'Rupture chaîne froid — panne réfrigérateur',
      materialsReturned: false,
    },
  },
];

// ─── Non-consumable inventory (for inventaire page) ─────────────────────────

export const mockInventory: InventoryItem[] = [
  { id: 'inv-001', type: 'cold_transport', designation: 'Glacière grande capacité GX-60L', serialNumber: 'GX-2024-001', locationId: 'fac-bol-cs-001', locationName: 'CS Bol Centre', status: 'operational', lastVerifiedAt: new Date(NOW - 15 * DAY), assignedTeamId: null, assignedTeamName: null },
  { id: 'inv-002', type: 'cold_transport', designation: 'Glacière grande capacité GX-60L', serialNumber: 'GX-2024-002', locationId: 'fac-bol-cs-001', locationName: 'CS Bol Centre', status: 'operational', lastVerifiedAt: new Date(NOW - 15 * DAY), assignedTeamId: 'team-lac-009', assignedTeamName: 'Équipe Mobile Ngouboua' },
  { id: 'inv-003', type: 'cold_transport', designation: 'Porte-vaccins VK-2 (4 accumulateurs)', serialNumber: 'VK-2023-018', locationId: 'fac-bol-ps-002', locationName: 'PS Kaya', status: 'damaged', lastVerifiedAt: new Date(NOW - 30 * DAY), assignedTeamId: null, assignedTeamName: null },
  { id: 'inv-004', type: 'cold_transport', designation: 'Glacière 30L (transport terrain)', serialNumber: 'GL-2023-044', locationId: 'fac-ngouri-cs-001', locationName: 'CS Ngouri', status: 'operational', lastVerifiedAt: new Date(NOW - 8 * DAY), assignedTeamId: 'team-lac-003', assignedTeamName: 'Équipe Mobile Ngouri' },
  { id: 'inv-005', type: 'cold_transport', designation: 'Glacière 30L (transport terrain)', serialNumber: 'GL-2023-045', locationId: 'fac-mao-cs-001', locationName: 'CS Mao Centre', status: 'operational', lastVerifiedAt: new Date(NOW - 12 * DAY), assignedTeamId: 'team-kanem-001', assignedTeamName: 'Équipe Kanem A' },
  { id: 'inv-006', type: 'measurement', designation: 'Thermomètre numérique TN-Pro', serialNumber: 'TH-2024-011', locationId: 'fac-bol-cs-001', locationName: 'CS Bol Centre', status: 'operational', lastVerifiedAt: new Date(NOW - 5 * DAY), assignedTeamId: null, assignedTeamName: null },
  { id: 'inv-007', type: 'measurement', designation: 'Thermomètre numérique TN-Pro', serialNumber: 'TH-2024-012', locationId: 'fac-ngouri-cs-001', locationName: 'CS Ngouri', status: 'missing', lastVerifiedAt: new Date(NOW - 45 * DAY), assignedTeamId: null, assignedTeamName: null },
  { id: 'inv-008', type: 'communication', designation: 'Tablette Samsung A7 (collecte données)', serialNumber: 'TB-2024-005', locationId: 'fac-bol-cs-001', locationName: 'CS Bol Centre', status: 'operational', lastVerifiedAt: new Date(NOW - 20 * DAY), assignedTeamId: 'team-lac-001', assignedTeamName: 'Équipe Mobile Bol 1' },
  { id: 'inv-009', type: 'communication', designation: 'Tablette Samsung A7 (collecte données)', serialNumber: 'TB-2024-006', locationId: 'fac-bol-cs-001', locationName: 'CS Bol Centre', status: 'damaged', lastVerifiedAt: new Date(NOW - 20 * DAY), assignedTeamId: null, assignedTeamName: null },
  { id: 'inv-010', type: 'communication', designation: 'GPS Garmin eTrex 32x', serialNumber: 'GPS-2023-003', locationId: 'fac-mao-cs-001', locationName: 'CS Mao Centre', status: 'operational', lastVerifiedAt: new Date(NOW - 18 * DAY), assignedTeamId: 'team-kanem-001', assignedTeamName: 'Équipe Kanem A' },
  { id: 'inv-011', type: 'transport', designation: 'Moto Honda CG 125 (immat. TA-4821)', serialNumber: 'MOTO-2022-007', locationId: 'fac-ngouri-cs-001', locationName: 'CS Ngouri', status: 'operational', lastVerifiedAt: new Date(NOW - 10 * DAY), assignedTeamId: 'team-lac-003', assignedTeamName: 'Équipe Mobile Ngouri' },
  { id: 'inv-012', type: 'transport', designation: 'Moto Honda CG 125 (immat. TA-4822)', serialNumber: 'MOTO-2022-008', locationId: 'fac-bagasola-ps-001', locationName: 'PS Bagasola', status: 'damaged', lastVerifiedAt: new Date(NOW - 35 * DAY), assignedTeamId: null, assignedTeamName: null },
  { id: 'inv-013', type: 'other', designation: 'Balance pèse-bébé (0-20kg)', serialNumber: 'BAL-2023-014', locationId: 'fac-bol-cds-003', locationName: 'CdS Ngouboua', status: 'operational', lastVerifiedAt: new Date(NOW - 22 * DAY), assignedTeamId: null, assignedTeamName: null },
  { id: 'inv-014', type: 'other', designation: 'Mégaphone portatif (sensibilisation)', serialNumber: 'MEG-2024-002', locationId: 'fac-liwa-cds-001', locationName: 'CdS Liwa Nord', status: 'missing', lastVerifiedAt: new Date(NOW - 60 * DAY), assignedTeamId: null, assignedTeamName: null },
  { id: 'inv-015', type: 'communication', designation: 'Radio VHF portative Kenwood', serialNumber: 'RAD-2023-009', locationId: 'fac-mao-ps-002', locationName: 'PS Choukou', status: 'operational', lastVerifiedAt: new Date(NOW - 28 * DAY), assignedTeamId: 'team-kanem-002', assignedTeamName: 'Équipe Kanem B' },
];
