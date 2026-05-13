import { useNavigate, useParams } from 'react-router';
import { useState, useMemo } from 'react';
import { ArrowLeft, ChevronRight, ShieldCheck, ShieldOff, Mail, Phone, Calendar, User, MapPin, Activity, BarChart2 } from 'lucide-react';
import { formatDistanceToNow, format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { usePermissions } from '../lib/permissions-context';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { PermissionMatrix } from '../components/admin/PermissionMatrix';
import { ROLE_LABEL, type Role, type RolePermissions } from '../types';

const ROLE_BADGE_CLASS: Record<Role, string> = {
  admin: 'bg-danger-100 text-danger-700',
  gestionnaire_national: 'bg-primary-100 text-primary-700',
  gestionnaire_provincial: 'bg-info-100 text-info-700',
  superviseur_district: 'bg-success-100 text-success-700',
  analyste: 'bg-stone-100 text-stone-700',
  agent_terrain: 'bg-warning-100 text-warning-700',
};

const STATUS_CONFIG = {
  active: { label: 'Actif', cls: 'bg-success-100 text-success-700' },
  suspended: { label: 'Suspendu', cls: 'bg-warning-100 text-warning-700' },
  pending_activation: { label: 'En attente', cls: 'bg-info-100 text-info-700' },
  disabled: { label: 'Désactivé', cls: 'bg-stone-100 text-stone-600' },
} as const;

const SCOPE_LABEL: Record<string, string> = {
  national: 'National',
  'prov-lac': 'Province du Lac',
  'prov-kanem': 'Province du Kanem',
  'prov-hadjer-lamis': 'Hadjer-Lamis',
  'prov-ndjamena': "N'Djamena",
  'prov-logone-occidental': 'Logone Occidental',
  'prov-batha': 'Batha',
  'dist-bol': 'District de Bol',
  'dist-mao': 'District de Mao',
  'dist-nokou': 'District de Nokou',
  'dist-liwa': 'District de Liwa',
  'dist-massakory': 'District de Massakory',
  'dist-massaguet': 'District de Massaguet',
  'dist-dourbali': 'District de Dourbali',
  'dist-moundou': 'District de Moundou',
};

// Generate mock activity data
function generateActivityData() {
  return Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'dd/MM'),
    connexions: Math.floor(Math.random() * 5),
  }));
}

const MOCK_AUDIT = [
  { id: 1, ts: new Date(Date.now() - 2 * 3600000), actor: 'Mahamat Idriss', action: 'Connexion', detail: 'Connexion depuis 196.x.x.1' },
  { id: 2, ts: new Date(Date.now() - 5 * 3600000), actor: 'Mahamat Idriss', action: 'Export', detail: 'Export CSV — Liste villages' },
  { id: 3, ts: new Date(Date.now() - 1 * 86400000), actor: 'Mahamat Idriss', action: 'Modification', detail: 'Mise à jour profil utilisateur u14' },
  { id: 4, ts: new Date(Date.now() - 2 * 86400000), actor: 'System', action: 'Création', detail: 'Compte créé par u1' },
  { id: 5, ts: new Date(Date.now() - 3 * 86400000), actor: 'Mahamat Idriss', action: 'Connexion', detail: 'Connexion depuis 197.x.x.2' },
  { id: 6, ts: new Date(Date.now() - 5 * 86400000), actor: 'Mahamat Idriss', action: 'Permission', detail: 'Modification permissions u9' },
  { id: 7, ts: new Date(Date.now() - 7 * 86400000), actor: 'Mahamat Idriss', action: 'Connexion', detail: 'Connexion depuis 196.x.x.1' },
  { id: 8, ts: new Date(Date.now() - 10 * 86400000), actor: 'System', action: 'Suspension', detail: 'Tentatives de connexion échouées (×5)' },
  { id: 9, ts: new Date(Date.now() - 12 * 86400000), actor: 'Mahamat Idriss', action: 'Export', detail: 'Export Excel — Rapport mensuel' },
  { id: 10, ts: new Date(Date.now() - 15 * 86400000), actor: 'Mahamat Idriss', action: 'Connexion', detail: 'Connexion depuis 196.x.x.5' },
];

