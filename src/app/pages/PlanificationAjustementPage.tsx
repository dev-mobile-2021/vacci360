import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  AlertTriangle, CheckCircle2, Info, Tent, MapPin,
  GripVertical, X, Plus, Users, Clock,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../lib/toast';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import {
  mockMicroPlans,
  type MicroPlan, type DayItinerary, type UrgentAdjustment,
} from '../data/mockMicroPlans';

const TABS = [
  { key: 'itineraries', label: 'Itinéraires' },
  { key: 'villages', label: 'Villages' },
  { key: 'teams', label: 'Équipes' },
  { key: 'urgent', label: 'Ajustement urgent' },
] as const;
type TabKey = typeof TABS[number]['key'];

const EXCLUDE_REASONS = [
  'Village inaccessible (route coupée)',
  'Refus communautaire',
  'Village déjà couvert',
  'Insécurité',
  'Autre',
];

const REASSIGN_TEAMS = ['team-lac-03', 'team-lac-04', 'team-lac-05'];

export default function PlanificationAjustementPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const plan: MicroPlan = mockMicroPlans.find((p) => p.id === id) ?? mockMicroPlans[6];
  const isInExecution = plan.status === 'in_execution';
  const active = plan.versions[plan.activeVersionIndex];

  const [activeTab, setActiveTab] = useState<TabKey>(isInExecution ? 'urgent' : 'itineraries');
  const [modifications, setModifications] = useState(0);
  const [versionLabel, setVersionLabel] = useState('Ajustement GP v' + (plan.versions.length + 1));
  const [excludedVillages, setExcludedVillages] = useState<Record<string, string>>({});
  const [excludeTarget, setExcludeTarget] = useState<string | null>(null);
  const [excludeReason, setExcludeReason] = useState('');
  const [urgentAdjustments, setUrgentAdjustments] = useState<UrgentAdjustment[]>(
    plan.executionProgress?.urgentAdjustments ?? [],
  );
  const [reassignTargets, setReassignTargets] = useState<Record<string, string>>({});

  const allVillages = useMemo(
    () => active?.itineraries.flatMap((i) => i.villages) ?? [],
    [active],
  );

  const handleMoveVillage = (villageId: string) => {
    setModifications((m) => m + 1);
    toast({ type: 'info', title: 'Village déplacé', description: `${villageId} réordonné.` });
  };

  const handleExclude = (villageId: string) => {
    setExcludeTarget(villageId);
    setExcludeReason('');
  };

  const confirmExclude = () => {
    if (!excludeTarget || !excludeReason) return;
    setExcludedVillages((prev) => ({ ...prev, [excludeTarget]: excludeReason }));
    setModifications((m) => m + 1);
    setExcludeTarget(null);
  };

  const handleApplyUrgentAdjustment = (adj: UrgentAdjustment) => {
    const toTeam = reassignTargets[adj.id];
    setUrgentAdjustments((prev) =>
      prev.map((a) => a.id === adj.id ? { ...a, status: 'applied', toTeamId: toTeam ?? a.toTeamId } : a),
    );
    setModifications((m) => m + 1);
    toast({
      type: 'success',
      title: 'Ajustement appliqué',
      description: `${adj.villagesReassigned.length} village(s) réaffecté(s). Équipes terrain notifiées.`,
    });
  };

  const handleRejectUrgentAdjustment = (adj: UrgentAdjustment) => {
    setUrgentAdjustments((prev) =>
      prev.map((a) => a.id === adj.id ? { ...a, status: 'rejected' } : a),
    );
    toast({ type: 'info', title: 'Signalement rejeté', description: "L'équipe terrain a été informée." });
  };

  const handleSave = () => {
    toast({
      type: 'success',
      title: 'Version sauvegardée',
      description: `"${versionLabel}" créée avec ${modifications} modification(s).`,
    });
    navigate(`/planification/${plan.id}`);
  };

  // ─── Tab renders ───────────────────────────────────────────────────────────

  const renderItineraries = () => (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
        <Info size={12} className="mt-0.5 flex-shrink-0" />
        Glissez-déposez les villages pour réorganiser l'itinéraire. Un arrêt nomade ne peut être supprimé sans confirmation.
      </div>

      {active?.itineraries.map((itin) => (
        <div key={`${itin.teamId}-${itin.day}`} className="border border-stone-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
            <div className="text-xs font-semibold text-stone-700">
              {itin.teamId} — Jour {itin.day} · {itin.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </div>
            <div className="text-[11px] text-stone-400">{itin.totalDistanceKm} km · {itin.fuelEstimatedLiters} L</div>
          </div>
          <div className="divide-y divide-stone-50">
            {itin.villages.filter((v) => !excludedVillages[v.villageId]).map((v) => (
              <div
                key={v.villageId}
                className={`flex items-center gap-3 px-3 py-2.5 group ${v.nomadOpportunityId ? 'bg-primary/5' : 'hover:bg-stone-50'}`}
              >
                <GripVertical size={14} className="text-stone-300 cursor-grab flex-shrink-0" />
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {v.nomadOpportunityId && <Tent size={12} className="text-primary flex-shrink-0" />}
                  <span className="text-xs font-medium text-stone-700">{v.estimatedArrival}</span>
                  <span className="text-xs text-stone-600 truncate">{v.villageName}</span>
                  <span className="text-[11px] text-stone-400 ml-1">{v.targetChildren} enf.</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="text-[10px] text-stone-400 hover:text-primary px-1.5 py-0.5 rounded border border-stone-200 hover:border-primary"
                    onClick={() => handleMoveVillage(v.villageId)}
                  >
                    Déplacer
                  </button>
                  {!v.nomadOpportunityId ? (
                    <button
                      className="text-[10px] text-stone-400 hover:text-danger px-1.5 py-0.5 rounded border border-stone-200 hover:border-danger/30"
                      onClick={() => handleExclude(v.villageId)}
                    >
                      Exclure
                    </button>
                  ) : (
                    <button
                      className="text-[10px] text-stone-300 cursor-not-allowed px-1.5 py-0.5 rounded border border-stone-100"
                      title="Arrêt nomade — confirmation requise"
                    >
                      <Tent size={10} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-stone-100">
            <button className="flex items-center gap-1 text-[11px] text-primary hover:underline">
              <Plus size={11} /> Ajouter un village
            </button>
          </div>
        </div>
      ))}

      {/* Exclude reason modal inline */}
      {excludeTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-80 shadow-lg">
            <div className="text-sm font-semibold text-stone-800 mb-3">Motif d'exclusion *</div>
            <select
              className="w-full text-sm border border-stone-200 rounded px-2 py-2 mb-3 focus:outline-none"
              value={excludeReason}
              onChange={(e) => setExcludeReason(e.target.value)}
            >
              <option value="">Sélectionner...</option>
              {EXCLUDE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setExcludeTarget(null)}>Annuler</Button>
              <Button size="sm" className="flex-1" disabled={!excludeReason} onClick={confirmExclude}>Confirmer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderVillages = () => (
    <div className="space-y-3">
      <div className="border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="px-3 py-2.5 text-left w-8"></th>
              {['Village', 'Équipe', 'Jour', 'Enfants', 'Statut'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-stone-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allVillages.map((v) => {
              const isExcluded = !!excludedVillages[v.villageId];
              const itin = active?.itineraries.find((i) => i.villages.some((x) => x.villageId === v.villageId));
              return (
                <tr key={v.villageId} className={`border-b border-stone-50 last:border-0 ${isExcluded ? 'opacity-50' : ''}`}>
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={!isExcluded}
                      onChange={() => {
                        if (isExcluded) {
                          setExcludedVillages((prev) => { const n = { ...prev }; delete n[v.villageId]; return n; });
                          setModifications((m) => m + 1);
                        } else {
                          handleExclude(v.villageId);
                        }
                      }}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      {v.nomadOpportunityId && <Tent size={11} className="text-primary" />}
                      <span className="text-xs font-medium text-stone-700">{v.villageName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-stone-500">{itin?.teamId ?? '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-stone-500">J{itin?.day ?? '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-stone-600">{v.targetChildren}</td>
                  <td className="px-3 py-2.5">
                    {isExcluded ? (
                      <span className="text-[11px] text-danger">Exclu · {excludedVillages[v.villageId]}</span>
                    ) : (
                      <span className="text-[11px] text-success">Inclus</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTeams = () => (
    <div className="space-y-3">
      <div className="text-xs text-stone-500 mb-2">Réaffecter des zones entre équipes ou modifier les assignations.</div>
      {plan.generationParams.availableTeams.map((teamId) => {
        const itins = active?.itineraries.filter((i) => i.teamId === teamId) ?? [];
        return (
          <div key={teamId} className="border border-stone-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-stone-400" />
                <span className="text-sm font-medium text-stone-700">{teamId}</span>
              </div>
              <button
                className="text-[11px] text-primary hover:underline"
                onClick={() => {
                  setModifications((m) => m + 1);
                  toast({ type: 'info', title: "Échange d'itinéraire", description: "Sélectionnez l'équipe cible pour le swap." });
                }}
              >
                Échanger itinéraires
              </button>
            </div>
            <div className="text-xs text-stone-500">
              {itins.length} jour(s) · {itins.flatMap((i) => i.villages).length} villages ·{' '}
              {itins.reduce((s, i) => s + i.totalDistanceKm, 0)} km
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderUrgent = () => {
    if (!isInExecution) {
      return (
        <div className="py-12 text-center text-sm text-stone-400">
          Onglet disponible uniquement pour les plans en exécution
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 text-xs text-warning-700">
          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-warning" />
          Plan en exécution. Les modifications affectent les équipes terrain en temps réel.
        </div>

        {urgentAdjustments.length === 0 && (
          <div className="py-8 text-center text-sm text-stone-400">Aucun signalement terrain en cours</div>
        )}

        {urgentAdjustments.map((adj) => (
          <div key={adj.id} className={`border rounded-lg p-4 ${
            adj.status === 'applied' ? 'border-success/30 bg-success/5' :
            adj.status === 'rejected' ? 'border-stone-200 opacity-60' :
            'border-warning/30 bg-warning/5'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={13} className="text-warning" />
                  <span className="text-sm font-semibold text-stone-800">Signalement terrain</span>
                  {adj.status !== 'pending' && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${adj.status === 'applied' ? 'bg-success/10 text-success-700' : 'bg-stone-100 text-stone-500'}`}>
                      {adj.status === 'applied' ? 'Appliqué' : 'Rejeté'}
                    </span>
                  )}
                </div>
                <div className="text-xs text-stone-700 mb-0.5">{adj.reason}</div>
                <div className="text-[11px] text-stone-400">
                  Équipe : <strong>{adj.affectedTeamId}</strong> · Villages impactés : {adj.villagesReassigned.join(', ')}
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1">
                  <Clock size={10} />
                  {adj.triggeredAt.toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                  {' · '}{adj.triggeredBy}
                </div>
              </div>
            </div>

            {adj.status === 'pending' && (
              <div className="mt-3 space-y-2">
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">Réaffecter à</label>
                  <select
                    className="text-xs border border-stone-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    value={reassignTargets[adj.id] ?? adj.toTeamId ?? ''}
                    onChange={(e) => setReassignTargets((r) => ({ ...r, [adj.id]: e.target.value }))}
                  >
                    <option value="">Sélectionner une équipe...</option>
                    {REASSIGN_TEAMS.filter((t) => t !== adj.affectedTeamId).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="_report">Reporter à demain</option>
                    <option value="_exclude">Exclure du plan</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApplyUrgentAdjustment(adj)}
                    disabled={!reassignTargets[adj.id] && !adj.toTeamId}
                  >
                    <CheckCircle2 size={13} /> Appliquer
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => handleRejectUrgentAdjustment(adj)}
                  >
                    <X size={13} /> Rejeter
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {urgentAdjustments.some((a) => a.status === 'applied') && (
          <div className="bg-stone-50 rounded-lg p-3">
            <div className="text-xs font-semibold text-stone-700 mb-2">Historique des ajustements appliqués</div>
            {urgentAdjustments.filter((a) => a.status === 'applied').map((a) => (
              <div key={a.id} className="text-xs text-stone-500">
                ✓ {a.affectedTeamId} → {a.toTeamId} · {a.villagesReassigned.join(', ')}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const tabContent: Record<TabKey, () => JSX.Element> = {
    itineraries: renderItineraries,
    villages: renderVillages,
    teams: renderTeams,
    urgent: renderUrgent,
  };

  return (
    <div className="space-y-4 pb-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/planification">Planification</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href={`/planification/${plan.id}`}>{plan.name}</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Ajustement</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-xl font-bold text-stone-900 mt-1">Ajustement manuel</h1>
      </div>

      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
        <Info size={13} className="mt-0.5 flex-shrink-0" />
        Modifications tracées. Une nouvelle version sera créée à la sauvegarde.
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Left panel */}
        <div className="col-span-2 space-y-4">
          {/* Tabs */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="flex border-b border-stone-100">
              {TABS.map((tab) => {
                const showDot = tab.key === 'urgent' && isInExecution && urgentAdjustments.some((a) => a.status === 'pending');
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-2.5 text-xs font-medium transition-colors flex-1 flex items-center justify-center gap-1 ${
                      activeTab === tab.key ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-stone-500 hover:text-stone-700'
                    } ${tab.key === 'urgent' && !isInExecution ? 'opacity-40' : ''}`}
                    disabled={tab.key === 'urgent' && !isInExecution}
                  >
                    {tab.label}
                    {showDot && <span className="w-1.5 h-1.5 bg-warning rounded-full" />}
                  </button>
                );
              })}
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {tabContent[activeTab]()}
            </div>
          </div>
        </div>

        {/* Right panel — map */}
        <div className="col-span-3 bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 bg-stone-50">
            <div className="text-xs font-semibold text-stone-700">Carte des itinéraires</div>
          </div>
          <div className="h-[420px] flex items-center justify-center bg-stone-50">
            <div className="text-center text-stone-400">
              <MapPin size={28} className="mx-auto mb-2" />
              <div className="text-xs">Mise à jour en temps réel selon modifications</div>
              {nomadCount > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-primary mt-1.5 justify-center">
                  <Tent size={11} /> Arrêts nomades visibles
                </div>
              )}
              {urgentAdjustments.some((a) => a.status === 'pending') && (
                <div className="flex items-center gap-1 text-[11px] text-danger mt-1 justify-center">
                  <AlertTriangle size={11} /> Villages en signalement
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer sticky */}
      <div className="sticky bottom-0 bg-white border-t border-stone-200 px-4 py-3 flex items-center justify-between -mx-0 rounded-b-xl">
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-500">
            <strong>{modifications}</strong> modification{modifications !== 1 ? 's' : ''}
          </span>
          <span className="text-stone-300">·</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">Nouvelle version :</span>
            <input
              type="text"
              className="text-xs border border-stone-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary w-48"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/planification/${plan.id}`)}>
            Annuler
          </Button>
          <Button size="sm" disabled={modifications === 0} onClick={handleSave}>
            Sauvegarder
          </Button>
        </div>
      </div>
    </div>
  );
}

const nomadCount = 2; // static for map label
