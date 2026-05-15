import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Search, Upload, Download, Filter, ExternalLink } from 'lucide-react';
import { getVillages, getNode } from '../data/mockGeography';
import type { Village } from '../types/village';
import { useScope } from '../lib/scope';
import { SCOPE_TO_GEO_NODE } from '../lib/scopeGeo';
import { Card } from '../components/ui/card';
import { cn } from '../lib/cn';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { DataTable } from '../components/data/DataTable';
import {
  FilterPanel,
  applyVillageFilters,
  activeFilterCount,
  DEFAULT_FILTERS,
  type VillageFilters,
} from '../components/data/FilterPanel';
import { CoverageBar } from '../components/data/CoverageBar';
import { AccessibilityBadge } from '../components/data/AccessibilityBadge';
import { ImportDialog } from '../components/data/ImportDialog';
import { MapView, type MapMarker } from '../components/map/MapView';
import { SplitMapView, type SplitMode } from '../components/map/SplitMapView';

function ancestorChain(v: Village): { canton: string; sp: string; dep: string; prov: string } {
  let cur = getNode(v.parentId ?? '');
  const canton = cur?.name ?? '—';
  cur = cur ? getNode(cur.parentId ?? '') : undefined;
  const sp = cur?.name ?? '—';
  cur = cur ? getNode(cur.parentId ?? '') : undefined;
  const dep = cur?.name ?? '—';
  cur = cur ? getNode(cur.parentId ?? '') : undefined;
  const prov = cur?.name ?? '—';
  return { canton, sp, dep, prov };
}

function scopedVillages(scopeGeoId: string | null, villages: Village[]): Village[] {
  if (!scopeGeoId || scopeGeoId === 'td') return villages;
  return villages.filter((v) => {
    let cur = getNode(v.parentId ?? '');
    while (cur) {
      if (cur.id === scopeGeoId) return true;
      cur = cur.parentId ? getNode(cur.parentId) : undefined;
    }
    return false;
  });
}

