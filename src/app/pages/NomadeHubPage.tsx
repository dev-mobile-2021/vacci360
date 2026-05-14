import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Tent, Users, Shield, AlertTriangle, CheckCircle2,
  Clock, ExternalLink,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../lib/auth';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import {
  mockNomadOpportunities,
  GROUP_TYPE_LABEL, GROUP_TYPE_COLOR, CONFIDENCE_LABEL, CONFIDENCE_COLOR, STATUS_LABEL,
  type NomadOpportunity,
} from '../data/mockNomadOpportunities';
import { useToast } from '../lib/toast';
import { NomadOpportunityCreateModal } from '../components/nomads/NomadOpportunityCreateModal';

const TABS = [
  { key: 'all', label: 'Toutes les opportunités' },
  { key: 'seasonal_nomad', label: 'Saisonnières' },
  { key: 'displaced_refugee', label: 'Déplacés/Réfugiés' },
] as const;
type TabKey = typeof TABS[number]['key'];

function CountdownBadge({ windowEnd }: { windowEnd: Date }) {
  const now = Date.now();
  const diffMs = windowEnd.getTime() - now;
  const diffDays = Math.ceil(diffMs / 86_400_000);

  if (diffMs < 0) return <span className="text-[11px] text-stone-400">Expirée</span>;
  if (diffDays <= 2) return <span className="flex items-center gap-1 text-[11px] text-danger font-medium"><Clock size={10} />J-{diffDays}</span>;
  if (diffDays <= 7) return <span className="flex items-center gap-1 text-[11px] text-warning font-medium"><Clock size={10} />J-{diffDays}</span>;
  return <span className="flex items-center gap-1 text-[11px] text-success"><Clock size={10} />J-{diffDays}</span>;
}

function TypeIcon({ type }: { type: NomadOpportunity['groupType'] }) {
  if (type === 'seasonal_nomad') return <Tent size={13} className="text-amber-600" />;
  if (type === 'displaced') return <Users size={13} className="text-stone-500" />;
  return <Shield size={13} className="text-slate-500" />;
}

