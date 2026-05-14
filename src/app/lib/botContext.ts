/** Context functions for VacciBot — pull live mock data to generate intelligent answers */

import { mockMissions } from '../data/mockMissions';
import { mockMicroPlans } from '../data/mockMicroPlans';
import { mockNomadOpportunities } from '../data/mockNomadOpportunities';
import { mockStock } from '../data/mockStock';
import { mockAllocations } from '../data/mockAllocations';
import { mockProvinceKPIs, mockNationalSummary } from '../data/mockAnalytics';

export interface AppContext {
  // Coverage
  getLacCoverage(): number;
  getKanemCoverage(): number;
  getNationalDtc3(): number;
  getProvinceCoverage(provinceId: string): number | null;

  // Missions & teams
  getActiveMissionsCount(): number;
  getActiveTeamsCount(): number;
  getBestTeam(): { name: string; coverage: number };
  getWorstTeam(): { name: string; coverage: number };
  getMissionsWithIssues(): number;

  // Villages & children
  getNeverVisitedCount(): number;
  getMissedChildrenTotal(): number;
  getTotalChildrenNational(): number;

  // Plans
  getActivePlansCount(): number;
  getPlansAwaitingValidation(): number;
  getTotalItineraries(): number;

  // Nomad
  getNomadOpportunitiesOpen(): number;
  getNomadContactsYTD(): number;
  getRecentNomadOpportunities(): { name: string; province: string; children: number }[];

  // Stock
  getCriticalStockItems(): { antigen: string; facility: string; level: string }[];
  getStockAlertsCount(): number;

  // Allocations
  getPendingAllocationsCount(): number;

  // National summary
  getNationalSummary(): typeof mockNationalSummary;

  // Province ranking
  getTopProvinces(n?: number): { name: string; coverage: number }[];
  getBottomProvinces(n?: number): { name: string; coverage: number }[];
}

export function buildBotContext(): AppContext {
  // Pre-compute once
  const activeMissions = mockMissions.filter((m) => m.status === 'in_progress');
  const completedMissions = mockMissions.filter((m) => m.status === 'completed');
  const allMissions = [...activeMissions, ...completedMissions];

  const teamCoverageMap = new Map<string, { given: number; target: number }>();
  allMissions.forEach((m) => {
    const entry = teamCoverageMap.get(m.teamId) ?? { given: 0, target: 0 };
    const given = m.fieldReports
      .flatMap((r) => r.vaccinations ?? [])
      .reduce((s, v) => s + v.dosesGiven, 0);
    entry.given += given;
    entry.target += m.planned.villages.reduce((s, v) => s + v.targetChildren, 0);
    teamCoverageMap.set(m.teamId, entry);
  });

  const teamsWithCoverage = Array.from(teamCoverageMap.entries()).map(([id, { given, target }]) => ({
    name: id,
    coverage: target > 0 ? Math.round((given / target) * 100) : 0,
  })).sort((a, b) => b.coverage - a.coverage);

  return {
    getLacCoverage: () => mockProvinceKPIs.find((p) => p.provinceId === 'td-lac')?.dtc3Coverage ?? 0,
    getKanemCoverage: () => mockProvinceKPIs.find((p) => p.provinceId === 'td-kanem')?.dtc3Coverage ?? 0,
    getNationalDtc3: () => mockNationalSummary.dtc3NationalCoverage,
    getProvinceCoverage: (id) => mockProvinceKPIs.find((p) => p.provinceId === id)?.dtc3Coverage ?? null,

    getActiveMissionsCount: () => activeMissions.length,
    getActiveTeamsCount: () => new Set(activeMissions.map((m) => m.teamId)).size,
    getBestTeam: () => teamsWithCoverage[0] ?? { name: 'N/D', coverage: 0 },
    getWorstTeam: () => teamsWithCoverage[teamsWithCoverage.length - 1] ?? { name: 'N/D', coverage: 0 },
    getMissionsWithIssues: () =>
      mockMissions.filter((m) => m.fieldReports.some((r) => r.type === 'issue')).length,

    getNeverVisitedCount: () => {
      const visitedIds = new Set(
        allMissions.flatMap((m) => m.fieldReports.map((r) => r.villageId)),
      );
      const allPlanVillages = new Set(
        mockMicroPlans.flatMap((p) =>
          (p.activeVersion?.itineraries ?? []).flatMap((it) => it.villages.map((v) => v.villageId)),
        ),
      );
      return [...allPlanVillages].filter((id) => !visitedIds.has(id)).length;
    },
    getMissedChildrenTotal: () =>
      mockProvinceKPIs.reduce((s, p) => s + p.missedChildren, 0),
    getTotalChildrenNational: () => mockNationalSummary.totalChildren,

    getActivePlansCount: () =>
      mockMicroPlans.filter((p) => ['validated', 'in_execution'].includes(p.status)).length,
    getPlansAwaitingValidation: () =>
      mockMicroPlans.filter((p) => p.status === 'submitted').length,
    getTotalItineraries: () =>
      mockMicroPlans.reduce(
        (s, p) => s + (p.activeVersion?.itineraries.length ?? 0),
        0,
      ),

    getNomadOpportunitiesOpen: () =>
      mockNomadOpportunities.filter((n) => n.status === 'identified').length,
    getNomadContactsYTD: () => mockNationalSummary.nomadContactsYTD,
    getRecentNomadOpportunities: () =>
      mockNomadOpportunities
        .filter((n) => n.status === 'identified')
        .slice(0, 3)
        .map((n) => ({
          name: n.location.description,
          province: n.nearestFacilityName,
          children: n.estimatedChildren,
        })),

    getCriticalStockItems: () =>
      mockStock
        .filter((s) => s.status === 'shortage' || s.quantityAvailable < s.quantityReserved)
        .slice(0, 5)
        .map((s) => ({
          antigen: s.antigen,
          facility: s.locationName,
          level: s.status === 'shortage' ? 'critique' : 'faible',
        })),
    getStockAlertsCount: () =>
      mockStock.filter((s) => s.status === 'shortage').length,

    getPendingAllocationsCount: () =>
      mockAllocations.filter((a) => a.status === 'reserved').length,

    getNationalSummary: () => mockNationalSummary,

    getTopProvinces: (n = 3) =>
      [...mockProvinceKPIs]
        .sort((a, b) => b.dtc3Coverage - a.dtc3Coverage)
        .slice(0, n)
        .map((p) => ({ name: p.provinceName, coverage: p.dtc3Coverage })),
    getBottomProvinces: (n = 3) =>
      [...mockProvinceKPIs]
        .sort((a, b) => a.dtc3Coverage - b.dtc3Coverage)
        .slice(0, n)
        .map((p) => ({ name: p.provinceName, coverage: p.dtc3Coverage })),
  };
}

export const botContext = buildBotContext();