const TOP_ACTIONS = [
  { action: 'Connexion', module: 'Auth', count: 42 },
  { action: 'Consultation', module: 'Référentiel', count: 38 },
  { action: 'Export', module: 'Référentiel', count: 17 },
  { action: 'Modification', module: 'Administration', count: 12 },
  { action: 'Validation', module: 'Planification', count: 8 },
  { action: 'Création', module: 'Référentiel', count: 6 },
  { action: 'Consultation', module: 'Supervision', count: 5 },
  { action: 'Export', module: 'Supervision', count: 3 },
  { action: 'Connexion', module: 'Mobile', count: 2 },
  { action: 'Import', module: 'Référentiel', count: 1 },
];

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { users, updateUser, updateUserPermissions } = usePermissions();

  const user = users.find((u) => u.id === id);
  const [editingPerms, setEditingPerms] = useState(false);
  const [localPerms, setLocalPerms] = useState<RolePermissions>({});
  const activityData = useMemo(() => generateActivityData(), []);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-400">
        <User size={48} className="mb-4 opacity-30" />
        <p className="text-lg font-medium">Utilisateur introuvable</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/admin/utilisateurs')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';
  const daysSinceLogin = user.lastLoginAt
    ? Math.floor((Date.now() - user.lastLoginAt.getTime()) / 86400000)
    : null;
  const daysSinceCreation = Math.floor((Date.now() - user.createdAt.getTime()) / 86400000);

  const showInviteBanner =
    user.status === 'pending_activation' && daysSinceCreation > 7;
  const showInactiveBanner =
    user.status === 'active' && daysSinceLogin !== null && daysSinceLogin > 90;
  const showMfaBanner =
    !user.mfaEnabled && (user.role === 'admin' || user.role === 'gestionnaire_national');

  const handleSuspend = () => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    updateUser(user.id, { status: newStatus });
    toast({ type: 'success', title: newStatus === 'suspended' ? 'Utilisateur suspendu' : 'Utilisateur réactivé', description: '' });
  };

  const handleSavePerms = () => {
    updateUserPermissions(user.id, localPerms);
    setEditingPerms(false);
    toast({ type: 'success', title: 'Permissions mises à jour', description: '' });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
          <button onClick={() => navigate('/admin/utilisateurs')} className="flex items-center gap-1 hover:text-stone-900 transition-colors">
            <ArrowLeft size={14} />
            Retour
          </button>
          <ChevronRight size={14} />
          <span>Administration</span>
          <ChevronRight size={14} />
          <button onClick={() => navigate('/admin/utilisateurs')} className="hover:text-stone-900 transition-colors">Utilisateurs</button>
          <ChevronRight size={14} />
          <span className="text-stone-900 font-medium">{user.name}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-stone-900">{user.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[user.status].cls}`}>
                {STATUS_CONFIG[user.status].label}
              </span>
            </div>
            <p className="text-stone-500 text-sm">{user.email}</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="secondary" size="sm" onClick={() => setEditingPerms(true)}>Modifier</Button>
              <Button variant="secondary" size="sm" onClick={() => toast({ type: 'info', title: 'Email envoyé', description: `Lien de réinitialisation envoyé à ${user.email}.` })}>
                Réinitialiser MDP
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className={user.status === 'suspended' ? 'text-success-700 hover:bg-success-50' : 'text-warning-700 hover:bg-warning-50'}
                onClick={handleSuspend}
              >
                {user.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Alert banners */}
      {showInviteBanner && (
        <div className="bg-warning-50 border border-warning-100 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-warning-700">
            Invitation envoyée il y a {daysSinceCreation} jours — non acceptée.
          </span>
          <button
            className="text-sm font-medium text-warning-700 hover:underline"
            onClick={() => toast({ type: 'success', title: 'Invitation renvoyée', description: `Email envoyé à ${user.email}.` })}
          >
            Renvoyer l'invitation
          </button>
        </div>
      )}

      {showInactiveBanner && (
        <div className="bg-info-50 border border-info-100 rounded-lg px-4 py-3">
          <span className="text-sm text-info-700">
            Cet utilisateur ne s'est pas connecté depuis {daysSinceLogin} jours.
          </span>
        </div>
      )}

      {showMfaBanner && (
        <div className="bg-danger-50 border border-danger-100 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-danger-700">
            MFA recommandé pour ce niveau de privilège.
          </span>
          <button
            className="text-sm font-medium text-danger-700 hover:underline"
            onClick={() => { updateUser(user.id, { mfaEnabled: true }); toast({ type: 'success', title: 'MFA activé', description: '' }); }}
          >
            Activer
          </button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="informations">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="activite">Activité</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* Tab: Informations */}
        <TabsContent value="informations" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile card */}
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-stone-900">Profil</CardTitle></CardHeader>
              <CardBody className="px-6 pb-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold">
                    {user.initials}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-stone-900">{user.name}</p>
                    <p className="text-sm text-stone-500">{user.function || '—'}</p>
                  </div>
                </div>
                <div className="space-y-3 pt-2 border-t border-stone-100">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-stone-400 flex-shrink-0" />
                    <span className="font-mono text-stone-600">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={14} className="text-stone-400 flex-shrink-0" />
                      <span className="text-stone-600">{user.phone}</span>
                    </div>
                  )}
                  {user.function && (
                    <div className="flex items-center gap-2 text-sm">
                      <User size={14} className="text-stone-400 flex-shrink-0" />
                      <span className="text-stone-600">{user.function}</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Access card */}
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-stone-900">Accès</CardTitle></CardHeader>
              <CardBody className="px-6 pb-6 space-y-4">
                <div>
                  <p className="text-xs font-medium text-stone-500 mb-1">Rôle</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${ROLE_BADGE_CLASS[user.role]}`}>
                    {ROLE_LABEL[user.role]}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-medium text-stone-500 mb-1">Scope assigné</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.scopeIds.map((id) => (
                      <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-xs">
                        <MapPin size={10} />
                        {SCOPE_LABEL[id] ?? id}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-stone-500 mb-1">MFA</p>
                  <div className="flex items-center gap-2">
                    {user.mfaEnabled ? (
                      <>
                        <ShieldCheck size={16} className="text-success" />
                        <span className="text-sm text-success-700 font-medium">Activé</span>
                      </>
                    ) : (
                      <>
                        <ShieldOff size={16} className="text-stone-400" />
                        <span className="text-sm text-stone-500">Non activé</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-100 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-stone-400" />
                    <span className="text-stone-500">Créé le</span>
                    <span className="text-stone-700 ml-auto">{format(user.createdAt, 'dd MMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-stone-400" />
                    <span className="text-stone-500">Dernière connexion</span>
                    <span className="text-stone-700 ml-auto">
                      {user.lastLoginAt
                        ? formatDistanceToNow(user.lastLoginAt, { addSuffix: true, locale: fr })
                        : <span className="text-stone-400 italic">Jamais</span>}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Permissions */}
        <TabsContent value="permissions" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-sm font-semibold text-stone-900">Matrice de permissions</CardTitle>
                {isAdmin && (
                  <div className="flex gap-2">
                    {editingPerms ? (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => setEditingPerms(false)}>Annuler</Button>
                        <Button variant="primary" size="sm" onClick={handleSavePerms}>Sauvegarder</Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { updateUserPermissions(user.id, {}); toast({ type: 'success', title: 'Permissions réinitialisées', description: '' }); }}
                        >
                          Réinitialiser
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => { setLocalPerms(user.permissions); setEditingPerms(true); }}>
                          Modifier les permissions
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardBody className="px-6 pb-6">
              <PermissionMatrix
                permissions={editingPerms ? localPerms : user.permissions}
                mode={editingPerms ? 'editable' : 'readonly'}
                onChange={setLocalPerms}
                rolePreset={user.role}
              />
            </CardBody>
          </Card>
        </TabsContent>

        {/* Tab: Activité */}
        <TabsContent value="activite" className="mt-4 space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Connexions ce mois', value: '14', icon: Activity, color: 'text-primary' },
              { label: 'Dernière connexion', value: user.lastLoginAt ? formatDistanceToNow(user.lastLoginAt, { locale: fr }) : 'Jamais', icon: Calendar, color: 'text-stone-600' },
              { label: 'Actions réalisées', value: '133', icon: BarChart2, color: 'text-success' },
              { label: 'Module le plus utilisé', value: 'Référentiel', icon: MapPin, color: 'text-warning' },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardBody className="px-4 py-4 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-500">{label}</span>
                    <Icon size={16} className={color} />
                  </div>
                  <p className="text-lg font-semibold text-stone-900 leading-tight">{value}</p>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Chart */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-stone-900">Connexions — 30 derniers jours</CardTitle></CardHeader>
            <CardBody className="px-6 pb-6">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716c' }} interval={4} />
                    <YAxis tick={{ fontSize: 11, fill: '#78716c' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="connexions" stroke="#1E5BA8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Top actions */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-stone-900">Top 10 actions</CardTitle></CardHeader>
            <CardBody className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-stone-600">Action</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-stone-600">Module</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-stone-600">Occurrences</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_ACTIONS.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}>
                      <td className="px-4 py-2 text-sm text-stone-800">{row.action}</td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-stone-100 text-stone-600">{row.module}</span>
                      </td>
                      <td className="px-4 py-2 text-sm text-stone-700 text-right font-mono">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </TabsContent>

        {/* Tab: Audit */}
        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-sm font-semibold text-stone-900">Journal d'audit</CardTitle>
                <div className="flex gap-2">
                  {['7j', '30j', '90j', 'Tout'].map((range) => (
                    <button
                      key={range}
                      className="text-xs px-2.5 py-1 rounded-md border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors"
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-stone-600">Horodatage</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-stone-600">Utilisateur</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-stone-600">Action</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-stone-600">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_AUDIT.map((entry) => (
                    <tr key={entry.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="px-4 py-2.5 text-xs font-mono text-stone-500 whitespace-nowrap">
                        {format(entry.ts, 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-stone-700">{entry.actor}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-stone-100 text-stone-700 font-medium">
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-stone-600">{entry.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
