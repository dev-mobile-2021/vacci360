import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle, Info,
  Tent, MapPin, Users, Package, Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../lib/toast';
import { useAuth } from '../lib/auth';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import { mockCampaigns } from '../data/mockCampaigns';
import { mockStock, ANTIGEN_LIST } from '../data/mockStock';
import { getTeams } from '../data/mockTeams';
import { mockNomadOpportunities, GROUP_TYPE_LABEL, CONFIDENCE_LABEL, CONFIDENCE_COLOR } from '../data/mockNomadOpportunities';
import { mockMicroPlans } from '../data/mockMicroPlans';

const STEPS = [
  { number: 1, label: 'Cadrage' },
  { number: 2, label: 'Ressources' },
  { number: 3, label: 'Contraintes' },
  { number: 4, label: 'Génération' },
  { number: 5, label: 'Confirmation' },
];

const PROVINCES = [
  { id: 'td-lac', name: 'Lac' },
  { id: 'td-kanem', name: 'Kanem' },
  { id: 'td-hadjer-lamis', name: 'Hadjer-Lamis' },
];

const TRANSPORT_MODES = [
  { id: 'moto', label: 'Moto', icon: '🏍️' },
  { id: '4x4', label: '4x4', icon: '🚙' },
  { id: 'pirogue', label: 'Pirogue', icon: '⛵' },
  { id: 'mixte', label: 'Mixte', icon: '🔀' },
];

const GEN_STEPS = [
  'Analyse des villages et ressources...',
  'Intégration des opportunités nomades...',
  'Optimisation des itinéraires...',
  'Calcul des ressources et coûts...',
  'Finalisation...',
];

type FormData = {
  name: string;
  campaignId: string;
  provinceId: string;
  startDate: string;
  endDate: string;
  antigens: string[];
  selectedTeams: string[];
  transport: string;
  maxHoursPerDay: number;
  includeNomads: boolean;
  selectedNomadOpps: string[];
  saveAsDraft: boolean;
};

