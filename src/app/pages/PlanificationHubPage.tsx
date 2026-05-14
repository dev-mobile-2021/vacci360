import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Download, AlertTriangle, Tent, MoreVertical, ChevronRight,
  Users, TrendingUp, ClipboardList, Clock,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import {
  mockMicroPlans, MICROPLAN_STATUS_LABEL, MICROPLAN_STATUS_COLOR,
  type MicroPlan,
} from '../data/mockMicroPlans';

const TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'active', label: 'En cours' },
  { key: 'pending', label: 'En attente' },
  { key: 'draft', label: 'Brouillons' },
  { key: 'archived', label: 'Archivés' },
] as const;

type TabKey = typeof TABS[number]['key'];

function filterByTab(plans: MicroPlan[], tab: TabKey): MicroPlan[] {
  switch (tab) {
    case 'active': return plans.filter((p) => p.status === 'in_execution');
    case 'pending': return plans.filter((p) => p.status === 'submitted');
    case 'draft': return plans.filter((p) => ['draft', 'generated', 'adjusted'].includes(p.status));
    case 'archived': return plans.filter((p) => ['closed', 'rejected'].includes(p.status));
    default: return plans;
  }
}

function CoverageBar({ value }: { value: number }) {
  const color = value >= 90 ? 'bg-success' : value >= 75 ? 'bg-warning' : 'bg-danger';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-stone-600">{value}%</span>
    </div>
  );
}

function ExecutionProgress({ plan }: { plan: MicroPlan }) {
  if (!plan.executionProgress) return null;
  const { villagesVisited, villagesTotal } = plan.executionProgress;
  const pct = Math.round((villagesVisited / villagesTotal) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-stone-600">{villagesVisited}/{villagesTotal}</span>
    </div>
  );
}

