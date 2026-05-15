import { useState, useEffect } from 'react';
import { BellRing, Plus, Mail, MessageSquare, Smartphone, Bell, Edit2, Trash2, ToggleLeft, ToggleRight, FlaskConical } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useToast } from '../lib/toast';

// ─── Types & mock data ────────────────────────────────────────────────────────

type Channel = 'inapp' | 'email' | 'sms' | 'whatsapp';
type Delay = 'immediate' | '15min' | '1h' | '24h';

interface NotifRule {
  id: string;
  event: string;
  channels: Channel[];
  roles: string[];
  delay: Delay;
  condition?: string;
  enabled: boolean;
}

const CHANNEL_ICON: Record<Channel, React.ReactNode> = {
  inapp: <Bell size={13} />,
  email: <Mail size={13} />,
  sms: <Smartphone size={13} />,
  whatsapp: <MessageSquare size={13} />,
};
const CHANNEL_LABEL: Record<Channel, string> = {
  inapp: 'In-app', email: 'Email', sms: 'SMS', whatsapp: 'WhatsApp',
};
const CHANNEL_COLOR: Record<Channel, string> = {
  inapp: '#1E5BA8', email: '#9333EA', sms: '#16A34A', whatsapp: '#25D366',
};
const DELAY_LABEL: Record<Delay, string> = {
  immediate: 'Immédiat', '15min': '15 min', '1h': '1 heure', '24h': '24 heures',
};

const INITIAL_RULES: NotifRule[] = [
  { id: 'n1', event: 'Micro-plan soumis pour validation', channels: ['inapp', 'email'], roles: ['gestionnaire_provincial', 'gestionnaire_national'], delay: 'immediate', enabled: true },
  { id: 'n2', event: 'Micro-plan validé', channels: ['inapp', 'email', 'sms'], roles: ['planificateur', 'chef_equipe'], delay: 'immediate', enabled: true },
  { id: 'n3', event: 'Micro-plan rejeté', channels: ['inapp', 'email'], roles: ['planificateur'], delay: 'immediate', enabled: true },
  { id: 'n4', event: 'Alerte critique terrain', channels: ['inapp', 'sms', 'whatsapp'], roles: ['superviseur', 'gestionnaire_provincial'], delay: 'immediate', condition: 'sévérité = critique', enabled: true },
  { id: 'n5', event: 'Rupture stock vaccin', channels: ['inapp', 'email', 'sms'], roles: ['gestionnaire_national', 'logisticien'], delay: 'immediate', enabled: true },
  { id: 'n6', event: 'Équipe hors géofence', channels: ['inapp', 'sms'], roles: ['superviseur'], delay: '15min', enabled: true },
  { id: 'n7', event: 'Opportunité nomade identifiée', channels: ['inapp', 'email'], roles: ['planificateur', 'gestionnaire_provincial'], delay: '1h', enabled: false },
  { id: 'n8', event: 'Rapport journalier non soumis', channels: ['inapp', 'sms'], roles: ['superviseur', 'chef_equipe'], delay: '24h', condition: 'après 20h si non soumis', enabled: true },
];

const ALL_EVENTS = [
  'Micro-plan soumis pour validation',
  'Micro-plan validé',
  'Micro-plan rejeté',
  'Alerte critique terrain',
  'Rupture stock vaccin',
  'Équipe hors géofence',
  'Opportunité nomade identifiée',
  'Rapport journalier non soumis',
  'Nouveau compte utilisateur',
  'Synchronisation DHIS2 échouée',
];

const ALL_ROLES = ['planificateur', 'superviseur', 'chef_equipe', 'logisticien', 'gestionnaire_provincial', 'gestionnaire_national', 'analyste', 'admin'];

// ─── Rule modal ────────────────────────────────────────────────────────────────

