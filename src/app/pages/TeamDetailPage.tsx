import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, ChevronRight, Users, Truck, MapPin, History, Activity,
  AlertTriangle, AlertCircle, Info, Star, Phone, Bike, Car, Ship,
  Calendar, Wrench,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { getTeam, teamMemberInitials } from '../data/mockTeams';
import { getFacility } from '../data/mockFacilities';
import { getNode, getVillages } from '../data/mockGeography';
import { createPrng } from '../data/prng';
import type { Team, TeamStatus, VehicleType } from '../types/team';
import {
  TEAM_STATUS_LABEL, VEHICLE_LABEL, ROLE_LABEL, EQUIPMENT_LABEL,
} from '../types/team';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { MapView } from '../components/map/MapView';
import { cn } from '../lib/cn';

type Tab = 'composition' | 'logistics' | 'zone' | 'history' | 'audit';

const TABS: { key: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'composition', label: 'Composition', icon: Users },
  { key: 'logistics', label: 'Logistique', icon: Truck },
  { key: 'zone', label: 'Zone et planning', icon: MapPin },
  { key: 'history', label: 'Historique et performance', icon: Activity },
  { key: 'audit', label: 'Audit', icon: History },
];

const STATUS_TONE: Record<TeamStatus, 'success' | 'primary' | 'neutral' | 'info' | 'danger'> = {
  available: 'success',
  on_mission: 'primary',
  resting: 'neutral',
  training: 'info',
  unavailable: 'danger',
};

function vehicleIcon(v: VehicleType) {
  if (v === 'motorbike') return Bike;
  if (v === 'pirogue') return Ship;
  return Car;
}

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

function buildTimeline(team: Team) {
  const seed = parseInt(team.id.replace(/\D/g, '').slice(-4) || '1', 10);
  const rng = createPrng(seed);
  const now = new Date();
  const points: { month: string; vaccinated: number; district: number }[] = [];
  const baseMonthly = Math.round(team.totalChildrenVaccinated / 12);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.toLocaleDateString('fr-FR', { month: 'short' });
    points.push({
      month,
      vaccinated: Math.max(0, baseMonthly + Math.round(rng.range(-baseMonthly * 0.3, baseMonthly * 0.3))),
      district: Math.round(baseMonthly * 0.9 + rng.range(-baseMonthly * 0.2, baseMonthly * 0.2)),
    });
  }
  return points;
}

const WEEK_DAYS: { key: keyof Team['weeklySchedule']; short: string }[] = [
  { key: 'monday', short: 'L' },
  { key: 'tuesday', short: 'M' },
  { key: 'wednesday', short: 'M' },
  { key: 'thursday', short: 'J' },
  { key: 'friday', short: 'V' },
  { key: 'saturday', short: 'S' },
  { key: 'sunday', short: 'D' },
];

