import type { GeoNode } from '../types/geography';
import type { Village } from '../types/village';
import type { Facility } from '../types/facility';
import { createPrng } from './prng';
import {
  CHAD_PROVINCES,
  LAC_DEPARTMENTS,
  KANEM_DEPARTMENTS,
  HADJER_LAMIS_DEPARTMENTS,
  VILLAGE_NAMES_POOL,
  type DepartmentSeed,
} from './chadProvinces';
import { getFacilities as getRichFacilities, getFacilitiesForCanton } from './mockFacilities';

interface Generated {
  nodes: GeoNode[];
  villages: Village[];
  facilities: Facility[];
}

const COUNTRY_POPULATION = 17_000_000;
const NOW = Date.now();

function dataset(): Generated {
  const rng = createPrng(42);
  const nodes: GeoNode[] = [];
  const villages: Village[] = [];
  const facilities: Facility[] = [];

  // Country
  nodes.push({
    id: 'td',
    level: 'country',
    name: 'Tchad',
    code: 'TD',
    parentId: null,
    population: COUNTRY_POPULATION,
    centroidLat: 15.45,
    centroidLng: 18.73,
    childrenCount: CHAD_PROVINCES.length,
  });

  // Provinces — all 23
  for (const p of CHAD_PROVINCES) {
    const id = `td-${p.slug}`;
    nodes.push({
      id,
      level: 'province',
      name: p.name,
      code: p.code,
      parentId: 'td',
      population: p.population,
      centroidLat: p.lat,
      centroidLng: p.lng,
      childrenCount: 0,
    });
  }

  // Facilities are now sourced from mockFacilities (rich registry).
  const allFacilities = getRichFacilities();
  facilities.push(...allFacilities);
  // Reset desserte counts — we will populate them below from villages.
  for (const f of facilities) {
    f.villagesServed = 0;
    f.populationCovered = 0;
    f.targetPopulationUnder5 = 0;
  }

  const primaryFacilityForCanton = (cantonId: string): Facility | undefined => {
    const list = getFacilitiesForCanton(cantonId);
    if (list.length === 0) return undefined;
    // Prefer operational, then by type preference (hospital > CS > PS > CdS).
    const pref = { hospital: 0, health_center: 1, health_post: 2, health_house: 3 } as const;
    return [...list].sort((a, b) => {
      const aOp = a.status === 'closed' ? 1 : 0;
      const bOp = b.status === 'closed' ? 1 : 0;
      if (aOp !== bOp) return aOp - bOp;
      return pref[a.type] - pref[b.type];
    })[0];
  };

  function buildDepartments(provinceId: string, departments: DepartmentSeed[]) {
    const provinceNode = nodes.find((n) => n.id === provinceId)!;
    provinceNode.childrenCount = departments.length;

    for (const dep of departments) {
      const depId = `${provinceId}-${dep.slug}`;
      nodes.push({
        id: depId,
        level: 'department',
        name: dep.name,
        code: `${provinceNode.code}-${dep.slug.toUpperCase().slice(0, 4)}`,
        parentId: provinceId,
        population: 0, // filled below
        centroidLat: dep.lat,
        centroidLng: dep.lng,
        childrenCount: dep.subPrefectures.length,
      });

      let depPop = 0;
      for (const sp of dep.subPrefectures) {
        const spId = `${depId}-${sp.slug}`;
        nodes.push({
          id: spId,
          level: 'sub_prefecture',
          name: sp.name,
          code: `${depId.toUpperCase()}-${sp.slug.toUpperCase().slice(0, 4)}`,
          parentId: depId,
          population: 0,
          centroidLat: sp.lat,
          centroidLng: sp.lng,
          childrenCount: sp.cantons.length,
        });
        let spPop = 0;

        for (let ci = 0; ci < sp.cantons.length; ci++) {
          const canton = sp.cantons[ci];
          const cantonId = `${spId}-${canton.slug}`;
          const cantonCenter = rng.pointAround(sp.lat, sp.lng, 12);
          const facility = primaryFacilityForCanton(cantonId);
          if (!facility) {
            throw new Error(`No facility found for canton ${cantonId}`);
          }

          const cantonNode: GeoNode = {
            id: cantonId,
            level: 'canton',
            name: canton.name,
            code: `${cantonId.toUpperCase()}`,
            parentId: spId,
            population: 0,
            centroidLat: cantonCenter.lat,
            centroidLng: cantonCenter.lng,
            childrenCount: canton.villagesCount,
          };
          nodes.push(cantonNode);

          let cantonPop = 0;
          for (let vi = 0; vi < canton.villagesCount; vi++) {
            const village = makeVillage(
              rng,
              provinceId,
              depId,
              spId,
              cantonId,
              facility.id,
              cantonCenter.lat,
              cantonCenter.lng,
              vi,
            );
            cantonPop += village.population;
            facility.villagesServed += 1;
            facility.populationCovered += village.population;
            facility.targetPopulationUnder5 += village.estimatedChildrenUnder5;
            villages.push(village);
            nodes.push(village);
          }
          cantonNode.population = cantonPop;
          spPop += cantonPop;
        }
        const spNode = nodes.find((n) => n.id === spId)!;
        spNode.population = spPop;
        depPop += spPop;
      }
      const depNode = nodes.find((n) => n.id === depId)!;
      depNode.population = depPop;
    }
  }

  buildDepartments('td-lac', LAC_DEPARTMENTS);
  buildDepartments('td-kanem', KANEM_DEPARTMENTS);
  buildDepartments('td-hadjer-lamis', HADJER_LAMIS_DEPARTMENTS);

  return { nodes, villages, facilities };
}