export default function PlanificationHubPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const kpis = useMemo(() => {
    const active = mockMicroPlans.filter((p) => p.status === 'in_execution').length;
    const pending = mockMicroPlans.filter((p) => p.status === 'submitted').length;
    const drafts = mockMicroPlans.filter((p) => ['draft', 'generated', 'adjusted'].includes(p.status)).length;
    const conflicts = mockMicroPlans.reduce((sum, p) => sum + p.resourceConflicts.filter((c) => !c.resolvedAt).length, 0);
    return { active, pending, drafts, conflicts };
  }, []);

  const visiblePlans = useMemo(() => filterByTab(mockMicroPlans, activeTab), [activeTab]);

  const formatPeriod = (start: Date, end: Date) => {
    const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    return `${fmt(start)} → ${fmt(end)}`;
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbPage>Planification</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-xl font-bold text-stone-900">Planification des campagnes</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download size={14} /> Exporter
            </Button>
            <Button size="sm" onClick={() => navigate('/planification/nouveau')}>
              <Plus size={14} /> Nouveau micro-plan
            </Button>
          </div>
        </div>
      </div>

      {/* Conflict banner */}
      {kpis.conflicts > 0 && (
        <div className="flex items-center justify-between gap-3 bg-warning/10 border border-warning/30 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-warning-700">
            <AlertTriangle size={16} className="text-warning flex-shrink-0" />
            <span>
              <strong>{kpis.conflicts} conflit{kpis.conflicts > 1 ? 's' : ''} de ressources</strong> détecté{kpis.conflicts > 1 ? 's' : ''} entre micro-plans.
            </span>
          </div>
          <button
            className="text-sm font-medium text-warning-700 hover:underline flex items-center gap-1 whitespace-nowrap"
            onClick={() => {
              const planWithConflict = mockMicroPlans.find((p) => p.resourceConflicts.some((c) => !c.resolvedAt));
              if (planWithConflict) navigate(`/planification/${planWithConflict.id}`);
            }}
          >
            Voir les conflits <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Micro-plans actifs', value: kpis.active, icon: TrendingUp, color: 'text-primary' },
          { label: 'En attente validation', value: kpis.pending, icon: Clock, color: 'text-orange-600' },
          { label: 'Brouillons', value: kpis.drafts, icon: ClipboardList, color: 'text-stone-600' },
          {
            label: 'Conflits ressources', value: kpis.conflicts, icon: AlertTriangle,
            color: kpis.conflicts > 0 ? 'text-danger' : 'text-stone-600',
            badge: kpis.conflicts > 0,
          },
        ].map((k) => (
          <div key={k.label} className={`bg-white rounded-xl border p-4 ${k.badge ? 'border-danger/30 bg-danger/5' : 'border-stone-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-500">{k.label}</span>
              <k.icon size={16} className={k.color} />
            </div>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-stone-100">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[11px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full">
                {filterByTab(mockMicroPlans, tab.key).length}
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                {['Nom', 'Zone', 'Statut', '', '', 'Villages', 'Période', 'Équipes', 'Couverture', ''].map((h, i) => (
                  <th key={i} className="px-3 py-2.5 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiblePlans.map((plan) => {
                const hasConflict = plan.resourceConflicts.some((c) => !c.resolvedAt);
                const teamsCount = plan.generationParams.availableTeams.length;
                return (
                  <tr
                    key={plan.id}
                    className="border-b border-stone-100 last:border-0 hover:bg-stone-50/60 cursor-pointer transition-colors"
                    onClick={() => navigate(`/planification/${plan.id}`)}
                  >
                    {/* Nom + campagne */}
                    <td className="px-3 py-3">
                      <div className="font-medium text-stone-800 text-sm">{plan.name}</div>
                      <div className="text-[11px] text-stone-400 mt-0.5">{plan.campaignId}</div>
                    </td>
                    {/* Zone */}
                    <td className="px-3 py-3 text-xs text-stone-600">
                      <div>{plan.provinceId.replace('td-', '').replace('-', ' ')}</div>
                      {plan.districtId && (
                        <div className="text-stone-400 text-[11px]">{plan.districtId.split('-').slice(2).join(' ')}</div>
                      )}
                    </td>
                    {/* Statut */}
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${MICROPLAN_STATUS_COLOR[plan.status]}`}>
                        {MICROPLAN_STATUS_LABEL[plan.status]}
                      </span>
                    </td>
                    {/* Nomades */}
                    <td className="px-3 py-3">
                      {plan.generationParams.nomadOpportunitiesIncluded.length > 0 && (
                        <div className="flex items-center gap-1 text-primary" title={`${plan.systemProposal.nomadStopsCount} arrêts nomades`}>
                          <Tent size={14} />
                          <span className="text-[11px] font-medium">{plan.systemProposal.nomadStopsCount}</span>
                        </div>
                      )}
                    </td>
                    {/* Conflit */}
                    <td className="px-3 py-3">
                      {hasConflict && (
                        <AlertTriangle size={14} className="text-danger" title="Conflit ressource" />
                      )}
                    </td>
                    {/* Villages */}
                    <td className="px-3 py-3">
                      {plan.status === 'in_execution' && plan.executionProgress ? (
                        <ExecutionProgress plan={plan} />
                      ) : (
                        <span className="text-xs text-stone-600">
                          {plan.systemProposal.totalVillages} villages
                        </span>
                      )}
                    </td>
                    {/* Période */}
                    <td className="px-3 py-3 text-xs text-stone-500 whitespace-nowrap">
                      {formatPeriod(plan.generationParams.startDate, plan.generationParams.endDate)}
                    </td>
                    {/* Équipes */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-stone-400" />
                        <span className="text-xs text-stone-600">{teamsCount}</span>
                      </div>
                    </td>
                    {/* Couverture */}
                    <td className="px-3 py-3">
                      <CoverageBar value={plan.systemProposal.estimatedCoverage} />
                    </td>
                    {/* Actions */}
                    <td className="px-3 py-3">
                      <button
                        className="p-1 rounded hover:bg-stone-100 transition-colors"
                        onClick={(e) => { e.stopPropagation(); navigate(`/planification/${plan.id}`); }}
                      >
                        <MoreVertical size={14} className="text-stone-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {visiblePlans.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm text-stone-400">
                    Aucun micro-plan dans cette catégorie
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
