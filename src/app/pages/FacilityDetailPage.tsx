import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, ChevronRight, MapPin, Snowflake, Wifi, WifiOff,
  AlertCircle, AlertTriangle, Info, Users, Activity, History,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts';
import { getFacility, getFacilities } from '../data/mockFacilities';
import { getTeamsForFacility } from '../data/mockTeams';
import { TEAM_STATUS_LABEL, VEHICLE_LABEL } from '../types/team';
import { getAncestors, getVillages } from '../data/mockGeography';
import { createPrng } from '../data/prng';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CoverageBar } from '../components/data/CoverageBar';
import { AccessibilityBadge } from '../components/data/AccessibilityBadge';
import { MapView } from '../components/map/MapView';
import {
  FACILITY_TYPE_LABEL, FACILITY_STATUS_LABEL, STRATEGY_LABEL,
} from '../types/facility';
import type { Facility, ColdChainEquipment } from '../types/facility';
import { cn } from '../lib/cn';

type Tab = 'info' | 'resources' | 'coverage_area' | 'pev' | 'audit';

const TABS: { key: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'info', label: 'Informations', icon: Info },
  { key: 'resources', label: 'Ressources', icon: Users },
  { key: 'coverage_area', label: 'Zone de desserte', icon: MapPin },
  { key: 'pev', label: 'Activités PEV', icon: Activity },
  { key: 'audit', label: 'Audit', icon: History },
];

