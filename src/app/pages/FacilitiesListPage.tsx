import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Search, Upload, Download, Filter, ExternalLink, Snowflake,
  Wifi, WifiOff,
} from 'lucide-react';
import { getFacilities } from '../data/mockFacilities';
import { getNode } from '../data/mockGeography';
import type { Facility } from '../types/facility';
import { FACILITY_TYPE_LABEL, FACILITY_TYPE_SHORT, FACILITY_STATUS_LABEL } from '../types/facility';
import { useScope } from '../lib/scope';
import { SCOPE_TO_GEO_NODE } from '../lib/scopeGeo';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { DataTable } from '../components/data/DataTable';
import { CoverageBar } from '../components/data/CoverageBar';
import { MapView, type MapMarker } from '../components/map/MapView';
import { SplitMapView, type SplitMode } from '../components/map/SplitMapView';
import {
  FacilityFilterPanel,
  applyFacilityFilters,
  activeFacilityFilterCount,
  DEFAULT_FACILITY_FILTERS,
  type FacilityFilters,
} from '../components/data/FacilityFilterPanel';
import { cn } from '../lib/cn';

function scopedFacilities(scopeGeoId: string | null, facilities: Facility[]): Facility[] {
  if (!scopeGeoId || scopeGeoId === 'td') return facilities;
  return facilities.filter((f) => {
    const ids = [f.provinceId, f.departmentId, f.subPrefectureId, f.cantonId];
    if (ids.includes(scopeGeoId)) return true;
    // Climb canton parent chain to support province-level scope.
    let cur = getNode(f.cantonId);
    while (cur) {
      if (cur.id === scopeGeoId) return true;
      cur = cur.parentId ? getNode(cur.parentId) : undefined;
    }
    return false;
  });
}

function statusTone(s: Facility['status']): 'success' | 'warning' | 'danger' | 'neutral' {
  return s === 'operational' ? 'success'
    : s === 'degraded' ? 'warning'
    : s === 'closed' ? 'danger'
    : 'neutral';
}

function coldChainState(f: Facility): { tone: 'success' | 'warning' | 'danger'; label: string } {
  if (!f.coldChainOperational) return { tone: 'danger', label: 'Hors service' };
  if (f.coldChainEquipments.some((e) => e.status === 'degraded')) return { tone: 'warning', label: 'Dégradée' };
  return { tone: 'success', label: 'Opérationnelle' };
}

