import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Table as TableIcon, Map as MapIcon, Columns } from 'lucide-react';
import { cn } from '../../lib/cn';

export type SplitMode = 'table' | 'split' | 'map';

interface Props {
  mode: SplitMode;
  onModeChange: (m: SplitMode) => void;
  tableSlot: ReactNode;
  mapSlot: ReactNode;
  /** Initial ratio of the table column (0.3 to 0.7). Default 0.6. */
  initialRatio?: number;
}

export function SplitMapView({
  mode,
  onModeChange,
  tableSlot,
  mapSlot,
  initialRatio = 0.6,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [ratio, setRatio] = useState(initialRatio);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const r = (e.clientX - rect.left) / rect.width;
      setRatio(Math.max(0.3, Math.min(0.7, r)));
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-end mb-2">
        <div className="inline-flex items-center rounded-md border border-stone-200 bg-white p-0.5">
          {([
            { key: 'table', icon: TableIcon, label: 'Tableau' },
            { key: 'split', icon: Columns, label: 'Tableau + carte' },
            { key: 'map', icon: MapIcon, label: 'Carte' },
          ] as const).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onModeChange(opt.key)}
              className={cn(
                'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] text-[12px]',
                mode === opt.key
                  ? 'bg-primary-100 text-primary-800'
                  : 'text-stone-600 hover:bg-stone-50',
              )}
              title={opt.label}
              aria-pressed={mode === opt.key}
            >
              <opt.icon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 min-h-0 flex">
        {mode === 'table' && <div className="flex-1 min-w-0 min-h-0">{tableSlot}</div>}
        {mode === 'map' && <div className="flex-1 min-w-0 min-h-0">{mapSlot}</div>}
        {mode === 'split' && (
          <>
            <div style={{ width: `${ratio * 100}%` }} className="min-w-0 min-h-0">
              {tableSlot}
            </div>
            <div
              onMouseDown={onMouseDown}
              className="w-1.5 bg-stone-100 hover:bg-primary-200 cursor-col-resize shrink-0 transition-colors"
              role="separator"
              aria-orientation="vertical"
            />
            <div style={{ width: `${(1 - ratio) * 100}%` }} className="min-w-0 min-h-0">
              {mapSlot}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