function Banner({
  tone, icon: Icon, children,
}: { tone: 'danger' | 'warning' | 'info'; icon: React.ComponentType<any>; children: React.ReactNode }) {
  const map = {
    danger: 'bg-danger-100 text-danger-800 border-danger-300',
    warning: 'bg-warning-100 text-warning-800 border-warning-300',
    info: 'bg-info-100 text-info-800 border-info-300',
  };
  return (
    <div className={cn('flex items-start gap-2 px-3 py-2 rounded-md border text-[13px]', map[tone])}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-stone-50 rounded-md px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-stone-500">{label}</div>
      <div className="text-stone-900 font-medium tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-stone-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function buildTimeline(f: Facility) {
  const rng = createPrng(parseInt(f.id.replace(/\D/g, '').slice(-6) || '1', 10) || 1);
  const now = new Date();
  const points: { month: string; DTC3: number; district: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.toLocaleDateString('fr-FR', { month: 'short' });
    const base = f.monthlyCoverage.dtc3;
    points.push({
      month,
      DTC3: Math.round(Math.max(0, Math.min(100, base - i * 1.5 + rng.range(-6, 6)))),
      district: Math.round(Math.max(0, Math.min(100, 75 + rng.range(-5, 5)))),
    });
  }
  return points;
}

// All cold-chain equipment types share the same icon for now.
function ccIconForType(_t: ColdChainEquipment['type']) {
  return Snowflake;
}

export default function FacilityDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('info');

  const facility = useMemo(() => getFacility(id), [id]);
  const villages = useMemo(
    () => (facility ? getVillages().filter((v) => v.facilityId === facility.id) : []),
    [facility],
  );
  const cantonSiblings = useMemo(
    () => (facility ? getFacilities().filter((f) => f.cantonId === facility.cantonId && f.id !== facility.id) : []),
    [facility],
  );

  if (!facility) {
    return (
      <div className="p-8">
        <Card>
          <CardBody>
            <div className="text-stone-700">Formation introuvable.</div>
            <Button className="mt-3" variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/referentiel/formations')}>
              Retour à la liste
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const ancestors = getAncestors(facility.cantonId);
  const timeline = useMemo(() => buildTimeline(facility), [facility]);

  const banners: React.ReactNode[] = [];
  if (facility.status === 'closed') {
    const fallback = cantonSiblings.find((f) => f.status === 'operational') ?? cantonSiblings[0];
    banners.push(
      <Banner key="closed" tone="danger" icon={AlertCircle}>
        Cette formation est actuellement fermée.{' '}
        {fallback && <>Les villages desservis sont redirigés vers <button className="underline" onClick={() => navigate(`/referentiel/formations/${fallback.id}`)}>{fallback.name}</button>.</>}
      </Banner>,
    );
  }
  if (!facility.coldChainOperational) {
    const broken = facility.coldChainEquipments.find((e) => e.status === 'broken' || e.status === 'maintenance');
    banners.push(
      <Banner key="cc" tone="warning" icon={AlertTriangle}>
        La chaîne du froid est hors service{broken?.lastMaintenance ? ` depuis ${broken.lastMaintenance.toLocaleDateString('fr-FR')}` : ''}. Les vaccinations sont suspendues.
      </Banner>,
    );
  }
  if (facility.lastVerifiedAt) {
    const days = Math.floor((Date.now() - facility.lastVerifiedAt.getTime()) / 86_400_000);
    if (days > 90) {
      banners.push(
        <Banner key="verif" tone="info" icon={Info}>
          Les données n'ont pas été vérifiées depuis {days} jours.
        </Banner>,
      );
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col p-4 gap-3 overflow-auto">
      <div>
        <button
          onClick={() => navigate('/referentiel/formations')}
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
        <div className="flex items-start justify-between mt-1 gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-stone-900">{facility.name}</h1>
              <Badge tone={
                facility.status === 'operational' ? 'success' :
                facility.status === 'degraded' ? 'warning' :
                facility.status === 'closed' ? 'danger' : 'neutral'
              }>{FACILITY_STATUS_LABEL[facility.status]}</Badge>
            </div>
            <div className="text-[12px] text-stone-500 font-mono mt-0.5">{facility.code} · {FACILITY_TYPE_LABEL[facility.type]}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm">Modifier</Button>
            <Button size="sm">Voir sur carte</Button>
          </div>
        </div>
      </div>

      {banners.length > 0 && <div className="space-y-2">{banners}</div>}

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

      <div className="flex-1 min-h-0">
        {tab === 'info' && (
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-7 space-y-3">
              <Card>
                <CardHeader><CardTitle className="text-[14px]">Identification</CardTitle></CardHeader>
                <CardBody className="space-y-2">
                  <div className="text-[13px] text-stone-700">Nom officiel : <span className="font-medium text-stone-900">{facility.name}</span></div>
                  <div className="text-[13px] text-stone-700">Code FOSA : <span className="font-mono text-stone-900">{facility.code}</span></div>
                  <div className="text-[13px] text-stone-700">Type : <Badge tone="primary">{FACILITY_TYPE_LABEL[facility.type]}</Badge></div>
                  <div className="text-[12px] text-stone-500">{ancestors.map((a) => a.name).join(' › ')}</div>
                </CardBody>
              </Card>
              <Card className="overflow-hidden">
                <CardHeader><CardTitle className="text-[14px]">Localisation</CardTitle></CardHeader>
                <CardBody className="space-y-2">
                  <div className="text-[13px] text-stone-700">
                    <span className="font-mono">{facility.lat.toFixed(4)}, {facility.lng.toFixed(4)}</span>
                  </div>
                  <div className="text-[12px] text-stone-500">{facility.address}</div>
                  <div className="h-56 rounded-md overflow-hidden border border-stone-200">
                    <MapView
                      center={[facility.lat, facility.lng]}
                      zoom={13}
                      markers={[{ id: facility.id, lat: facility.lat, lng: facility.lng, label: facility.name, tone: 'primary' }]}
                      selectedId={facility.id}
                      className="h-full"
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
            <div className="col-span-5 space-y-3">
              <Card>
                <CardHeader><CardTitle className="text-[14px]">Accessibilité</CardTitle></CardHeader>
                <CardBody className="space-y-2">
                  <AccessibilityBadge dry={facility.roadAccess.drySeasonAccess} wet={facility.roadAccess.wetSeasonAccess} />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {facility.transportModesAvailable.map((m) => (
                      <Badge key={m} tone="neutral">{m}</Badge>
                    ))}
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-[14px]">Connectivité</CardTitle></CardHeader>
                <CardBody className="space-y-2 text-[13px]">
                  <div className="flex items-center gap-2">
                    {facility.connectivity === 'none'
                      ? <WifiOff className="h-4 w-4 text-danger-700" />
                      : <Wifi className={cn('h-4 w-4', facility.connectivity === 'good' ? 'text-success-700' : 'text-warning-700')} />}
                    <span className="text-stone-700">
                      {facility.mobileNetwork.available ? `Réseau ${facility.mobileNetwork.quality}` : 'Sans réseau'}
                    </span>
                  </div>
                  {facility.mobileNetwork.operators.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {facility.mobileNetwork.operators.map((o) => <Badge key={o} tone="info">{o}</Badge>)}
                    </div>
                  )}
                  <div className="text-stone-700">Internet : <span className={facility.hasInternet ? 'text-success-700 font-medium' : 'text-stone-500'}>{facility.hasInternet ? 'oui' : 'non'}</span></div>
                </CardBody>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-[14px]">Métadonnées</CardTitle></CardHeader>
                <CardBody className="space-y-1.5 text-[12px] text-stone-600">
                  <div>Créée le : <span className="text-stone-800">{facility.createdAt.toLocaleDateString('fr-FR')}</span></div>
                  <div>Mise à jour : <span className="text-stone-800">{facility.updatedAt.toLocaleDateString('fr-FR')}</span></div>
                  <div>Dernière vérif. terrain : <span className="text-stone-800">{facility.lastVerifiedAt ? facility.lastVerifiedAt.toLocaleDateString('fr-FR') : '—'}</span></div>
                  {facility.verifiedBy && <div>Vérifiée par : <span className="text-stone-800">{facility.verifiedBy}</span></div>}
                  <div className="pt-2">
                    <CoverageBar value={facility.dataQualityScore} label="Score qualité" />
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {tab === 'resources' && (
          <div className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-[14px]">
                  Équipe sur place ({facility.staffCount} membres dont {facility.pevTrainedCount} formés PEV)
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {facility.staff.map((s, i) => (
                    <div key={i} className="border border-stone-200 rounded-md p-3 flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-800 grid place-items-center font-medium text-[12px]">
                        {s.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-stone-900 font-medium text-[13px] truncate">{s.name}</div>
                        <Badge tone="neutral" className="mt-1">{s.role}</Badge>
                        <div className="mt-1">
                          {s.pevTrained
                            ? <Badge tone="success">Formé PEV{s.pevTrainingDate ? ` · ${s.pevTrainingDate.toLocaleDateString('fr-FR')}` : ''}</Badge>
                            : <Badge tone="neutral">Non formé</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[14px]">
                  Chaîne du froid · Capacité totale {facility.coldChainCapacityDoses.toLocaleString('fr-FR')} doses ·
                  {' '}{facility.coldChainEquipments.filter((e) => e.status === 'operational').length}/{facility.coldChainEquipments.length} opérationnels
                </CardTitle>
              </CardHeader>
              <CardBody>
                {facility.coldChainEquipments.length === 0 ? (
                  <div className="text-stone-500 text-[13px] py-4 text-center">
                    Aucun équipement de chaîne du froid renseigné.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {facility.coldChainEquipments.map((e) => {
                      const Icon = ccIconForType(e.type);
                      const overdue = e.nextMaintenanceDue && e.nextMaintenanceDue.getTime() < Date.now();
                      return (
                        <div key={e.id} className="border border-stone-200 rounded-md p-3">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary-700" />
                            <span className="font-medium text-stone-900 text-[13px]">{e.brand}</span>
                            <Badge tone={
                              e.status === 'operational' ? 'success' :
                              e.status === 'degraded' ? 'warning' :
                              e.status === 'broken' ? 'danger' : 'neutral'
                            } className="ml-auto">{e.status}</Badge>
                          </div>
                          <div className="text-[12px] text-stone-600 mt-1">{e.type} · {e.capacity} L/doses</div>
                          <div className="text-[11px] text-stone-500 mt-1">Installé : {e.installedDate.toLocaleDateString('fr-FR')}</div>
                          <div className="text-[11px] text-stone-500">Dernière maint. : {e.lastMaintenance ? e.lastMaintenance.toLocaleDateString('fr-FR') : '—'}</div>
                          <div className={cn('text-[11px]', overdue ? 'text-danger-700 font-medium' : 'text-stone-500')}>
                            Prochaine maint. : {e.nextMaintenanceDue ? e.nextMaintenanceDue.toLocaleDateString('fr-FR') : '—'}{overdue && ' (dépassée)'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>

            {(() => {
              const teams = getTeamsForFacility(facility.id);
              if (teams.length === 0) return null;
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[14px]">
                      Équipes opérant depuis cette FOSA ({teams.length})
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {teams.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => navigate(`/referentiel/equipes/${t.id}`)}
                          className="text-left border border-stone-200 hover:border-primary-300 rounded-md p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium text-stone-900 text-[13px]">{t.name}</div>
                            <Badge tone={t.status === 'available' ? 'success' : t.status === 'on_mission' ? 'primary' : 'neutral'}>
                              {TEAM_STATUS_LABEL[t.status]}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-stone-500 font-mono mt-0.5">{t.code}</div>
                          <div className="text-[12px] text-stone-600 mt-1">
                            {t.membersCount} membres · {VEHICLE_LABEL[t.vehicleType]} · {t.totalMissionsCompleted} missions
                          </div>
                          <div className="text-[11px] text-primary-700 mt-1 inline-flex items-center gap-0.5">
                            Voir l'équipe <ExternalLink className="h-3 w-3" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              );
            })()}
          </div>
        )}

        {tab === 'coverage_area' && (
          <div className="space-y-3">
            <Card>
              <CardBody className="grid grid-cols-4 gap-2">
                <StatTile label="Villages desservis" value={facility.villagesServed.toLocaleString('fr-FR')} />
                <StatTile label="Population" value={facility.populationCovered.toLocaleString('fr-FR')} />
                <StatTile label="Enfants <5 ans" value={facility.targetPopulationUnder5.toLocaleString('fr-FR')} />
                <StatTile label="Rayon moyen" value={`${facility.averageRadiusKm} km`} />
              </CardBody>
            </Card>

            <Card className="overflow-hidden p-0 h-80">
              <MapView
                center={[facility.lat, facility.lng]}
                zoom={10}
                markers={[
                  { id: facility.id, lat: facility.lat, lng: facility.lng, label: facility.name, tone: 'primary', radius: 10 },
                  ...villages.map((v) => ({
                    id: v.id,
                    lat: v.centroidLat,
                    lng: v.centroidLng,
                    label: `${v.name} — ${v.vaccinationCoverage.overall}%`,
                    tone: !v.lastVaccinationVisit ? 'danger' as const
                      : v.vaccinationCoverage.overall >= 95 ? 'success' as const
                      : v.vaccinationCoverage.overall >= 50 ? 'warning' as const
                      : 'danger' as const,
                  })),
                ]}
                onMarkerClick={(id) => { if (id !== facility.id) navigate(`/referentiel/villages/${id}`); }}
                className="h-full"
              />
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-[14px]">Villages desservis ({villages.length})</CardTitle></CardHeader>
              <CardBody>
                <div className="overflow-auto max-h-72">
                  <table className="w-full text-[13px]">
                    <thead className="bg-stone-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-stone-600">Village</th>
                        <th className="text-left px-3 py-2 font-medium text-stone-600">Distance</th>
                        <th className="text-left px-3 py-2 font-medium text-stone-600">Population</th>
                        <th className="text-left px-3 py-2 font-medium text-stone-600">DTC3</th>
                        <th className="text-left px-3 py-2 font-medium text-stone-600">Dernière visite</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...villages].sort((a, b) => a.vaccinationCoverage.overall - b.vaccinationCoverage.overall).map((v) => (
                        <tr key={v.id} className="border-t border-stone-100">
                          <td className="px-3 py-2 font-medium text-stone-900">{v.name}</td>
                          <td className="px-3 py-2 tabular-nums">{v.facilityDistanceKm} km</td>
                          <td className="px-3 py-2 tabular-nums">{v.population.toLocaleString('fr-FR')}</td>
                          <td className="px-3 py-2"><CoverageBar value={v.vaccinationCoverage.dtc3} className="min-w-[100px]" /></td>
                          <td className="px-3 py-2 text-stone-700">{v.daysSinceLastVisit !== null ? `il y a ${v.daysSinceLastVisit} j` : <span className="text-danger-700">Jamais</span>}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => navigate(`/referentiel/villages/${v.id}`)} className="text-primary-700 hover:text-primary-900">
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {tab === 'pev' && (
          <div className="space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-[14px]">Stratégies vaccinales</CardTitle></CardHeader>
              <CardBody className="flex flex-wrap gap-2">
                {facility.vaccinationStrategies.map((s) => (
                  <Badge key={s} tone="primary">{STRATEGY_LABEL[s]}</Badge>
                ))}
                <span className="text-[12px] text-stone-500 ml-2">·  {facility.sessionsPerMonth} séances/mois</span>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-[14px]">Couverture mensuelle</CardTitle></CardHeader>
              <CardBody className="grid grid-cols-4 gap-2">
                <div><CoverageBar label="BCG" value={facility.monthlyCoverage.bcg} /></div>
                <div><CoverageBar label="DTC1" value={facility.monthlyCoverage.dtc1} /></div>
                <div><CoverageBar label="DTC3" value={facility.monthlyCoverage.dtc3} /></div>
                <div><CoverageBar label="Rougeole" value={facility.monthlyCoverage.measles} /></div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-[14px]">Performance comparée — DTC3 sur 12 mois</CardTitle></CardHeader>
              <CardBody>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeline}>
                      <CartesianGrid stroke="#E7E5E4" strokeDasharray="3 3" />
                      <XAxis dataKey="month" stroke="#78716C" fontSize={12} />
                      <YAxis domain={[0, 100]} stroke="#78716C" fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <ReferenceLine y={95} stroke="#16A34A" strokeDasharray="4 4" label={{ value: 'Objectif PEV 95%', position: 'right', fontSize: 11, fill: '#16A34A' }} />
                      <Line type="monotone" dataKey="DTC3" stroke="#1E5BA8" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="district" name="Moyenne district" stroke="#78716C" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {tab === 'audit' && (
          <Card>
            <CardBody>
              <div className="text-stone-500 text-[13px] text-center py-8">
                Historique d'audit disponible avec l'intégration backend (Sprint 6).
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