export default function FacilitiesListPage() {
  const navigate = useNavigate();
  const { current } = useScope();
  const all = useMemo(() => getFacilities(), []);
  const inScope = useMemo(
    () => scopedFacilities(current ? SCOPE_TO_GEO_NODE[current.id] ?? null : null, all),
    [current, all],
  );

  const [filters, setFilters] = useState<FacilityFilters>(DEFAULT_FACILITY_FILTERS);
  const [showFilters, setShowFilters] = useState(true);
  const [splitMode, setSplitMode] = useState<SplitMode>('split');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const out = applyFacilityFilters(inScope, filters);
    // Tri : closed et degraded en premier (alertes), puis par nom.
    const order = { closed: 0, degraded: 1, under_construction: 2, operational: 3 } as const;
    return [...out].sort((a, b) => {
      const o = order[a.status] - order[b.status];
      return o !== 0 ? o : a.name.localeCompare(b.name);
    });
  }, [inScope, filters]);

  const columns = useMemo<ColumnDef<Facility, any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Formation',
        cell: (info) => {
          const f = info.row.original;
          return (
            <div>
              <div className="font-medium text-stone-900">{f.name}</div>
              <div className="text-[11px] text-stone-500 font-mono">{f.code}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: (info) => {
          const t = info.getValue() as Facility['type'];
          return <Badge tone={t === 'hospital' ? 'danger' : t === 'health_center' ? 'primary' : 'neutral'}>{FACILITY_TYPE_SHORT[t]}</Badge>;
        },
      },
      {
        id: 'localization',
        header: 'Localisation',
        accessorFn: (f) => f.cantonId,
        cell: (info) => {
          const f = info.row.original;
          const canton = getNode(f.cantonId);
          const dep = getNode(f.departmentId);
          return (
            <div className="text-[12px]">
              <div className="text-stone-800">{canton?.name ?? '—'}</div>
              <div className="text-stone-500">{dep?.name ?? '—'}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: (info) => {
          const s = info.getValue() as Facility['status'];
          return <Badge tone={statusTone(s)}>{FACILITY_STATUS_LABEL[s]}</Badge>;
        },
      },
      {
        id: 'staff',
        header: 'Personnel',
        accessorFn: (f) => f.staffCount,
        cell: (info) => {
          const f = info.row.original;
          return (
            <div className="text-[12px]">
              <div className="text-stone-900 tabular-nums">{f.staffCount}</div>
              <div className="text-stone-500">({f.pevTrainedCount} formés PEV)</div>
            </div>
          );
        },
      },
      {
        id: 'coldchain',
        header: 'Chaîne du froid',
        accessorFn: (f) => (f.coldChainOperational ? 1 : 0),
        cell: (info) => {
          const f = info.row.original;
          const st = coldChainState(f);
          return (
            <span className={cn(
              'inline-flex items-center gap-1 text-[12px]',
              st.tone === 'success' ? 'text-success-700' :
              st.tone === 'warning' ? 'text-warning-700' : 'text-danger-700',
            )}>
              <Snowflake className="h-3.5 w-3.5" /> {st.label}
            </span>
          );
        },
      },
      {
        accessorKey: 'coldChainCapacityDoses',
        header: 'Capacité (doses)',
        cell: (info) => <span className="tabular-nums">{(info.getValue() as number).toLocaleString('fr-FR')}</span>,
      },
      {
        accessorKey: 'villagesServed',
        header: 'Villages',
        cell: (info) => <span className="tabular-nums">{(info.getValue() as number).toLocaleString('fr-FR')}</span>,
      },
      {
        id: 'dtc3',
        header: 'DTC3',
        accessorFn: (f) => f.monthlyCoverage.dtc3,
        cell: (info) => <CoverageBar value={info.getValue() as number} className="min-w-[110px]" />,
      },
      {
        id: 'connectivity',
        header: 'Réseau',
        accessorFn: (f) => f.connectivity,
        cell: (info) => {
          const c = info.getValue() as Facility['connectivity'];
          const Icon = c === 'none' ? WifiOff : Wifi;
          const cls = c === 'good' ? 'text-success-700' : c === 'intermittent' ? 'text-warning-700' : 'text-danger-700';
          return <Icon className={cn('h-4 w-4', cls)} />;
        },
      },
      {
        id: 'open',
        header: '',
        enableSorting: false,
        cell: (info) => (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(`/referentiel/formations/${info.row.original.id}`); }}
            className="text-primary-700 hover:text-primary-900 p-1 -m-1"
            title="Ouvrir la fiche"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [navigate],
  );

  const markers: MapMarker[] = useMemo(() => {
    const capped = filtered.slice(0, 200);
    return capped.map((f) => ({
      id: f.id,
      lat: f.lat,
      lng: f.lng,
      label: `${f.name} — DTC3 ${f.monthlyCoverage.dtc3}%`,
      tone: statusTone(f.status) === 'success' ? 'success'
        : statusTone(f.status) === 'warning' ? 'warning'
        : statusTone(f.status) === 'danger' ? 'danger'
        : 'neutral',
    }));
  }, [filtered]);

  const selectedFac = selectedId ? filtered.find((f) => f.id === selectedId) : null;
  const center: [number, number] = selectedFac
    ? [selectedFac.lat, selectedFac.lng]
    : filtered.length > 0 ? [filtered[0].lat, filtered[0].lng] : [13.5, 14.7];
  const zoom = selectedFac ? 12 : 8;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-stone-900">Master Facility Registry</h1>
          <p className="text-stone-500 text-[13px] mt-0.5">
            Référentiel des formations sanitaires impliquées dans la vaccination.
            {' '}<span className="font-medium">{inScope.length}</span> dans le périmètre <span className="font-medium">{current?.name ?? 'national'}</span>.
            {filtered.length !== inScope.length && <> {filtered.length} après filtre.</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>Exporter</Button>
          <Button size="sm" leftIcon={<Upload className="h-4 w-4" />}>Nouvelle formation</Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 max-w-md">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Rechercher par nom ou code FOSA…"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <Button
          variant={showFilters ? 'primary' : 'outline'}
          size="md"
          leftIcon={<Filter className="h-4 w-4" />}
          onClick={() => setShowFilters((v) => !v)}
        >
          Filtres
          {activeFacilityFilterCount(filters) > 0 && (
            <Badge tone={showFilters ? 'neutral' : 'primary'} className="ml-2">
              {activeFacilityFilterCount(filters)}
            </Badge>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        {showFilters && (
          <Card className="col-span-3 overflow-auto p-4">
            <FacilityFilterPanel filters={filters} onChange={setFilters} />
          </Card>
        )}
        <div className={cn('min-h-0 flex flex-col', showFilters ? 'col-span-9' : 'col-span-12')}>
          <SplitMapView
            mode={splitMode}
            onModeChange={setSplitMode}
            tableSlot={
              <DataTable
                columns={columns}
                data={filtered}
                onRowClick={(f) => setSelectedId(f.id)}
                emptyMessage="Aucune formation ne correspond à votre recherche."
                getRowKey={(f) => f.id}
                selectedKey={selectedId}
              />
            }
            mapSlot={
              <Card className="h-full overflow-hidden p-0">
                <MapView
                  center={center}
                  zoom={zoom}
                  markers={markers}
                  selectedId={selectedId}
                  onMarkerClick={setSelectedId}
                  className="h-full"
                />
              </Card>
            }
          />
        </div>
      </div>
    </div>
  );
}