function RuleModal({ rule, onClose, onSave }: {
  rule: Partial<NotifRule> | null;
  onClose: () => void;
  onSave: (r: NotifRule) => void;
}) {
  const { toast } = useToast();
  const isNew = !rule?.id;
  const [event, setEvent] = useState(rule?.event ?? ALL_EVENTS[0]);
  const [channels, setChannels] = useState<Channel[]>(rule?.channels ?? ['inapp']);
  const [roles, setRoles] = useState<string[]>(rule?.roles ?? []);
  const [delay, setDelay] = useState<Delay>(rule?.delay ?? 'immediate');
  const [condition, setCondition] = useState(rule?.condition ?? '');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggleChannel = (c: Channel) =>
    setChannels((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  const toggleRole = (r: string) =>
    setRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);

  const handleTest = () => {
    toast({ type: 'success', title: 'Test envoyé', message: 'Notification test envoyée avec succès.' });
  };

  const handleSave = () => {
    onSave({
      id: rule?.id ?? `n-${Date.now()}`,
      event, channels, roles, delay,
      condition: condition || undefined,
      enabled: rule?.enabled ?? true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="font-bold text-stone-900">{isNew ? 'Nouvelle règle' : 'Modifier la règle'}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-lg">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Event */}
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1.5">Événement déclencheur</label>
            <select
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {ALL_EVENTS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {/* Channels */}
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1.5">Canaux</label>
            <div className="flex flex-wrap gap-2">
              {(['inapp', 'email', 'sms', 'whatsapp'] as Channel[]).map((c) => (
                <button
                  key={c}
                  onClick={() => toggleChannel(c)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    channels.includes(c)
                      ? 'text-white border-transparent'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}
                  style={channels.includes(c) ? { background: CHANNEL_COLOR[c] } : {}}
                >
                  {CHANNEL_ICON[c]} {CHANNEL_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Delay */}
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1.5">Délai</label>
            <div className="flex flex-wrap gap-2">
              {(['immediate', '15min', '1h', '24h'] as Delay[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDelay(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    delay === d ? 'bg-primary text-white border-transparent' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {DELAY_LABEL[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Roles */}
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1.5">Rôles destinataires</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => toggleRole(r)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                    roles.includes(r) ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1.5">Condition optionnelle</label>
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="ex : seulement si sévérité = critique"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-stone-200 flex justify-between">
          <button
            onClick={handleTest}
            className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 font-medium"
          >
            <FlaskConical size={14} /> Tester
          </button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
            <Button size="sm" onClick={handleSave}>
              {isNew ? 'Créer la règle' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  const [rules, setRules] = useState<NotifRule[]>(INITIAL_RULES);
  const [modalRule, setModalRule] = useState<Partial<NotifRule> | null | undefined>(undefined);

  const toggleRule = (id: string) =>
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));

  const deleteRule = (id: string) =>
    setRules((prev) => prev.filter((r) => r.id !== id));

  const saveRule = (r: NotifRule) => {
    setRules((prev) => prev.some((x) => x.id === r.id) ? prev.map((x) => x.id === r.id ? r : x) : [...prev, r]);
    setModalRule(undefined);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
            <span>Administration</span><span>/</span>
            <span className="text-stone-600 font-medium">Notifications</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <BellRing size={22} className="text-primary" /> Configuration des notifications
          </h1>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setModalRule({})}>
          <Plus size={14} /> Nouvelle règle
        </Button>
      </div>

      {/* Rules table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
        <div className="px-4 py-3 border-b border-stone-100">
          <span className="font-semibold text-stone-800 text-sm">Règles de notification ({rules.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                {['Événement', 'Canaux', 'Rôles', 'Délai', 'Condition', 'Statut', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-stone-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-stone-900 text-xs">{rule.event}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {rule.channels.map((c) => (
                        <span
                          key={c}
                          title={CHANNEL_LABEL[c]}
                          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
                          style={{ background: CHANNEL_COLOR[c] }}
                        >
                          {CHANNEL_ICON[c]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {rule.roles.slice(0, 2).map((r) => (
                        <span key={r} className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-full">{r}</span>
                      ))}
                      {rule.roles.length > 2 && (
                        <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full">+{rule.roles.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-stone-600">{DELAY_LABEL[rule.delay]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-stone-500 italic">{rule.condition ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleRule(rule.id)} className="flex items-center gap-1 text-xs font-medium">
                      {rule.enabled
                        ? <><ToggleRight size={18} className="text-green-600" /><span className="text-green-700">Actif</span></>
                        : <><ToggleLeft size={18} className="text-stone-400" /><span className="text-stone-500">Inactif</span></>
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setModalRule(rule)} className="p-1.5 rounded hover:bg-stone-200 text-stone-500 hover:text-primary">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded hover:bg-red-50 text-stone-500 hover:text-red-600">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global preferences */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
        <div className="px-4 py-3 border-b border-stone-100">
          <span className="font-semibold text-stone-800 text-sm">Préférences globales</span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1.5">Horaires de silence</label>
            <div className="flex items-center gap-2">
              <input type="time" defaultValue="22:00" className="px-2 py-1.5 border border-stone-300 rounded-lg text-sm" />
              <span className="text-stone-400 text-xs">à</span>
              <input type="time" defaultValue="07:00" className="px-2 py-1.5 border border-stone-300 rounded-lg text-sm" />
            </div>
            <p className="text-[10px] text-stone-400 mt-1">Sans SMS/WhatsApp</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1.5">Fréquence max</label>
            <div className="flex items-center gap-2">
              <input type="number" defaultValue={10} min={1} max={100}
                className="w-20 px-2 py-1.5 border border-stone-300 rounded-lg text-sm" />
              <span className="text-xs text-stone-500">notifications / heure / utilisateur</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1.5">Canal de secours</label>
            <select className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm">
              <option value="email">Email (si SMS échoue)</option>
              <option value="inapp">In-app uniquement</option>
              <option value="none">Aucun</option>
            </select>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-stone-100 flex justify-end">
          <Button size="sm">Sauvegarder les préférences</Button>
        </div>
      </div>

      {/* Modal */}
      {modalRule !== undefined && (
        <RuleModal rule={modalRule} onClose={() => setModalRule(undefined)} onSave={saveRule} />
      )}
    </div>
  );
}
