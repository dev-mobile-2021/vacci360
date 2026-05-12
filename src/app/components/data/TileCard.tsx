import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '../../lib/cn';

export interface TileCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  count: string;
  info: string;
  warningInfo?: string;
  warningIcon?: LucideIcon;
  status: 'success' | 'warning';
  href: string;
}

export function TileCard({
  icon: Icon,
  title,
  subtitle,
  count,
  info,
  warningInfo,
  warningIcon: WarningIcon,
  status,
  href,
}: TileCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(href)}
      className={cn(
        'relative w-full bg-white border border-stone-200 rounded-xl p-6',
        'hover:border-primary-300 hover:shadow-sm transition-all',
        'text-left cursor-pointer'
      )}
    >
      <div
        className={cn(
          'absolute top-6 right-6 w-2 h-2 rounded-full',
          status === 'success' ? 'bg-success-500' : 'bg-warning-500'
        )}
      />

      <Icon className="w-8 h-8 text-primary-600 mb-4" />

      <h3 className="text-lg font-semibold text-stone-800 mb-1">{title}</h3>
      <p className="text-xs text-stone-500 mb-3">{subtitle}</p>

      <div className="text-3xl font-bold text-stone-800 mb-2">{count}</div>

      <div className="space-y-1">
        <p className="text-sm text-stone-600">{info}</p>
        {warningInfo && WarningIcon && (
          <div className="flex items-center gap-1.5 text-sm text-warning-600">
            <WarningIcon className="w-4 h-4" />
            <span>{warningInfo}</span>
          </div>
        )}
      </div>
    </button>
  );
}