let cache: Generated | null = null;
function generate(): Generated {
  if (!cache) cache = dataset();
  return cache;
}

/* --------------------------------- Villages -------------------------------- */

const TARGET_DISTRIBUTION = {
  /** Number of villages forced into specific states for demo richness. */
  neverVisited: 18,         // 15-20 demandés
  lowCoverage: 8,           // <50% — 5-10 demandés
  highCoverage: 35,         // >95% — 30-40 demandés
  veryDifficultWet: 13,     // 10-15 demandés
  needsReview: 10,          // 8-12 demandés
  lowQuality: 3,            // 2-3 demandés
};

function makeVillage(
  rng: ReturnType<typeof createPrng>,
  provinceId: string,
  departmentId: string,
  spId: string,
  cantonId: string,
  facilityId: string,
  cantonLat: number,
  cantonLng: number,
  index: number,
): Village {
  const seedKey = `${cantonId}-${index}`;
  // Stable hash from key → reuse rng for now (already deterministic)
  const center = rng.pointAround(cantonLat, cantonLng, 8);
  const name = rng.pick(VILLAGE_NAMES_POOL);
  const suffix = index > 0 ? ` ${roman(index + 1)}` : '';
  const id = `vil-${cantonId}-${index}`;
  const population = rng.int(120, 2400);
  const childrenUnder5 = Math.round(population * (0.15 + rng.next() * 0.06));

  // Quality + visit defaults (will be tuned afterwards by buildVillagesWithDistribution)
  const daysSinceLastVisit = rng.int(2, 180);
  const lastVisit = new Date(NOW - daysSinceLastVisit * 86_400_000);

  // Coverage distribution — most around 60-85
  const overall = clamp(
    Math.round(rng.range(35, 100) * 0.85 + rng.range(50, 95) * 0.15),
    0,
    100,
  );
  const variation = (base: number, spread: number) =>
    clamp(Math.round(base + rng.range(-spread, spread)), 0, 100);

  const distanceKm = parseFloat((rng.range(0.5, 32)).toFixed(1));
  const travelMin = Math.round(distanceKm * rng.range(2.5, 6));

  const ratings: Village['accessibility']['drySeasonAccess'][] = [
    'easy', 'easy', 'moderate', 'moderate', 'difficult',
  ];
  const wetRatings: Village['accessibility']['drySeasonAccess'][] = [
    'easy', 'moderate', 'moderate', 'difficult', 'difficult', 'very_difficult',
  ];

  return {
    id,
    level: 'village',
    name: `${name}${suffix}`,
    code: `${cantonId.toUpperCase()}-V${String(index + 1).padStart(3, '0')}`,
    parentId: cantonId,
    population,
    centroidLat: center.lat,
    centroidLng: center.lng,
    childrenCount: 0,
    facilityId,
    facilityDistanceKm: distanceKm,
    facilityTravelTimeMin: travelMin,
    estimatedChildrenUnder5: childrenUnder5,
    accessibility: {
      drySeasonAccess: rng.pick(ratings),
      wetSeasonAccess: rng.pick(wetRatings),
    },
    infrastructure: {
      hasSchool: rng.bool(0.55),
      hasWaterPoint: rng.bool(0.7),
      hasMarket: rng.bool(0.3),
      hasMosque: rng.bool(0.8),
    },
    lastVaccinationVisit: lastVisit,
    daysSinceLastVisit,
    vaccinationCoverage: {
      bcg: variation(overall, 8),
      dtc1: variation(overall, 6),
      dtc3: variation(overall, 10),
      measles: variation(overall, 12),
      overall,
    },
    dataQualityScore: rng.int(55, 98),
    validationStatus: rng.pick(['pending', 'validated', 'validated', 'validated', 'needs_review']),
    validatedBy: null,
    validatedAt: null,
    photos: [],
  };
}

