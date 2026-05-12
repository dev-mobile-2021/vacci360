import { useEffect, useRef, useState } from 'react';
import { ChevronDown, MapPin, Check } from 'lucide-react';
import { useScope } from '../../lib/scope';
import { cn } from '../../lib/cn';

const LEVEL_LABEL: Record<string, string> = {
  national: 'National',
  provincial: 'Province',
  district: 'District',
};

export function ScopeSelector() {
  const { current, available, setCurrentScope } = useScope();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!current) return null;

  const isSingle = available.length <= 1;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !isSingle && setOpen((v) => !v)}
        disabled={isSingle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-2 h-9 px-3 rounded-md border border-stone-200 bg-white text-[14px] text-stone-800',
          !isSingle && 'hover:border-stone-300 hover:bg-stone-50 cursor-pointer',
          isSingle && 'cursor-default',
        )}
      >
        <MapPin size={16} className="text-primary-600" />
        <span className="font-medium">{current.name}</span>
        {!isSingle && <ChevronDown size={14} className="text-stone-500" />}
      </button>

      {open && !isSingle && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1 w-72 rounded-lg border border-stone-200 bg-white shadow-lg z-50 overflow-hidden"
        >
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-stone-500 border-b border-stone-100">
            VOS SCOPES
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {available.map((s) => {
              const active = s.id === current.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentScope(s.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-primary-50',
                      active && 'bg-primary-50',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-stone-500">
                        {LEVEL_LABEL[s.level]}
                      </div>
                      <div className="text-[14px] text-stone-800 truncate">{s.name}</div>
                    </div>
                    {active && <Check size={16} className="text-primary-700 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
