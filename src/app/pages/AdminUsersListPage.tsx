import { useNavigate } from 'react-router';
import { useState, useMemo } from 'react';
import { UserPlus, Mail, Download, ChevronRight, MoreVertical, ShieldCheck, ShieldOff, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { usePermissions } from '../lib/permissions-context';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { UserCreateModal } from '../components/admin/UserCreateModal';
import { ROLE_LABEL, type UserStatus, type Role } from '../types';

const ROLE_BADGE_CLASS: Record<Role, string> = {
  admin: 'bg-danger-100 text-danger-700',
  gestionnaire_national: 'bg-primary-100 text-primary-700',
  gestionnaire_provincial: 'bg-info-100 text-info-700',
  superviseur_district: 'bg-success-100 text-success-700',
  analyste: 'bg-stone-100 text-stone-700',
  agent_terrain: 'bg-warning-100 text-warning-700',
};

const STATUS_CONFIG: Record<UserStatus, { label: string; cls: string }> = {
  active: { label: 'Actif', cls: 'bg-success-100 text-success-700' },
  suspended: { label: 'Suspendu', cls: 'bg-warning-100 text-warning-700' },
  pending_activation: { label: 'En attente', cls: 'bg-info-100 text-info-700' },
  disabled: { label: 'Désactivé', cls: 'bg-stone-100 text-stone-600' },
};

const SCOPE_LABEL: Record<string, string> = {
  national: 'National',
  'prov-lac': 'Lac',
  'prov-kanem': 'Kanem',
  'prov-hadjer-lamis': 'H-Lamis',
  'prov-ndjamena': "N'Djamena",
  'prov-logone-occidental': 'Logone',
  'prov-batha': 'Batha',
  'dist-bol': 'Bol',
  'dist-mao': 'Mao',
  'dist-nokou': 'Nokou',
  'dist-liwa': 'Liwa',
  'dist-massakory': 'Massakory',
  'dist-massaguet': 'Massaguet',
  'dist-dourbali': 'Dourbali',
  'dist-moundou': 'Moundou',
};

function ScopeChips({ scopeIds }: { scopeIds: string[] }) {
  const visible = scopeIds.slice(0, 2);
  const rest = scopeIds.length - 2;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((id) => (
        <span key={id} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-stone-100 text-stone-700">
          {SCOPE_LABEL[id] ?? id}
        </span>
      ))}
      {rest > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-stone-100 text-stone-500">
          +{rest}
        </span>
      )}
    </div>
  );
}

function UserAvatar({ name, initials }: { name: string; initials: string }) {
  return (
    <div
      className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0"
      title={name}
    >
      {initials}
    </div>
  );
}

function formatLastLogin(lastLoginAt: Date | null): string {
  if (!lastLoginAt) return 'Jamais';
  return formatDistanceToNow(lastLoginAt, { addSuffix: true, locale: fr });
}

interface FilterState {
  search: string;
  role: Role | '';
  status: UserStatus | '';
  lastLoginRange: 'week' | 'month' | 'quarter' | 'year' | 'never' | '';
}