export default function VillagesListPage() {
  const navigate = useNavigate();
  const { current } = useScope();
  const allVillages = useMemo(() => getVillages(), []);
  const inScope = useMemo(
    () => scopedVillages(current ? SCOPE_TO_GEO_NODE[current.id] ?? null : null, allVillages),
    [current, allVillages],
  );

  const [filters, setFilters] = useState<VillageFilters>(DEFAULT_FILTERS);
  const [importOpen, setImportOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [splitMode, setSplitMode] = useState<SplitMode>('split');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => applyVillageFilters(inScope, filters), [inScope, filters]);

  const columns = useMemo<ColumnDef<Village, any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Village',
        cell: (info) => {
          const v = info.row.original;
          const chain = ancestorChain(v);
          return (
            <div>
              <div className="font-medium text-stone-900">{v.name}</div>
              <div className="text-[11px] text-stone-500">{chain.prov} › {chain.canton}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'code',
        header: 'Code',
        cell: (info) => <span className="font-mono text-[11px] text-stone-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'population',
        header: 'Population',
        cell: (info) => <span className="tabular-nums">{(info.getValue() as number).toLocaleString('fr-FR')}</span>,
      },
      {
        id: 'coverage',
        header: 'Couverture',
        accessorFn: (v) => v.vaccinationCoverage.overall,
        cell: (info) => {
          const v = info.row.original;
          if (!v.lastVaccinationVisit) {
            return <Badge tone="danger">Jamais visité</Badge>;
          }
          return <CoverageBar value={v.vaccinationCoverage.overall} className="min-w-[120px]" />;
        },
      },
      {
        id: 'access',
        header: 'Accès',
        accessorFn: (v) => v.accessibility.wetSeasonAccess,
        cell: (info) => {
          const v = info.row.original;
          return (
            <AccessibilityBadge
              dry={v.accessibility.drySeasonAccess}
              wet={v.accessibility.wetSeasonAccess}
            />
          );
        },
      },
      {
        accessorKey: 'daysSinceLastVisit',
        header: 'Dernière visite',
        cell: (info) => {
          const v = info.row.original;
          if (v.daysSinceLastVisit === null) return <span className="text-danger-700">—</span>;
          return <span className="tabular-nums text-stone-700">il y a {v.daysSinceLastVisit} j</span>;
        },
      },
      {
        accessorKey: 'validationStatus',
        header: 'Validation',
        cell: (info) => {
          const s = info.getValue() as Village['validationStatus'];
          const tone = s === 'validated' ? 'success' : s === 'needs_review' ? 'warning' : 'neutral';
          const label = s === 'validated' ? 'Validé' : s === 'needs_review' ? 'À réviser' : 'En attente';
          return <Badge tone={tone}>{label}</Badge>;
        },
      },
      {
        id: 'open',
        header: '',
        enableSorting: false,
        cell: (info) => (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(`/referentiel/villages/${info.row.original.id}`); }}
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

  const toneForVillage = (v: Village): MapMarker['tone'] => {
    if (!v.lastVaccinationVisit) return 'danger';
    const c = v.vaccinationCoverage.overall;
    if (c >= 95) return 'success';
    if (c >= 50) return 'warning';
    return 'danger';
  };

  // Cap markers to 200 for perf (décimage).
  const markers: MapMarker[] = useMemo(() => {
    const capped = filtered.slice(0, 200);
    return capped.map((v) => ({
      id: v.id,
      lat: v.centroidLat,
      lng: v.centroidLng,
      label: `${v.name} — ${v.vaccinationCoverage.overall}%`,
      tone: toneForVillage(v),
    }));
  }, [filtered]);

  // Map center: selected village or scope centroid.
  const selectedVillage = selectedId ? filtered.find((v) => v.id === selectedId) : null;
  const mapCenter: [number, number] = selectedVillage
    ? [selectedVillage.centroidLat, selectedVillage.centroidLng]
    : filtered.length > 0
      ? [filtered[0].centroidLat, filtered[0].centroidLng]
      : [13.5, 14.7];
  const mapZoom = selectedVillage ? 12 : 8;

  const exportCsv = () => {
    const header = ['code', 'name', 'population', 'lat', 'lng', 'couverture', 'wet_access', 'validation'].join(',');
    const lines = filtered.map((v) =>
      [v.code, `"${v.name}"`, v.population, v.centroidLat, v.centroidLng, v.vaccinationCoverage.overall, v.accessibility.wetSeasonAccess, v.validationStatus].join(','),
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vacci360-villages-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-stone-900">Master Village Registry</h1>
          <p className="text-stone-500 text-[13px] mt-0.5">
            {inScope.length.toLocaleString('fr-FR')} villages dans le périmètre <span className="font-medium">{current?.name ?? 'national'}</span>.
            {filtered.length !== inScope.length && <> {filtered.length} après filtre.</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={exportCsv}>
            Exporter
          </Button>
          <Button size="sm" leftIcon={<Upload className="h-4 w-4" />} onClick={() => setImportOpen(true)}>
            Importer
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 max-w-md">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Rechercher par nom ou code…"
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
          {activeFilterCount(filters) > 0 && (
            <Badge tone={showFilters ? 'neutral' : 'primary'} className="ml-2">
              {activeFilterCount(filters)}
            </Badge>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        {showFilters && (
          <Card className="col-span-3 overflow-auto p-4">
            <FilterPanel filters={filters} onChange={setFilters} />
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
                onRowClick={(v) => setSelectedId(v.id)}
                emptyMessage="Aucun village ne correspond à votre recherche."
                getRowKey={(v) => v.id}
                selectedKey={selectedId}
              />
            }
            mapSlot={
              <Card className="h-full overflow-hidden p-0">
                <MapView
                  center={mapCenter}
                  zoom={mapZoom}
                  markers={markers}
                  selectedId={selectedId}
                  onMarkerClick={(id) => setSelectedId(id)}
                  className="h-full"
                />
              </Card>
            }
          />
        </div>
      </div>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
