import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  AlertTriangle, CheckCircle2, XCircle, Tent, ChevronRight,
  GitCompare, Clock, User, MapPin, Zap, FileText,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../lib/toast';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import {
  mockMicroPlans, MICROPLAN_STATUS_LABEL, MICROPLAN_STATUS_COLOR,
  type MicroPlan, type PlanVersion,
} from '../data/mockMicroPlans';
import { mockNomadOpportunities } from '../data/mockNomadOpportunities';

const TABS = [
  { key: 'overview', label: "Vue d'ensemble" },
  { key: 'itineraries', label: 'Itinéraires' },
  { key: 'resources', label: 'Ressources' },
  { key: 'conflicts', label: 'Conflits' },
  { key: 'validation', label: 'Validation' },
  { key: 'versions', label: 'Versions' },
  { key: 'history', label: 'Historique' },
] as const;

type TabKey = typeof TABS[number]['key'];

const WORKFLOW_STEPS = [
  { status: ['draft', 'generated', 'adjusted'], label: 'Brouillon', icon: FileText },
  { status: ['submitted'], label: 'Soumis', icon: ChevronRight },
  { status: ['validated'], label: 'Validé', icon: CheckCircle2 },
  { status: ['in_execution'], label: 'En exécution', icon: Zap },
  { status: ['closed'], label: 'Clôturé', icon: CheckCircle2 },
];

