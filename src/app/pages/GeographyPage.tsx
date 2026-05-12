import { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown, Globe, MapPin, Users, Layers, Home } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  getGeoNodes,
  getNode,
  getChildren,
  getAncestors,
  getDescendantsCount,
  getVillages,
  getFacilities,
} from '../data/mockGeography';
import type { GeoNode, GeoLevel } from '../types/geography';
import type { Village } from '../types/village';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CoverageBar } from '../components/data/CoverageBar';
import { AccessibilityBadge } from '../components/data/AccessibilityBadge';
import { MapView, type MapMarker } from '../components/map/MapView';
import { cn } from '../lib/cn';

const LEVEL_LABEL: Record<GeoLevel, string> = {
  country: 'Pays',
  province: 'Province',
  department: 'Département',
  sub_prefecture: 'Sous-préfecture',
  canton: 'Canton',
  village: 'Village',
};

const LEVEL_ICON: Record<GeoLevel, LucideIcon> = {
  country: Globe,
  province: Layers,
  department: Layers,
  sub_prefecture: Layers,
  canton: MapPin,
  village: Home,
};

const LEVEL_ZOOM: Record<GeoLevel, number> = {
  country: 6,
  province: 8,
  department: 9,
  sub_prefecture: 10,
  canton: 11,
  village: 13,
};

