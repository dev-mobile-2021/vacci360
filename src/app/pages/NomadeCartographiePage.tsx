import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Tent, Users, Shield, AlertTriangle, CheckCircle2, Clock, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import { Button } from '../components/ui/Button';
import {
  mockNomadOpportunities,
  GROUP_TYPE_LABEL, GROUP_TYPE_COLOR, CONFIDENCE_LABEL, STATUS_LABEL,
  type NomadOpportunity,
} from '../data/mockNomadOpportunities';

function TypeIcon({ type }: { type: NomadOpportunity['groupType'] }) {
  if (type === 'seasonal_nomad') return <Tent size={13} className="text-amber-600" />;
  if (type === 'displaced') return <Users size={13} className="text-stone-500" />;
  return <Shield size={13} className="text-slate-500" />;
}

function MarkerDot({ type, status }: { type: NomadOpportunity['groupType']; status: NomadOpportunity['status'] }) {
  const baseColor =
    type === 'seasonal_nomad' ? 'bg-amber-400' :
    type === 'displaced' ? 'bg-stone-400' : 'bg-slate-400';
  const statusRing =
    status === 'executed' ? 'ring-2 ring-success' :
    status === 'planned' ? 'ring-2 ring-primary' :
    status === 'missed' ? 'ring-2 ring-danger' : '';
  return <div className={`w-3 h-3 rounded-full ${baseColor} ${statusRing} flex-shrink-0`} />;
}

