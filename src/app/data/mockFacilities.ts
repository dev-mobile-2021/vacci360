import type {
  Facility,
  FacilityType,
  FacilityStatus,
  ColdChainEquipment,
  StaffMember,
  VaccinationStrategy,
  Connectivity,
} from '../types/facility';
import type { AccessibilityRating } from '../types/village';
import { createPrng } from './prng';
import {
  LAC_DEPARTMENTS,
  KANEM_DEPARTMENTS,
  HADJER_LAMIS_DEPARTMENTS,
  type DepartmentSeed,
} from './chadProvinces';

const NOW = Date.now();
const DAY = 86_400_000;

const FIRST_NAMES = [
  'Aminata', 'Fatimé', 'Mahamat', 'Idriss', 'Hawa', 'Khadija', 'Oumar', 'Aïcha',
  'Brahim', 'Zara', 'Hassan', 'Achta', 'Moussa', 'Halima', 'Saleh', 'Mariam',
  'Adam', 'Roukaya', 'Issa', 'Ndilbé',
];
const LAST_NAMES = [
  'Hassan', 'Abakar', 'Idriss', 'Déby', 'Ngamine', 'Goukouni', 'Adoum',
  'Mahamat', 'Tahir', 'Oumar', 'Soumaila', 'Brahim', 'Ahmat', 'Saleh', 'Ali',
];
const COLD_BRANDS = ['Vestfrost MK 304', 'Haier HBC-150', 'Sundanzer DCR-225', 'Dometic FR 240', 'B Medical TCW 4000'];
const OPERATORS = ['Airtel', 'Tigo', 'Salam'];

type Canton = { provinceId: string; depId: string; spId: string; cantonId: string; cantonName: string; spLat: number; spLng: number; };

function flattenCantons(provinceId: string, deps: DepartmentSeed[]): Canton[] {
  const out: Canton[] = [];
  for (const dep of deps) {
    const depId = `${provinceId}-${dep.slug}`;
    for (const sp of dep.subPrefectures) {
      const spId = `${depId}-${sp.slug}`;
      for (const c of sp.cantons) {
        out.push({
          provinceId,
          depId,
          spId,
          cantonId: `${spId}-${c.slug}`,
          cantonName: c.name,
          spLat: sp.lat,
          spLng: sp.lng,
        });
      }
    }
  }
  return out;
}

