import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, Filter, Plus, LayoutGrid, Table as TableIcon, Map as MapIcon,
  Star, Bike, Car, Ship, Users as UsersIcon, ChevronRight,
} from 'lucide-react';
import { getTeams, teamMemberInitials } from '../data/mockTeams';
import { getFacility } from '../data/mockFacilities';
import { getNode } from '../data/mockGeography';
import type { Team, TeamStatus, VehicleType } from '../types/team';
import { TEAM_STATUS_LABEL, VEHICLE_LABEL, ROLE_LABEL } from '../types/team';
import { useScope } from '../lib/scope';
import { SCOPE_TO_GEO_NODE } from '../lib/scopeGeo';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { MapView, type MapMarker } from '../components/map/MapView';
import { cn } from '../lib/cn';

type ViewMode = 'cards' | 'table' | 'map';

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

function scopedTeams(scopeGeoId: string | null, teams: Team[]): Team[] {
  if (!scopeGeoId || scopeGeoId === 'td') return teams;
  return teams.filter((t) => {
    const fac = getFacility(t.homeFacilityId);
    if (!fac) return false;
    const ids = [fac.provinceId, fac.departmentId, fac.subPrefectureId, fac.cantonId];
    if (ids.includes(scopeGeoId)) return true;
    let cur = getNode(fac.cantonId);
    while (cur) {
      if (cur.id === scopeGeoId) return true;
      cur = cur.parentId ? getNode(cur.parentId) : undefined;
    }
    return false;
  });
}

interface Filters {
  search: string;
  statuses: Set<TeamStatus>;
  vehicles: Set<VehicleType>;
}
const DEFAULT_FILTERS: Filters = {
  search: '',
  statuses: new Set(),
  vehicles: new Set(),
};

function activeFilterCount(f: Filters): number {
  return (f.search ? 1 : 0) + f.statuses.size + f.vehicles.size;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] border transition',
        active
          ? 'bg-primary-50 border-primary-300 text-primary-800'
          : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300',
      )}
    >
      {children}
    </button>
  );
}