export default function TeamDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('composition');

  const team = useMemo(() => getTeam(id), [id]);

  if (!team) {
    return (
      <div className="p-8">
        <Card>
          <CardBody>
            <div className="text-stone-700">Équipe introuvable.</div>
            <Button className="mt-3" variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/referentiel/equipes')}>
              Retour à la liste
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const facility = getFacility(team.homeFacilityId);
  const department = facility ? getNode(facility.departmentId) : null;
  const province = facility ? getNode(facility.provinceId) : null;
  const leader = team.members.find((m) => m.id === team.teamLeaderId);
  const certifiedCount = team.members.filter((m) => m.pevCertified).length;
  const damagedEquipment = team.equipment.filter((e) => e.status !== 'operational');
  const operationalEquipment = team.equipment.length - damagedEquipment.length;
  const cantonVillages = useMemo(() => {
    return getVillages().filter((v) => team.primaryInterventionZone.cantons.includes(v.parentId ?? ''));
  }, [team]);

  const Vehicle = vehicleIcon(team.vehicleType);
  const tone = STATUS_TONE[team.status];

  const banners: React.ReactNode[] = [];
  if (team.status === 'on_mission' && team.currentMissionName && team.currentMissionStartedAt) {
    const hoursAgo = Math.floor((Date.now() - team.currentMissionStartedAt.getTime()) / 3_600_000);
    banners.push(
      <Banner key="mission" tone="info" icon={Activity}>
        Mission en cours : <span className="font-medium">{team.currentMissionName}</span> · Démarrée il y a {hoursAgo}h
      </Banner>,
    );
  }
  if (certifiedCount < team.membersCount) {
    banners.push(
      <Banner key="cert" tone="warning" icon={AlertTriangle}>
        {team.membersCount - certifiedCount} membre(s) de cette équipe ne sont pas certifiés PEV.
      </Banner>,
    );
  }
  if (damagedEquipment.length > 0) {
    banners.push(
      <Banner key="equip" tone="warning" icon={AlertTriangle}>
        {damagedEquipment.length} équipement(s) nécessitent une vérification.
      </Banner>,
    );
  }
  if (team.membersCount < 3) {
    banners.push(
      <Banner key="mincount" tone="danger" icon={AlertCircle}>
        Une équipe PEV doit compter au minimum 3 membres.
      </Banner>,
    );
  }

  const timeline = buildTimeline(team);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col p-4 gap-3 overflow-auto">
      <div>
        <button
          onClick={() => navigate('/referentiel/equipes')}
          className="inline-flex items-center gap-1 text-[12px] text-stone-500 hover:text-stone-800 mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Retour à la liste
        </button>
        <div className="flex items-center gap-1 text-[12px] text-stone-500 flex-wrap">
          {province && <span>{province.name}</span>}
          {department && <><ChevronRight className="h-3 w-3" /><span>{department.name}</span></>}
          {facility && <><ChevronRight className="h-3 w-3" /><span>{facility.name}</span></>}
        </div>
        <div className="flex items-start justify-between mt-1 gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-stone-900">{team.name}</h1>
              <span className="inline-flex items-center gap-1.5">
                <span className={cn(
                  'inline-block h-2 w-2 rounded-full',
                  tone === 'success' && 'bg-success-500',
                  tone === 'primary' && 'bg-primary-500 animate-pulse',
                  tone === 'neutral' && 'bg-stone-400',
                  tone === 'info' && 'bg-info-500',
                  tone === 'danger' && 'bg-danger-500',
                )} />
                <Badge tone={tone}>{TEAM_STATUS_LABEL[team.status]}</Badge>
              </span>
            </div>
            <div className="text-[12px] text-stone-500 font-mono mt-0.5">
              {team.code} · Rattachée à {facility?.name ?? '—'}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" leftIcon={<Phone className="h-4 w-4" />}>Contacter</Button>
            <Button size="sm">Affecter à une mission</Button>
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
              'inline-flex items-center gap-1.5 px-3 py-2 text-[13px] border-b-2 -mb-px',
              tab === key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-stone-600 hover:text-stone-900',
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {tab === 'composition' && (
          <div className="space-y-3">
            <div className="text-[13px] text-stone-700">
              <span className="font-medium">{team.membersCount}</span> membres ·{' '}
              <span className="font-medium">{certifiedCount}</span> certifiés PEV · Leader :{' '}
              <span className="font-medium">{leader?.name ?? '—'}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {team.members.map((m) => (
                <Card key={m.id} className="p-3 flex items-center gap-3">
                  <Avatar initials={teamMemberInitials(m.name)} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-stone-900">{m.name}</span>
                      {m.id === team.teamLeaderId && <Badge tone="primary">Leader</Badge>}
                    </div>
                    <div className="text-[12px] text-stone-600">{ROLE_LABEL[m.role]} · {m.yearsOfExperience} ans d'exp.</div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <a href={`tel:${m.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 text-[12px] text-primary-700 hover:underline">
                        <Phone className="h-3 w-3" /> {m.phone}
                      </a>
                      {m.pevCertified ? (
                        <Badge tone="success">
                          Certifié PEV{m.certificationDate ? ` · ${m.certificationDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}` : ''}
                        </Badge>
                      ) : (
                        <Badge tone="neutral">Non certifié</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === 'logistics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader><CardTitle className="text-[14px]">Véhicule</CardTitle></CardHeader>
              <CardBody className="space-y-2 text-[13px]">
                <div className="flex items-center gap-2">
                  <Vehicle className="h-5 w-5 text-stone-500" />
                  <div className="font-medium text-stone-900">{VEHICLE_LABEL[team.vehicleType]} — {team.vehicleLabel}</div>
                </div>
                {team.vehicleId && (
                  <div className="text-stone-600">Immatriculation : <span className="font-mono">{team.vehicleId}</span></div>
                )}
                <div className="pt-2">
                  <Button variant="outline" size="sm" leftIcon={<Wrench className="h-4 w-4" />}>
                    Signaler un problème véhicule
                  </Button>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-[14px]">
                  Équipements ({operationalEquipment}/{team.equipment.length} opérationnels)
                </CardTitle>
              </CardHeader>
              <CardBody>
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-stone-500 text-[11px] uppercase tracking-wide">
                      <th className="py-1">Type</th>
                      <th className="py-1">Quantité</th>
                      <th className="py-1">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.equipment.map((e, i) => (
                      <tr key={i} className="border-t border-stone-100">
                        <td className="py-1.5">{EQUIPMENT_LABEL[e.type]}</td>
                        <td className="py-1.5 tabular-nums">{e.quantity}</td>
                        <td className="py-1.5">
                          <Badge tone={e.status === 'operational' ? 'success' : e.status === 'damaged' ? 'warning' : 'danger'}>
                            {e.status === 'operational' ? 'OK' : e.status === 'damaged' ? 'Endommagé' : 'Manquant'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pt-3">
                  <Button variant="outline" size="sm">Demander réapprovisionnement</Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {tab === 'zone' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatTile label="Cantons couverts" value={String(team.primaryInterventionZone.cantons.length)} />
              <StatTile label="Villages dans la zone" value={String(team.primaryInterventionZone.villagesCount)} />
              <StatTile label="Population estimée" value={cantonVillages.reduce((s, v) => s + v.population, 0).toLocaleString('fr-FR')} />
              <StatTile label="Note conformité" value={`${team.averageRating.toFixed(1)}/5`} />
            </div>
            <Card className="overflow-hidden p-0 h-[380px]">
              <MapView
                center={facility ? [facility.lat, facility.lng] : [13.5, 14.7]}
                zoom={9}
                markers={[
                  ...(facility ? [{ id: facility.id, lat: facility.lat, lng: facility.lng, label: facility.name, tone: 'primary' as const }] : []),
                  ...cantonVillages.slice(0, 150).map((v) => ({
                    id: v.id, lat: v.centroidLat, lng: v.centroidLng,
                    label: `${v.name} — DTC3 ${v.vaccinationCoverage.overall}%`,
                    tone: (v.vaccinationCoverage.overall >= 95 ? 'success' : v.vaccinationCoverage.overall >= 50 ? 'warning' : 'danger') as 'success' | 'warning' | 'danger',
                  })),
                ]}
                onMarkerClick={(mid) => {
                  if (mid === facility?.id) navigate(`/referentiel/formations/${facility.id}`);
                  else navigate(`/referentiel/villages/${mid}`);
                }}
                className="h-full"
              />
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-[14px]">Disponibilité hebdomadaire</CardTitle></CardHeader>
              <CardBody>
                <div className="inline-flex gap-1.5">
                  {WEEK_DAYS.map((d) => {
                    const on = team.weeklySchedule[d.key];
                    return (
                      <div
                        key={d.key}
                        className={cn(
                          'h-10 w-10 rounded-md grid place-items-center text-[12px] font-medium',
                          on ? 'bg-success-100 text-success-800' : 'bg-stone-100 text-stone-400',
                        )}
                        title={d.key}
                      >
                        {d.short}
                      </div>
                    );
                  })}
                </div>
                {team.nextMissionStart && (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-stone-600">
                    <Calendar className="h-3.5 w-3.5" />
                    Prochaine mission : <span className="font-medium">{team.nextMissionStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatTile label="Missions complétées" value={String(team.totalMissionsCompleted)} />
              <StatTile label="Villages couverts" value={team.totalVillagesCovered.toLocaleString('fr-FR')} />
              <StatTile label="Enfants vaccinés" value={team.totalChildrenVaccinated.toLocaleString('fr-FR')} />
              <StatTile
                label="Note moyenne"
                value={`${team.averageRating.toFixed(1)}/5`}
                sub={'★'.repeat(Math.round(team.averageRating))}
              />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-[14px]">Évolution mensuelle — enfants vaccinés</CardTitle></CardHeader>
              <CardBody>
                <div className="h-[280px]">
                  <ResponsiveContainer>
                    <AreaChart data={timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="month" stroke="#78716c" fontSize={11} />
                      <YAxis stroke="#78716c" fontSize={11} />
                      <Tooltip />
                      <Area type="monotone" dataKey="vaccinated" stroke="#1E5BA8" fill="#1E5BA8" fillOpacity={0.15} name="Équipe" />
                      <Area type="monotone" dataKey="district" stroke="#78716c" fill="#78716c" fillOpacity={0.06} name="District (moy.)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-[14px]">Points forts & axes d'amélioration</CardTitle></CardHeader>
              <CardBody className="text-[13px] grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-stone-500 text-[11px] uppercase tracking-wide mb-1">Points forts</div>
                  <ul className="space-y-1 text-stone-700">
                    <li className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-warning-500 text-warning-500" /> Note conformité supérieure à la moyenne du district</li>
                    <li className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-warning-500 text-warning-500" /> Couverture DTC3 stable depuis 6 mois</li>
                  </ul>
                </div>
                <div>
                  <div className="text-stone-500 text-[11px] uppercase tracking-wide mb-1">Axes d'amélioration</div>
                  <ul className="space-y-1 text-stone-700">
                    <li className="inline-flex items-center gap-1"><Info className="h-3 w-3 text-info-600" /> Villages enclavés non visités depuis 60+ jours</li>
                    <li className="inline-flex items-center gap-1"><Info className="h-3 w-3 text-info-600" /> Rotation des certifications PEV à renforcer</li>
                  </ul>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {tab === 'audit' && (
          <Card>
            <CardBody className="text-stone-500 text-[13px]">
              Historique des modifications à venir — module Audit Sprint 6.
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