function applyTargetedDistribution(villages: Village[]) {
  const rng = createPrng(1337);
  const pickN = (n: number, predicate: (v: Village) => boolean = () => true) => {
    const candidates = villages.filter(predicate);
    const out: Village[] = [];
    const pool = [...candidates];
    while (out.length < n && pool.length > 0) {
      const idx = Math.floor(rng.next() * pool.length);
      out.push(pool.splice(idx, 1)[0]);
    }
    return out;
  };

  // 1) Jamais visités
  for (const v of pickN(TARGET_DISTRIBUTION.neverVisited)) {
    v.lastVaccinationVisit = null;
    v.daysSinceLastVisit = null;
    v.vaccinationCoverage = { bcg: 0, dtc1: 0, dtc3: 0, measles: 0, overall: 0 };
  }
  // 2) Couverture < 50%
  for (const v of pickN(TARGET_DISTRIBUTION.lowCoverage, (v) => v.lastVaccinationVisit !== null)) {
    const base = rng.int(20, 48);
    v.vaccinationCoverage = {
      bcg: clamp(base + rng.int(-5, 10), 0, 100),
      dtc1: clamp(base + rng.int(-5, 8), 0, 100),
      dtc3: base,
      measles: clamp(base + rng.int(-8, 8), 0, 100),
      overall: base,
    };
  }
  // 3) Couverture > 95%
  for (const v of pickN(TARGET_DISTRIBUTION.highCoverage, (v) => v.lastVaccinationVisit !== null)) {
    const base = rng.int(96, 100);
    v.vaccinationCoverage = {
      bcg: clamp(base + rng.int(-2, 2), 90, 100),
      dtc1: clamp(base + rng.int(-2, 2), 90, 100),
      dtc3: base,
      measles: clamp(base + rng.int(-2, 2), 90, 100),
      overall: base,
    };
  }
  // 4) Très difficile en saison des pluies
  for (const v of pickN(TARGET_DISTRIBUTION.veryDifficultWet)) {
    v.accessibility.wetSeasonAccess = 'very_difficult';
  }
  // 5) Needs review
  for (const v of pickN(TARGET_DISTRIBUTION.needsReview)) {
    v.validationStatus = 'needs_review';
  }
  // 6) Qualité < 50
  for (const v of pickN(TARGET_DISTRIBUTION.lowQuality)) {
    v.dataQualityScore = rng.int(25, 49);
  }
  // Stamp validations
  const validators = ['Dr. Aminata Hassan', 'Fatimé Abakar', 'Mahamat Idriss'];
  for (const v of villages) {
    if (v.validationStatus === 'validated') {
      v.validatedBy = rng.pick(validators);
      v.validatedAt = new Date(NOW - rng.int(2, 120) * 86_400_000);
    }
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function roman(n: number) {
  const map: Array<[number, string]> = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let s = '';
  let x = n;
  for (const [v, t] of map) {
    while (x >= v) { s += t; x -= v; }
  }
  return s;
}

/* ----------------------------------- API ----------------------------------- */

export function getGeoNodes(): GeoNode[] {
  return generate().nodes;
}

export function getVillages(): Village[] {
  return generate().villages;
}

export function getFacilities(): Facility[] {
  return generate().facilities;
}

export function getNode(id: string): GeoNode | undefined {
  return getGeoNodes().find((n) => n.id === id);
}

export function getChildren(parentId: string | null): GeoNode[] {
  return getGeoNodes().filter((n) => n.parentId === parentId);
}

export function getAncestors(id: string): GeoNode[] {
  const out: GeoNode[] = [];
  let cur = getNode(id);
  while (cur && cur.parentId) {
    const parent = getNode(cur.parentId);
    if (!parent) break;
    out.unshift(parent);
    cur = parent;
  }
  return out;
}

export function getDescendantsCount(id: string): number {
  const all = getGeoNodes();
  const set = new Set<string>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of all) {
      if (n.parentId && set.has(n.parentId) && !set.has(n.id)) {
        set.add(n.id);
        changed = true;
      }
    }
  }
  set.delete(id);
  return set.size;
}

// Apply targeted distribution once at module load
applyTargetedDistribution(generate().villages);
