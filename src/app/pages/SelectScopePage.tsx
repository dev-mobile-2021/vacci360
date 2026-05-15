import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Globe, MapPin, Building2, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../lib/auth';
import { useScope } from '../lib/scope';
import type { Scope, ScopeLevel } from '../types';
import { cn } from '../lib/cn';

const LEVEL_ICON: Record<ScopeLevel, LucideIcon> = {
  national: Globe,
  provincial: MapPin,
  district: Building2,
};

const LEVEL_LABEL: Record<ScopeLevel, string> = {
  national: 'PAYS',
  provincial: 'PROVINCE',
  district: 'DISTRICT',
};

export default function SelectScopePage() {
  const { user, logout } = useAuth();
  const { available, current, setCurrentScope } = useScope();
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState<string | null>(current?.id ?? null);
  const [setDefault, setSetDefault] = useState(true);

  if (!user) return <Navigate to="/login" replace />;
  if (available.length <= 1) return <Navigate to="/dashboard" replace />;

  function handleContinue() {
    if (!selectedId) return;
    setCurrentScope(selectedId);
    if (setDefault) {
      // déjà persisté via le ScopeProvider (localStorage)
    }
    navigate('/dashboard', { replace: true });
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-start justify-center px-6 py-20">
      <div className="w-full max-w-[640px]">
        <div className="text-center mb-8">
          <div
            className="text-primary-700"
            style={{ fontSize: 32, lineHeight: '40px', fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            VACCI360
          </div>
          <h2 className="mt-6 text-stone-900">Sélectionnez votre périmètre de travail</h2>
          <p className="mt-2 text-stone-600">
            Vous avez accès à plusieurs zones. Choisissez celle sur laquelle vous souhaitez
            travailler. Vous pourrez en changer à tout moment depuis l'en-tête.
          </p>
        </div>

        <ul className="space-y-3">
          {available.map((s) => (
            <li key={s.id}>
              <ScopeCard
                scope={s}
                selected={s.id === selectedId}
                onSelect={() => setSelectedId(s.id)}
              />
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-4">
          <label className="flex items-center gap-2 text-[13px] text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={setDefault}
              onChange={(e) => setSetDefault(e.target.checked)}
              className="size-4 rounded border-stone-300 text-primary focus:ring-primary-500"
            />
            Définir comme scope par défaut
          </label>

          <Button fullWidth size="lg" disabled={!selectedId} onClick={handleContinue}>
            Continuer
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="text-[13px] text-stone-500 hover:text-stone-800"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScopeCard({
  scope,
  selected,
  onSelect,
}: {
  scope: Scope;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = LEVEL_ICON[scope.level];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'w-full text-left rounded-xl bg-white p-4 transition-colors flex items-start gap-4',
        selected
          ? 'border-2 border-primary bg-primary-50'
          : 'border border-stone-200 hover:border-primary-200 hover:bg-primary-50',
      )}
    >
      <span
        className={cn(
          'size-10 grid place-items-center rounded-lg shrink-0',
          selected ? 'bg-primary text-white' : 'bg-primary-100 text-primary-700',
        )}
      >
        <Icon size={20} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold tracking-wider text-stone-500">
          {LEVEL_LABEL[scope.level]}
        </div>
        <div className="text-[16px] font-semibold text-stone-900">{scope.name}</div>
        <div className="mt-0.5 text-[13px] text-stone-600">
          {scope.level !== 'district' && (
            <>{scope.stats.districts} districts · </>
          )}
          {scope.stats.villages.toLocaleString('fr-FR')} villages ·{' '}
          {scope.stats.formations} formations sanitaires
        </div>
      </div>
      {selected && (
        <Check size={20} className="text-primary-700 shrink-0 mt-1" aria-label="Sélectionné" />
      )}
    </button>
  );
}
