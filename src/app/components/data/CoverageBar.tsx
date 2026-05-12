import { cn } from '../../lib/cn';

/** 5-tier OMS color scale for vaccination coverage. */
function colorFor(value: number): { bar: string; text: string } {
  if (value >= 95) return { bar: 'bg-success-500', text: 'text-success-700' };
  if (value >= 80) return { bar: 'bg-success-400', text: 'text-success-700' };
  if (value >= 50) return { bar: 'bg-warning-500', text: 'text-warning-700' };
  if (value > 0) return { bar: 'bg-danger-500', text: 'text-danger-700' };
  return { bar: 'bg-stone-300', text: 'text-stone-500' };
}

interface Props {
  value: number;
  label?: string;
  className?: string;
  showValue?: boolean;
}

export function CoverageBar({ value, label, className, showValue = true }: Props) {
  const pct = Math.max(0, Math.min(100, value));
  const c = colorFor(pct);
  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1 text-[12px]">
          {label && <span className="text-stone-600">{label}</span>}
          {showValue && <span className={cn('font-medium tabular-nums', c.text)}>{pct}%</span>}
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', c.bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