function VersionComparatorModal({
  open, onClose, versions,
}: { open: boolean; onClose: () => void; versions: PlanVersion[] }) {
  const [vA, setVA] = useState(0);
  const [vB, setVB] = useState(Math.min(1, versions.length - 1));
  const verA = versions[vA];
  const verB = versions[vB];

  const diffVillages = () => {
    const idsA = new Set(verA?.itineraries.flatMap((i) => i.villages.map((v) => v.villageId)));
    const idsB = new Set(verB?.itineraries.flatMap((i) => i.villages.map((v) => v.villageId)));
    const added = [...idsB].filter((id) => !idsA.has(id));
    const removed = [...idsA].filter((id) => !idsB.has(id));
    return { added, removed };
  };

  const diff = diffVillages();

  return (
    <Modal open={open} onClose={onClose} title="Comparer deux versions" width={700}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Version A</label>
          <select
            className="w-full text-sm border border-stone-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            value={vA}
            onChange={(e) => setVA(Number(e.target.value))}
          >
            {versions.map((v, i) => (
              <option key={i} value={i}>v{v.versionNumber} — {v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Version B</label>
          <select
            className="w-full text-sm border border-stone-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            value={vB}
            onChange={(e) => setVB(Number(e.target.value))}
          >
            {versions.map((v, i) => (
              <option key={i} value={i}>v{v.versionNumber} — {v.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-stone-50 rounded-lg p-3 space-y-2">
          <div className="text-xs font-semibold text-stone-700">{verA?.label}</div>
          <div className="text-[11px] text-stone-500">{verA?.itineraries.flatMap((i) => i.villages).length} villages · {verA?.itineraries.length} jours</div>
          <div className="text-[11px] text-stone-400">Par {verA?.createdBy}</div>
        </div>
        <div className="bg-stone-50 rounded-lg p-3 space-y-2">
          <div className="text-xs font-semibold text-stone-700">{verB?.label}</div>
          <div className="text-[11px] text-stone-500">{verB?.itineraries.flatMap((i) => i.villages).length} villages · {verB?.itineraries.length} jours</div>
          <div className="text-[11px] text-stone-400">Par {verB?.createdBy}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {diff.added.length > 0 && (
          <div className="flex items-start gap-2 text-xs bg-success/5 border border-success/20 rounded px-3 py-2">
            <span className="text-success font-bold">+</span>
            <span className="text-success-700">Villages ajoutés dans B : {diff.added.join(', ')}</span>
          </div>
        )}
        {diff.removed.length > 0 && (
          <div className="flex items-start gap-2 text-xs bg-danger/5 border border-danger/20 rounded px-3 py-2">
            <span className="text-danger font-bold">-</span>
            <span className="text-danger-700">Villages retirés dans B : {diff.removed.join(', ')}</span>
          </div>
        )}
        {diff.added.length === 0 && diff.removed.length === 0 && (
          <div className="text-xs text-stone-400 text-center py-2">Itinéraires identiques</div>
        )}
        {verB?.changes?.map((c) => (
          <div key={c} className="text-xs text-stone-600 bg-blue-50 border border-blue-100 rounded px-3 py-1.5">• {c}</div>
        ))}
      </div>
    </Modal>
  );
}

function RejectModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  return (
    <Modal
      open={open} onClose={onClose} title="Rejeter le plan"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" variant="destructive" disabled={!reason.trim()} onClick={() => onConfirm(reason)}>
            <XCircle size={14} /> Rejeter
          </Button>
        </>
      }
    >
      <div>
        <label className="block text-xs font-medium text-stone-700 mb-1">Motif de rejet *</label>
        <textarea
          rows={3}
          className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          placeholder="Expliquez la raison du rejet..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Modal>
  );
}

export default function PlanificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [comparatorOpen, setComparatorOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const plan = mockMicroPlans.find((p) => p.id === id) ?? mockMicroPlans[0];

  const unresolvedConflicts = plan.resourceConflicts.filter((c) => !c.resolvedAt);
  const nomadOpps = plan.generationParams.nomadOpportunitiesIncluded
    .map((id) => mockNomadOpportunities.find((o) => o.id === id))
    .filter(Boolean);

  const handleValidate = () => {
    toast({ type: 'success', title: 'Plan validé', description: 'Le gestionnaire de province sera notifié.' });
  };

  const handleReject = (reason: string) => {
    toast({ type: 'warning', title: 'Plan rejeté', description: reason });
    setRejectOpen(false);
  };

  const handleStartExecution = () => {
    toast({ type: 'success', title: 'Exécution démarrée', description: 'Les équipes terrain ont été notifiées.' });
  };

  const renderWorkflowStepper = () => {
    const statusOrder = ['draft', 'generated', 'adjusted', 'submitted', 'validated', 'in_execution', 'closed'];
    const currentIdx = statusOrder.indexOf(plan.status);

    return (
      <div className="flex items-center gap-0 mt-3 bg-stone-50 rounded-lg px-4 py-3 overflow-x-auto">
        {WORKFLOW_STEPS.map((ws, i) => {
          const isActive = ws.status.some((s) => s === plan.status);
          const isPast = WORKFLOW_STEPS.slice(0, i).some((prev) => prev.status.some((s) => statusOrder.indexOf(s) < currentIdx));
          const isDone = !isActive && statusOrder.indexOf(ws.status[0]) < currentIdx;
          const Icon = ws.icon;
          return (
            <div key={ws.label} className="flex items-center">
              <div className="flex flex-col items-center min-w-[80px]">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  isDone ? 'bg-success text-white' : isActive ? 'bg-primary text-white' : 'bg-stone-200 text-stone-400'
                }`}>
                  <Icon size={13} />
                </div>
                <div className={`text-[10px] mt-1 font-medium text-center ${isActive ? 'text-primary' : isDone ? 'text-success' : 'text-stone-400'}`}>
                  {ws.label}
                </div>
              </div>
              {i < WORKFLOW_STEPS.length - 1 && (
                <div className={`w-12 h-0.5 mb-3 ${isDone ? 'bg-success' : 'bg-stone-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderActions = () => {
    const s = plan.status;
    return (
      <div className="flex gap-2">
        {(s === 'draft' || s === 'adjusted' || s === 'generated') && (
          <>
            <Button size="sm" onClick={() => toast({ type: 'success', title: 'Plan soumis' })} disabled={unresolvedConflicts.length > 0}>
              <ChevronRight size={14} /> Soumettre
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/planification/${plan.id}/ajustement`)}>
              Ajuster
            </Button>
            <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10">
              <XCircle size={14} /> Supprimer
            </Button>
          </>
        )}
        {s === 'submitted' && (
          <>
            <Button size="sm" onClick={handleValidate}><CheckCircle2 size={14} /> Valider</Button>
            <Button variant="outline" size="sm" className="text-danger border-danger/30 hover:bg-danger/5" onClick={() => setRejectOpen(true)}>
              <XCircle size={14} /> Rejeter avec motif
            </Button>
          </>
        )}
        {s === 'validated' && (
          <Button size="sm" onClick={handleStartExecution}><Zap size={14} /> Démarrer l'exécution</Button>
        )}
        {s === 'in_execution' && (
          <>
            <Button size="sm" onClick={() => setActiveTab('overview')}>Voir progression</Button>
            <Button variant="outline" size="sm" className="text-warning border-warning/30" onClick={() => navigate(`/planification/${plan.id}/ajustement`)}>
              <AlertTriangle size={14} /> Ajustement urgent
            </Button>
          </>
        )}
        {s === 'closed' && (
          <Button size="sm"><FileText size={14} /> Rapport final</Button>
        )}
      </div>
    );
  };

  // ─── Tab content ───────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-stone-50 rounded-lg p-4 space-y-3">
          <div className="text-xs font-semibold text-stone-700">Paramètres</div>
          {[
            ['Campagne', plan.campaignId],
            ['Équipes', `${plan.generationParams.availableTeams.length} équipes`],
            ['Antigènes', plan.generationParams.antigens.join(', ')],
            ['Durée planifiée', `${plan.systemProposal.totalDays} jours`],
            ['Villages ciblés', plan.systemProposal.totalVillages],
            ['Carburant estimé', `${plan.systemProposal.estimatedFuelLiters} L`],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex justify-between text-xs">
              <span className="text-stone-500">{k}</span>
              <span className="text-stone-700 font-medium">{v}</span>
            </div>
          ))}
        </div>
        <div className="bg-stone-50 rounded-lg p-4 space-y-3">
          <div className="text-xs font-semibold text-stone-700">Scores système</div>
          {[
            ['Couverture estimée', `${plan.systemProposal.score.coverage}%`],
            ['Score coût', `${plan.systemProposal.score.cost}%`],
            ['Faisabilité', `${plan.systemProposal.score.feasibility}%`],
            ['Coût estimé', `${plan.systemProposal.estimatedCost.toLocaleString('fr-FR')} FCFA`],
            ['Arrêts nomades', plan.systemProposal.nomadStopsCount],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex justify-between text-xs">
              <span className="text-stone-500">{k}</span>
              <span className="text-stone-700 font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fake map placeholder */}
      <div className="bg-stone-100 rounded-lg h-48 flex items-center justify-center border border-stone-200">
        <div className="text-center text-stone-400">
          <MapPin size={24} className="mx-auto mb-2" />
          <div className="text-xs">Carte des itinéraires</div>
          {nomadOpps.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-primary mt-1 justify-center">
              <Tent size={11} /> {nomadOpps.length} arrêt{nomadOpps.length > 1 ? 's' : ''} nomade{nomadOpps.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {plan.status === 'in_execution' && plan.executionProgress && (
        <div className="bg-white border border-stone-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-stone-700 mb-3">Progression en cours</div>
          <div className="grid grid-cols-3 gap-4 mb-3">
            {[
              { label: 'Villages visités', value: `${plan.executionProgress.villagesVisited}/${plan.executionProgress.villagesTotal}` },
              { label: 'Enfants vaccinés', value: plan.executionProgress.childrenVaccinated.toLocaleString('fr-FR') },
              { label: 'Jours complétés', value: `${plan.executionProgress.daysCompleted}/${plan.systemProposal.totalDays}` },
            ].map((k) => (
              <div key={k.label} className="text-center">
                <div className="text-lg font-bold text-stone-800">{k.value}</div>
                <div className="text-[11px] text-stone-400">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.round((plan.executionProgress.villagesVisited / plan.executionProgress.villagesTotal) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {nomadOpps.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
            <Tent size={13} className="text-primary" /> Arrêts nomades intégrés
          </div>
          <div className="space-y-2">
            {nomadOpps.map((opp) => opp && (
              <div key={opp.id} className="flex items-center justify-between text-xs">
                <span className="text-stone-700">{opp.location.description}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  opp.status === 'executed' ? 'bg-success/10 text-success-700' : 'bg-primary/10 text-primary-700'
                }`}>
                  {opp.status === 'executed' ? 'Exécuté' : 'Planifié'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderItineraries = () => {
    const active = plan.versions[plan.activeVersionIndex];
    return (
      <div className="space-y-4">
        {plan.generationParams.availableTeams.map((teamId) => {
          const teamItins = active?.itineraries.filter((i) => i.teamId === teamId) ?? [];
          if (teamItins.length === 0) {
            teamItins.push(...(active?.itineraries ?? []));
          }
          return (
            <div key={teamId} className="bg-white border border-stone-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-stone-100 bg-stone-50">
                <div className="text-xs font-semibold text-stone-700 flex items-center gap-2">
                  <User size={12} /> {teamId}
                </div>
              </div>
              <div className="p-3 space-y-2">
                {teamItins.slice(0, 2).map((itin) => (
                  <div key={itin.day}>
                    <div className="text-[11px] font-semibold text-stone-500 mb-1.5">
                      Jour {itin.day} — {itin.date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </div>
                    <div className="space-y-1 pl-3 border-l-2 border-stone-100">
                      {itin.villages.map((v) => (
                        <div key={v.villageId} className={`flex items-center gap-2 text-xs py-1 px-2 rounded ${v.nomadOpportunityId ? 'bg-primary/5 border border-primary/10' : ''}`}>
                          {v.nomadOpportunityId && <Tent size={11} className="text-primary" />}
                          <span className="font-medium text-stone-700">{v.estimatedArrival}</span>
                          <span className="text-stone-600">{v.villageName}</span>
                          <span className="text-stone-400 ml-auto">{v.targetChildren} enfants · {v.estimatedDuration}min</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderResources = () => (
    <div className="space-y-3">
      <div className="bg-stone-50 rounded-lg p-4 text-sm text-stone-600">
        Allocations liées au plan.{' '}
        <button className="text-primary underline" onClick={() => navigate('/logistique/allocations')}>
          Voir dans le module Logistique →
        </button>
      </div>
      <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
        {plan.generationParams.availableTeams.map((t) => (
          <div key={t} className="flex items-center justify-between text-sm">
            <span className="text-stone-700">{t}</span>
            <span className="text-[11px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">Alloué</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderConflicts = () => {
    if (plan.resourceConflicts.length === 0) {
      return (
        <div className="py-12 text-center text-sm text-stone-400">
          <CheckCircle2 size={24} className="mx-auto mb-2 text-success" />
          Aucun conflit de ressources détecté
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {plan.resourceConflicts.map((conflict, i) => (
          <div key={i} className={`border rounded-lg p-4 ${conflict.resolvedAt ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} className={conflict.resolvedAt ? 'text-success' : 'text-danger'} />
                  <span className="text-sm font-semibold text-stone-800">
                    Conflit {conflict.type === 'team' ? 'équipe' : 'stock'}
                  </span>
                </div>
                <div className="text-xs text-stone-600">
                  Ressource : <strong>{conflict.resourceId}</strong>
                </div>
                <div className="text-xs text-stone-500">
                  Aussi dans : <strong>{conflict.conflictingPlanName}</strong>
                </div>
                <div className="text-[11px] text-stone-400 mt-1">
                  Détecté le {conflict.detectedAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                </div>
              </div>
              {conflict.resolvedAt && (
                <span className="text-[11px] bg-success/10 text-success-700 px-2 py-0.5 rounded font-medium">Résolu</span>
              )}
            </div>
            {!conflict.resolvedAt && (
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => toast({ type: 'success', title: 'Ressource retirée du plan' })}>
                  Retirer cette ressource
                </Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => toast({ type: 'info', title: 'Notification envoyée', description: 'Le GP du plan concurrent a été contacté.' })}>
                  Contacter GP concurrent
                </Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => toast({ type: 'warning', title: 'Escaladé au GN' })}>
                  Escalader au GN
                </Button>
              </div>
            )}
            {conflict.resolvedAt && (
              <div className="text-[11px] text-stone-500">
                Résolu par {conflict.resolvedBy} le {conflict.resolvedAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                {conflict.resolution && ` · ${conflict.resolution}`}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderValidation = () => (
    <div className="space-y-4">
      {/* Stepper vertical */}
      <div className="space-y-3">
        {[
          { label: 'Création', done: true, date: plan.versions[0]?.createdAt, by: plan.createdBy },
          { label: 'Soumission', done: !!plan.submittedAt, date: plan.submittedAt, by: plan.submittedBy },
          { label: 'Validation GN', done: !!plan.validatedAt, date: plan.validatedAt, by: plan.validatedBy, rejected: !!plan.rejectedAt },
          { label: 'Exécution', done: plan.status === 'in_execution' || plan.status === 'closed', date: plan.executionStartDate },
        ].map((step) => (
          <div key={step.label} className="flex gap-3">
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${step.done ? 'bg-success text-white' : step.rejected ? 'bg-danger text-white' : 'bg-stone-200'}`}>
              {step.done ? <CheckCircle2 size={12} /> : step.rejected ? <XCircle size={12} /> : <div className="w-2 h-2 rounded-full bg-stone-400" />}
            </div>
            <div className="flex-1 pb-3 border-b border-stone-50 last:border-0">
              <div className="text-xs font-medium text-stone-700">{step.label}</div>
              {step.date && (
                <div className="text-[11px] text-stone-400">
                  {step.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {step.by ? ` · par ${step.by}` : ''}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {plan.rejectedReason && (
        <div className="bg-danger/5 border border-danger/20 rounded-lg p-4">
          <div className="text-xs font-semibold text-danger mb-1">Motif du rejet</div>
          <div className="text-sm text-stone-700">{plan.rejectedReason}</div>
          <Button size="sm" className="mt-3" onClick={() => toast({ type: 'info', title: 'Révision démarrée' })}>
            Réviser et resoumettre
          </Button>
        </div>
      )}
    </div>
  );

  const renderVersions = () => (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setComparatorOpen(true)}>
          <GitCompare size={14} /> Comparer deux versions
        </Button>
      </div>
      {plan.versions.map((v, i) => (
        <div key={i} className={`border rounded-lg p-4 ${i === plan.activeVersionIndex ? 'border-primary/30 bg-primary/5' : 'border-stone-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-stone-800">v{v.versionNumber} — {v.label}</span>
              {i === plan.activeVersionIndex && (
                <span className="text-[10px] bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded">Active</span>
              )}
            </div>
            <span className="text-[11px] text-stone-400">
              {v.createdAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
            </span>
          </div>
          <div className="text-[11px] text-stone-500 mb-2">Par {v.createdBy}</div>
          {v.changes && v.changes.length > 0 && (
            <div className="space-y-0.5">
              {v.changes.map((c) => (
                <div key={c} className="text-xs text-stone-600">• {c}</div>
              ))}
            </div>
          )}
          <div className="text-[11px] text-stone-400 mt-1.5">
            {v.itineraries.length} jours · {v.itineraries.flatMap((it) => it.villages).length} villages
          </div>
        </div>
      ))}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-2">
      {[
        { date: plan.versions[plan.activeVersionIndex]?.createdAt, user: plan.createdBy, action: 'Version active modifiée' },
        plan.submittedAt ? { date: plan.submittedAt, user: plan.submittedBy, action: 'Plan soumis pour validation' } : null,
        plan.validatedAt ? { date: plan.validatedAt, user: plan.validatedBy, action: 'Plan validé' } : null,
        plan.executionStartDate ? { date: plan.executionStartDate, user: plan.validatedBy, action: 'Exécution démarrée' } : null,
      ].filter(Boolean).reverse().map((entry, i) => (
        entry && (
          <div key={i} className="flex items-start gap-3 text-xs py-2 border-b border-stone-50 last:border-0">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-1.5 flex-shrink-0" />
            <div>
              <span className="text-stone-700 font-medium">{entry.action}</span>
              {entry.user && <span className="text-stone-400"> · par {entry.user}</span>}
              <div className="text-stone-400">
                {entry.date?.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        )
      ))}
    </div>
  );

  const tabContent: Record<TabKey, () => JSX.Element> = {
    overview: renderOverview,
    itineraries: renderItineraries,
    resources: renderResources,
    conflicts: renderConflicts,
    validation: renderValidation,
    versions: renderVersions,
    history: renderHistory,
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/planification">Planification</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{plan.name}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-start justify-between mt-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900">{plan.name}</h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${MICROPLAN_STATUS_COLOR[plan.status]}`}>
                {MICROPLAN_STATUS_LABEL[plan.status]}
              </span>
            </div>
            <div className="text-xs text-stone-400 mt-0.5">Créé par {plan.createdBy}</div>
          </div>
          {renderActions()}
        </div>
        {renderWorkflowStepper()}
      </div>

      {/* Conditional banners */}
      {unresolvedConflicts.length > 0 && (
        <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 text-sm text-danger-700">
          <AlertTriangle size={15} className="text-danger flex-shrink-0" />
          <span>Conflit de ressources non résolu. Impossible de soumettre.</span>
          <button className="ml-auto text-danger font-medium underline" onClick={() => setActiveTab('conflicts')}>
            Résoudre →
          </button>
        </div>
      )}

      {plan.status === 'in_execution' && plan.executionProgress?.urgentAdjustments.some((a) => a.status === 'pending') && (
        <div className="flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 text-sm text-warning-700">
          <AlertTriangle size={15} className="text-warning flex-shrink-0" />
          <span>Ajustement urgent en attente de validation.</span>
          <button className="ml-auto text-warning font-medium underline" onClick={() => navigate(`/planification/${plan.id}/ajustement`)}>
            Voir →
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="flex border-b border-stone-100 overflow-x-auto">
          {TABS.map((tab) => {
            const showConflictDot = tab.key === 'conflicts' && unresolvedConflicts.length > 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {tab.label}
                {showConflictDot && (
                  <span className="w-1.5 h-1.5 bg-danger rounded-full" />
                )}
              </button>
            );
          })}
        </div>
        <div className="p-4">
          {tabContent[activeTab]()}
        </div>
      </div>

      <VersionComparatorModal
        open={comparatorOpen}
        onClose={() => setComparatorOpen(false)}
        versions={plan.versions}
      />
      <RejectModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
      />
    </div>
  );
}