function TreeRow({
  node,
  depth,
  expanded,
  selectedId,
  onToggle,
  onSelect,
}: {
  node: GeoNode;
  depth: number;
  expanded: Set<string>;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const children = useMemo(() => getChildren(node.id), [node.id]);
  const hasChildren = children.length > 0;
  const isOpen = expanded.has(node.id);
  const isSelected = selectedId === node.id;
  const Icon = LEVEL_ICON[node.level];

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-[13px]',
          isSelected ? 'bg-primary-50 text-primary-800' : 'hover:bg-stone-50 text-stone-700',
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => onSelect(node.id)}
      >
        <button
          type="button"
          className="w-4 h-4 flex items-center justify-center text-stone-400 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
          aria-label={isOpen ? 'Réduire' : 'Développer'}
        >
          {hasChildren ? (
            isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
          ) : null}
        </button>
        <Icon className="h-3.5 w-3.5 text-stone-500 shrink-0" />
        <span className="truncate">{node.name}</span>
        {hasChildren && (
          <span className="ml-auto text-[11px] text-stone-400 tabular-nums">{children.length}</span>
        )}
      </div>
      {isOpen && hasChildren && (
        <>
          {children.map((c) => (
            <TreeRow
              key={c.id}
              node={c}
              depth={depth + 1}
              expanded={expanded}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </>
      )}
    </>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-stone-50 rounded-md px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-stone-500">{label}</div>
      <div className="text-stone-900 font-medium tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

function formatPop(n: number) {
  return n.toLocaleString('fr-FR');
}

function DetailsPanel({ node }: { node: GeoNode }) {
  const ancestors = useMemo(() => getAncestors(node.id), [node.id]);
  const descendants = useMemo(
    () => (node.level === 'village' ? 0 : getDescendantsCount(node.id)),
    [node.id, node.level],
  );

  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <div className="flex items-center gap-2 text-[12px] text-stone-500 flex-wrap">
          {ancestors.map((a, i) => (
            <span key={a.id} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              <span>{a.name}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge tone="primary">{LEVEL_LABEL[node.level]}</Badge>
          <CardTitle className="text-[18px]">{node.name}</CardTitle>
        </div>
        <div className="text-[12px] text-stone-500 mt-0.5 font-mono">{node.code}</div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <StatPill label="Population" value={formatPop(node.population)} />
          {node.level !== 'village' ? (
            <StatPill label="Sous-unités" value={formatPop(descendants)} />
          ) : (
            <StatPill label="Lat / Lng" value={`${node.centroidLat.toFixed(3)}, ${node.centroidLng.toFixed(3)}`} />
          )}
        </div>

        {node.level === 'village' && <VillageDetails village={node as Village} />}
      </CardBody>
    </Card>
  );
}

function VillageDetails({ village }: { village: Village }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[12px] uppercase tracking-wide text-stone-500 mb-2">Couverture vaccinale</div>
        <div className="space-y-2">
          <CoverageBar label="Globale" value={village.vaccinationCoverage.overall} />
          <CoverageBar label="BCG" value={village.vaccinationCoverage.bcg} />
          <CoverageBar label="DTC1" value={village.vaccinationCoverage.dtc1} />
          <CoverageBar label="DTC3" value={village.vaccinationCoverage.dtc3} />
          <CoverageBar label="Rougeole" value={village.vaccinationCoverage.measles} />
        </div>
      </div>

      <div>
        <div className="text-[12px] uppercase tracking-wide text-stone-500 mb-2">Accessibilité</div>
        <AccessibilityBadge
          dry={village.accessibility.drySeasonAccess}
          wet={village.accessibility.wetSeasonAccess}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatPill label="Enfants &lt; 5 ans" value={formatPop(village.estimatedChildrenUnder5)} />
        <StatPill label="Distance FOSA" value={`${village.facilityDistanceKm} km`} />
        <StatPill label="Trajet" value={`${village.facilityTravelTimeMin} min`} />
        <StatPill label="Qualité donnée" value={`${village.dataQualityScore}/100`} />
      </div>

      <div>
        <div className="text-[12px] uppercase tracking-wide text-stone-500 mb-2">Dernière visite</div>
        <div className="text-stone-700 text-[13px]">
          {village.lastVaccinationVisit
            ? `${village.lastVaccinationVisit.toLocaleDateString('fr-FR')} — il y a ${village.daysSinceLastVisit} j`
            : <span className="text-danger-700 font-medium">Jamais visité</span>}
        </div>
      </div>

      <div>
        <div className="text-[12px] uppercase tracking-wide text-stone-500 mb-2">Infrastructures</div>
        <div className="flex flex-wrap gap-1.5">
          {village.infrastructure.hasSchool && <Badge tone="info">École</Badge>}
          {village.infrastructure.hasWaterPoint && <Badge tone="info">Point d'eau</Badge>}
          {village.infrastructure.hasMarket && <Badge tone="info">Marché</Badge>}
          {village.infrastructure.hasMosque && <Badge tone="info">Mosquée</Badge>}
        </div>
      </div>

      <div>
        <div className="text-[12px] uppercase tracking-wide text-stone-500 mb-2">Validation</div>
        <Badge
          tone={
            village.validationStatus === 'validated'
              ? 'success'
              : village.validationStatus === 'needs_review'
                ? 'warning'
                : 'neutral'
          }
        >
          {village.validationStatus === 'validated' ? 'Validé' :
            village.validationStatus === 'needs_review' ? 'À réviser' : 'En attente'}
        </Badge>
        {village.validatedBy && (
          <div className="text-[12px] text-stone-500 mt-1">
            par {village.validatedBy} le {village.validatedAt?.toLocaleDateString('fr-FR')}
          </div>
        )}
      </div>
    </div>
  );
}

function toneForVillage(v: Village): MapMarker['tone'] {
  if (!v.lastVaccinationVisit) return 'danger';
  const cov = v.vaccinationCoverage.overall;
  if (cov >= 95) return 'success';
  if (cov >= 50) return 'warning';
  return 'danger';
}

export default function GeographyPage() {
  const allNodes = useMemo(() => getGeoNodes(), []);
  const villages = useMemo(() => getVillages(), []);
  const facilities = useMemo(() => getFacilities(), []);
  // void facilities until next vague — already counted via villagesServed
  void facilities;

  const country = useMemo(() => allNodes.find((n) => n.level === 'country')!, [allNodes]);
  const [selectedId, setSelectedId] = useState<string>(country.id);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set<string>([country.id, 'td-lac', 'td-kanem', 'td-hadjer-lamis']),
  );

  const selected = getNode(selectedId) ?? country;

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const select = (id: string) => {
    setSelectedId(id);
    setExpanded((prev) => {
      const next = new Set(prev);
      let cur = getNode(id);
      while (cur && cur.parentId) {
        next.add(cur.parentId);
        cur = getNode(cur.parentId);
      }
      return next;
    });
  };

  const markers: MapMarker[] = useMemo(() => {
    // Show villages whose ancestor chain contains the selected node.
    const isInSelection = (v: Village): boolean => {
      if (selected.level === 'country' || selected.level === 'village') {
        return selected.id === country.id;
      }
      let cur: GeoNode | undefined = v;
      while (cur) {
        if (cur.parentId === selected.id || cur.id === selected.id) return true;
        cur = cur.parentId ? getNode(cur.parentId) : undefined;
      }
      return false;
    };

    let vs: Village[];
    if (selected.level === 'country') {
      // Top-level: show the three pilot province seeds only (not all villages)
      vs = villages;
    } else if (selected.level === 'village') {
      vs = [selected as Village];
    } else {
      vs = villages.filter(isInSelection);
    }

    // Cap to keep the map snappy
    const capped = vs.slice(0, 400);
    return capped.map((v) => ({
      id: v.id,
      lat: v.centroidLat,
      lng: v.centroidLng,
      label: `${v.name} — ${v.vaccinationCoverage.overall}%`,
      tone: toneForVillage(v),
    }));
  }, [selected, villages, country.id]);

  const center: [number, number] = [selected.centroidLat, selected.centroidLng];
  const zoom = LEVEL_ZOOM[selected.level];

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col gap-3 p-4">
      <div>
        <h1 className="text-stone-900">Hiérarchie géographique</h1>
        <p className="text-stone-500 text-[13px] mt-0.5">
          Pays → Province → Département → Sous-préfecture → Canton → Village. Données pilotes pour Lac, Kanem et Hadjer-Lamis.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        <Card className="col-span-3 flex flex-col min-h-0">
          <CardHeader className="border-b border-stone-100 pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary-700" />
              <CardTitle className="text-[14px]">Arborescence</CardTitle>
            </div>
          </CardHeader>
          <div className="flex-1 overflow-auto py-2">
            <TreeRow
              node={country}
              depth={0}
              expanded={expanded}
              selectedId={selectedId}
              onToggle={toggle}
              onSelect={select}
            />
          </div>
        </Card>

        <Card className="col-span-6 overflow-hidden p-0">
          <MapView
            center={center}
            zoom={zoom}
            markers={markers}
            selectedId={selectedId}
            onMarkerClick={select}
            className="h-full"
          />
        </Card>

        <div className="col-span-3 min-h-0">
          <DetailsPanel node={selected} />
        </div>
      </div>
    </div>
  );
}