export default function AdminUsersListPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { users, updateUser } = usePermissions();

  if (currentUser?.role !== 'admin') {
    toast({ type: 'danger', title: 'Accès non autorisé', description: 'Seuls les administrateurs peuvent accéder à cette page.' });
    navigate('/dashboard');
    return null;
  }

  const [filters, setFilters] = useState<FilterState>({ search: '', role: '', status: '', lastLoginRange: '' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'lastLogin' | 'name'>('lastLogin');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    let result = users.filter((u) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      if (filters.role && u.role !== filters.role) return false;
      if (filters.status && u.status !== filters.status) return false;
      if (filters.lastLoginRange) {
        if (filters.lastLoginRange === 'never' && u.lastLoginAt !== null) return false;
        if (filters.lastLoginRange !== 'never') {
          if (!u.lastLoginAt) return false;
          const days = Math.floor((Date.now() - u.lastLoginAt.getTime()) / 86400000);
          if (filters.lastLoginRange === 'week' && days >= 7) return false;
          if (filters.lastLoginRange === 'month' && (days < 7 || days >= 30)) return false;
          if (filters.lastLoginRange === 'quarter' && (days < 30 || days >= 90)) return false;
          if (filters.lastLoginRange === 'year' && days < 90) return false;
        }
      }
      return true;
    });

    result.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      if (sortBy === 'lastLogin') {
        return (b.lastLoginAt?.getTime() ?? 0) - (a.lastLoginAt?.getTime() ?? 0);
      }
      return a.name.localeCompare(b.name);
    });
    return result;
  }, [users, filters, sortBy]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = useMemo(() => filteredUsers.slice((page - 1) * pageSize, page * pageSize), [filteredUsers, page, pageSize]);

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedUsers.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedUsers.map((u) => u.id)));
  };

  const handleToggle = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const handleSuspend = (userId: string, currentStatus: UserStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    updateUser(userId, { status: newStatus });
    toast({ type: 'success', title: newStatus === 'suspended' ? 'Utilisateur suspendu' : 'Utilisateur réactivé', description: '' });
  };

  const handleDisable = (userId: string) => {
    updateUser(userId, { status: 'disabled' });
    toast({ type: 'success', title: 'Utilisateur désactivé', description: '' });
  };

  const handleResetPwd = (email: string) => {
    toast({ type: 'info', title: 'Email envoyé', description: `Lien de réinitialisation envoyé à ${email}.` });
  };

  const resetFilters = () => {
    setFilters({ search: '', role: '', status: '', lastLoginRange: '' });
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
          <span>Administration</span>
          <ChevronRight size={14} />
          <span className="text-stone-900 font-medium">Utilisateurs</span>
        </div>
        <h1 className="text-stone-900 mb-1">Gestion des utilisateurs</h1>
        <p className="text-stone-600">Gérez les comptes, rôles et permissions de la plateforme.</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap items-center">
        <Button variant="primary" size="md" className="gap-2" onClick={() => setCreateModalOpen(true)}>
          <UserPlus size={16} />
          Nouvel utilisateur
        </Button>
        <Button variant="secondary" size="md" className="gap-2" onClick={() => toast({ type: 'info', title: 'Fonctionnalité disponible prochainement', description: "L'invitation par email sera disponible dans la prochaine version." })}>
          <Mail size={16} />
          Inviter par email
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="md" className="gap-2">
              <Download size={16} />
              Exporter
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => toast({ type: 'success', title: 'Export CSV', description: 'Fichier CSV exporté.' })}>
              CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast({ type: 'success', title: 'Export Excel', description: 'Fichier Excel exporté.' })}>
              Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold text-stone-900">Filtrer</CardTitle>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1">Recherche</label>
              <Input
                placeholder="Nom ou email..."
                value={filters.search}
                onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1">Rôle</label>
              <Select value={filters.role} onValueChange={(v) => { setFilters({ ...filters, role: v as Role | '' }); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Tous les rôles" /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1">Statut</label>
              <Select value={filters.status} onValueChange={(v) => { setFilters({ ...filters, status: v as UserStatus | '' }); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_CONFIG) as UserStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1">Dernière connexion</label>
              <Select value={filters.lastLoginRange} onValueChange={(v) => { setFilters({ ...filters, lastLoginRange: v as any }); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Anytime" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">&lt; 7 jours</SelectItem>
                  <SelectItem value="month">7 – 30 jours</SelectItem>
                  <SelectItem value="quarter">30 – 90 jours</SelectItem>
                  <SelectItem value="year">&gt; 90 jours</SelectItem>
                  <SelectItem value="never">Jamais connecté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(filters.search || filters.role || filters.status || filters.lastLoginRange) && (
            <button onClick={resetFilters} className="mt-3 text-xs text-primary hover:underline">
              Réinitialiser les filtres
            </button>
          )}
        </CardBody>
      </Card>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-primary-800">{selectedIds.size} utilisateur(s) sélectionné(s)</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => {
              selectedIds.forEach(id => {
                const u = users.find(u => u.id === id);
                if (u && u.status === 'active') updateUser(id, { status: 'suspended' });
              });
              toast({ type: 'success', title: 'Utilisateurs suspendus', description: '' });
              setSelectedIds(new Set());
            }}>Suspendre</Button>
            <Button variant="secondary" size="sm" onClick={() => {
              selectedIds.forEach(id => updateUser(id, { status: 'active' }));
              toast({ type: 'success', title: 'Utilisateurs réactivés', description: '' });
              setSelectedIds(new Set());
            }}>Réactiver</Button>
            <Button variant="secondary" size="sm" onClick={() => toast({ type: 'success', title: 'Export', description: `${selectedIds.size} utilisateurs exportés.` })}>
              Exporter
            </Button>
            <Button variant="secondary" size="sm" className="text-danger-700 hover:bg-danger-50" onClick={() => {
              selectedIds.forEach(id => updateUser(id, { status: 'disabled' }));
              toast({ type: 'danger', title: 'Utilisateurs désactivés', description: '' });
              setSelectedIds(new Set());
            }}>Désactiver</Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-4 py-3 text-left w-10">
                    <Checkbox
                      checked={paginatedUsers.length > 0 && selectedIds.size === paginatedUsers.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wide">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wide">Rôle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wide">Scope</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wide">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-wide">Dernière connexion</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-stone-700 uppercase tracking-wide">MFA</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-stone-700 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user, idx) => (
                  <tr
                    key={user.id}
                    className={`border-b border-stone-100 hover:bg-stone-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}`}
                  >
                    <td className="px-4 py-3">
                      <Checkbox checked={selectedIds.has(user.id)} onChange={() => handleToggle(user.id)} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="flex items-center gap-2.5 text-left"
                        onClick={() => navigate(`/admin/utilisateurs/${user.id}`)}
                      >
                        <UserAvatar name={user.name} initials={user.initials} />
                        <div>
                          <div className="font-medium text-stone-900 hover:text-primary transition-colors">{user.name}</div>
                          <div className="text-xs text-stone-500">{user.email}</div>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${ROLE_BADGE_CLASS[user.role]}`}>
                        {ROLE_LABEL[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ScopeChips scopeIds={user.scopeIds} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_CONFIG[user.status].cls}`}>
                        {STATUS_CONFIG[user.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600">
                      {user.lastLoginAt ? (
                        formatLastLogin(user.lastLoginAt)
                      ) : (
                        <span className="text-stone-400 italic">Jamais</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.mfaEnabled ? (
                        <ShieldCheck size={16} className="text-success mx-auto" />
                      ) : (
                        <ShieldOff size={16} className="text-stone-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 hover:bg-stone-200 rounded transition-colors">
                            <MoreVertical size={16} className="text-stone-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/utilisateurs/${user.id}`)}>
                            Voir le détail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/utilisateurs/${user.id}`)}>
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPwd(user.email)}>
                            Réinitialiser MDP
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleSuspend(user.id, user.status)}>
                            {user.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-danger-700 focus:text-danger-700 focus:bg-danger-50"
                            onClick={() => handleDisable(user.id)}
                          >
                            Désactiver
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-stone-400">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-stone-600">
          <span>{filteredUsers.length} utilisateur(s) trouvé(s)</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-20 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>par page</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500">Page {page} / {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</Button>
            <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Suivant</Button>
          </div>
        )}
      </div>

      <UserCreateModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  );
}
