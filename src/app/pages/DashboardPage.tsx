import { MapPin, CheckCircle2 } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../lib/auth';
import { useScope } from '../lib/scope';
import { ROLE_LABEL } from '../types';

const FEATURES = [
  'Navigation entre les espaces (Pilotage, Action, Référentiel)',
  'Sidebar adaptée au rôle utilisateur (RBAC)',
  'Sélecteur de scope géographique',
  'Profil & déconnexion via le menu utilisateur',
  'Routes placeholder pour les modules métier à venir',
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { current, available } = useScope();
  const firstName = user?.name.split(' ').slice(-1)[0] ?? '';

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-stone-900">Bonjour, {user?.name}</h1>
        <p className="mt-2 text-stone-600">
          Bienvenue sur votre espace VACCI360. Les modules seront disponibles progressivement.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Badge tone="primary">{ROLE_LABEL[user!.role]}</Badge>
          {firstName && <Badge tone="neutral">Identifié : {firstName}</Badge>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Sprint 0 — Shell applicatif</CardTitle>
            <Badge tone="ai">En cours</Badge>
          </CardHeader>
          <CardBody>
            <p className="text-stone-600 mb-4">
              Voici les fonctionnalités de la fondation déjà disponibles à tester :
            </p>
            <ul className="space-y-2">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[14px] text-stone-700">
                  <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scope actuel</CardTitle>
          </CardHeader>
          <CardBody>
            {current ? (
              <>
                <div className="flex items-start gap-3">
                  <span className="size-9 grid place-items-center rounded-md bg-primary-100 text-primary-700">
                    <MapPin size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-stone-500">
                      {current.level}
                    </div>
                    <div className="text-stone-900 font-medium truncate">{current.name}</div>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Districts" value={current.stats.districts} />
                  <Stat label="Villages" value={current.stats.villages} />
                  <Stat label="Formations" value={current.stats.formations} />
                </dl>
                {available.length > 1 && (
                  <Button variant="outline" size="sm" fullWidth className="mt-4">
                    Changer de scope
                  </Button>
                )}
              </>
            ) : (
              <p className="text-stone-500 text-[13px]">Aucun scope sélectionné.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-stone-50 border border-stone-200 px-2 py-2">
      <div className="text-[11px] text-stone-500 uppercase tracking-wide">{label}</div>
      <div className="text-stone-900 font-semibold">{value.toLocaleString('fr-FR')}</div>
    </div>
  );
}
