import { useNavigate } from 'react-router';
import { useState, useMemo } from 'react';
import { UserPlus, Mail, Download, ChevronRight, MoreVertical } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { usePermissions } from '../lib/permissions-context';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { UserCreateModal } from '../components/admin/UserCreateModal';
import { ROLE_LABEL, type User, type UserStatus, type Role } from '../types';

interface FilterState {
  search: string;
  roles: Role[];
  statuses: UserStatus[];
  mfaEnabled?: boolean;
  lastLoginRange?: 'week' | 'month' | 'quarter' | 'year' | 'never';
}

const STATUS_LABELS: Record<UserStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'stone' }> = {
  active: { label: 'Actif', tone: 'success' },
  suspended: { label: 'Suspendu', tone: 'warning' },
  pending_activation: { label: 'En attente', tone: 'stone' },
  disabled: { label: 'Désactivé', tone: 'danger' },
};

const DAYS_RANGES = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
} as const;

function getLastLoginLabel(lastLoginAt: Date | null): string {
  if (!lastLoginAt) return 'Jamais';
  const days = Math.floor((Date.now() - lastLoginAt.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days}j`;
  if (days < 30) return `${Math.floor(days / 7)}s`;
  if (days < 365) return `${Math.floor(days / 30)}m`;
  return `${Math.floor(days / 365)}a`;
}

function matchesLastLoginRange(lastLoginAt: Date | null, range: string): boolean {
  if (!lastLoginAt) return range === 'never';
  const days = Math.floor((Date.now() - lastLoginAt.getTime()) / (1000 * 60 * 60 * 24));
  const dayLimit = DAYS_RANGES[range as keyof typeof DAYS_RANGES];
  if (range === 'week') return days < 7;
  if (range === 'month') return days >= 7 && days < 30;
  if (range === 'quarter') return days >= 30 && days < 90;
  if (range === 'year') return days >= 90 && days < 365;
  return false;
}

export default function AdminUsersListPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const { users } = usePermissions();

  // Guard: only admins can access
  if (currentUser?.role !== 'admin') {
    addToast({
      type: 'danger',
      title: 'Accès refusé',
      description: 'Seuls les administrateurs peuvent accéder à cette page.',
    });
    navigate('/dashboard');
    return null;
  }

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    roles: [],
    statuses: [],
  });

  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'lastLogin' | 'name'>('lastLogin');
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const pageSize = 25;

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let result = users.filter((u) => {
      // Search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) {
          return false;
        }
      }

      // Roles filter
      if (filters.roles.length > 0 && !filters.roles.includes(u.role)) {
        return false;
      }

      // Statuses filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(u.status)) {
        return false;
      }

      // MFA filter
      if (filters.mfaEnabled !== undefined && u.mfaEnabled !== filters.mfaEnabled) {
        return false;
      }

      // Last login range filter
      if (filters.lastLoginRange && !matchesLastLoginRange(u.lastLoginAt, filters.lastLoginRange)) {
        return false;
      }

      return true;
    });

    // Sort: Active first, then by selected criteria
    result.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;

      if (sortBy === 'lastLogin') {
        const aTime = a.lastLoginAt?.getTime() ?? 0;
        const bTime = b.lastLoginAt?.getTime() ?? 0;
        return bTime - aTime;
      }

      return a.name.localeCompare(b.name);
    });

    return result;
  }, [users, filters, sortBy]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const handleSelectAll = () => {
    if (selectedUserIds.size === paginatedUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(paginatedUsers.map((u) => u.id)));
    }
  };

  const handleToggleUser = (userId: string) => {
    const updated = new Set(selectedUserIds);
    if (updated.has(userId)) {
      updated.delete(userId);
    } else {
      updated.add(userId);
    }
    setSelectedUserIds(updated);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-stone-600 mb-3">
          <span>Administration</span>
          <ChevronRight size={16} />
          <span className="text-stone-900 font-medium">Utilisateurs</span>
        </div>
        <h1 className="text-stone-900 mb-2">Gestion des utilisateurs</h1>
        <p className="text-stone-600">{filteredUsers.length} utilisateur(s) trouvé(s)</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="primary" size="md" className="gap-2" onClick={() => setCreateModalOpen(true)}>
          <UserPlus size={18} />
          Nouvel utilisateur
        </Button>
        <Button variant="secondary" size="md" className="gap-2">
          <Mail size={18} />
          Inviter par email
        </Button>
        <Button variant="secondary" size="md" className="gap-2">
          <Download size={18} />
          Exporter
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtrer</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium text-stone-900 block mb-2">
                Recherche
              </label>
              <Input
                type="text"
                placeholder="Nom ou email..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setPage(1);
                }}
              />
            </div>

            {/* Roles */}
            <div>
              <label className="text-sm font-medium text-stone-900 block mb-2">
                Rôles
              </label>
              <Select
                value={filters.roles.join(',')}
                onValueChange={(v) => {
                  setFilters({
                    ...filters,
                    roles: v ? (v.split(',') as Role[]) : [],
                  });
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les rôles</SelectItem>
                  {(Object.keys(ROLE_LABEL) as Role[]).map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABEL[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Statuses */}
            <div>
              <label className="text-sm font-medium text-stone-900 block mb-2">
                Statut
              </label>
              <Select
                value={filters.statuses.join(',')}
                onValueChange={(v) => {
                  setFilters({
                    ...filters,
                    statuses: v ? (v.split(',') as UserStatus[]) : [],
                  });
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  {(Object.keys(STATUS_LABELS) as UserStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Last Login */}
            <div>
              <label className="text-sm font-medium text-stone-900 block mb-2">
                Dernière connexion
              </label>
              <Select
                value={filters.lastLoginRange || ''}
                onValueChange={(v) => {
                  setFilters({
                    ...filters,
                    lastLoginRange: v as any,
                  });
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Anytime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Anytime</SelectItem>
                  <SelectItem value="week">&lt; 7 jours</SelectItem>
                  <SelectItem value="month">7-30 jours</SelectItem>
                  <SelectItem value="quarter">30-90 jours</SelectItem>
                  <SelectItem value="year">&gt; 90 jours</SelectItem>
                  <SelectItem value="never">Jamais</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Bulk Actions */}
      {selectedUserIds.size > 0 && (
        <div className="bg-info-50 border border-info text-info-900 p-4 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">{selectedUserIds.size} utilisateur(s) sélectionné(s)</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              Suspendre
            </Button>
            <Button variant="secondary" size="sm">
              Réactiver
            </Button>
            <Button variant="secondary" size="sm">
              Exporter
            </Button>
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
                  <th className="px-4 py-3 text-left">
                    <Checkbox
                      checked={
                        paginatedUsers.length > 0 && selectedUserIds.size === paginatedUsers.length
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900">Utilisateur</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900">Rôle</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900">
                    Dernière connexion
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-stone-900">MFA</th>
                  <th className="px-4 py-3 text-center font-semibold text-stone-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user, idx) => (
                  <tr key={user.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedUserIds.has(user.id)}
                        onChange={() => handleToggleUser(user.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-stone-900">{user.name}</div>
                        <div className="text-sm text-stone-600">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="primary">{ROLE_LABEL[user.role]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_LABELS[user.status].tone}>
                        {STATUS_LABELS[user.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600">
                      {getLastLoginLabel(user.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.mfaEnabled ? (
                        <div className="text-success">🔒</div>
                      ) : (
                        <div className="text-stone-400">-</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1 hover:bg-stone-200 rounded">
                        <MoreVertical size={18} className="text-stone-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-stone-600">
            Page {page} sur {totalPages} ({filteredUsers.length} au total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Précédent
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <UserCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
}
