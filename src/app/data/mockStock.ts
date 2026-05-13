const NOW = Date.now();
const DAY = 86_400_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export type VaccineStock = {
  id: string;
  antigen: string;
  lot: string;
  expiryDate: Date;
  level: 'national' | 'provincial' | 'facility';
  locationId: string;
  locationName: string;
  quantityAvailable: number;
  quantityReserved: number;
  quantityAllocated: number;
  quantityConsumed: number;
  quantityWasted: number;
  unitDoses: number;
  status: 'available' | 'reserved' | 'allocated' | 'expired' | 'shortage';
  coldChainRequired: boolean;
  temperatureRange: { min: number; max: number };
};

export type StockMovement = {
  id: string;
  type: 'in' | 'out' | 'reserve' | 'allocate' | 'return' | 'waste';
  vaccineId: string;
  antigen: string;
  quantity: number;
  date: Date;
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
  missionId?: string;
  teamId?: string;
  reason?: string;
  confirmedBy: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const ANTIGEN_COLORS: Record<string, string> = {
  BCG: '#6D28D9',
  DTC: '#2563EB',
  Rougeole: '#D97706',
  VPO: '#16A34A',
  Rotavirus: '#DB2777',
  PCV13: '#0891B2',
};

export const ANTIGEN_LIST = ['BCG', 'DTC', 'Rougeole', 'VPO', 'Rotavirus', 'PCV13'];

export const STOCK_STATUS_LABEL: Record<VaccineStock['status'], string> = {
  available: 'Disponible',
  reserved: 'Réservé',
  allocated: 'Alloué',
  expired: 'Périmé',
  shortage: 'Rupture',
};

export const MOVEMENT_TYPE_LABEL: Record<StockMovement['type'], string> = {
  in: 'Entrée',
  out: 'Sortie',
  reserve: 'Réservation',
  allocate: 'Allocation',
  return: 'Restitution',
  waste: 'Gaspillage',
};

// ─── Location registry ────────────────────────────────────────────────────────

const LOC = {
  national: { id: 'national', name: "Dépôt National N'Djaména", level: 'national' as const },
  lac: { id: 'td-lac', name: 'Dépôt Provincial — Lac', level: 'provincial' as const },
  kanem: { id: 'td-kanem', name: 'Dépôt Provincial — Kanem', level: 'provincial' as const },
  hadjer: { id: 'td-hadjer-lamis', name: 'Dépôt Provincial — Hadjer-Lamis', level: 'provincial' as const },
  bolCS: { id: 'fac-bol-cs-001', name: 'CS Bol Centre', level: 'facility' as const },
  bolPS: { id: 'fac-bol-ps-002', name: 'PS Kaya', level: 'facility' as const },
  bolCDS: { id: 'fac-bol-cds-003', name: 'CdS Ngouboua', level: 'facility' as const },
  ngouriCS: { id: 'fac-ngouri-cs-001', name: 'CS Ngouri', level: 'facility' as const },
  ngouriPS: { id: 'fac-ngouri-ps-002', name: 'PS Liwa', level: 'facility' as const },
  bagasolaPS: { id: 'fac-bagasola-ps-001', name: 'PS Bagasola', level: 'facility' as const },
  liwaCS: { id: 'fac-liwa-cds-001', name: 'CdS Liwa Nord', level: 'facility' as const },
  maoCS: { id: 'fac-mao-cs-001', name: 'CS Mao Centre', level: 'facility' as const },
  maoPS: { id: 'fac-mao-ps-002', name: 'PS Choukou', level: 'facility' as const },
  mondoPS: { id: 'fac-mondo-ps-001', name: 'PS Mondo', level: 'facility' as const },
};

type Loc = typeof LOC[keyof typeof LOC];

// ─── Stock factory ────────────────────────────────────────────────────────────

let _sid = 1;
function makeStock(
  antigen: string,
  lot: string,
  expiryDays: number,
  loc: Loc,
  available: number,
  reserved = 0,
  allocated = 0,
  consumed = 0,
  wasted = 0,
  forceStatus?: VaccineStock['status'],
): VaccineStock {
  const unitDoses = antigen === 'Rotavirus' || antigen === 'PCV13' ? 1 : 10;
  const coldChain = antigen !== 'VPO';
  const expiry = new Date(NOW + expiryDays * DAY);
  let status: VaccineStock['status'] = forceStatus ?? (
    available === 0 && reserved === 0 ? 'shortage'
    : reserved > 0 && available === 0 ? 'reserved'
    : allocated > 0 && available === 0 && reserved === 0 ? 'allocated'
    : expiryDays < 0 ? 'expired'
    : 'available'
  );
  if (forceStatus) status = forceStatus;
  return {
    id: `stk-${String(_sid++).padStart(3, '0')}`,
    antigen,
    lot,
    expiryDate: expiry,
    level: loc.level,
    locationId: loc.id,
    locationName: loc.name,
    quantityAvailable: available,
    quantityReserved: reserved,
    quantityAllocated: allocated,
    quantityConsumed: consumed,
    quantityWasted: wasted,
    unitDoses,
    status,
    coldChainRequired: coldChain,
    temperatureRange: coldChain ? { min: 2, max: 8 } : { min: -20, max: 8 },
  };
}

// ─── Stock data (~80 entries) ──────────────────────────────────────────────────

export const mockStock: VaccineStock[] = [
  // ── National level ─────────────────────────────────────────────────────────
  makeStock('BCG',       'BCG-2025-047', 280, LOC.national, 48000, 2000, 0,   12000, 0),
  makeStock('DTC',       'DTC-2025-112', 310, LOC.national, 62000, 5000, 0,   18000, 0),
  makeStock('Rougeole',  'ROR-2025-033', 195, LOC.national, 38000, 3000, 0,    9500, 0),
  makeStock('VPO',       'VPO-2025-089', 410, LOC.national, 55000, 1000, 0,   14000, 0),
  makeStock('Rotavirus', 'ROT-2025-021', 240, LOC.national, 22000, 800,  0,    6500, 0),
  makeStock('PCV13',     'PCV-2025-018', 365, LOC.national, 31000, 1200, 0,    8200, 0),

  // ── Province du Lac ─────────────────────────────────────────────────────────
  makeStock('BCG',       'BCG-2025-047', 280, LOC.lac, 3200, 400,  0,  1800, 0),
  makeStock('DTC',       'DTC-2025-112', 310, LOC.lac, 4100, 600,  0,  2200, 0),
  makeStock('Rougeole',  'ROR-2025-033', 195, LOC.lac, 2800, 300,  0,  1400, 0),
  makeStock('VPO',       'VPO-2025-089', 410, LOC.lac, 3600, 200,  0,  1600, 0),
  makeStock('Rotavirus', 'ROT-2025-021', 240, LOC.lac, 1500, 150,  0,   700, 0),
  makeStock('PCV13',     'PCV-2025-018', 365, LOC.lac, 2100, 200,  0,   900, 0),

  // ── Province du Kanem ───────────────────────────────────────────────────────
  makeStock('BCG',       'BCG-2025-047', 280, LOC.kanem, 1800, 200, 0, 900,  0),
  makeStock('DTC',       'DTC-2025-112',  25, LOC.kanem,  200, 800, 0, 600, 60, 'reserved'), // expiry <30j
  makeStock('Rougeole',  'ROR-2025-033', 310, LOC.kanem, 1400, 100, 0, 700,  0),
  makeStock('VPO',       'VPO-2025-089', 410, LOC.kanem,    0,   0, 0,   0,  0, 'shortage'), // shortage
  makeStock('Rotavirus', 'ROT-2025-021',  18, LOC.kanem,  600,   0, 0, 300, 20, 'available'), // expiry <30j
  makeStock('PCV13',     'PCV-2025-018', 365, LOC.kanem, 1200, 100, 0, 500,  0),

  // ── Province Hadjer-Lamis ───────────────────────────────────────────────────
  makeStock('BCG',       'BCG-2025-047', 280, LOC.hadjer, 2100, 300, 0, 1100, 0),
  makeStock('DTC',       'DTC-2025-112', 310, LOC.hadjer, 2800, 400, 0, 1500, 0),
  makeStock('Rougeole',  'ROR-2025-033', 195, LOC.hadjer,    0,   0, 0,    0, 0, 'shortage'), // shortage
  makeStock('VPO',       'VPO-2025-089', 410, LOC.hadjer, 2200, 100, 0,  900, 0),
  makeStock('Rotavirus', 'ROT-2025-021', 240, LOC.hadjer,  900, 100, 0,  400, 0),
  makeStock('PCV13',     'PCV-2025-018',  22, LOC.hadjer,  400,   0, 0,  200, 40, 'available'), // expiry <30j

  // ── CS Bol Centre ────────────────────────────────────────────────────────────
  makeStock('BCG',       'BCG-2025-047', 180, LOC.bolCS,  240,  60,  0, 120,  0),
  makeStock('DTC',       'DTC-2025-112', 200, LOC.bolCS,  320,  80, 40, 180,  0),
  makeStock('Rougeole',  'ROR-2025-033', 120, LOC.bolCS,  180,  40,  0,  90,  0),
  makeStock('VPO',       'VPO-2025-089', 200, LOC.bolCS,  250,  30,  0, 110,  0),
  makeStock('Rotavirus', 'ROT-2025-021', 160, LOC.bolCS,  120,  20,  0,  60,  0),
  makeStock('PCV13',     'PCV-2025-018', 240, LOC.bolCS,  160,  30,  0,  80,  0),

  // ── PS Kaya ───────────────────────────────────────────────────────────────────
  makeStock('BCG',       'BCG-2025-047',  90, LOC.bolPS,   80,  20,  0,  40,  8),
  makeStock('DTC',       'DTC-2025-112', 110, LOC.bolPS,  100,  30,  0,  50,  0),
  makeStock('Rougeole',  'ROR-2025-033',  70, LOC.bolPS,   60,  10,  0,  30,  5),
  makeStock('VPO',       'VPO-2025-089', 140, LOC.bolPS,   90,   0,  0,  40,  0),
  makeStock('Rotavirus', 'ROT-2025-021',   0, LOC.bolPS,    0,   0,  0,   0,  0, 'shortage'), // shortage
  makeStock('PCV13',     'PCV-2025-018', 100, LOC.bolPS,   70,  10,  0,  35,  0),

  // ── CdS Ngouboua ──────────────────────────────────────────────────────────────
  makeStock('BCG',       'BCG-2025-047',  60, LOC.bolCDS,  40,   0,  0,  20, 12),
  makeStock('DTC',       'DTC-2025-112',  80, LOC.bolCDS,  50,  10,  0,  25,  0),
  makeStock('Rougeole',  'ROR-2025-033',  28, LOC.bolCDS,  30,   0,  0,  15,  0), // expiry <30j
  makeStock('VPO',       'VPO-2025-089', 100, LOC.bolCDS,  60,   0,  0,  28,  0),
  makeStock('Rotavirus', 'ROT-2025-021',  90, LOC.bolCDS,  25,   0,  0,  12,  0),
  makeStock('PCV13',     'PCV-2025-018', 120, LOC.bolCDS,  35,   0,  0,  18,  0),

  // ── CS Ngouri ─────────────────────────────────────────────────────────────────
  makeStock('BCG',       'BCG-2025-047', 150, LOC.ngouriCS, 180, 40,  0,  90,  0),
  makeStock('DTC',       'DTC-2025-112', 170, LOC.ngouriCS, 220, 60, 20, 110,  0),
  makeStock('Rougeole',  'ROR-2025-033', 110, LOC.ngouriCS, 140, 30,  0,  70,  0),
  makeStock('VPO',       'VPO-2025-089', 200, LOC.ngouriCS,   0,  0,  0,   0,  0, 'shortage'), // shortage
  makeStock('Rotavirus', 'ROT-2025-021', 130, LOC.ngouriCS,  80, 15,  0,  40,  0),
  makeStock('PCV13',     'PCV-2025-018', 200, LOC.ngouriCS, 110, 20,  0,  55,  0),

  // ── PS Liwa ───────────────────────────────────────────────────────────────────
  makeStock('BCG',       'BCG-2025-047',  50, LOC.ngouriPS,  30,  0,  0,  15, 18),
  makeStock('DTC',       'DTC-2025-112',  70, LOC.ngouriPS,  40, 10,  0,  20,  0),
  makeStock('Rougeole',  'ROR-2025-033',  40, LOC.ngouriPS,  20,  0,  0,  10,  0),
  makeStock('VPO',       'VPO-2025-089',  80, LOC.ngouriPS,   0,  0,  0,   0,  0, 'shortage'), // shortage
  makeStock('Rotavirus', 'ROT-2025-021',  60, LOC.ngouriPS,  15,  0,  0,   8,  0),
  makeStock('PCV13',     'PCV-2025-018', 100, LOC.ngouriPS,  25,  0,  0,  12,  0),

  // ── PS Bagasola ───────────────────────────────────────────────────────────────
  makeStock('BCG',       'BCG-2025-047',  85, LOC.bagasolaPS, 60, 15,  0,  30, 6),
  makeStock('DTC',       'DTC-2025-112', 100, LOC.bagasolaPS, 80, 20,  0,  40, 0),
  makeStock('Rougeole',  'ROR-2025-033',  65, LOC.bagasolaPS, 50, 10,  0,  25, 0),
  makeStock('VPO',       'VPO-2025-089', 120, LOC.bagasolaPS, 70,  0,  0,  30, 0),
  makeStock('Rotavirus', 'ROT-2025-021',  90, LOC.bagasolaPS, 35,  5,  0,  18, 0),
  makeStock('PCV13',     'PCV-2025-018', 150, LOC.bagasolaPS, 45,  8,  0,  22, 0),

  // ── CdS Liwa Nord ─────────────────────────────────────────────────────────────
  makeStock('BCG',       'BCG-2025-047',  45, LOC.liwaCS,  25,  0,  0,  12, 15),
  makeStock('DTC',       'DTC-2025-112',  55, LOC.liwaCS,  30,  8,  0,  15,  0),
  makeStock('Rougeole',  'ROR-2025-033',  35, LOC.liwaCS,  20,  0,  0,  10,  0),
  makeStock('VPO',       'VPO-2025-089',  70, LOC.liwaCS,   0,  0,  0,   0,  0, 'shortage'), // shortage
  makeStock('Rotavirus', 'ROT-2025-021',  50, LOC.liwaCS,   0,  0,  0,   0,  0, 'shortage'), // shortage (10 total shortages now)
  makeStock('PCV13',     'PCV-2025-018',  90, LOC.liwaCS,  20,  0,  0,  10,  0),

  // ── CS Mao Centre ─────────────────────────────────────────────────────────────
  makeStock('BCG',       'BCG-2025-047', 160, LOC.maoCS, 200, 50,  0, 100,  0),
  makeStock('DTC',       'DTC-2025-112', 180, LOC.maoCS, 260, 70, 30, 130,  0),
  makeStock('Rougeole',  'ROR-2025-033', 120, LOC.maoCS, 160, 40,  0,  80,  0),
  makeStock('VPO',       'VPO-2025-089', 200, LOC.maoCS, 200, 20,  0,  90,  0),
  makeStock('Rotavirus', 'ROT-2025-021', 150, LOC.maoCS,  90, 10,  0,  45,  0),
  makeStock('PCV13',     'PCV-2025-018', 200, LOC.maoCS, 120, 15,  0,  60,  0),

  // ── PS Choukou ────────────────────────────────────────────────────────────────
  makeStock('BCG',       'BCG-2025-047',  75, LOC.maoPS,  50, 10,  0,  25, 10),
  makeStock('DTC',       'DTC-2025-112',  90, LOC.maoPS,  60, 15,  0,  30,  0),
  makeStock('Rougeole',  'ROR-2025-033',  55, LOC.maoPS,  40,  0,  0,  20,  0),
  makeStock('VPO',       'VPO-2025-089', 110, LOC.maoPS,  70,  0,  0,  32,  0),
  makeStock('Rotavirus', 'ROT-2025-021',  80, LOC.maoPS,  30,  5,  0,  15,  0),
  makeStock('PCV13',     'PCV-2025-018', 120, LOC.maoPS,  40,  5,  0,  20,  0),

  // ── PS Mondo ──────────────────────────────────────────────────────────────────
  makeStock('BCG',       'BCG-2025-047',  40, LOC.mondoPS,  20,  0,  0,  10, 22),
  makeStock('DTC',       'DTC-2025-112',  50, LOC.mondoPS,  25,  8,  0,  12,  0),
  makeStock('Rougeole',  'ROR-2025-033',  30, LOC.mondoPS,  15,  0,  0,   8,  0),
  makeStock('VPO',       'VPO-2025-089',  60, LOC.mondoPS,  30,  0,  0,  14,  0),
  makeStock('Rotavirus', 'ROT-2025-021',  45, LOC.mondoPS,   0,  0,  0,   0,  0, 'shortage'), // shortage
  makeStock('PCV13',     'PCV-2025-018',  80, LOC.mondoPS,  18,  0,  0,   9,  0),
];

// ─── Stock movements (50 entries, 90 days history) ────────────────────────────

let _mid = 1;
function mv(
  type: StockMovement['type'],
  vaccineId: string,
  antigen: string,
  qty: number,
  daysAgo: number,
  from: Loc,
  to: Loc,
  confirmedBy: string,
  extra: Partial<StockMovement> = {},
): StockMovement {
  return {
    id: `mov-${String(_mid++).padStart(3, '0')}`,
    type,
    vaccineId,
    antigen,
    quantity: qty,
    date: new Date(NOW - daysAgo * DAY),
    fromLocationId: from.id,
    fromLocationName: from.name,
    toLocationId: to.id,
    toLocationName: to.name,
    confirmedBy,
    ...extra,
  };
}

export const mockStockMovements: StockMovement[] = [
  // Incoming deliveries from national
  mv('in',       'stk-007', 'BCG',       4000, 88, LOC.national, LOC.lac,   'Dr. Hassan Ali'),
  mv('in',       'stk-008', 'DTC',       5000, 85, LOC.national, LOC.lac,   'Dr. Hassan Ali'),
  mv('in',       'stk-013', 'BCG',       2500, 82, LOC.national, LOC.kanem, 'Mme Fatimé Brahim'),
  mv('in',       'stk-019', 'BCG',       3000, 79, LOC.national, LOC.hadjer,'Dr. Issa Mahamat'),
  mv('in',       'stk-009', 'Rougeole',  3500, 75, LOC.national, LOC.lac,   'Dr. Hassan Ali'),

  // Provincial → FOSA distributions
  mv('out',      'stk-007', 'BCG',        400, 72, LOC.lac,    LOC.bolCS,     'Hassan Adoum'),
  mv('out',      'stk-008', 'DTC',        500, 70, LOC.lac,    LOC.bolCS,     'Hassan Adoum'),
  mv('out',      'stk-009', 'Rougeole',   300, 68, LOC.lac,    LOC.bolCS,     'Hassan Adoum'),
  mv('out',      'stk-007', 'BCG',        150, 65, LOC.lac,    LOC.bolPS,     'Mahamat Saleh'),
  mv('out',      'stk-008', 'DTC',        200, 63, LOC.lac,    LOC.bolPS,     'Mahamat Saleh'),
  mv('out',      'stk-007', 'BCG',        250, 60, LOC.lac,    LOC.ngouriCS,  'Aïcha Issa'),
  mv('out',      'stk-008', 'DTC',        320, 58, LOC.lac,    LOC.ngouriCS,  'Aïcha Issa'),
  mv('out',      'stk-013', 'BCG',        200, 55, LOC.kanem,  LOC.maoCS,     'Brahim Ousmane'),
  mv('out',      'stk-014', 'DTC',        300, 52, LOC.kanem,  LOC.maoCS,     'Brahim Ousmane'),
  mv('out',      'stk-019', 'BCG',        250, 50, LOC.hadjer, LOC.bagasolaPS,'Saleh Tidjani'),

  // Reservations (micro-plan validations)
  mv('reserve',  'stk-026', 'DTC',         80, 45, LOC.bolCS,  LOC.bolCS,     'Système PEV', { missionId: 'mission-001', teamId: 'team-lac-001' }),
  mv('reserve',  'stk-025', 'BCG',         60, 43, LOC.bolCS,  LOC.bolCS,     'Système PEV', { missionId: 'mission-002', teamId: 'team-lac-002' }),
  mv('reserve',  'stk-032', 'BCG',         20, 40, LOC.bolPS,  LOC.bolPS,     'Système PEV', { missionId: 'mission-003', teamId: 'team-lac-003' }),
  mv('reserve',  'stk-044', 'BCG',         40, 38, LOC.ngouriCS,LOC.ngouriCS, 'Système PEV', { missionId: 'mission-004', teamId: 'team-lac-004' }),
  mv('reserve',  'stk-008', 'DTC',        600, 35, LOC.lac,    LOC.lac,       'Système PEV', { missionId: 'mission-005', teamId: 'team-lac-005' }),

  // Allocations (chargement confirmé)
  mv('allocate', 'stk-026', 'DTC',         80, 42, LOC.bolCS,  LOC.bolCS,     'Equipe mobile 1', { missionId: 'mission-001', teamId: 'team-lac-001' }),
  mv('allocate', 'stk-025', 'BCG',         60, 40, LOC.bolCS,  LOC.bolCS,     'Equipe mobile 2', { missionId: 'mission-002', teamId: 'team-lac-002' }),
  mv('allocate', 'stk-063', 'BCG',        200, 38, LOC.maoCS,  LOC.maoCS,     'Equipe Mao 1',    { missionId: 'mission-006', teamId: 'team-kanem-001' }),
  mv('allocate', 'stk-064', 'DTC',        260, 36, LOC.maoCS,  LOC.maoCS,     'Equipe Mao 1',    { missionId: 'mission-006', teamId: 'team-kanem-001' }),
  mv('allocate', 'stk-013', 'BCG',        200, 32, LOC.kanem,  LOC.kanem,     'Coord. Kanem',    { missionId: 'mission-007', teamId: 'team-kanem-002' }),

  // Returns (restitutions)
  mv('return',   'stk-025', 'BCG',         18, 28, LOC.bolCS,  LOC.lac,       'Equipe mobile 2', { missionId: 'mission-002', teamId: 'team-lac-002', reason: 'Fin mission — surplus' }),
  mv('return',   'stk-026', 'DTC',         12, 26, LOC.bolCS,  LOC.lac,       'Equipe mobile 1', { missionId: 'mission-001', teamId: 'team-lac-001' }),
  mv('return',   'stk-063', 'BCG',         35, 22, LOC.maoCS,  LOC.kanem,     'Equipe Mao 1',    { missionId: 'mission-006' }),
  mv('return',   'stk-064', 'DTC',         48, 20, LOC.maoCS,  LOC.kanem,     'Equipe Mao 1',    { missionId: 'mission-006' }),
  mv('return',   'stk-013', 'BCG',         22, 18, LOC.kanem,  LOC.national,  'Coord. Kanem',    { missionId: 'mission-007' }),

  // Waste events
  mv('waste',    'stk-031', 'BCG',          8, 25, LOC.bolPS,  LOC.bolPS,     'PS Kaya', { reason: 'Rupture chaîne froid — panneau électrique' }),
  mv('waste',    'stk-033', 'Rougeole',     5, 22, LOC.bolPS,  LOC.bolPS,     'PS Kaya', { reason: 'Flacon entamé non utilisé' }),
  mv('waste',    'stk-037', 'BCG',         12, 19, LOC.bolCDS, LOC.bolCDS,    'CdS Ngouboua', { reason: 'Rupture chaîne froid' }),
  mv('waste',    'stk-049', 'BCG',         18, 16, LOC.ngouriPS,LOC.ngouriPS, 'PS Liwa', { reason: 'Périmé — lot expiré' }),
  mv('waste',    'stk-056', 'BCG',          6, 14, LOC.bagasolaPS,LOC.bagasolaPS,'PS Bagasola',{ reason: 'Flacon entamé non utilisé' }),
  mv('waste',    'stk-061', 'BCG',         15, 12, LOC.liwaCS, LOC.liwaCS,    'CdS Liwa Nord', { reason: 'Rupture chaîne froid — réfrigérateur HS' }),
  mv('waste',    'stk-069', 'BCG',         10, 10, LOC.maoPS,  LOC.maoPS,     'PS Choukou', { reason: 'Flacon entamé non utilisé' }),
  mv('waste',    'stk-075', 'BCG',         22, 8,  LOC.mondoPS,LOC.mondoPS,   'PS Mondo', { reason: 'Rupture chaîne froid' }),

  // New incoming deliveries (recent)
  mv('in',       'stk-010', 'VPO',        4000, 15, LOC.national, LOC.lac,    'Dr. Hassan Ali'),
  mv('in',       'stk-016', 'VPO',           0,  8, LOC.national, LOC.kanem,  'Mme Fatimé Brahim', { reason: 'Commande annulée — rupture stock national' }),
  mv('in',       'stk-020', 'BCG',        2500,  6, LOC.national, LOC.hadjer, 'Dr. Issa Mahamat'),
  mv('out',      'stk-010', 'VPO',         250,  5, LOC.lac,    LOC.ngouriCS, 'Coord. Lac'),
  mv('out',      'stk-010', 'VPO',         200,  4, LOC.lac,    LOC.bolCS,    'Coord. Lac'),

  // Recent reservations (pending)
  mv('reserve',  'stk-008', 'DTC',        400, 3, LOC.lac, LOC.lac,          'Système PEV', { missionId: 'mission-008', teamId: 'team-lac-006' }),
  mv('reserve',  'stk-007', 'BCG',        300, 2, LOC.lac, LOC.lac,          'Système PEV', { missionId: 'mission-009', teamId: 'team-lac-007' }),
  mv('reserve',  'stk-027', 'Rougeole',   40,  1, LOC.bolCS, LOC.bolCS,      'Système PEV', { missionId: 'mission-010', teamId: 'team-lac-008' }),
  mv('in',       'stk-001', 'BCG',      10000,  1, LOC.national, LOC.national,'Coord. National'),
  mv('in',       'stk-002', 'DTC',      12000,  0, LOC.national, LOC.national,'Coord. National'),
];
