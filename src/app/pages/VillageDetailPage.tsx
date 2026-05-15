import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, MapPin, ChevronRight, Calendar, Users, Activity, History,
  School, Droplet, Store, Building2, Sun, CloudRain,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { getVillages, getNode, getAncestors, getFacilities } from '../data/mockGeography';
import { createPrng } from '../data/prng';
import type { Village } from '../types/village';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CoverageBar } from '../components/data/CoverageBar';
import { AccessibilityBadge } from '../components/data/AccessibilityBadge';
import { MapView } from '../components/map/MapView';
import { ACCESSIBILITY_LABEL, VALIDATION_LABEL } from '../types/village';
import { cn } from '../lib/cn';

type Tab = 'overview' | 'coverage' | 'access' | 'history';

const TABS: { key: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'overview', label: 'Vue d\'ensemble', icon: Users },
  { key: 'coverage', label: 'Couverture', icon: Activity },
  { key: 'access', label: 'Accessibilité', icon: MapPin },
  { key: 'history', label: 'Historique', icon: History },
];

function buildTimeline(v: Village) {
  const rng = createPrng(parseInt(v.id.replace(/\D/g, '').slice(-6) || '1', 10) || 1);
  const now = new Date();
  const points: { month: string; BCG: number; DTC1: number; DTC3: number; Rougeole: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.toLocaleDateString('fr-FR', { month: 'short' });
    const drift = (base: number) => Math.max(0, Math.min(100, base - i * 1.2 + rng.range(-5, 5)));
    points.push({
      month,
      BCG: Math.round(drift(v.vaccinationCoverage.bcg)),
      DTC1: Math.round(drift(v.vaccinationCoverage.dtc1)),
      DTC3: Math.round(drift(v.vaccinationCoverage.dtc3)),
      Rougeole: Math.round(drift(v.vaccinationCoverage.measles)),
    });
  }
  return points;
}

function buildVisits(v: Village) {
  if (!v.lastVaccinationVisit) return [];
  const rng = createPrng(parseInt(v.id.replace(/\D/g, '').slice(-6) || '1', 10) || 1);
  const visits: { date: Date; type: string; team: string; outcome: string }[] = [];
  let cur = new Date(v.lastVaccinationVisit);
  const TEAMS = ['Équipe Bol-1', 'Équipe Liwa-2', 'Équipe Mao-3', 'Équipe Massakory-1'];
  for (let i = 0; i < 5; i++) {
    visits.push({
      date: new Date(cur),
      type: rng.pick(['Routine', 'Campagne ciblée', 'Visite supervision']),
      team: rng.pick(TEAMS),
      outcome: rng.pick(['Complétée', 'Complétée', 'Partielle']),
    });
    cur = new Date(cur.getTime() - rng.int(45, 90) * 86_400_000);
  }
  return visits;
}