function makeStaff(rng: ReturnType<typeof createPrng>, type: FacilityType): StaffMember[] {
  const count =
    type === 'hospital' ? rng.int(18, 28) :
    type === 'health_center' ? rng.int(6, 12) :
    type === 'health_post' ? rng.int(3, 6) :
    rng.int(2, 4);

  const roles: StaffMember['role'][] = [];
  if (type === 'hospital') {
    roles.push('doctor', 'doctor', 'midwife', 'midwife', 'administrator');
    for (let i = roles.length; i < count; i++) roles.push(rng.pick(['nurse', 'nurse', 'community_agent', 'driver']));
  } else if (type === 'health_center') {
    roles.push('doctor', 'midwife', 'nurse');
    for (let i = roles.length; i < count; i++) roles.push(rng.pick(['nurse', 'community_agent', 'community_agent']));
  } else {
    for (let i = 0; i < count; i++) roles.push(rng.pick(['nurse', 'community_agent', 'community_agent']));
  }

  return roles.map((role, i) => {
    const trained = rng.bool(role === 'community_agent' ? 0.8 : 0.7);
    return {
      name: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}${i === 0 ? '' : ''}`,
      role,
      pevTrained: trained,
      pevTrainingDate: trained ? new Date(NOW - rng.int(60, 720) * DAY) : null,
    };
  });
}

function makeColdChain(
  rng: ReturnType<typeof createPrng>,
  type: FacilityType,
  forceHs: boolean,
): { equipments: ColdChainEquipment[]; capacityDoses: number; operational: boolean } {
  const n =
    type === 'hospital' ? rng.int(4, 6) :
    type === 'health_center' ? rng.int(2, 3) :
    type === 'health_post' ? rng.int(1, 2) :
    rng.int(0, 1);

  const equipments: ColdChainEquipment[] = [];
  let capacity = 0;
  for (let i = 0; i < n; i++) {
    const t = i === 0 ? 'refrigerator' : rng.pick<ColdChainEquipment['type']>(['refrigerator', 'freezer', 'cold_box', 'vaccine_carrier']);
    const cap =
      t === 'refrigerator' ? rng.int(150, 400) :
      t === 'freezer' ? rng.int(80, 200) :
      t === 'cold_box' ? rng.int(15, 30) :
      rng.int(5, 12);
    const installed = new Date(NOW - rng.int(180, 2200) * DAY);
    const lastMaint = rng.bool(0.85) ? new Date(NOW - rng.int(30, 360) * DAY) : null;
    const nextMaint = lastMaint ? new Date(lastMaint.getTime() + rng.int(180, 365) * DAY) : null;
    let status: ColdChainEquipment['status'] = rng.pick(['operational', 'operational', 'operational', 'degraded']);
    if (forceHs && i === 0) status = rng.pick(['broken', 'broken', 'maintenance']);
    equipments.push({
      id: `eq-${rng.int(1000, 9999)}-${i}`,
      type: t,
      brand: rng.pick(COLD_BRANDS),
      capacity: cap,
      status,
      lastMaintenance: lastMaint,
      nextMaintenanceDue: nextMaint,
      installedDate: installed,
    });
    if (status === 'operational' || status === 'degraded') capacity += cap;
  }

  const operational = !forceHs && equipments.some((e) => e.status === 'operational');
  return { equipments, capacityDoses: capacity * 10, operational };
}

interface FacilityPlan {
  type: FacilityType;
  status: FacilityStatus;
  coldChainHs: boolean;
  connectivity: Connectivity;
}

function buildFacility(
  rng: ReturnType<typeof createPrng>,
  index: number,
  canton: Canton,
  plan: FacilityPlan,
): Facility {
  // Decentralise around the sub-prefecture center
  const r = Math.sqrt(rng.next()) * 8; // up to 8 km
  const theta = rng.next() * 2 * Math.PI;
  const lat = canton.spLat + (r * Math.cos(theta)) / 111;
  const lng = canton.spLng + (r * Math.sin(theta)) / (111 * Math.cos((canton.spLat * Math.PI) / 180));

  const prefix =
    plan.type === 'hospital' ? 'HR' :
    plan.type === 'health_center' ? 'CS' :
    plan.type === 'health_post' ? 'PS' : 'CdS';
  const name = `${plan.type === 'hospital' ? 'Hôpital Régional' : prefix === 'CS' ? 'Centre de Santé' : prefix === 'PS' ? 'Poste de Santé' : 'Case de Santé'} de ${canton.cantonName}${index > 0 ? ` ${index + 1}` : ''}`;
  const code = `TD-${canton.provinceId.split('-')[1].toUpperCase()}-${prefix}-${String(index + 1).padStart(3, '0')}-${canton.cantonId.slice(-3).toUpperCase()}`;

  const staff = makeStaff(rng, plan.type);
  const cc = makeColdChain(rng, plan.type, plan.coldChainHs);

  const baseCoverage = plan.status === 'closed' ? 0 : rng.int(35, 98);
  const variation = (spread: number) => Math.max(0, Math.min(100, baseCoverage + rng.int(-spread, spread)));

  const ratings: AccessibilityRating[] = ['easy', 'easy', 'moderate', 'moderate', 'difficult'];
  const wetRatings: AccessibilityRating[] = ['easy', 'moderate', 'moderate', 'difficult', 'difficult', 'very_difficult'];

  const strategies: VaccinationStrategy[] = ['fixed'];
  if (plan.type !== 'health_house') strategies.push('advanced');
  if (rng.bool(0.4)) strategies.push('mobile');
  if (strategies.length >= 3) strategies.push('mixed');

  const transport = (['foot', 'bike', 'motorbike', '4x4', 'pirogue'] as const).filter(() => rng.bool(0.55));
  if (transport.length === 0) transport.push('motorbike');

  const connQuality: 'good' | 'intermittent' | 'poor' =
    plan.connectivity === 'good' ? 'good' :
    plan.connectivity === 'intermittent' ? 'intermittent' : 'poor';

  const lastSession = plan.status === 'closed' ? null : new Date(NOW - rng.int(2, 60) * DAY);
  const lastVerified = rng.bool(0.7) ? new Date(NOW - rng.int(5, 240) * DAY) : null;

  return {
    id: `fac-${canton.cantonId}-${index}`,
    name,
    code,
    type: plan.type,
    status: plan.status,
    provinceId: canton.provinceId,
    districtId: canton.depId,
    departmentId: canton.depId,
    subPrefectureId: canton.spId,
    cantonId: canton.cantonId,
    lat,
    lng,
    address: `${canton.cantonName}, ${canton.spId.split('-').slice(-1)[0]}`,
    staff,
    staffCount: staff.length,
    pevTrainedCount: staff.filter((s) => s.pevTrained).length,
    coldChainEquipments: cc.equipments,
    coldChainCapacityDoses: cc.capacityDoses,
    coldChainCapacity: cc.capacityDoses,
    coldChainOperational: cc.operational,
    villagesServed: 0,
    populationCovered: 0,
    targetPopulationUnder5: 0,
    averageRadiusKm: parseFloat((rng.range(4, 18)).toFixed(1)),
    vaccinationStrategies: strategies,
    sessionsPerMonth: plan.status === 'closed' ? 0 : rng.int(2, 8),
    lastSessionDate: lastSession,
    monthlyCoverage: {
      bcg: variation(8),
      dtc1: variation(6),
      dtc3: baseCoverage,
      measles: variation(10),
    },
    roadAccess: {
      drySeasonAccess: rng.pick(ratings),
      wetSeasonAccess: rng.pick(wetRatings),
    },
    transportModesAvailable: transport,
    mobileNetwork: {
      available: plan.connectivity !== 'none',
      quality: connQuality,
      operators: plan.connectivity === 'none' ? [] : OPERATORS.filter(() => rng.bool(0.5)),
    },
    hasInternet: plan.connectivity === 'good' && rng.bool(0.6),
    connectivity: plan.connectivity,
    createdAt: new Date(NOW - rng.int(365, 3650) * DAY),
    updatedAt: new Date(NOW - rng.int(1, 60) * DAY),
    lastVerifiedAt: lastVerified,
    verifiedBy: lastVerified ? `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}` : null,
    dataQualityScore: rng.int(55, 98),
  };
}

let cache: Facility[] | null = null;

function generate(): Facility[] {
  if (cache) return cache;
  const rng = createPrng(777);

  const lacCantons = flattenCantons('td-lac', LAC_DEPARTMENTS);
  const kanemCantons = flattenCantons('td-kanem', KANEM_DEPARTMENTS);
  const hadjerCantons = flattenCantons('td-hadjer-lamis', HADJER_LAMIS_DEPARTMENTS);

  const facilities: Facility[] = [];

  // 1) Hôpital Régional de Bol (premier canton = bol-centre)
  const bolCanton = lacCantons.find((c) => c.cantonId.endsWith('bol-centre'))!;
  facilities.push(buildFacility(rng, 0, bolCanton, {
    type: 'hospital',
    status: 'operational',
    coldChainHs: false,
    connectivity: 'good',
  }));

  // 2) Pour chaque canton Lac → 1 CS principal + parfois 1 PS/CdS
  for (const c of lacCantons) {
    if (c.cantonId.endsWith('bol-centre')) continue; // déjà hospital
    facilities.push(buildFacility(rng, 0, c, {
      type: 'health_center',
      status: 'operational',
      coldChainHs: false,
      connectivity: 'intermittent',
    }));
  }

  // 3) Extras pour atteindre 40 sur le Lac (PS et CdS)
  while (facilities.length < 40) {
    const c = rng.pick(lacCantons);
    const t: FacilityType = rng.bool(0.6) ? 'health_post' : 'health_house';
    const existing = facilities.filter((f) => f.cantonId === c.cantonId).length;
    facilities.push(buildFacility(rng, existing, c, {
      type: t,
      status: 'operational',
      coldChainHs: false,
      connectivity: rng.pick<Connectivity>(['intermittent', 'none', 'good']),
    }));
  }

  // 4) Cohérence Kanem & Hadjer-Lamis : 1 CS par canton (non comptés dans les 40)
  for (const c of [...kanemCantons, ...hadjerCantons]) {
    facilities.push(buildFacility(rng, 0, c, {
      type: rng.bool(0.7) ? 'health_center' : 'health_post',
      status: 'operational',
      coldChainHs: false,
      connectivity: rng.pick<Connectivity>(['intermittent', 'none', 'intermittent']),
    }));
  }

  // 5) Application de la variance ciblée sur les 40 du Lac
  const lacOnly = facilities.slice(0, 40);
  const pick = (n: number, predicate: (f: Facility) => boolean = () => true) => {
    const pool = lacOnly.filter(predicate);
    const out: Facility[] = [];
    while (out.length < n && pool.length > 0) {
      const idx = Math.floor(rng.next() * pool.length);
      out.push(pool.splice(idx, 1)[0]);
    }
    return out;
  };

  // Statuts : 30 op, 6 dégradées, 3 fermées, 1 en construction (hôpital exclu, toujours op)
  for (const f of pick(6, (f) => f.type !== 'hospital')) f.status = 'degraded';
  for (const f of pick(3, (f) => f.type !== 'hospital' && f.status === 'operational')) f.status = 'closed';
  for (const f of pick(1, (f) => f.type !== 'hospital' && f.status === 'operational')) f.status = 'under_construction';

  // Chaîne du froid HS : 6 facilities
  for (const f of pick(6, (f) => f.type !== 'hospital' && f.status !== 'closed')) {
    f.coldChainOperational = false;
    if (f.coldChainEquipments[0]) {
      f.coldChainEquipments[0].status = rng.pick(['broken', 'broken', 'maintenance']);
    }
  }

  // Connectivité : 10 none / 15 intermittent / 15 good
  for (const f of pick(10)) { f.connectivity = 'none'; f.mobileNetwork.available = false; f.mobileNetwork.quality = 'poor'; f.mobileNetwork.operators = []; f.hasInternet = false; }
  for (const f of pick(15, (f) => f.connectivity !== 'none')) { f.connectivity = 'intermittent'; f.mobileNetwork.quality = 'intermittent'; }

  cache = facilities;
  return facilities;
}

export function getFacilities(): Facility[] {
  return generate();
}

export function getFacility(id: string): Facility | undefined {
  return generate().find((f) => f.id === id);
}

export function getFacilitiesForCanton(cantonId: string): Facility[] {
  return generate().filter((f) => f.cantonId === cantonId);
}