export default function PlanificationNouveauPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [genStepIdx, setGenStepIdx] = useState(0);
  const [generated, setGenerated] = useState(false);
  const genIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canSeeNomads =
    user?.permissions?.['Nomades']?.['Voir'] &&
    ['FULL', 'READ_ALL', 'READ_OWN'].includes(user.permissions['Nomades']['Voir']);

  const [form, setForm] = useState<FormData>({
    name: '',
    campaignId: '',
    provinceId: 'td-lac',
    startDate: '',
    endDate: '',
    antigens: [],
    selectedTeams: [],
    transport: '4x4',
    maxHoursPerDay: 8,
    includeNomads: true,
    selectedNomadOpps: [],
    saveAsDraft: false,
  });

  const teams = getTeams();
  const NOW = Date.now();

  const stockByAntigen = ANTIGEN_LIST.map((a) => {
    const available = mockStock
      .filter((s) => s.antigen === a && s.level === 'facility')
      .reduce((sum, s) => sum + s.quantityAvailable, 0);
    const reserved = mockStock
      .filter((s) => s.antigen === a)
      .reduce((sum, s) => sum + s.quantityReserved, 0);
    return { antigen: a, available, reserved, sufficient: available > 500 };
  });

  const availableNomadOpps = mockNomadOpportunities.filter(
    (o) => o.accessLevel === 'public' && o.status === 'identified',
  );

  const conflictingTeams = form.selectedTeams.filter((teamId) =>
    mockMicroPlans.some((p) =>
      ['submitted', 'validated', 'in_execution'].includes(p.status) &&
      p.generationParams.availableTeams.includes(teamId) &&
      p.id !== 'plan-new',
    ),
  );

  const handleGenerate = () => {
    setGenerating(true);
    setGenStepIdx(0);
    let idx = 0;
    genIntervalRef.current = setInterval(() => {
      idx++;
      if (idx < GEN_STEPS.length) {
        setGenStepIdx(idx);
      } else {
        clearInterval(genIntervalRef.current!);
        setGenerating(false);
        setGenerated(true);
      }
    }, 800);
  };

  const handleConfirm = () => {
    toast({
      type: 'success',
      title: 'Micro-plan créé',
      description: form.saveAsDraft ? 'Plan sauvegardé en brouillon.' : 'Plan soumis à validation.',
    });
    navigate('/planification/plan-001');
  };

  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const canProceed = () => {
    if (step === 1) return form.name.trim() && form.campaignId && form.startDate && form.endDate;
    if (step === 2) return form.selectedTeams.length > 0 && form.antigens.length > 0;
    if (step === 3) return true;
    if (step === 4) return generated;
    return true;
  };

  // ─── Step renders ──────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-stone-700 mb-1">Nom du micro-plan *</label>
        <input
          type="text"
          className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Ex: Micro-plan BCG — Bol Nord Mai 2026"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-700 mb-1">Campagne associée *</label>
        <select
          className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          value={form.campaignId}
          onChange={(e) => setForm((f) => ({ ...f, campaignId: e.target.value }))}
        >
          <option value="">Sélectionner une campagne...</option>
          {mockCampaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-700 mb-1">Province *</label>
        <select
          className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          value={form.provinceId}
          onChange={(e) => setForm((f) => ({ ...f, provinceId: e.target.value }))}
        >
          {PROVINCES.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Date de début *</label>
          <input
            type="date"
            className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Date de fin *</label>
          <input
            type="date"
            className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-700 mb-2">Antigènes ciblés *</label>
        <div className="flex flex-wrap gap-2">
          {ANTIGEN_LIST.map((a) => (
            <button
              key={a}
              onClick={() => setForm((f) => ({ ...f, antigens: toggle(f.antigens, a) }))}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                form.antigens.includes(a)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-semibold text-stone-700 mb-2">Équipes disponibles</div>
        <div className="border border-stone-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-3 py-2 text-left w-8"></th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-stone-500 uppercase">Équipe</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-stone-500 uppercase">Type</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-stone-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody>
              {teams.slice(0, 10).map((team) => {
                const isConflict = conflictingTeams.includes(team.id);
                const isSelected = form.selectedTeams.includes(team.id);
                return (
                  <tr key={team.id} className={`border-b border-stone-50 last:border-0 ${isConflict ? 'bg-warning/5' : ''}`}>
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={isSelected}
                        onChange={() => setForm((f) => ({ ...f, selectedTeams: toggle(f.selectedTeams, team.id) }))}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-stone-700">{team.name}</td>
                    <td className="px-3 py-2.5 text-xs text-stone-500">{team.vehicleType ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      {isConflict && isSelected ? (
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 text-[11px] text-warning font-medium">
                            <AlertTriangle size={11} /> Conflit potentiel
                          </span>
                          <button
                            className="text-[10px] text-stone-400 underline"
                            onClick={() => setForm((f) => ({ ...f, selectedTeams: f.selectedTeams.filter((t) => t !== team.id) }))}
                          >
                            Retirer
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-success">Disponible</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-stone-700 mb-2">Stock vaccins (FOSA)</div>
        <div className="border border-stone-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                {['Antigène', 'Disponible', 'Réservé', 'Suffisant ?'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-stone-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stockByAntigen.filter((s) => form.antigens.length === 0 || form.antigens.includes(s.antigen)).map((s) => (
                <tr key={s.antigen} className={`border-b border-stone-50 last:border-0 ${!s.sufficient ? 'bg-danger/5' : ''}`}>
                  <td className="px-3 py-2.5 text-xs font-medium text-stone-700">{s.antigen}</td>
                  <td className="px-3 py-2.5 text-xs text-stone-600">{s.available.toLocaleString('fr-FR')}</td>
                  <td className="px-3 py-2.5 text-xs text-stone-500">{s.reserved.toLocaleString('fr-FR')}</td>
                  <td className="px-3 py-2.5">
                    {s.sufficient ? (
                      <span className="flex items-center gap-1 text-[11px] text-success"><CheckCircle2 size={11} /> OK</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-danger font-medium"><AlertTriangle size={11} /> Insuffisant</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {stockByAntigen.some((s) => !s.sufficient && form.antigens.includes(s.antigen)) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-warning-700 bg-warning/5 border border-warning/20 rounded px-3 py-2">
            <AlertTriangle size={12} />
            Stock insuffisant pour certains antigènes.{' '}
            <a href="/logistique/stock" className="underline font-medium">Gérer le stock →</a>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-semibold text-stone-700 mb-2">Mode de transport dominant</div>
        <div className="grid grid-cols-4 gap-2">
          {TRANSPORT_MODES.map((t) => (
            <button
              key={t.id}
              onClick={() => setForm((f) => ({ ...f, transport: t.id }))}
              className={`p-3 text-center rounded-lg border transition-colors ${
                form.transport === t.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-stone-200 hover:border-stone-300 text-stone-600'
              }`}
            >
              <div className="text-xl mb-1">{t.icon}</div>
              <div className="text-xs font-medium">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-700 mb-2">
          Durée max par jour : <strong>{form.maxHoursPerDay}h</strong>
        </label>
        <input
          type="range" min={6} max={12} step={1}
          value={form.maxHoursPerDay}
          onChange={(e) => setForm((f) => ({ ...f, maxHoursPerDay: Number(e.target.value) }))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-stone-400 mt-1">
          <span>6h</span><span>12h</span>
        </div>
      </div>

      {canSeeNomads && (
        <div className="border border-stone-200 rounded-lg p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="accent-primary"
              checked={form.includeNomads}
              onChange={(e) => setForm((f) => ({ ...f, includeNomads: e.target.checked }))}
            />
            <div>
              <div className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
                <Tent size={14} className="text-primary" />
                Intégrer les opportunités nomades identifiées
              </div>
              <div className="text-[11px] text-stone-400">Ajoute des arrêts dans les itinéraires</div>
            </div>
          </label>

          {form.includeNomads && (
            <>
              <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                <Info size={12} className="mt-0.5 flex-shrink-0" />
                Les opportunités sélectionnées seront intégrées comme arrêts dans les itinéraires.
              </div>
              <div className="space-y-2">
                {availableNomadOpps.length === 0 && (
                  <p className="text-xs text-stone-400">Aucune opportunité disponible dans cette zone/période.</p>
                )}
                {availableNomadOpps.map((opp) => (
                  <label key={opp.id} className="flex items-start gap-3 cursor-pointer bg-stone-50 rounded-lg p-3">
                    <input
                      type="checkbox"
                      className="accent-primary mt-0.5"
                      checked={form.selectedNomadOpps.includes(opp.id)}
                      onChange={() => setForm((f) => ({ ...f, selectedNomadOpps: toggle(f.selectedNomadOpps, opp.id) }))}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          opp.groupType === 'seasonal_nomad' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {GROUP_TYPE_LABEL[opp.groupType]}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CONFIDENCE_COLOR[opp.confidenceLevel]}`}>
                          {CONFIDENCE_LABEL[opp.confidenceLevel]}
                        </span>
                      </div>
                      <div className="text-xs text-stone-700">{opp.location.description}</div>
                      <div className="text-[11px] text-stone-400 mt-0.5">
                        {opp.windowStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        {' → '}
                        {opp.windowEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        {' · '}{opp.estimatedChildren} enfants estimés
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  const renderStep4 = () => {
    const nomadCount = form.selectedNomadOpps.length;
    const hasConflictDemo = form.selectedTeams.some((t) => conflictingTeams.includes(t));

    return (
      <div className="space-y-5">
        {!generated && !generating && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin size={24} className="text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-stone-800 mb-1">Prêt à générer</h3>
            <p className="text-xs text-stone-500 mb-4">
              {form.generationParams?.targetVillages?.length ?? '~'} villages · {form.selectedTeams.length} équipes · {form.antigens.join(', ')}
              {nomadCount > 0 ? ` · ${nomadCount} opportunités nomades` : ''}
            </p>
            <Button size="sm" className="w-full" onClick={handleGenerate}>
              Générer le micro-plan
            </Button>
          </div>
        )}

        {generating && (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span>{GEN_STEPS[genStepIdx]}</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${((genStepIdx + 1) / GEN_STEPS.length) * 100}%` }}
              />
            </div>
            <div className="space-y-1">
              {GEN_STEPS.map((s, i) => (
                <div key={s} className={`text-xs flex items-center gap-2 ${i < genStepIdx ? 'text-success' : i === genStepIdx ? 'text-primary font-medium' : 'text-stone-300'}`}>
                  {i < genStepIdx ? <CheckCircle2 size={11} /> : <span className="w-[11px] h-[11px] rounded-full border border-current inline-block" />}
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {generated && (
          <div className="space-y-4">
            {/* Score card */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Couverture', value: '87%', color: 'text-success' },
                { label: 'Coût estimé', value: '312k FCFA', color: 'text-stone-700' },
                { label: 'Durée', value: `${form.maxHoursPerDay > 9 ? 4 : 5} jours`, color: 'text-stone-700' },
                { label: 'Faisabilité', value: '84%', color: 'text-success' },
              ].map((s) => (
                <div key={s.label} className="bg-stone-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-stone-500 mb-1">{s.label}</div>
                  <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {nomadCount > 0 && (
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                <Tent size={14} className="text-primary" />
                <span className="text-xs font-medium text-primary">{nomadCount} arrêt{nomadCount > 1 ? 's' : ''} nomade{nomadCount > 1 ? 's' : ''} intégré{nomadCount > 1 ? 's' : ''} dans les itinéraires</span>
              </div>
            )}

            {hasConflictDemo && (
              <div className="flex items-start gap-2 bg-warning/10 border border-warning/30 rounded-lg px-3 py-2">
                <AlertTriangle size={14} className="text-warning mt-0.5 flex-shrink-0" />
                <div className="text-xs text-warning-700">
                  <strong>Conflit ressource détecté :</strong> une équipe est déjà assignée à un autre plan sur cette période. À résoudre avant soumission.
                </div>
              </div>
            )}

            <div className="bg-stone-50 rounded-lg p-3 text-xs text-stone-600 space-y-1">
              <div>Itinéraires générés pour <strong>{form.selectedTeams.length} équipes</strong></div>
              <div>Villages couverts : <strong>~18 villages</strong></div>
              <div>Carburant estimé : <strong>~78 litres</strong></div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline" size="sm" className="flex-1"
                onClick={() => navigate('/planification/plan-001/ajustement')}
              >
                Ajuster manuellement
              </Button>
              <Button size="sm" className="flex-1" onClick={() => setStep(5)}>
                Accepter <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStep5 = () => (
    <div className="space-y-5">
      <div className="bg-stone-50 rounded-lg p-4 space-y-2 text-sm">
        <div className="font-semibold text-stone-800 mb-2">Récapitulatif</div>
        {[
          ['Nom', form.name || '—'],
          ['Campagne', mockCampaigns.find((c) => c.id === form.campaignId)?.name ?? '—'],
          ['Province', PROVINCES.find((p) => p.id === form.provinceId)?.name ?? '—'],
          ['Période', form.startDate && form.endDate ? `${form.startDate} → ${form.endDate}` : '—'],
          ['Antigènes', form.antigens.join(', ') || '—'],
          ['Équipes', `${form.selectedTeams.length} équipe(s) sélectionnée(s)`],
          ['Transport', form.transport],
          ['Nomades', form.includeNomads && form.selectedNomadOpps.length > 0 ? `${form.selectedNomadOpps.length} opportunité(s)` : 'Non'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-stone-500">{k}</span>
            <span className="text-stone-800 font-medium">{v}</span>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-700 mb-2">Mode de création</label>
        <div className="space-y-2">
          {[
            { value: false, label: 'Soumettre directement pour validation' },
            { value: true, label: 'Garder en brouillon' },
          ].map((opt) => (
            <label key={String(opt.value)} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                className="accent-primary"
                checked={form.saveAsDraft === opt.value}
                onChange={() => setForm((f) => ({ ...f, saveAsDraft: opt.value }))}
              />
              <span className="text-sm text-stone-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Button size="sm" className="w-full" onClick={handleConfirm}>
        <CheckCircle2 size={14} /> Créer le micro-plan
      </Button>
    </div>
  );

  const stepContent = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5][step - 1];

  return (
    <div className="space-y-5 pb-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/planification">Planification</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Nouveau micro-plan</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-xl font-bold text-stone-900 mt-1">Nouveau micro-plan</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.number} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step > s.number ? 'bg-success text-white' :
                step === s.number ? 'bg-primary text-white' :
                'bg-stone-200 text-stone-400'
              }`}>
                {step > s.number ? <CheckCircle2 size={14} /> : s.number}
              </div>
              <div className={`text-[10px] mt-1 font-medium ${step === s.number ? 'text-primary' : 'text-stone-400'}`}>
                {s.label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 mx-1 ${step > s.number ? 'bg-success' : 'bg-stone-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-stone-800">{STEPS[step - 1].label}</h2>
        </div>
        {stepContent()}
      </div>

      {/* Navigation */}
      {!(step === 4) && (
        <div className="flex justify-between">
          <Button
            variant="outline" size="sm"
            onClick={() => step > 1 ? setStep((s) => s - 1) : navigate('/planification')}
          >
            <ChevronLeft size={14} /> {step === 1 ? 'Annuler' : 'Précédent'}
          </Button>
          {step < 5 && (
            <Button size="sm" disabled={!canProceed()} onClick={() => setStep((s) => s + 1)}>
              Suivant <ChevronRight size={14} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
