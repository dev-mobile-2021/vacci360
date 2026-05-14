/** Mock analytics data for Sprint 6 — Pilotage Exécutif */

import { CHAD_PROVINCES } from './chadProvinces';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MonthlyMetric {
  month: string;          // "2025-01"
  provinceId: string;
  provinceName: string;
  antigen: string;
  targetChildren: number;
  vaccinatedChildren: number;
  coverage: number;       // %
  wastedDoses: number;
  sessionsConducted: number;
  nomadContacts: number;
  dropouts: number;       // dropout from DTC1 to DTC3 equivalent
}

export interface ProvinceKPI {
  provinceId: string;
  provinceName: string;
  lat: number;
  lng: number;
  dtc3Coverage: number;
  bcgCoverage: number;
  vpoCoverage: number;
  rougeoleCoverage: number;
  pcv13Coverage: number;
  totalChildren: number;
  totalVaccinated: number;
  missedChildren: number;
  activePlans: number;
  activeTeams: number;
  lastUpdateDate: string;
  trend: 'up' | 'down' | 'stable';
  zeroVaccineVillages: number;
  nomadContactsYTD: number;
}

export interface NationalSummary {
  dtc3NationalCoverage: number;
  bcgNationalCoverage: number;
  totalChildren: number;
  totalVaccinated: number;
  activeMissions: number;
  activeTeams: number;
  nomadContactsYTD: number;
  provincesAbove80: number;
  provincesBelow50: number;
  lastUpdated: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Monthly Metrics (12 months × 3 pilot provinces × 5 antigens = 180 rows) ─

const PILOT_PROVINCES = [
  { id: 'td-lac',          name: 'Lac',           baseCov: 75, trend: +0.8 },
  { id: 'td-kanem',        name: 'Kanem',         baseCov: 62, trend: +1.2 },
  { id: 'td-hadjer-lamis', name: 'Hadjer-Lamis',  baseCov: 81, trend: +0.5 },
];

const ANTIGENS = ['BCG', 'DTC3', 'VPO', 'Rougeole', 'PCV13'];
const ANTIGEN_MODIFIER: Record<string, number> = {
  BCG: +8, DTC3: 0, VPO: +3, Rougeole: -4, PCV13: -2,
};

const BASE_TARGETS: Record<string, number> = {
  'td-lac': 12400, 'td-kanem': 9800, 'td-hadjer-lamis': 14200,
};

export const mockMonthlyMetrics: MonthlyMetric[] = (() => {
  const rows: MonthlyMetric[] = [];
  for (const prov of PILOT_PROVINCES) {
    for (let m = 0; m < 12; m++) {
      const monthStr = `2025-${String(m + 1).padStart(2, '0')}`;
      for (const antigen of ANTIGENS) {
        const rng = seededRand(prov.id.charCodeAt(3) * 100 + m * 7 + antigen.charCodeAt(0));
        const noise = (rng() - 0.5) * 6;
        const cov = Math.min(99, Math.max(30,
          prov.baseCov + ANTIGEN_MODIFIER[antigen] + prov.trend * m + noise,
        ));
        const target = Math.round(BASE_TARGETS[prov.id] * (0.9 + rng() * 0.2));
        const vaccinated = Math.round(target * cov / 100);
        rows.push({
          month: monthStr,
          provinceId: prov.id,
          provinceName: prov.name,
          antigen,
          targetChildren: target,
          vaccinatedChildren: vaccinated,
          coverage: Math.round(cov * 10) / 10,
          wastedDoses: Math.round(vaccinated * (0.04 + rng() * 0.06)),
          sessionsConducted: Math.round(12 + rng() * 20),
          nomadContacts: Math.round(rng() * 45),
          dropouts: antigen === 'DTC3' ? Math.round((target - vaccinated) * 0.3) : 0,
        });
      }
    }
  }
  return rows;
})();

// ─── Province KPIs (all 23 Chad provinces) ───────────────────────────────────

// Realistic DTC3 coverage spread — pilot provinces slightly higher
const PROVINCE_BASE_COVERAGE: Record<string, number> = {
  'td-lac':             76,
  'td-kanem':           63,
  'td-hadjer-lamis':    82,
  'td-ndjamena':        88,
  'td-chari-baguirmi':  71,
  'td-batha':           54,
  'td-guera':           49,
  'td-ouaddai':         51,
  'td-wadi-fira':       46,
  'td-sila':            43,
  'td-salamat':         55,
  'td-moyen-chari':     68,
  'td-mandoul':         72,
  'td-logone-occidental': 78,
  'td-logone-oriental': 75,
  'td-tandjile':        73,
  'td-mayo-kebbi-est':  80,
  'td-mayo-kebbi-ouest': 77,
  'td-borkou':          39,
  'td-tibesti':         27,
  'td-ennedi-est':      33,
  'td-ennedi-ouest':    31,
  'td-barh-el-gazel':   58,
};

export const mockProvinceKPIs: ProvinceKPI[] = CHAD_PROVINCES.map((p) => {
  const id = `td-${p.slug}`;
  const rng = seededRand(p.code.charCodeAt(3) * 1337);
  const dtc3 = PROVINCE_BASE_COVERAGE[id] ?? Math.round(40 + rng() * 40);
  const noise = () => Math.round((rng() - 0.5) * 8);
  const bcg  = Math.min(99, Math.max(20, dtc3 + 7 + noise()));
  const vpo  = Math.min(99, Math.max(20, dtc3 + 3 + noise()));
  const rou  = Math.min(99, Math.max(20, dtc3 - 5 + noise()));
  const pcv  = Math.min(99, Math.max(20, dtc3 - 3 + noise()));
  const children = Math.round(p.population * (0.14 + rng() * 0.04));
  const vaccinated = Math.round(children * dtc3 / 100);
  const missed = children - vaccinated;
  const isNorth = p.lat > 15;
  return {
    provinceId: id,
    provinceName: p.name,
    lat: p.lat,
    lng: p.lng,
    dtc3Coverage: dtc3,
    bcgCoverage: bcg,
    vpoCoverage: vpo,
    rougeoleCoverage: rou,
    pcv13Coverage: pcv,
    totalChildren: children,
    totalVaccinated: vaccinated,
    missedChildren: missed,
    activePlans: isNorth ? 0 : Math.round(1 + rng() * 3),
    activeTeams: isNorth ? 0 : Math.round(2 + rng() * 8),
    lastUpdateDate: isNorth ? '2025-11-15' : `2026-05-${String(Math.round(1 + rng() * 13)).padStart(2, '0')}`,
    trend: dtc3 >= 70 ? 'up' : dtc3 >= 50 ? 'stable' : 'down',
    zeroVaccineVillages: Math.round(rng() * (isNorth ? 25 : 8)),
    nomadContactsYTD: Math.round(rng() * (isNorth ? 180 : 40)),
  };
});

// ─── National Summary ─────────────────────────────────────────────────────────

export const mockNationalSummary: NationalSummary = (() => {
  const total = mockProvinceKPIs.reduce((s, p) => s + p.totalChildren, 0);
  const vaccinated = mockProvinceKPIs.reduce((s, p) => s + p.totalVaccinated, 0);
  return {
    dtc3NationalCoverage: Math.round((vaccinated / total) * 100 * 10) / 10,
    bcgNationalCoverage: Math.round(
      mockProvinceKPIs.reduce((s, p) => s + p.bcgCoverage, 0) / mockProvinceKPIs.length,
    ),
    totalChildren: total,
    totalVaccinated: vaccinated,
    activeMissions: 8,
    activeTeams: 34,
    nomadContactsYTD: mockProvinceKPIs.reduce((s, p) => s + p.nomadContactsYTD, 0),
    provincesAbove80: mockProvinceKPIs.filter((p) => p.dtc3Coverage >= 80).length,
    provincesBelow50: mockProvinceKPIs.filter((p) => p.dtc3Coverage < 50).length,
    lastUpdated: '2026-05-14T08:30:00Z',
  };
})();

// ─── Helpers for charts ───────────────────────────────────────────────────────

/** Monthly series for a given province (or 'all' for weighted mean across pilots) */
export function getMonthlySeriesForAntigen(
  antigen: string,
  provinceId: string | 'all' = 'all',
): { month: string; coverage: number; vaccinatedChildren: number }[] {
  const months = [...new Set(mockMonthlyMetrics.map((r) => r.month))].sort();
  return months.map((month) => {
    const rows = mockMonthlyMetrics.filter(
      (r) => r.month === month && r.antigen === antigen &&
        (provinceId === 'all' || r.provinceId === provinceId),
    );
    if (rows.length === 0) return { month, coverage: 0, vaccinatedChildren: 0 };
    const totalTarget = rows.reduce((s, r) => s + r.targetChildren, 0);
    const totalVacc = rows.reduce((s, r) => s + r.vaccinatedChildren, 0);
    return {
      month,
      coverage: Math.round((totalVacc / totalTarget) * 1000) / 10,
      vaccinatedChildren: totalVacc,
    };
  });
}

/** Heatmap data: province × antigen coverage matrix */
export function getHeatmapData(): { province: string; antigen: string; coverage: number }[] {
  const result: { province: string; antigen: string; coverage: number }[] = [];
  for (const prov of PILOT_PROVINCES) {
    for (const antigen of ANTIGENS) {
      const rows = mockMonthlyMetrics.filter(
        (r) => r.provinceId === prov.id && r.antigen === antigen,
      );
      const avgCov = rows.reduce((s, r) => s + r.coverage, 0) / rows.length;
      result.push({ province: prov.name, antigen, coverage: Math.round(avgCov * 10) / 10 });
    }
  }
  return result;
}

/** Scatter data: coverage vs missed children for all provinces */
export function getScatterData(): { name: string; coverage: number; missed: number; population: number }[] {
  return mockProvinceKPIs.map((p) => ({
    name: p.provinceName,
    coverage: p.dtc3Coverage,
    missed: p.missedChildren,
    population: p.totalChildren,
  }));
}