function TeamCard({ team, onOpen }: { team: Team; onOpen: () => void }) {
  const fac = getFacility(team.homeFacilityId);
  const Vehicle = vehicleIcon(team.vehicleType);
  const tone = STATUS_TONE[team.status];
  const visibleMembers = team.members.slice(0, 4);
  const extra = team.members.length - visibleMembers.length;
  const cantonNames = team.primaryInterventionZone.cantons
    .map((c) => getNode(c)?.name ?? c)
    .join(', ');

  return (
    <Card className="p-4 flex flex-col gap-3 hover:border-primary-300 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            'inline-block h-2 w-2 rounded-full',
            tone === 'success' && 'bg-success-500',
            tone === 'primary' && 'bg-primary-500 animate-pulse',
            tone === 'neutral' && 'bg-stone-400',
            tone === 'info' && 'bg-info-500',
            tone === 'danger' && 'bg-danger-500',
          )} />
          <Badge tone={tone}>{TEAM_STATUS_LABEL[team.status]}</Badge>
        </div>
      </div>

      <div>
        <div className="text-stone-900 font-medium">{team.name}</div>
        <div className="text-[11px] text-stone-500 font-mono mt-0.5">
          {team.code} · {fac?.name ?? '—'}
        </div>
      </div>

      <div className="flex items-center -space-x-2">
        {visibleMembers.map((m) => (
          <span key={m.id} title={`${m.name} (${ROLE_LABEL[m.role]})`} className="ring-2 ring-white rounded-full">
            <Avatar initials={teamMemberInitials(m.name)} size={30} />
          </span>
        ))}
        {extra > 0 && (
          <span className="ring-2 ring-white inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-stone-100 text-[11px] font-medium text-stone-600">
            +{extra}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[12px] text-stone-700">
        <Vehicle className="h-4 w-4 text-stone-500" />
        <span>{VEHICLE_LABEL[team.vehicleType]} {team.vehicleLabel}</span>
        {team.vehicleId && <span className="text-stone-400 font-mono text-[11px]">· {team.vehicleId}</span>}
      </div>

      <div className="bg-stone-50 rounded-md px-3 py-2 text-[12px] space-y-0.5">
        <div className="text-stone-700">
          <span className="tabular-nums font-medium">{team.totalMissionsCompleted}</span> missions ·{' '}
          <span className="tabular-nums font-medium">{team.totalChildrenVaccinated.toLocaleString('fr-FR')}</span> enfants vaccinés
        </div>
        <div className="inline-flex items-center gap-1 text-stone-600">
          <Star className="h-3 w-3 fill-warning-500 text-warning-500" />
          <span className="tabular-nums">{team.averageRating.toFixed(1)}/5</span> conformité
        </div>
      </div>

      <div className="text-[12px] text-stone-600">
        <div>
          <span className="text-stone-500">Zone :</span> {cantonNames || '—'} ({team.primaryInterventionZone.villagesCount} villages)
        </div>
        {team.status === 'on_mission' && team.currentMissionName ? (
          <div className="mt-0.5 text-primary-700">
            En mission : {team.currentMissionName}
          </div>
        ) : team.nextMissionStart ? (
          <div className="mt-0.5">
            Prochaine mission : {team.nextMissionStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        ) : null}
      </div>

      <button
        onClick={onOpen}
        className="text-primary-700 hover:text-primary-900 inline-flex items-center gap-1 text-[13px] font-medium self-start mt-auto"
      >
        Voir le détail <ChevronRight className="h-3 w-3" />
      </button>
    </Card>
  );
}

export default function TeamsListPage() {
  const navigate = useNavigate();
  const { current } = useScope();
  const all = useMemo(() => getTeams(), []);
  const inScope = useMemo(
    () => scopedTeams(current ? SCOPE_TO_GEO_NODE[current.id] ?? null : null, all),
    [current, all],
  );

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(true);
  const [view, setView] = useState<ViewMode>('cards');

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return inScope.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q) && !t.code.toLowerCase().includes(q)) return false;
      if (filters.statuses.size && !filters.statuses.has(t.status)) return false;
      if (filters.vehicles.size && !filters.vehicles.has(t.vehicleType)) return false;
      return true;
    });
  }, [inScope, filters]);

  const toggleSet = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value); else next.add(value);
    return next;
  };
  const update = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch });
  const count = activeFilterCount(filters);

  const markers: MapMarker[] = useMemo(() => {
    return filtered.slice(0, 200).map((t) => {
      const fac = getFacility(t.homeFacilityId);
      if (!fac) return null;
      const tone = STATUS_TONE[t.status];
      return {
        id: t.id,
        lat: fac.lat,
        lng: fac.lng,
        label: `${t.name} — ${TEAM_STATUS_LABEL[t.status]}`,
        tone: tone === 'primary' ? 'neutral' : tone === 'info' ? 'neutral' : tone,
      } as MapMarker;
    }).filter(Boolean) as MapMarker[];
  }, [filtered]);

  const center: [number, number] = (() => {
    if (markers.length === 0) return [13.5, 14.7];
    return [markers[0].lat, markers[0].lng];
  })();

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-stone-900">Équipes mobiles</h1>
          <p className="text-stone-500 text-[13px] mt-0.5">
            Gestion des équipes de vaccination opérationnelles.{' '}
            <span className="font-medium">{inScope.length}</span> équipes dans le périmètre{' '}
            <span className="font-medium">{current?.name ?? 'national'}</span>.
            {filtered.length !== inScope.length && <> {filtered.length} après filtre.</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Affecter à une mission</Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>Nouvelle équipe</Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 max-w-md">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Rechercher par nom ou code…"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
          />
        </div>
        <Button
          variant={showFilters ? 'primary' : 'outline'}
          size="md"
          leftIcon={<Filter className="h-4 w-4" />}
          onClick={() => setShowFilters((v) => !v)}
        >
          Filtres
          {count > 0 && (
            <Badge tone={showFilters ? 'neutral' : 'primary'} className="ml-2">{count}</Badge>
          )}
        </Button>
        <div className="inline-flex rounded-md border border-stone-200 bg-white overflow-hidden">
          {([
            { k: 'cards', icon: LayoutGrid, label: 'Cards' },
            { k: 'table', icon: TableIcon, label: 'Tableau' },
            { k: 'map', icon: MapIcon, label: 'Carte' },
          ] as { k: ViewMode; icon: any; label: string }[]).map(({ k, icon: Icon, label }) => (
            <button
              key={k}
              onClick={() => setView(k)}
              title={label}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px]',
                view === k ? 'bg-primary-50 text-primary-800' : 'text-stone-600 hover:bg-stone-50',
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        {showFilters && (
          <Card className="col-span-3 overflow-auto p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-stone-900 font-medium">Filtres</div>
                {count > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="text-[12px] text-primary-700 hover:underline"
                  >
                    Réinitialiser ({count})
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wide text-stone-500">Statut</div>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(TEAM_STATUS_LABEL) as TeamStatus[]).map((s) => (
                    <Chip key={s} active={filters.statuses.has(s)} onClick={() => update({ statuses: toggleSet(filters.statuses, s) })}>
                      {TEAM_STATUS_LABEL[s]}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wide text-stone-500">Véhicule</div>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(VEHICLE_LABEL) as VehicleType[]).map((v) => (
                    <Chip key={v} active={filters.vehicles.has(v)} onClick={() => update({ vehicles: toggleSet(filters.vehicles, v) })}>
                      {VEHICLE_LABEL[v]}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className={cn('min-h-0 flex flex-col', showFilters ? 'col-span-9' : 'col-span-12')}>
          {filtered.length === 0 ? (
            <Card className="flex-1 grid place-items-center">
              <div className="text-center p-8">
                <UsersIcon className="h-12 w-12 text-stone-300 mx-auto" />
                <div className="mt-3 text-stone-700">Aucune équipe ne correspond aux filtres.</div>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  Réinitialiser les filtres
                </Button>
              </div>
            </Card>
          ) : view === 'cards' ? (
            <div className="overflow-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map((t) => (
                  <TeamCard key={t.id} team={t} onOpen={() => navigate(`/referentiel/equipes/${t.id}`)} />
                ))}
              </div>
            </div>
          ) : view === 'table' ? (
            <Card className="overflow-auto p-0">
              <table className="w-full text-[13px]">
                <thead className="bg-stone-50 sticky top-0">
                  <tr className="text-left text-stone-600">
                    <th className="px-3 py-2 font-medium">Équipe</th>
                    <th className="px-3 py-2 font-medium">FOSA</th>
                    <th className="px-3 py-2 font-medium">Statut</th>
                    <th className="px-3 py-2 font-medium">Véhicule</th>
                    <th className="px-3 py-2 font-medium">Membres</th>
                    <th className="px-3 py-2 font-medium">Missions</th>
                    <th className="px-3 py-2 font-medium">Note</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const fac = getFacility(t.homeFacilityId);
                    return (
                      <tr
                        key={t.id}
                        className="border-t border-stone-100 hover:bg-primary-50 cursor-pointer"
                        onClick={() => navigate(`/referentiel/equipes/${t.id}`)}
                      >
                        <td className="px-3 py-2">
                          <div className="font-medium text-stone-900">{t.name}</div>
                          <div className="text-[11px] text-stone-500 font-mono">{t.code}</div>
                        </td>
                        <td className="px-3 py-2 text-stone-700">{fac?.name ?? '—'}</td>
                        <td className="px-3 py-2">
                          <Badge tone={STATUS_TONE[t.status]}>{TEAM_STATUS_LABEL[t.status]}</Badge>
                        </td>
                        <td className="px-3 py-2 text-stone-700">{VEHICLE_LABEL[t.vehicleType]}</td>
                        <td className="px-3 py-2 tabular-nums">{t.membersCount}</td>
                        <td className="px-3 py-2 tabular-nums">{t.totalMissionsCompleted}</td>
                        <td className="px-3 py-2 tabular-nums">{t.averageRating.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right">
                          <ChevronRight className="h-4 w-4 text-stone-400 inline" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          ) : (
            <Card className="h-full overflow-hidden p-0">
              <MapView
                center={center}
                zoom={8}
                markers={markers}
                onMarkerClick={(id) => navigate(`/referentiel/equipes/${id}`)}
                className="h-full"
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
