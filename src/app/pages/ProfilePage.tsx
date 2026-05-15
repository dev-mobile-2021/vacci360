import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar } from '../components/ui/avatar';
import { Toggle } from '../components/ui/toggle';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';

const FUNCTIONS = [
  'Médecin chef de district',
  'Gestionnaire PEV',
  'Superviseur',
  'Analyste',
  'Autre',
];

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [fn, setFn] = useState(user?.function ?? FUNCTIONS[0]);

  const [lang, setLang] = useState<'fr' | 'ar'>('fr');
  const [tz, setTz] = useState('Africa/Ndjamena');
  const [dateFmt, setDateFmt] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY'>('DD/MM/YYYY');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifWa, setNotifWa] = useState(false);

  const [twoFa, setTwoFa] = useState(user?.role === 'admin');
  const [pwModalOpen, setPwModalOpen] = useState(false);

  if (!user) return null;

  function handleSaveInfos() {
    updateUser({ name, phone, function: fn });
    toast({
      type: 'success',
      title: 'Vos informations ont été mises à jour',
    });
  }

  function handleSavePrefs() {
    toast({
      type: 'success',
      title: 'Préférences enregistrées',
      description: 'Vos préférences ont été appliquées à votre session.',
    });
  }

  return (
    <div className="max-w-[800px] space-y-6">
      <div>
        <h1 className="text-stone-900">Mon profil</h1>
        <p className="mt-2 text-stone-600">
          Gérez vos informations personnelles et vos préférences
        </p>
      </div>

      {/* Informations personnelles */}
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar initials={user.initials} size={80} />
            <Button variant="ghost" size="sm" disabled>
              Modifier la photo
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nom complet" htmlFor="pf-name">
              <Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field
              label="Email"
              htmlFor="pf-email"
              hint="Pour modifier votre email, contactez votre administrateur."
            >
              <Input id="pf-email" value={user.email} disabled />
            </Field>
            <Field label="Téléphone" htmlFor="pf-phone">
              <Input
                id="pf-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+235 …"
              />
            </Field>
            <Field label="Fonction" htmlFor="pf-fn">
              <select
                id="pf-fn"
                value={fn}
                onChange={(e) => setFn(e.target.value)}
                className="w-full h-10 rounded-md border border-stone-300 bg-white px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {FUNCTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveInfos}>Enregistrer les modifications</Button>
          </div>
        </CardBody>
      </Card>

      {/* Préférences */}
      <Card>
        <CardHeader>
          <CardTitle>Préférences</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <Field label="Langue">
            <div className="flex gap-4 text-[14px]">
              <Radio
                name="lang"
                checked={lang === 'fr'}
                onChange={() => setLang('fr')}
                label="Français"
              />
              <Radio
                name="lang"
                checked={lang === 'ar'}
                onChange={() => {}}
                disabled
                label="العربية (disponible bientôt)"
              />
            </div>
          </Field>

          <Field label="Fuseau horaire" htmlFor="pf-tz">
            <select
              id="pf-tz"
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              className="w-full md:w-72 h-10 rounded-md border border-stone-300 bg-white px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option>Africa/Ndjamena</option>
              <option>Africa/Lagos</option>
              <option>UTC</option>
              <option>Europe/Paris</option>
            </select>
          </Field>

          <Field label="Format de date">
            <div className="flex gap-4 text-[14px]">
              <Radio
                name="datefmt"
                checked={dateFmt === 'DD/MM/YYYY'}
                onChange={() => setDateFmt('DD/MM/YYYY')}
                label="DD/MM/YYYY"
              />
              <Radio
                name="datefmt"
                checked={dateFmt === 'MM/DD/YYYY'}
                onChange={() => setDateFmt('MM/DD/YYYY')}
                label="MM/DD/YYYY"
              />
            </div>
          </Field>

          <Field label="Densité des tableaux">
            <div className="flex gap-4 text-[14px]">
              <Radio
                name="density"
                checked={density === 'comfortable'}
                onChange={() => setDensity('comfortable')}
                label="Confortable"
              />
              <Radio
                name="density"
                checked={density === 'compact'}
                onChange={() => setDensity('compact')}
                label="Compact"
              />
            </div>
          </Field>

          <Field label="Préférences de notifications">
            <div className="space-y-2 max-w-md">
              <ToggleRow label="Notifications in-app" checked={notifInApp} onChange={setNotifInApp} />
              <ToggleRow label="Email" checked={notifEmail} onChange={setNotifEmail} />
              <ToggleRow label="SMS" checked={notifSms} onChange={setNotifSms} />
              <ToggleRow label="WhatsApp" checked={notifWa} onChange={setNotifWa} />
            </div>
          </Field>

          <div className="flex justify-end">
            <Button onClick={handleSavePrefs}>Enregistrer les préférences</Button>
          </div>
        </CardBody>
      </Card>

      {/* Sécurité */}
      <Card>
        <CardHeader>
          <CardTitle>Sécurité</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[14px] font-medium text-stone-800">Mot de passe</div>
              <div className="text-[13px] text-stone-600">Dernière modification : il y a 2 mois</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPwModalOpen(true)}>
              Changer le mot de passe
            </Button>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="max-w-md">
              <div className="text-[14px] font-medium text-stone-800">
                Authentification à deux facteurs
              </div>
              <div className="text-[13px] text-stone-600">
                Recommandé pour les comptes ayant accès aux données sensibles.
              </div>
            </div>
            <Toggle checked={twoFa} onChange={setTwoFa} label="Activer la 2FA" />
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() =>
                toast({ type: 'info', title: 'Disponible bientôt', description: 'Sessions actives — Sprint 6.' })
              }
              className="text-[13px] text-primary-700 hover:underline"
            >
              Voir mes sessions actives
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="text-danger hover:bg-danger-50"
            >
              Déconnecter toutes les autres sessions
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* À propos */}
      <Card>
        <CardHeader>
          <CardTitle>À propos</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2">
          <Row label="Version application" value="1.0.0-sprint0" />
          <Row label="Conditions d'utilisation" link />
          <Row label="Politique de confidentialité" link />
          <Row label="Contacter le support" link />
          <p className="pt-3 text-[11px] text-stone-500">
            VACCI360 — Plateforme PEV Tchad · Ministère de la Santé Publique
          </p>
        </CardBody>
      </Card>

      <PasswordModal open={pwModalOpen} onClose={() => setPwModalOpen(false)} />
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block mb-1.5 text-[13px] font-medium text-stone-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[12px] text-stone-500">{hint}</p>}
    </div>
  );
}

