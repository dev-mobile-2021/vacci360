import { useState } from 'react';
import { Tent, Users, Shield, AlertTriangle, CheckCircle2, ChevronRight, MapPin, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Modal } from '../ui/Modal';
import { useToast } from '../../lib/toast';
import { ANTIGEN_LIST } from '../../data/mockStock';
import { getTeams } from '../../data/mockTeams';
import type { NomadOpportunity } from '../../data/mockNomadOpportunities';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  prefilled?: Partial<NomadOpportunity>;
  sourceFieldReportId?: string;
};

const SOURCES = [
  'Signalement terrain',
  'Données transhumance IRAM',
  'Leader communautaire',
  'Observation satellite',
  'Autre',
];

const ACCESS_CONSTRAINTS_OPTIONS = [
  'Route difficile',
  "Autorisation chef communautaire",
  'Zone insécurisée',
  'Autre',
];

const GROUP_TYPES = [
  {
    id: 'seasonal_nomad' as const,
    label: 'Nomade saisonnier',
    description: 'Groupe en déplacement saisonnier',
    icon: Tent,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    activeBg: 'bg-amber-100 border-amber-400',
  },
  {
    id: 'displaced' as const,
    label: 'Déplacés internes',
    description: 'Population déplacée, accès restreint',
    icon: Users,
    color: 'text-stone-500',
    bg: 'bg-stone-50 border-stone-200',
    activeBg: 'bg-stone-100 border-stone-400',
  },
  {
    id: 'refugee' as const,
    label: 'Réfugiés',
    description: 'Population réfugiée, accès restreint',
    icon: Shield,
    color: 'text-slate-500',
    bg: 'bg-slate-50 border-slate-200',
    activeBg: 'bg-slate-100 border-slate-400',
  },
];

const STEPS = ['Identification', 'Localisation', 'Ressources'];

