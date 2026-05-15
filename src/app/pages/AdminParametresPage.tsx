import { useState } from 'react';
import { Settings, ChevronDown, ChevronUp, CheckCircle2, XCircle, Upload } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../lib/toast';

// ─── Accordion section ────────────────────────────────────────────────────────

function AccordionSection({
  title, children, defaultOpen = false,
}: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
      >
        <span className="font-semibold text-stone-800">{title}</span>
        {open ? <ChevronUp size={18} className="text-stone-400" /> : <ChevronDown size={18} className="text-stone-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-stone-100">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-stone-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  );
}

function TextInput({ defaultValue, placeholder }: { defaultValue?: string; placeholder?: string }) {
  return (
    <input
      type="text"
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  );
}

function SelectInput({ options, defaultValue }: { options: string[]; defaultValue?: string }) {
  return (
    <select defaultValue={defaultValue} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminParametresPage() {
  const { toast } = useToast();
  const [dhis2Status, setDhis2Status] = useState<'idle' | 'success' | 'error'>('idle');
  const [primaryColor, setPrimaryColor] = useState('#1E5BA8');

  const testDhis2 = () => {
    setDhis2Status('idle');
    setTimeout(() => {
      const ok = Math.random() > 0.3;
      setDhis2Status(ok ? 'success' : 'error');
      toast({
        type: ok ? 'success' : 'danger',
        title: ok ? 'Connexion DHIS2 réussie' : 'Connexion DHIS2 échouée',
        message: ok ? 'Instance accessible.' : 'Vérifiez l\'URL et la clé API.',
      });
    }, 1200);
  };

  const handleSave = () => {
    toast({ type: 'success', title: 'Paramètres sauvegardés', message: 'Les modifications ont été appliquées.' });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
            <span>Administration</span><span>/</span>
            <span className="text-stone-600 font-medium">Paramètres</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Settings size={22} className="text-primary" /> Paramètres système
          </h1>
        </div>
        <Button onClick={handleSave} className="gap-1.5">
          <CheckCircle2 size={14} /> Sauvegarder
        </Button>
      </div>

      {/* Intégrations */}
      <AccordionSection title="🔗 Intégrations" defaultOpen>
        <div className="space-y-5 mt-2">
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            <div className="font-medium text-stone-800 mb-3 text-sm">DHIS2</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="URL instance">
                <TextInput defaultValue="https://dhis2.sante.td" />
              </Field>
              <Field label="Clé API">
                <TextInput defaultValue="••••••••••••••••" placeholder="Clé API secrète" />
              </Field>
              <Field label="Fréquence de synchronisation">
                <SelectInput options={['Temps réel', 'Toutes les heures', 'Quotidien', 'Manuel']} defaultValue="Quotidien" />
              </Field>
              <Field label="">
                <div className="flex items-center gap-2 pt-5">
                  <Button onClick={testDhis2} variant="secondary" size="sm" className="gap-1.5">
                    Tester la connexion
                  </Button>
                  {dhis2Status === 'success' && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 size={13} /> Connecté
                    </span>
                  )}
                  {dhis2Status === 'error' && (
                    <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                      <XCircle size={13} /> Échec
                    </span>
                  )}
                </div>
              </Field>
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            <div className="font-medium text-stone-800 mb-3 text-sm">OpenStreetMap</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Niveau de détail cartographique">
                <SelectInput options={['Pays', 'Province', 'Département', 'Sous-préfecture', 'Village']} defaultValue="Village" />
              </Field>
              <Field label="Cache local" hint="Les tuiles de carte sont mises en cache localement.">
                <SelectInput options={['Activé (7 jours)', 'Activé (30 jours)', 'Désactivé']} defaultValue="Activé (7 jours)" />
              </Field>
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            <div className="font-medium text-stone-800 mb-3 text-sm">API Météo</div>
            <Field label="Clé API" hint="Utilisée pour les alertes météo et les prévisions de fenêtres d'accessibilité.">
              <TextInput placeholder="Clé API OpenWeatherMap" />
            </Field>
          </div>
        </div>
      </AccordionSection>

      {/* Branding */}
      <AccordionSection title="🎨 Branding">
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nom de la plateforme">
              <TextInput defaultValue="VACCI360" />
            </Field>
            <Field label="Couleur primaire">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono"
                />
              </div>
            </Field>
            <Field label="Logo">
              <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors">
                <Upload size={14} className="text-stone-400" />
                <span className="text-sm text-stone-500">Téléverser un logo (PNG/SVG)</span>
              </label>
            </Field>
            <Field label="Pied de page">
              <textarea
                defaultValue="Ministère de la Santé Publique — République du Tchad · VACCI360 v2.0"
                rows={2}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </Field>
          </div>
        </div>
      </AccordionSection>

      {/* Sécurité */}
      <AccordionSection title="🔒 Sécurité">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <Field label="Durée de session">
            <SelectInput options={['1 heure', '4 heures', '8 heures', '24 heures']} defaultValue="8 heures" />
          </Field>
          <Field label="Tentatives de connexion max">
            <input type="number" defaultValue={5} min={1} max={20}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm" />
          </Field>
          <Field label="MFA obligatoire pour" hint="Authentification à deux facteurs">
            <div className="flex flex-wrap gap-1.5">
              {['admin', 'gestionnaire_national', 'gestionnaire_provincial'].map((r) => (
                <label key={r} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox" defaultChecked={r === 'admin'} className="rounded" />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Rétention des logs d'audit">
            <SelectInput options={['90 jours', '180 jours', '1 an', '2 ans']} defaultValue="1 an" />
          </Field>
        </div>
      </AccordionSection>

      {/* Données */}
      <AccordionSection title="📊 Données et seuils">
        <div className="space-y-4 mt-2">
          <Field label="Hiérarchie géographique active" hint="Configuration en lecture seule — modifiable via le Référentiel.">
            <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-lg border border-stone-200">
              <span className="text-sm text-stone-600">Tchad — 23 provinces, 3 provinces pilotes actives</span>
              <a href="/referentiel/geographie" className="text-xs text-primary hover:underline ml-auto">Voir →</a>
            </div>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Seuil critique" hint="Coverage <X%">
              <div className="flex items-center gap-2">
                <input type="number" defaultValue={50} min={0} max={100}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm" />
                <span className="text-stone-500 text-sm flex-shrink-0">%</span>
              </div>
            </Field>
            <Field label="Seuil insuffisant">
              <div className="flex items-center gap-2">
                <input type="number" defaultValue={80} min={0} max={100}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm" />
                <span className="text-stone-500 text-sm flex-shrink-0">%</span>
              </div>
            </Field>
            <Field label="Seuil satisfaisant">
              <div className="flex items-center gap-2">
                <input type="number" defaultValue={90} min={0} max={100}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm" />
                <span className="text-stone-500 text-sm flex-shrink-0">%</span>
              </div>
            </Field>
          </div>

          <Field label="Seuil d'alerte stock" hint="Alerte rupture déclenchée quand le stock disponible passe sous ce seuil.">
            <div className="flex items-center gap-2">
              <input type="number" defaultValue={20} min={0} max={100}
                className="w-32 px-3 py-2 border border-stone-300 rounded-lg text-sm" />
              <span className="text-stone-500 text-sm">% du stock minimum requis</span>
            </div>
          </Field>
        </div>
      </AccordionSection>

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} className="gap-1.5 px-6">
          <CheckCircle2 size={14} /> Sauvegarder tous les paramètres
        </Button>
      </div>
    </div>
  );
}
