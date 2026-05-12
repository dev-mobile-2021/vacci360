import { X } from 'lucide-react';
import type { AccessibilityRating, ValidationStatus } from '../../types/village';
import { ACCESSIBILITY_LABEL, VALIDATION_LABEL } from '../../types/village';
import { cn } from '../../lib/cn';

export type CoverageBand = 'never' | 'low' | 'mid' | 'high' | 'top';

export interface VillageFilters {
  search: string;
  coverage: Set<CoverageBand>;
  wetAccess: Set<AccessibilityRating>;
  validation: Set<ValidationStatus>;
  neverVisitedOnly: boolean;
  lowQualityOnly: boolean;
}

export const DEFAULT_FILTERS: VillageFilters = {
  search: '',
  coverage: new Set(),
  wetAccess: new Set(),
  validation: new Set(),
  neverVisitedOnly: false,
  lowQualityOnly: false,
};

const COVERAGE_LABELS: Record<CoverageBand, string> = {
  never: 'Jamais visité',
  low: '< 50%',
  mid: '50 – 79%',
  high: '80 – 94%',
  top: '≥ 95%',
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

export function activeFilterCount(f: VillageFilters): number {
  return (
    (f.search ? 1 : 0) +
    f.coverage.size +
    f.wetAccess.size +
    f.validation.size +
    (f.neverVisitedOnly ? 1 : 0) +
    (f.lowQualityOnly ? 1 : 0)
  );
}

interface Props {
  filters: VillageFilters;
  onChange: (f: VillageFilters) => void;
}

export function FilterPanel({ filters, onChange }: Props) {
  const toggleSet = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const update = (patch: Partial<VillageFilters>) => onChange({ ...filters, ...patch });

  const count = activeFilterCount(filters);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-stone-900 font-medium">Filtres</div>
        {count > 0 && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="inline-flex items-center gap-1 text-[12px] text-primary-700 hover:underline"
          >
            <X className="h-3 w-3" /> Réinitialiser ({count})
          </button>
        )}
      </div>

      <Section title="Couverture">
        {(Object.keys(COVERAGE_LABELS) as CoverageBand[]).map((b) => (
          <Chip
            key={b}
            active={filters.coverage.has(b)}
            onClick={() => update({ coverage: toggleSet(filters.coverage, b) })}
          >
            {COVERAGE_LABELS[b]}
          </Chip>
        ))}
      </Section>

      <Section title="Accès saison des pluies">
        {(Object.keys(ACCESSIBILITY_LABEL) as AccessibilityRating[]).map((r) => (
          <Chip
            key={r}
            active={filters.wetAccess.has(r)}
            onClick={() => update({ wetAccess: toggleSet(filters.wetAccess, r) })}
          >
            {ACCESSIBILITY_LABEL[r]}
          </Chip>
        ))}
      </Section>

      <Section title="Validation">
        {(Object.keys(VALIDATION_LABEL) as ValidationStatus[]).map((s) => (
          <Chip
            key={s}
            active={filters.validation.has(s)}
            onClick={() => update({ validation: toggleSet(filters.validation, s) })}
          >
            {VALIDATION_LABEL[s]}
          </Chip>
        ))}
      </Section>

      <Section title="Drapeaux">
        <Chip
          active={filters.neverVisitedOnly}
          onClick={() => update({ neverVisitedOnly: !filters.neverVisitedOnly })}
        >
          Jamais visités
        </Chip>
        <Chip
          active={filters.lowQualityOnly}
          onClick={() => update({ lowQualityOnly: !filters.lowQualityOnly })}
        >
          Qualité &lt; 50
        </Chip>
      </Section>
    </div>
  );
}

/** Pure filter function — keeps the page concise. */
export function applyVillageFilters<T extends import('../../types/village').Village>(
  villages: T[],
  filters: VillageFilters,
): T[] {
  const q = filters.search.trim().toLowerCase();
  return villages.filter((v) => {
    if (q && !v.name.toLowerCase().includes(q) && !v.code.toLowerCase().includes(q)) return false;

    if (filters.coverage.size > 0) {
      const cov = v.vaccinationCoverage.overall;
      const visited = v.lastVaccinationVisit !== null;
      const band: CoverageBand =
        !visited ? 'never'
          : cov < 50 ? 'low'
          : cov < 80 ? 'mid'
          : cov < 95 ? 'high'
          : 'top';
      if (!filters.coverage.has(band)) return false;
    }

    if (filters.wetAccess.size > 0 && !filters.wetAccess.has(v.accessibility.wetSeasonAccess)) return false;
    if (filters.validation.size > 0 && !filters.validation.has(v.validationStatus)) return false;
    if (filters.neverVisitedOnly && v.lastVaccinationVisit !== null) return false;
    if (filters.lowQualityOnly && v.dataQualityScore >= 50) return false;

    return true;
  });
}
