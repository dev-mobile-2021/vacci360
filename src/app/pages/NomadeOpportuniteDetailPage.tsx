import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  MapPin, Clock, AlertTriangle, CheckCircle2, Shield, Tent, Users,
  ExternalLink, ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../lib/toast';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import {
  mockNomadOpportunities,
  GROUP_TYPE_LABEL, GROUP_TYPE_COLOR, CONFIDENCE_LABEL, CONFIDENCE_COLOR, STATUS_LABEL,
} from '../data/mockNomadOpportunities';
import { mockStock, ANTIGEN_LIST } from '../data/mockStock';
import { mockMicroPlans } from '../data/mockMicroPlans';

const MISSED_REASONS = [
  'Équipes indisponibles sur la période',
  'Fenêtre temporelle trop courte',
  "Contraintes d'accès insurmontables",
  'Décision opérationnelle',
  'Autre',
];

const MISSION_ANTIGENS = ['BCG', 'DTC', 'Rougeole'];

function CreateMissionModal({ open, onClose, opportunityId }: { open: boolean; onClose: () => void; opportunityId: string }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [missionStep, setMissionStep] = useState(1);
  const [selectedAntigens, setSelectedAntigens] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');

  const opp = mockNomadOpportunities.find((o) => o.id === opportunityId);

  const handleCreate = () => {
    toast({ type: 'success', title: 'Mission ciblée créée', description: 'Micro-plan généré et soumis pour validation.' });
    navigate('/planification/plan-001');
  };

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Créer une mission ciblée"
      width={480}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={missionStep > 1 ? () => setMissionStep((s) => s - 1) : onClose}>
            {missionStep > 1 ? 'Précédent' : 'Annuler'}
          </Button>
          {missionStep < 3 ? (
            <Button size="sm" onClick={() => setMissionStep((s) => s + 1)}
              disabled={missionStep === 1 ? selectedAntigens.length === 0 : !selectedTeam}>
              Suivant <ChevronRight size={14} />
            </Button>
          ) : (
            <Button size="sm" onClick={handleCreate}>
              <CheckCircle2 size={14} /> Créer la mission
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${missionStep >= s ? 'bg-primary text-white' : 'bg-stone-200 text-stone-400'}`}>
                {s}
              </div>
              {s < 3 && <div className={`h-0.5 flex-1 ${missionStep > s ? 'bg-primary' : 'bg-stone-200'}`} />}
            </div>
          ))}
        </div>

        {missionStep === 1 && (
          <>
            <div className="text-sm font-medium text-stone-700 mb-1">Étape 1 — Confirmation</div>
            <div className="bg-stone-50 rounded-lg p-3 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-stone-500">Zone</span><span className="text-stone-700 font-medium">{opp?.location.description}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Fenêtre</span>
                <span className="text-stone-700 font-medium">
                  {opp?.windowStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} → {opp?.windowEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-stone-500">Population</span><span className="text-stone-700 font-medium">{opp?.estimatedPopulation} personnes</span></div>
            </div>
            <div>
              <div className="text-xs font-medium text-stone-700 mb-2">Antigènes à vacciner *</div>
              <div className="flex flex-wrap gap-2">
                {MISSION_ANTIGENS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setSelectedAntigens(toggle(selectedAntigens, a))}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      selectedAntigens.includes(a) ? 'bg-primary text-white border-primary' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {missionStep === 2 && (
          <>
            <div className="text-sm font-medium text-stone-700 mb-1">Étape 2 — Équipe</div>
            <div className="space-y-2">
              {(opp?.teamsAvailableInWindow.length ?? 0) === 0 ? (
                <div className="text-sm text-stone-500 bg-stone-50 rounded-lg p-3">Aucune équipe disponible sur cette fenêtre.</div>
              ) : (
                opp?.teamsAvailableInWindow.map((teamId) => (
                  <label key={teamId} className="flex items-center gap-3 cursor-pointer bg-stone-50 rounded-lg p-3">
                    <input
                      type="radio"
                      className="accent-primary"
                      checked={selectedTeam === teamId}
                      onChange={() => setSelectedTeam(teamId)}
                    />
                    <div>
                      <div className="text-sm font-medium text-stone-700">{teamId}</div>
                      <div className="text-[11px] text-stone-400">Disponible sur la fenêtre</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </>
        )}

        {missionStep === 3 && (
          <>
            <div className="text-sm font-medium text-stone-700 mb-1">Étape 3 — Ressources</div>
            <div className="space-y-2">
              {selectedAntigens.map((a) => {
                const available = mockStock
                  .filter((s) => s.antigen === a && s.level === 'facility')
                  .reduce((sum, s) => sum + s.quantityAvailable, 0);
                return (
                  <div key={a} className="flex items-center justify-between text-sm bg-stone-50 rounded px-3 py-2">
                    <span className="text-stone-700 font-medium">{a}</span>
                    <span className={`text-xs ${available > 200 ? 'text-success' : 'text-warning'}`}>
                      {available.toLocaleString('fr-FR')} doses disponibles
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-stone-500 bg-blue-50 border border-blue-200 rounded px-3 py-2">
              Les vaccins seront réservés automatiquement à la création du plan.
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default function NomadeOpportuniteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [createMissionOpen, setCreateMissionOpen] = useState(false);
  const [missedOpen, setMissedOpen] = useState(false);
  const [missedReason, setMissedReason] = useState('');

  const opp = mockNomadOpportunities.find((o) => o.id === id) ?? mockNomadOpportunities[0];
  const linkedPlan = opp.linkedMicroPlanId
    ? mockMicroPlans.find((p) => p.id === opp.linkedMicroPlanId)
    : null;

  const now = Date.now();
  const isExpired = opp.windowEnd.getTime() < now;
  const isIdentified = opp.status === 'identified';
  const hasTeams = opp.teamsAvailableInWindow.length > 0;

  const stockCheck = ANTIGEN_LIST.map((a) => {
    const available = mockStock.filter((s) => s.antigen === a && s.level === 'facility').reduce((sum, s) => sum + s.quantityAvailable, 0);
    return { antigen: a, available, ok: available > 200 };
  }).filter((s) => ['BCG', 'DTC', 'Rougeole'].includes(s.antigen));

  const anonymize = (n: number) => {
    if (opp.accessLevel === 'restricted') return `~${Math.round(n / 50) * 50}`;
    return n.toString();
  };

  const handleMarkMissed = () => {
    if (!missedReason) return;
    toast({ type: 'warning', title: 'Opportunité marquée comme manquée', description: missedReason });
    setMissedOpen(false);
  };

  const diffDays = Math.ceil((opp.windowEnd.getTime() - now) / 86_400_000);

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/planification">Planification</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="/nomades">Populations mobiles</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{opp.id}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-start justify-between mt-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900">
                {GROUP_TYPE_LABEL[opp.groupType]} — {opp.location.description}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${GROUP_TYPE_COLOR[opp.groupType]}`}>
                {opp.groupType === 'seasonal_nomad' ? <Tent size={11} /> : opp.groupType === 'displaced' ? <Users size={11} /> : <Shield size={11} />}
                {GROUP_TYPE_LABEL[opp.groupType]}
              </span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                opp.status === 'executed' ? 'bg-success/10 text-success-700' :
                opp.status === 'planned' ? 'bg-primary/10 text-primary-700' :
                opp.status === 'missed' ? 'bg-danger/10 text-danger-700' : 'bg-stone-100 text-stone-600'
              }`}>
                {STATUS_LABEL[opp.status]}
              </span>
              {opp.accessLevel === 'restricted' && (
                <span className="flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                  <Shield size={10} /> Restreint
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Main info card */}
        <div className="col-span-2 space-y-4">
          {/* Map placeholder */}
          <div className="bg-stone-100 rounded-xl border border-stone-200 h-52 flex items-center justify-center">
            <div className="text-center text-stone-400">
              <MapPin size={24} className="mx-auto mb-2" />
              <div className="text-xs font-medium">{opp.location.description}</div>
              <div className="text-[11px] mt-0.5">{opp.location.lat.toFixed(3)}, {opp.location.lng.toFixed(3)}</div>
              <div className="text-[11px] mt-1 text-stone-300">Rayon d'incertitude affiché sur carte réelle</div>
            </div>
          </div>

          {/* Infos groupe */}
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-stone-700 mb-3">Informations groupe</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Population estimée', anonymize(opp.estimatedPopulation) + ' personnes'],
                ['Enfants estimés', anonymize(opp.estimatedChildren) + ' enfants'],
                ['Source', opp.dataSource],
                ['Confiance', CONFIDENCE_LABEL[opp.confidenceLevel]],
                ['FOSA proche', `${opp.nearestFacilityName} (${opp.distanceKm} km)`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-[11px] text-stone-400">{k}</div>
                  <div className="text-xs text-stone-700 font-medium">{v}</div>
                </div>
              ))}
              <div>
                <div className="text-[11px] text-stone-400">Niveau de confiance</div>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mt-0.5 ${CONFIDENCE_COLOR[opp.confidenceLevel]}`}>
                  {CONFIDENCE_LABEL[opp.confidenceLevel]}
                </span>
              </div>
            </div>
            {opp.accessConstraints.length > 0 && (
              <div className="mt-3 pt-3 border-t border-stone-100">
                <div className="text-[11px] text-stone-500 mb-1">Contraintes d'accès</div>
                <div className="space-y-0.5">
                  {opp.accessConstraints.map((c) => (
                    <div key={c} className="flex items-start gap-1.5 text-xs text-stone-600">
                      <AlertTriangle size={10} className="text-warning mt-0.5 flex-shrink-0" />
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Disponibilité ressources (Zone d'ombre 3) */}
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-stone-700 mb-3">Disponibilité des ressources</div>

            {/* Équipes */}
            <div className="mb-4">
              <div className="text-[11px] text-stone-500 mb-2">Équipes disponibles dans la fenêtre</div>
              {hasTeams ? (
                <div className="space-y-1.5">
                  {opp.teamsAvailableInWindow.map((teamId) => (
                    <div key={teamId} className="flex items-center justify-between text-xs bg-stone-50 rounded-lg px-3 py-2">
                      <span className="font-medium text-stone-700">{teamId}</span>
                      <span className="text-success text-[11px]">Disponible</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 bg-warning/10 border border-warning/30 rounded-lg px-3 py-2.5 text-xs text-warning-700">
                    <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-warning" />
                    Aucune équipe disponible sur cette fenêtre. Toutes les équipes sont en mission.
                  </div>
                  <Button
                    variant="outline" size="sm"
                    className="text-warning border-warning/30"
                    onClick={() => toast({ type: 'warning', title: 'Escalade envoyée', description: 'Le Gestionnaire National a été notifié.' })}
                  >
                    Escalader au Gestionnaire National
                  </Button>
                </div>
              )}
            </div>

            {/* Stock */}
            <div>
              <div className="text-[11px] text-stone-500 mb-2">Stock vaccins (BCG, DTC, Rougeole)</div>
              <div className="space-y-1.5">
                {stockCheck.map((s) => (
                  <div key={s.antigen} className="flex items-center justify-between text-xs">
                    <span className="text-stone-700">{s.antigen}</span>
                    <span className={s.ok ? 'text-success' : 'text-danger'}>
                      {s.available.toLocaleString('fr-FR')} doses {s.ok ? '✓' : '⚠'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Fenêtre temporelle */}
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
              <Clock size={13} /> Fenêtre temporelle
            </div>
            <div className="text-xs text-stone-600 mb-1">
              {opp.windowStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
            <div className="text-xs text-stone-500 mb-2">→ {opp.windowEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            {!isExpired && (
              <div className={`text-sm font-bold ${diffDays <= 2 ? 'text-danger' : diffDays <= 7 ? 'text-warning' : 'text-success'}`}>
                J-{diffDays} {diffDays <= 2 ? '⚠ Urgence' : ''}
              </div>
            )}
            {isExpired && <div className="text-sm text-stone-400">Fenêtre expirée</div>}
          </div>

          {/* Lié à un plan */}
          {linkedPlan && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-blue-700 mb-1.5">Intégrée dans un plan</div>
              <div className="text-sm font-medium text-stone-800 mb-1">{linkedPlan.name}</div>
              <div className="text-[11px] text-stone-500 mb-2">
                Statut : {linkedPlan.status}
              </div>
              <button
                className="flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={() => navigate(`/planification/${linkedPlan.id}`)}
              >
                Voir le plan <ExternalLink size={11} />
              </button>
            </div>
          )}

          {/* Créer mission */}
          {isIdentified && !isExpired && hasTeams && !linkedPlan && (
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-stone-700 mb-2">Créer une mission ciblée</div>
              <div className="text-xs text-stone-500 mb-3">Générer un micro-plan dédié à ce groupe.</div>
              <Button size="sm" className="w-full" onClick={() => setCreateMissionOpen(true)}>
                <Plus size={13} /> Créer la mission
              </Button>
            </div>
          )}

          {/* Opportunité manquée */}
          {isIdentified && isExpired && (
            <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
              <div className="text-xs font-semibold text-danger mb-2 flex items-center gap-1.5">
                <AlertTriangle size={12} /> Opportunité manquée
              </div>
              <div className="text-xs text-stone-500 mb-3">La fenêtre temporelle est dépassée.</div>
              <Button size="sm" variant="outline" className="w-full text-danger border-danger/30" onClick={() => setMissedOpen(true)}>
                Marquer comme manquée
              </Button>
            </div>
          )}
        </div>
      </div>

      <CreateMissionModal
        open={createMissionOpen}
        onClose={() => setCreateMissionOpen(false)}
        opportunityId={opp.id}
      />

      <Modal
        open={missedOpen}
        onClose={() => setMissedOpen(false)}
        title="Marquer comme manquée"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setMissedOpen(false)}>Annuler</Button>
            <Button size="sm" variant="destructive" disabled={!missedReason} onClick={handleMarkMissed}>
              Confirmer
            </Button>
          </>
        }
      >
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Motif *</label>
          <select
            className="w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            value={missedReason}
            onChange={(e) => setMissedReason(e.target.value)}
          >
            <option value="">Sélectionner...</option>
            {MISSED_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  );
}