export default function NomadeHubPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const canSeeDisplacedRefugee =
    user?.permissions?.['Nomades']?.['Voir'] &&
    ['FULL', 'READ_ALL'].includes(user.permissions['Nomades']['Voir']);

  const visibleOpps = useMemo(() => {
    const base = canSeeDisplacedRefugee
      ? mockNomadOpportunities
      : mockNomadOpportunities.filter((o) => o.accessLevel === 'public');

    switch (activeTab) {
      case 'seasonal_nomad': return base.filter((o) => o.groupType === 'seasonal_nomad');
      case 'displaced_refugee': return base.filter((o) => o.groupType === 'displaced' || o.groupType === 'refugee');
      default: return base;
    }
  }, [activeTab, canSeeDisplacedRefugee]);

  const kpis = useMemo(() => {
    const base = canSeeDisplacedRefugee
      ? mockNomadOpportunities
      : mockNomadOpportunities.filter((o) => o.accessLevel === 'public');

    const now = Date.now();
    const weekEnd = now + 7 * 86_400_000;
    const monthStart = new Date(); monthStart.setDate(1);
    const monthEnd = new Date(monthStart); monthEnd.setMonth(monthEnd.getMonth() + 1);

    return {
      total: base.filter((o) => o.status !== 'missed').length,
      activeThisWeek: base.filter((o) => o.windowStart.getTime() <= weekEnd && o.windowEnd.getTime() >= now).length,
      integrated: base.filter((o) => !!o.linkedMicroPlanId && o.status !== 'missed').length,
      missed: base.filter((o) => o.status === 'missed').length,
    };
  }, [canSeeDisplacedRefugee]);

  const formatWindow = (start: Date, end: Date) => {
    const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    return `${fmt(start)} → ${fmt(end)}`;
  };

  const anonymizeCount = (opp: NomadOpportunity) => {
    if (opp.accessLevel === 'restricted' && (opp.groupType === 'displaced' || opp.groupType === 'refugee')) {
      const approxPop = Math.round(opp.estimatedPopulation / 50) * 50;
      return { pop: `~${approxPop} personnes`, children: `~${Math.round(opp.estimatedChildren / 10) * 10} enfants` };
    }
    return { pop: `${opp.estimatedPopulation} personnes`, children: `${opp.estimatedChildren} enfants` };
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/planification">Planification</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Populations mobiles</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-xl font-bold text-stone-900">Populations mobiles</h1>
          <Button size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus size={14} /> Signaler une opportunité
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Opportunités identifiées', value: kpis.total, icon: Tent, color: 'text-amber-600' },
          { label: 'Fenêtres actives cette semaine', value: kpis.activeThisWeek, icon: Clock, color: 'text-primary' },
          { label: 'Intégrées dans des plans', value: kpis.integrated, icon: CheckCircle2, color: 'text-success' },
          { label: 'Manquées ce mois', value: kpis.missed, icon: AlertTriangle, color: kpis.missed > 0 ? 'text-danger' : 'text-stone-400' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-stone-200 p-4">
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
        <div className="flex border-b border-stone-100">
          {TABS.filter((tab) => tab.key !== 'displaced_refugee' || canSeeDisplacedRefugee).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                {['Type', 'Localisation', 'Population / Enfants', 'Fenêtre', 'Confiance', 'Source', 'FOSA proche', 'Équipes dispo', 'Plan', 'Statut'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleOpps.map((opp) => {
                const counts = anonymizeCount(opp);
                return (
                  <tr
                    key={opp.id}
                    className="border-b border-stone-100 last:border-0 hover:bg-stone-50/60 cursor-pointer transition-colors"
                    onClick={() => navigate(`/nomades/opportunites/${opp.id}`)}
                  >
                    {/* Type */}
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${GROUP_TYPE_COLOR[opp.groupType]}`}>
                        <TypeIcon type={opp.groupType} />
                        {GROUP_TYPE_LABEL[opp.groupType]}
                      </span>
                    </td>
                    {/* Localisation */}
                    <td className="px-3 py-2.5">
                      <div className="text-xs text-stone-700 max-w-[160px] truncate">{opp.location.description}</div>
                    </td>
                    {/* Population */}
                    <td className="px-3 py-2.5">
                      <div className="text-xs text-stone-700">{counts.pop}</div>
                      <div className="text-[11px] text-stone-400">{counts.children}</div>
                    </td>
                    {/* Fenêtre */}
                    <td className="px-3 py-2.5">
                      <div className="text-xs text-stone-600 whitespace-nowrap">{formatWindow(opp.windowStart, opp.windowEnd)}</div>
                      <CountdownBadge windowEnd={opp.windowEnd} />
                    </td>
                    {/* Confiance */}
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${CONFIDENCE_COLOR[opp.confidenceLevel]}`}>
                        {CONFIDENCE_LABEL[opp.confidenceLevel]}
                      </span>
                    </td>
                    {/* Source */}
                    <td className="px-3 py-2.5 text-[11px] text-stone-400 max-w-[100px] truncate">{opp.dataSource}</td>
                    {/* FOSA */}
                    <td className="px-3 py-2.5">
                      <div className="text-xs text-stone-600">{opp.nearestFacilityName}</div>
                      <div className="text-[11px] text-stone-400">{opp.distanceKm} km</div>
                    </td>
                    {/* Équipes dispo */}
                    <td className="px-3 py-2.5">
                      {opp.teamsAvailableInWindow.length === 0 ? (
                        <span className="flex items-center gap-1 text-[11px] text-warning font-medium">
                          <AlertTriangle size={10} /> 0
                        </span>
                      ) : (
                        <span className="text-xs text-stone-600">{opp.teamsAvailableInWindow.length}</span>
                      )}
                    </td>
                    {/* Plan */}
                    <td className="px-3 py-2.5">
                      {opp.linkedMicroPlanId ? (
                        <button
                          className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                          onClick={(e) => { e.stopPropagation(); navigate(`/planification/${opp.linkedMicroPlanId}`); }}
                        >
                          <ExternalLink size={10} /> Plan
                        </button>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>
                    {/* Statut */}
                    <td className="px-3 py-2.5">
                      <span className={`text-[11px] font-medium ${
                        opp.status === 'executed' ? 'text-success' :
                        opp.status === 'planned' ? 'text-primary' :
                        opp.status === 'missed' ? 'text-danger' : 'text-stone-600'
                      }`}>
                        {STATUS_LABEL[opp.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {visibleOpps.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm text-stone-400">
                    Aucune opportunité dans cette catégorie
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NomadOpportunityCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