function Radio({
  name,
  checked,
  onChange,
  label,
  disabled,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className={`inline-flex items-center gap-2 ${disabled ? 'text-stone-400 cursor-not-allowed' : 'text-stone-800 cursor-pointer'}`}>
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="size-4 text-primary border-stone-300 focus:ring-primary-500"
      />
      {label}
    </label>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-[14px] text-stone-700">{label}</span>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

function Row({ label, value, link }: { label: string; value?: string; link?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[14px]">
      <span className="text-stone-700">{label}</span>
      {link ? (
        <a href="#" className="text-primary-700 hover:underline">
          Consulter
        </a>
      ) : (
        <span className="text-stone-900 font-mono text-[13px]">{value}</span>
      )}
    </div>
  );
}

function PasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!current || !next || !confirm) return setError('Tous les champs sont requis.');
    if (next.length < 8) return setError('Le nouveau mot de passe doit faire au moins 8 caractères.');
    if (next !== confirm) return setError('La confirmation ne correspond pas.');
    toast({ type: 'success', title: 'Mot de passe modifié' });
    setCurrent('');
    setNext('');
    setConfirm('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Changer le mot de passe"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={submit}>Mettre à jour</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[13px] text-danger-700">
            {error}
          </div>
        )}
        <Field label="Mot de passe actuel" htmlFor="pw-cur">
          <Input id="pw-cur" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="Nouveau mot de passe" htmlFor="pw-new">
          <Input id="pw-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <Field label="Confirmer le nouveau mot de passe" htmlFor="pw-conf">
          <Input id="pw-conf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
