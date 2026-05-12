import { Sun, CloudRain } from 'lucide-react';
import type { AccessibilityRating } from '../../types/village';
import { ACCESSIBILITY_LABEL } from '../../types/village';
import { cn } from '../../lib/cn';

const tone: Record<AccessibilityRating, string> = {
  easy: 'bg-success-100 text-success-700',
  moderate: 'bg-warning-100 text-warning-700',
  difficult: 'bg-danger-100 text-danger-700',
  very_difficult: 'bg-danger-200 text-danger-800',
};

function Pill({
  icon,
  rating,
}: {
  icon: React.ReactNode;
  rating: AccessibilityRating;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-[14px]',
        tone[rating],
      )}
    >
      {icon}
      {ACCESSIBILITY_LABEL[rating]}
    </span>
  );
}

export function AccessibilityBadge({
  dry,
  wet,
  className,
}: {
  dry: AccessibilityRating;
  wet: AccessibilityRating;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <Pill icon={<Sun className="h-3 w-3" />} rating={dry} />
      <Pill icon={<CloudRain className="h-3 w-3" />} rating={wet} />
    </div>
  );
}