export function NomadOpportunityCreateModal({ isOpen, onClose, prefilled, sourceFieldReportId }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  // Step 1
  const [groupType, setGroupType] = useState<NomadOpportunity['groupType']>(
    prefilled?.groupType ?? 'seasonal_nomad',
  );
  const [population, setPopulation] = useState(
    prefilled?.estimatedPopulation?.toString() ?? '',
  );
  const [children, setChildren] = useState(
    prefilled?.estimatedChildren?.toString() ?? '',
  );
  const [source, setSource] = useState('Signalement terrain');
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium');

  // Step 2
  const [locationDesc, setLocationDesc] = useState(
    prefilled?.location?.description ?? '',
  );
  const [lat, setLat] = useState(prefilled?.location?.lat?.toString() ?? '');
  const [lng, setLng] = useState(prefilled?.location?.lng?.toString() ?? '');
  const [uncertaintyKm, setUncertaintyKm] = useState(5);
  const [windowStart, setWindowStart] = useState('');
  const [windowEnd, setWindowEnd] = useState('');
  const [constraints, setConstraints] = useState<string[]>([]);

  // Step 3
  const [selectedAntigens, setSelectedAntigens] = useState<string[]>(['BCG', 'DTC']);
  const [notes, setNotes] = useState(
    prefilled?.location ? `Signalement issu du rapport terrain ${sourceFieldReportId ?? ''}.` : '',
  );

  const teams = getTeams().slice(0, 5);
  const isRestricted = groupType === 'displaced' || groupType === 'refugee';

  const autoChildren = () => {
    if (children) return;
    const pop = parseInt(population);
    if (!isNaN(pop)) setChildren(Math.round(pop * 0.18).toString());
  };

  const toggleConstraint = (c: string) =>
    setConstraints((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const toggleAntigen = (a: string) =>
    setSelectedAntigens((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

  const canNext = () => {
    if (step === 1) return groupType && population;
    if (step === 2) return locationDesc && windowStart && windowEnd;
    return true;
  };

  const handleCreate = () => {
    toast({
      type: 'success',
      title: "Opportunité enregistrée",
      description: "Le Gestionnaire Provincial a été notifié.",
    });
    onClose();
  };

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-medium text-stone-700 mb-2">Type de groupe *</div>
        <div className="grid grid-cols-3 gap-2">
          {GROUP_TYPES.map((gt) => {
            const Icon = gt.icon;
            const isActive = groupType === gt.id;
            return (
              <button
                key={gt.id}
                onClick={() => setGroupType(gt.id)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${isActive ? gt.activeBg : gt.bg + ' hover:opacity-80'}`}
              >
                <Icon size={18} className={`${gt.color} mb-1.5`} />
                <div className="text-xs font-semibold text-stone-800">{gt.label}</div>
                <div className="text-[10px] text-stone-500 mt-0.5">{gt.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {isRestricted && (
        <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
          <Info size={13} className="mt-0.5 flex-shrink-0" />
          Ces données seront accessibles uniquement aux profils autorisés (GN, GP, Analyste).
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Personnes totales estimées *</label>
          <input
            type="number" min={1}
            className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Ex: 300"
            value={population}
            onChange={(e) => setPopulation(e.target.value)}
            onBlur={autoChildren}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Enfants estimés
            <span className="text-stone-400 font-normal ml-1">(auto 18%)</span>
          </label>
          <input
            type="number" min={0}
            className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Auto-calculé"
            value={children}
            onChange={(e) => setChildren(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-700 mb-1">Source de l'information</label>
        <select
          className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <div className="text-xs font-medium text-stone-700 mb-2">Niveau de confiance</div>
        <div className="flex gap-2">
          {(['high', 'medium', 'low'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setConfidence(c)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                confidence === c
                  ? c === 'high' ? 'bg-success/10 border-success/40 text-success-700'
                    : c === 'medium' ? 'bg-warning/10 border-warning/40 text-warning-700'
                    : 'bg-danger/10 border-danger/40 text-danger-700'
                  : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
              }`}
            >
              {c === 'high' ? 'Élevée' : c === 'medium' ? 'Moyenne' : 'Faible'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-stone-700 mb-1">Description localisation *</label>
        <textarea
          rows={2}
          className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          placeholder="Ex: À 12km au nord de Bol, rive est du lac"
          value={locationDesc}
          onChange={(e) => setLocationDesc(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Latitude</label>
          <input
            type="text"
            className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Ex: 13.462"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Longitude</label>
          <input
            type="text"
            className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Ex: 14.718"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
          />
        </div>
      </div>

      {/* Mini map placeholder */}
      <div className="bg-stone-100 rounded-lg h-28 flex items-center justify-center border border-stone-200 relative overflow-hidden">
        <div className="text-center text-stone-400">
          <MapPin size={18} className="mx-auto mb-1" />
          <div className="text-xs">Cliquez sur la carte pour placer le marqueur</div>
          {lat && lng && (
            <div className="text-[10px] mt-1 text-stone-500">{lat}, {lng}</div>
          )}
        </div>
        {lat && lng && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md" />
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-700 mb-2">
          Rayon d'incertitude : <strong>{uncertaintyKm} km</strong>
        </label>
        <input
          type="range" min={1} max={20} step={1}
          value={uncertaintyKm}
          onChange={(e) => setUncertaintyKm(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
          <span>1 km</span><span>20 km</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Début disponibilité *
            <span className="text-stone-400 font-normal ml-1">— accessible quand ?</span>
          </label>
          <input type="date"
            className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            value={windowStart}
            onChange={(e) => setWindowStart(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Fin disponibilité *</label>
          <input type="date"
            className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            value={windowEnd}
            onChange={(e) => setWindowEnd(e.target.value)}
          />
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-stone-700 mb-2">Contraintes d'accès</div>
        <div className="flex flex-wrap gap-2">
          {ACCESS_CONSTRAINTS_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => toggleConstraint(c)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                constraints.includes(c)
                  ? 'bg-warning/10 border-warning/40 text-warning-700'
                  : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-stone-50 rounded-lg p-3">
          <div className="text-[11px] text-stone-500 mb-1">FOSA la plus proche</div>
          <div className="text-sm font-medium text-stone-800">CS Bol</div>
          <div className="text-[11px] text-stone-400 mt-0.5">
            {lat && lng ? `~${(Math.abs(parseFloat(lat) - 13.46) * 111 + Math.abs(parseFloat(lng) - 14.72) * 85).toFixed(0)} km` : '—'}
          </div>
        </div>
        <div className="bg-stone-50 rounded-lg p-3">
          <div className="text-[11px] text-stone-500 mb-1">Fenêtre</div>
          <div className="text-sm font-medium text-stone-800">
            {windowStart ? new Date(windowStart).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
            {' → '}
            {windowEnd ? new Date(windowEnd).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-stone-700 mb-2">Équipes potentiellement disponibles</div>
        {teams.length === 0 ? (
          <div className="flex items-start gap-2 text-xs text-warning-700 bg-warning/10 border border-warning/30 rounded-lg px-3 py-2.5">
            <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-warning" />
            Aucune équipe disponible dans cette zone. Le GN sera notifié.
          </div>
        ) : (
          <div className="space-y-1.5">
            {teams.map((team) => (
              <div key={team.id} className="flex items-center justify-between text-xs bg-stone-50 rounded-lg px-3 py-2">
                <span className="text-stone-700 font-medium">{team.name}</span>
                <span className="text-success text-[11px]">Zone compatible</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs font-medium text-stone-700 mb-2">Antigènes recommandés</div>
        <div className="flex flex-wrap gap-2">
          {ANTIGEN_LIST.map((a) => (
            <button
              key={a}
              onClick={() => toggleAntigen(a)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                selectedAntigens.includes(a)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-700 mb-1">Notes complémentaires</label>
        <textarea
          rows={3}
          className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          placeholder="Informations supplémentaires utiles..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {sourceFieldReportId && (
        <div className="flex items-center gap-2 text-xs text-stone-500 bg-stone-50 rounded-lg px-3 py-2 border border-stone-200">
          <Info size={12} />
          Lié au rapport terrain <strong>{sourceFieldReportId}</strong>
        </div>
      )}
    </div>
  );

  const stepContent = [renderStep1, renderStep2, renderStep3][step - 1];

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Signaler une opportunité de vaccination"
      width={580}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={step > 1 ? () => setStep((s) => s - 1) : handleClose}>
            {step === 1 ? 'Annuler' : 'Précédent'}
          </Button>
          {step < 3 ? (
            <Button size="sm" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
              Suivant <ChevronRight size={14} />
            </Button>
          ) : (
            <Button size="sm" onClick={handleCreate}>
              <CheckCircle2 size={14} /> Créer l'opportunité
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {/* Stepper */}
        <div className="flex items-center gap-0 mb-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step > i + 1 ? 'bg-success text-white' : step === i + 1 ? 'bg-primary text-white' : 'bg-stone-200 text-stone-400'
                }`}>
                  {step > i + 1 ? <CheckCircle2 size={12} /> : i + 1}
                </div>
                <div className={`text-[10px] mt-0.5 font-medium whitespace-nowrap ${step === i + 1 ? 'text-primary' : 'text-stone-400'}`}>
                  {s}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-3.5 mx-1 ${step > i + 1 ? 'bg-success' : 'bg-stone-200'}`} />
              )}
            </div>
          ))}
        </div>

        {stepContent()}
      </div>
    </Modal>
  );
}
