import { X, Snowflake, Wifi } from 'lucide-react';
import {
  FACILITY_TYPE_LABEL,
  FACILITY_STATUS_LABEL,
  STRATEGY_LABEL,
  type FacilityType,
  type FacilityStatus,
  type VaccinationStrategy,
  type Connectivity,
  type Facility,
} from '../../types/facility';
import { cn } from '../../lib/cn';

export type ColdChainBand = 'operational' | 'degraded' | 'broken';

export interface FacilityFilters {
  search: string;
  types: Set<FacilityType>;
  statuses: Set<FacilityStatus>;
  coldChain: Set<ColdChainBand>;
  strategies: Set<VaccinationStrategy>;
  connectivity: Set<Connectivity>;
  coverageMin: number;
  coverageMax: number;
}

export const DEFAULT_FACILITY_FILTERS: FacilityFilters = {
  search: '',
  types: new Set(),
  statuses: new Set(),
  coldChain: new Set(),
  strategies: new Set(),
  connectivity: new Set(),
  coverageMin: 0,
  coverageMax: 100,
};

const COLD_LABEL: Record<ColdChainBand, string> = {
  operational: 'Opérationnelle',
  degraded: 'Dégradée',
  broken: 'Hors service',
};

const CONN_LABEL: Record<Connectivity, string> = {
  good: 'Bonne',
  intermittent: 'Intermittente',
  none: 'Sans réseau',
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase tracking-wide text-stone-500">{title}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function activeFacilityFilterCount(f: FacilityFilters): number {
  return (
    (f.search ? 1 : 0) +
    f.types.size +
    f.statuses.size +
    f.coldChain.size +
    f.strategies.size +
    f.connectivity.size +
    (f.coverageMin > 0 ? 1 : 0) +
    (f.coverageMax < 100 ? 1 : 0)
  );
}

interface Props {
  filters: FacilityFilters;
  onChange: (f: FacilityFilters) => void;
}

export function FacilityFilterPanel({ filters, onChange }: Props) {
  const toggleSet = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };
  const update = (patch: Partial<FacilityFilters>) => onChange({ ...filters, ...patch });
  const count = activeFacilityFilterCount(filters);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-stone-900 font-medium">Filtres</div>
        {count > 0 && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FACILITY_FILTERS)}
            className="inline-flex items-center gap-1 text-[12px] text-primary-700 hover:underline"
          >
            <X className="h-3 w-3" /> Réinitialiser ({count})
          </button>
        )}
      </div>

      <Section title="Type">
        {(Object.keys(FACILITY_TYPE_LABEL) as FacilityType[]).map((t) => (
          <Chip key={t} active={filters.types.has(t)} onClick={() => update({ types: toggleSet(filters.types, t) })}>
            {FACILITY_TYPE_LABEL[t]}
          </Chip>
        ))}
      </Section>

      <Section title="Statut">
        {(Object.keys(FACILITY_STATUS_LABEL) as FacilityStatus[]).map((s) => (
          <Chip key={s} active={filters.statuses.has(s)} onClick={() => update({ statuses: toggleSet(filters.statuses, s) })}>
            {FACILITY_STATUS_LABEL[s]}
          </Chip>
        ))}
      </Section>

      <Section title="Chaîne du froid">
        {(Object.keys(COLD_LABEL) as ColdChainBand[]).map((b) => (
          <Chip key={b} active={filters.coldChain.has(b)} onClick={() => update({ coldChain: toggleSet(filters.coldChain, b) })}>
            <Snowflake className="h-3 w-3" /> {COLD_LABEL[b]}
          </Chip>
        ))}
      </Section>

      <Section title="Stratégies vaccinales">
        {(Object.keys(STRATEGY_LABEL) as VaccinationStrategy[]).map((s) => (
          <Chip key={s} active={filters.strategies.has(s)} onClick={() => update({ strategies: toggleSet(filters.strategies, s) })}>
            {STRATEGY_LABEL[s]}
          </Chip>
        ))}
      </Section>

      <Section title="Connectivité">
        {(Object.keys(CONN_LABEL) as Connectivity[]).map((c) => (
          <Chip key={c} active={filters.connectivity.has(c)} onClick={() => update({ connectivity: toggleSet(filters.connectivity, c) })}>
            <Wifi className="h-3 w-3" /> {CONN_LABEL[c]}
          </Chip>
        ))}
      </Section>

      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wide text-stone-500">Couverture DTC3</div>
        <div className="flex items-center gap-2 text-[12px] text-stone-700">
          <span className="tabular-nums w-8">{filters.coverageMin}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={filters.coverageMin}
            onChange={(e) => update({ coverageMin: Math.min(Number(e.target.value), filters.coverageMax) })}
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-2 text-[12px] text-stone-700">
          <span className="tabular-nums w-8">{filters.coverageMax}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={filters.coverageMax}
            onChange={(e) => update({ coverageMax: Math.max(Number(e.target.value), filters.coverageMin) })}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

export function applyFacilityFilters(items: Facility[], f: FacilityFilters): Facility[] {
  const q = f.search.trim().toLowerCase();
  return items.filter((it) => {
    if (q && !it.name.toLowerCase().includes(q) && !it.code.toLowerCase().includes(q)) return false;
    if (f.types.size > 0 && !f.types.has(it.type)) return false;
    if (f.statuses.size > 0 && !f.statuses.has(it.status)) return false;

    if (f.coldChain.size > 0) {
      const broken = !it.coldChainOperational;
      const degraded = it.coldChainEquipments.some((e) => e.status === 'degraded');
      const band: ColdChainBand = broken ? 'broken' : degraded ? 'degraded' : 'operational';
      if (!f.coldChain.has(band)) return false;
    }

    if (f.strategies.size > 0 && !it.vaccinationStrategies.some((s) => f.strategies.has(s))) return false;
    if (f.connectivity.size > 0 && !f.connectivity.has(it.connectivity)) return false;

    const cov = it.monthlyCoverage.dtc3;
    if (cov < f.coverageMin || cov > f.coverageMax) return false;

    return true;
  });
}