export default function NomadeCartographiePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedOpp, setSelectedOpp] = useState<NomadOpportunity | null>(null);
  const [sliderDate, setSliderDate] = useState(0);

  const canSeeRestricted =
    user?.permissions?.['Nomades']?.['Voir'] &&
    ['FULL', 'READ_ALL'].includes(user.permissions['Nomades']['Voir']);

  const baseOpps = canSeeRestricted
    ? mockNomadOpportunities
    : mockNomadOpportunities.filter((o) => o.accessLevel === 'public');

  const now = Date.now();
  const DAY = 86_400_000;
  const sliderOffset = (sliderDate - 15) * DAY;
  const viewDate = now + sliderOffset;

  const visibleOpps = useMemo(() =>
    baseOpps.filter((o) => o.windowStart.getTime() <= viewDate && o.windowEnd.getTime() >= viewDate),
    [sliderDate, canSeeRestricted],
  );

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] min-h-0">
      {/* Breadcrumb */}
      <div className="mb-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/planification">Planification</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="/nomades">Populations mobiles</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Cartographie</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-xl font-bold text-stone-900 mt-1">Cartographie des populations mobiles</h1>
      </div>

      {/* Main layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left panel */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wide mb-2">
              Opportunités visibles ({visibleOpps.length})
            </div>
            {visibleOpps.length === 0 && (
              <div className="text-xs text-stone-400 py-2 text-center">Aucune opportunité à cette date</div>
            )}
            <div className="space-y-1.5">
              {visibleOpps.map((opp) => (
                <button
                  key={opp.id}
                  className={`w-full text-left px-2.5 py-2 rounded-lg border transition-colors ${
                    selectedOpp?.id === opp.id
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent hover:bg-stone-50'
                  }`}
                  onClick={() => setSelectedOpp(opp)}
                >
                  <div className="flex items-center gap-2">
                    <MarkerDot type={opp.groupType} status={opp.status} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-stone-700 truncate">{opp.location.description}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <TypeIcon type={opp.groupType} />
                        <span className="text-[10px] text-stone-400">{GROUP_TYPE_LABEL[opp.groupType]}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white border border-stone-200 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wide mb-2">Légende</div>
            <div className="space-y-1.5">
              {[
                { color: 'bg-amber-400', label: 'Nomade saisonnier' },
                { color: 'bg-stone-400', label: 'Déplacé' },
                { color: 'bg-slate-400', label: 'Réfugié' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2 text-xs text-stone-600">
                  <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                  {l.label}
                </div>
              ))}
              <div className="mt-1.5 pt-1.5 border-t border-stone-100 space-y-1">
                {[
                  { color: 'ring-2 ring-success bg-stone-300', label: 'Exécuté' },
                  { color: 'ring-2 ring-primary bg-stone-300', label: 'Planifié' },
                  { color: 'ring-2 ring-danger bg-stone-300', label: 'Manqué' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-2 text-xs text-stone-600">
                    <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Map area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 bg-stone-100 rounded-xl border border-stone-200 relative overflow-hidden">
            {/* Mock map */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-stone-400">
                <div className="text-4xl mb-3">🗺️</div>
                <div className="text-sm font-medium">Carte Leaflet — Populations mobiles</div>
                <div className="text-xs mt-1 text-stone-300">Couche nomades activée par défaut</div>
              </div>
            </div>

            {/* Simulated markers */}
            {visibleOpps.map((opp, i) => {
              const x = 15 + (i * 11 % 70);
              const y = 20 + (i * 13 % 55);
              return (
                <button
                  key={opp.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onClick={() => setSelectedOpp(opp)}
                  title={opp.location.description}
                >
                  <div className={`w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center ${
                    opp.groupType === 'seasonal_nomad' ? 'bg-amber-400' :
                    opp.groupType === 'displaced' ? 'bg-stone-400' : 'bg-slate-400'
                  } ${selectedOpp?.id === opp.id ? 'ring-2 ring-primary scale-125' : 'hover:scale-110'} transition-transform`}>
                    <span className="text-[8px] text-white font-bold">{i + 1}</span>
                  </div>
                </button>
              );
            })}

            {/* Tent icons for nomad stops */}
            <div className="absolute top-3 right-3">
              <div className="bg-white rounded-lg border border-stone-200 px-2.5 py-1.5 text-[11px] text-stone-600 flex items-center gap-1.5 shadow-sm">
                <Tent size={11} className="text-primary" />
                Arrêts nomades dans micro-plans
              </div>
            </div>
          </div>

          {/* Temporal slider */}
          <div className="mt-3 bg-white rounded-xl border border-stone-200 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-stone-700">Fenêtre temporelle</div>
              <div className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-medium">
                {formatDate(viewDate)}
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={sliderDate}
              onChange={(e) => setSliderDate(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-stone-400 mt-1">
              <span>{formatDate(now - 15 * DAY)}</span>
              <span>Aujourd'hui</span>
              <span>{formatDate(now + 15 * DAY)}</span>
            </div>
          </div>
        </div>

        {/* Right drawer — detail */}
        {selectedOpp && (
          <div className="w-72 flex-shrink-0 bg-white border border-stone-200 rounded-xl p-4 overflow-y-auto">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${GROUP_TYPE_COLOR[selectedOpp.groupType]}`}>
                  <TypeIcon type={selectedOpp.groupType} />
                  {GROUP_TYPE_LABEL[selectedOpp.groupType]}
                </span>
              </div>
              <button className="text-stone-400 hover:text-stone-600" onClick={() => setSelectedOpp(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="text-sm font-semibold text-stone-800 mb-3">{selectedOpp.location.description}</div>

            <div className="space-y-2 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-stone-500">Population</span>
                <span className="text-stone-700 font-medium">{selectedOpp.estimatedPopulation} personnes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Enfants</span>
                <span className="text-stone-700 font-medium">{selectedOpp.estimatedChildren}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Confiance</span>
                <span className="text-stone-700">{CONFIDENCE_LABEL[selectedOpp.confidenceLevel]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">FOSA</span>
                <span className="text-stone-700">{selectedOpp.nearestFacilityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Équipes dispo</span>
                <span className={`font-medium ${selectedOpp.teamsAvailableInWindow.length === 0 ? 'text-warning' : 'text-success'}`}>
                  {selectedOpp.teamsAvailableInWindow.length}
                  {selectedOpp.teamsAvailableInWindow.length === 0 && ' ⚠'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Statut</span>
                <span className={`font-medium ${
                  selectedOpp.status === 'executed' ? 'text-success' :
                  selectedOpp.status === 'planned' ? 'text-primary' :
                  selectedOpp.status === 'missed' ? 'text-danger' : 'text-stone-600'
                }`}>
                  {STATUS_LABEL[selectedOpp.status]}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button size="sm" className="w-full" onClick={() => navigate(`/nomades/opportunites/${selectedOpp.id}`)}>
                Voir le détail
              </Button>
              {selectedOpp.status === 'identified' && selectedOpp.teamsAvailableInWindow.length > 0 && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/nomades/opportunites/${selectedOpp.id}`)}>
                  Créer mission ciblée
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