function StatTile({
  label, value, icon: Icon, tone = 'neutral',
}: {
  label: string; value: string; icon: React.ComponentType<any>; tone?: 'neutral' | 'primary' | 'danger';
}) {
  return (
    <div className="bg-stone-50 rounded-md px-3 py-3 flex items-center gap-3">
      <div className={cn(
        'h-9 w-9 rounded-md grid place-items-center',
        tone === 'primary' ? 'bg-primary-100 text-primary-700' :
        tone === 'danger' ? 'bg-danger-100 text-danger-700' :
        'bg-white border border-stone-200 text-stone-600',
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-stone-500">{label}</div>
        <div className="text-stone-900 font-medium tabular-nums">{value}</div>
      </div>
    </div>
  );
}

export default function VillageDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');

  const village = useMemo(
    () => getVillages().find((v) => v.id === id),
    [id],
  );

  if (!village) {
    return (
      <div className="p-8">
        <Card>
          <CardBody>
            <div className="text-stone-700">Village introuvable.</div>
            <Button className="mt-3" variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/referentiel/villages')}>
              Retour à la liste
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const ancestors = getAncestors(village.id);
  const facility = getFacilities().find((f) => f.id === village.facilityId);
  const timeline = useMemo(() => buildTimeline(village), [village]);
  const visits = useMemo(() => buildVisits(village), [village]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col p-4 gap-3">
      <div>
        <button
          onClick={() => navigate('/referentiel/villages')}
          className="inline-flex items-center gap-1 text-[12px] text-stone-500 hover:text-stone-800 mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Retour à la liste
        </button>
        <div className="flex items-center gap-1 text-[12px] text-stone-500 flex-wrap">
          {ancestors.map((a, i) => (
            <span key={a.id} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              <span>{a.name}</span>
            </span>
          ))}
        </div>
        <div className="flex items-start justify-between mt-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-stone-900">{village.name}</h1>
              <Badge tone={
                village.validationStatus === 'validated' ? 'success' :
                village.validationStatus === 'needs_review' ? 'warning' : 'neutral'
              }>
                {VALIDATION_LABEL[village.validationStatus]}
              </Badge>
            </div>
            <div className="text-[12px] text-stone-500 font-mono mt-0.5">{village.code}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Modifier</Button>
            <Button size="sm">Valider</Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-stone-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 text-[13px] border-b-2 -mb-px',
              tab === key
                ? 'border-primary text-primary-800 font-medium'
                : 'border-transparent text-stone-600 hover:text-stone-900',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {tab === 'overview' && (
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-8 space-y-3">
              <Card>
                <CardHeader><CardTitle className="text-[14px]">Indicateurs clés</CardTitle></CardHeader>
                <CardBody className="grid grid-cols-4 gap-2">
                  <StatTile label="Population" value={village.population.toLocaleString('fr-FR')} icon={Users} tone="primary" />
                  <StatTile label="Enfants <5 ans" value={village.estimatedChildrenUnder5.toLocaleString('fr-FR')} icon={Users} />
                  <StatTile label="Distance FOSA" value={`${village.facilityDistanceKm} km`} icon={MapPin} />
                  <StatTile
                    label="Dernière visite"
                    value={village.daysSinceLastVisit !== null ? `il y a ${village.daysSinceLastVisit} j` : 'Jamais'}
                    icon={Calendar}
                    tone={village.daysSinceLastVisit === null ? 'danger' : 'neutral'}
                  />
                </CardBody>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-[14px]">Couverture vaccinale</CardTitle></CardHeader>
                <CardBody className="space-y-2">
                  <CoverageBar label="Globale" value={village.vaccinationCoverage.overall} />
                  <CoverageBar label="BCG" value={village.vaccinationCoverage.bcg} />
                  <CoverageBar label="DTC1" value={village.vaccinationCoverage.dtc1} />
                  <CoverageBar label="DTC3" value={village.vaccinationCoverage.dtc3} />
                  <CoverageBar label="Rougeole" value={village.vaccinationCoverage.measles} />
                </CardBody>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-[14px]">Infrastructures</CardTitle></CardHeader>
                <CardBody className="flex flex-wrap gap-2">
                  {village.infrastructure.hasSchool && <Badge tone="info"><School className="h-3 w-3" /> École</Badge>}
                  {village.infrastructure.hasWaterPoint && <Badge tone="info"><Droplet className="h-3 w-3" /> Point d'eau</Badge>}
                  {village.infrastructure.hasMarket && <Badge tone="info"><Store className="h-3 w-3" /> Marché</Badge>}
                  {village.infrastructure.hasMosque && <Badge tone="info"><Building2 className="h-3 w-3" /> Mosquée</Badge>}
                  {!village.infrastructure.hasSchool && !village.infrastructure.hasWaterPoint && !village.infrastructure.hasMarket && !village.infrastructure.hasMosque && (
                    <span className="text-stone-500 text-[13px]">Aucune infrastructure recensée.</span>
                  )}
                </CardBody>
              </Card>
            </div>

            <div className="col-span-4 space-y-3">
              <Card className="overflow-hidden p-0 h-64">
                <MapView
                  center={[village.centroidLat, village.centroidLng]}
                  zoom={12}
                  markers={[{
                    id: village.id,
                    lat: village.centroidLat,
                    lng: village.centroidLng,
                    label: village.name,
                    tone: 'primary',
                  }]}
                  selectedId={village.id}
                  className="h-full"
                />
              </Card>
              {facility && (
                <Card
                  className="cursor-pointer hover:ring-1 hover:ring-primary-300 transition"
                  onClick={() => navigate(`/referentiel/formations/${facility.id}`)}
                >
                  <CardHeader><CardTitle className="text-[14px]">Formation sanitaire</CardTitle></CardHeader>
                  <CardBody className="space-y-2 text-[13px]">
                    <div className="font-medium text-stone-900">{facility.name}</div>
                    <div className="text-stone-500 font-mono text-[11px]">{facility.code}</div>
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <Badge tone="primary">{facility.type}</Badge>
                      <Badge tone={facility.status === 'operational' ? 'success' : 'warning'}>{facility.status}</Badge>
                    </div>
                    <div className="text-stone-600 pt-1">
                      {facility.staffCount} agents · Couvre {facility.villagesServed} villages
                    </div>
                  </CardBody>
                </Card>
              )}
              <Card>
                <CardHeader><CardTitle className="text-[14px]">Qualité de la donnée</CardTitle></CardHeader>
                <CardBody>
                  <CoverageBar value={village.dataQualityScore} label="Score qualité" />
                  {village.validatedBy && (
                    <div className="text-[12px] text-stone-500 mt-2">
                      Validé par <span className="font-medium text-stone-700">{village.validatedBy}</span> le {village.validatedAt?.toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {tab === 'coverage' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Évolution de la couverture — 12 derniers mois</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline}>
                    <CartesianGrid stroke="#E7E5E4" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="#78716C" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#78716C" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="BCG" stroke="#1E5BA8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="DTC1" stroke="#16A34A" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="DTC3" stroke="#D97706" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Rougeole" stroke="#E11D74" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        )}

        {tab === 'access' && (
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader><CardTitle className="text-[14px]">Conditions d'accès</CardTitle></CardHeader>
              <CardBody className="space-y-3">
                <div className="flex items-center gap-2 text-[13px]">
                  <Sun className="h-4 w-4 text-warning-700" />
                  <span className="text-stone-600">Saison sèche :</span>
                  <span className="font-medium text-stone-900">{ACCESSIBILITY_LABEL[village.accessibility.drySeasonAccess]}</span>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <CloudRain className="h-4 w-4 text-info-700" />
                  <span className="text-stone-600">Saison des pluies :</span>
                  <span className="font-medium text-stone-900">{ACCESSIBILITY_LABEL[village.accessibility.wetSeasonAccess]}</span>
                </div>
                <AccessibilityBadge dry={village.accessibility.drySeasonAccess} wet={village.accessibility.wetSeasonAccess} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-[14px]">Trajet vers la FOSA</CardTitle></CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-2">
                  <StatTile label="Distance" value={`${village.facilityDistanceKm} km`} icon={MapPin} />
                  <StatTile label="Temps trajet" value={`${village.facilityTravelTimeMin} min`} icon={Calendar} />
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {tab === 'history' && (
          <Card>
            <CardHeader><CardTitle className="text-[14px]">Historique des visites</CardTitle></CardHeader>
            <CardBody>
              {visits.length === 0 ? (
                <div className="text-stone-500 text-[13px] py-6 text-center">
                  Ce village n'a jamais été visité.
                </div>
              ) : (
                <ol className="relative border-l border-stone-200 ml-2 space-y-4 pt-1">
                  {visits.map((v, i) => (
                    <li key={i} className="ml-4">
                      <span className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary border-2 border-white" />
                      <div className="text-[13px] text-stone-900 font-medium">
                        {v.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-[12px] text-stone-600 mt-0.5">
                        {v.type} — {v.team} ·
                        <span className={cn('ml-1', v.outcome === 'Complétée' ? 'text-success-700' : 'text-warning-700')}>
                          {v.outcome}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
