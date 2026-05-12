import type { LucideIcon } from 'lucide-react';
import { Construction } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  sprintName?: string;
  cta?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, sprintName, cta }: EmptyStateProps) {
  const I = Icon ?? Construction;
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <I size={64} className="text-stone-300" strokeWidth={1.5} />
      <h2 className="mt-6 text-stone-900">{title}</h2>
      <p className="mt-2 max-w-[480px] text-stone-600">{description}</p>
      {sprintName && (
        <Badge tone="neutral" className="mt-4 text-[12px] px-3 py-1">
          🚧 {sprintName}
        </Badge>
      )}
      {cta && (
        <Button variant="outline" className="mt-5" onClick={cta.onClick}>
          {cta.label}
        </Button>
      )}
    </div>
  );
}
