import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from './cn';

export type ToastType = 'success' | 'warning' | 'danger' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  /** ms ; 0 = persistant */
  duration?: number;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 5;

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 5000,
  info: 7000,
  warning: 7000,
  danger: 0,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const scheduleAutoDismiss = useCallback(
    (id: string, duration: number) => {
      if (duration <= 0) return;
      const timer = window.setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const toast = useCallback<ToastContextValue['toast']>(
    (input) => {
      const id = Math.random().toString(36).slice(2);
      const duration = input.duration ?? DEFAULT_DURATION[input.type];
      const next: Toast = { id, ...input, duration };
      setToasts((prev) => [...prev, next].slice(-MAX_TOASTS));
      scheduleAutoDismiss(id, duration);
      return id;
    },
    [scheduleAutoDismiss],
  );

  const pause = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const resume = useCallback(
    (t: Toast) => {
      if (t.duration && t.duration > 0) scheduleAutoDismiss(t.id, t.duration);
    },
    [scheduleAutoDismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => window.clearTimeout(t));
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} onPause={pause} onResume={resume} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
} as const;

const TONE: Record<ToastType, { border: string; icon: string }> = {
  success: { border: 'border-l-success', icon: 'text-success' },
  warning: { border: 'border-l-warning', icon: 'text-warning' },
  danger: { border: 'border-l-danger', icon: 'text-danger' },
  info: { border: 'border-l-info', icon: 'text-info' },
};

function ToastContainer({
  toasts,
  onDismiss,
  onPause,
  onResume,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (t: Toast) => void;
}) {
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            role={t.type === 'danger' || t.type === 'warning' ? 'alert' : 'status'}
            onMouseEnter={() => onPause(t.id)}
            onMouseLeave={() => onResume(t)}
            className={cn(
              'pointer-events-auto bg-white rounded-md shadow-lg border border-stone-200 border-l-4 px-4 py-3',
              'min-w-[320px] max-w-[420px] flex items-start gap-3',
              'animate-[toast-in_250ms_ease-out]',
              TONE[t.type].border,
            )}
          >
            <Icon size={20} className={cn('shrink-0 mt-0.5', TONE[t.type].icon)} />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-stone-900">{t.title}</div>
              {t.description && (
                <div className="mt-0.5 text-[13px] text-stone-600">{t.description}</div>
              )}
            </div>
            <button
              type="button"
              aria-label="Fermer la notification"
              onClick={() => onDismiss(t.id)}
              className="shrink-0 text-stone-400 hover:text-stone-700 opacity-60 hover:opacity-100 transition"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
      <style>{`@keyframes toast-in {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }`}</style>
    </div>
  );
}
