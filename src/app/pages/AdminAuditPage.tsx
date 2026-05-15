import { useState, useMemo } from 'react';
import { FileSearch, Download, Settings2, CheckCircle2, XCircle, ChevronRight, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { DataTable } from '../components/data/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

// ─── Mock data ────────────────────────────────────────────────────────────────

type ActionType = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'VALIDATE';
type AuditModule = 'Référentiel' | 'Planification' | 'Supervision' | 'Logistique' | 'Admin' | 'Auth';
type AuditResult = 'success' | 'failure';

interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userAvatar: string;
  module: AuditModule;
  action: ActionType;
  entity: string;
  details: string;
  ip: string;
  result: AuditResult;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  errorMessage?: string;
}

function mkDate(daysAgo: number, h: number, m: number) {
  const d = new Date(2026, 4, 14 - daysAgo, h, m, Math.floor(Math.random() * 60));
  return d;
}

const MOCK_LOGS: AuditLog[] = [
  { id: 'a1', timestamp: mkDate(0, 8, 12), userId: 'u1', userName: 'Amadou Djerou', userAvatar: 'AD', module: 'Planification', action: 'VALIDATE', entity: 'Micro-plan #2026-015', details: 'Validation du micro-plan campagne Lac — Mai 2026', ip: '196.28.14.52', result: 'success', before: { status: 'submitted' }, after: { status: 'validated' } },
  { id: 'a2', timestamp: mkDate(0, 8, 45), userId: 'u2', userName: 'Mariam Oumar', userAvatar: 'MO', module: 'Auth', action: 'LOGIN', entity: 'Session', details: 'Connexion depuis Chrome 124 / Windows', ip: '196.28.14.88', result: 'success' },
  { id: 'a3', timestamp: mkDate(0, 9, 3), userId: 'u3', userName: 'Hassan Mahamat', userAvatar: 'HM', module: 'Logistique', action: 'UPDATE', entity: 'Stock BCG lot #BCG-2026-04', details: 'Mise à jour quantité disponible', ip: '41.203.68.15', result: 'success', before: { quantityAvailable: 4500 }, after: { quantityAvailable: 3800 } },
  { id: 'a4', timestamp: mkDate(0, 9, 28), userId: 'u4', userName: 'Fatimé Ali', userAvatar: 'FA', module: 'Supervision', action: 'CREATE', entity: 'Alerte #ALT-042', details: 'Création alerte géofence équipe Bol-3', ip: '196.28.15.11', result: 'success' },
  { id: 'a5', timestamp: mkDate(0, 10, 5), userId: 'u1', userName: 'Amadou Djerou', userAvatar: 'AD', module: 'Admin', action: 'UPDATE', entity: 'Utilisateur #u8', details: 'Modification rôle utilisateur Khadidja Nadjingar', ip: '196.28.14.52', result: 'success', before: { role: 'superviseur' }, after: { role: 'gestionnaire_provincial' } },
  { id: 'a6', timestamp: mkDate(0, 10, 41), userId: 'u5', userName: 'Ibrahim Seid', userAvatar: 'IS', module: 'Auth', action: 'LOGIN', entity: 'Session', details: 'Tentative de connexion échouée (mot de passe incorrect)', ip: '41.66.12.203', result: 'failure', errorMessage: 'Invalid credentials — tentative 2/5' },
  { id: 'a7', timestamp: mkDate(0, 11, 15), userId: 'u2', userName: 'Mariam Oumar', userAvatar: 'MO', module: 'Planification', action: 'EXPORT', entity: 'Rapport couverture mai 2026', details: 'Export PDF rapport mensuel Province du Lac', ip: '196.28.14.88', result: 'success' },
  { id: 'a8', timestamp: mkDate(1, 14, 30), userId: 'u6', userName: 'Zara Adoum', userAvatar: 'ZA', module: 'Référentiel', action: 'CREATE', entity: 'Village #v-lac-441', details: 'Ajout village Kaya-Toumour dans canton Bol Rural', ip: '196.28.16.5', result: 'success' },
  { id: 'a9', timestamp: mkDate(1, 15, 20), userId: 'u3', userName: 'Hassan Mahamat', userAvatar: 'HM', module: 'Logistique', action: 'DELETE', entity: 'Lot expiré #VPO-2025-11', details: 'Suppression lot VPO expiré (date: 2025-11-30)', ip: '41.203.68.15', result: 'success' },
  { id: 'a10', timestamp: mkDate(1, 16, 45), userId: 'u7', userName: 'Ousmane Djimet', userAvatar: 'OD', module: 'Supervision', action: 'UPDATE', entity: 'Mission #MSN-2026-031', details: 'Mise à jour statut mission', ip: '196.28.20.3', result: 'success', before: { status: 'planned' }, after: { status: 'in_progress' } },
  { id: 'a11', timestamp: mkDate(2, 9, 0), userId: 'u1', userName: 'Amadou Djerou', userAvatar: 'AD', module: 'Admin', action: 'DELETE', entity: 'Utilisateur #u12', details: 'Désactivation compte suspendu Moussa Bichara', ip: '196.28.14.52', result: 'failure', errorMessage: 'Permission denied — cannot delete admin user' },
  { id: 'a12', timestamp: mkDate(2, 11, 22), userId: 'u4', userName: 'Fatimé Ali', userAvatar: 'FA', module: 'Planification', action: 'CREATE', entity: 'Micro-plan #2026-016', details: 'Création nouveau micro-plan Province Kanem', ip: '196.28.15.11', result: 'success' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MODULE_COLOR: Record<AuditModule, string> = {
  Référentiel: '#16A34A', Planification: '#1E5BA8', Supervision: '#EA580C',
  Logistique: '#CA8A04', Admin: '#9333EA', Auth: '#78716C',
};
const ACTION_COLOR: Record<ActionType, string> = {
  CREATE: '#16A34A', READ: '#78716C', UPDATE: '#CA8A04', DELETE: '#DC2626',
  LOGIN: '#1E5BA8', EXPORT: '#9333EA', VALIDATE: '#E11D74',
};

function formatTs(d: Date) {
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).replace(',', '');
}

// ─── Diff view ─────────────────────────────────────────────────────────────────

function DiffView({ before, after }: { before?: Record<string, unknown>; after?: Record<string, unknown> }) {
  if (!before && !after) return null;
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];
  return (
    <div className="font-mono text-xs rounded-lg overflow-hidden border border-stone-200">
      {keys.map((k) => {
        const bv = before?.[k];
        const av = after?.[k];
        const changed = JSON.stringify(bv) !== JSON.stringify(av);
        return (
          <div key={k}>
            {bv !== undefined && (
              <div className="flex gap-2 px-3 py-1 bg-red-50 text-red-700">
                <span className="text-red-400 select-none">−</span>
                <span className="text-stone-500">{k}:</span>
                <span>{JSON.stringify(bv)}</span>
              </div>
            )}
            {av !== undefined && changed && (
              <div className="flex gap-2 px-3 py-1 bg-green-50 text-green-700">
                <span className="text-green-400 select-none">+</span>
                <span className="text-stone-500">{k}:</span>
                <span>{JSON.stringify(av)}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Detail drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-bold text-stone-900 text-sm">Détail de l'action</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Main info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-stone-400 mb-0.5">Horodatage</div>
              <div className="font-mono text-xs text-stone-800">{formatTs(log.timestamp)}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-0.5">Résultat</div>
              <div className="flex items-center gap-1">
                {log.result === 'success'
                  ? <><CheckCircle2 size={13} className="text-green-600" /><span className="text-green-700 text-xs font-medium">Succès</span></>
                  : <><XCircle size={13} className="text-red-600" /><span className="text-red-700 text-xs font-medium">Échec</span></>
                }
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-0.5">Utilisateur</div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">{log.userAvatar}</div>
                <span className="text-xs font-medium text-stone-800">{log.userName}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-0.5">Adresse IP</div>
              <div className="font-mono text-xs text-stone-600">{log.ip}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-0.5">Module</div>
              <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold" style={{ background: MODULE_COLOR[log.module] }}>{log.module}</span>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-0.5">Action</div>
              <span className="text-xs px-2 py-0.5 rounded font-semibold text-white" style={{ background: ACTION_COLOR[log.action] }}>{log.action}</span>
            </div>
          </div>

          {/* Entity */}
          <div>
            <div className="text-xs text-stone-400 mb-1">Entité concernée</div>
            <div className="text-sm font-medium text-stone-800">{log.entity}</div>
          </div>

          {/* Details */}
          <div>
            <div className="text-xs text-stone-400 mb-1">Description</div>
            <div className="text-sm text-stone-700 bg-stone-50 rounded-lg px-3 py-2">{log.details}</div>
          </div>

          {/* Error */}
          {log.errorMessage && (
            <div>
              <div className="text-xs text-stone-400 mb-1">Message d'erreur</div>
              <div className="text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 font-mono">{log.errorMessage}</div>
            </div>
          )}

          {/* Diff */}
          {(log.before || log.after) && (
            <div>
              <div className="text-xs text-stone-400 mb-1">Modifications (avant / après)</div>
              <DiffView before={log.before} after={log.after} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const ALL_MODULES: AuditModule[] = ['Référentiel', 'Planification', 'Supervision', 'Logistique', 'Admin', 'Auth'];
const ALL_ACTIONS: ActionType[] = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', 'VALIDATE'];

export default function AdminAuditPage() {
  const [moduleFilter, setModuleFilter] = useState<AuditModule[]>([]);
  const [actionFilter, setActionFilter] = useState<ActionType[]>([]);
  const [resultFilter, setResultFilter] = useState<'' | 'success' | 'failure'>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const logs = useMemo(() => {
    let data = MOCK_LOGS;
    if (moduleFilter.length) data = data.filter((l) => moduleFilter.includes(l.module));
    if (actionFilter.length) data = data.filter((l) => actionFilter.includes(l.action));
    if (resultFilter) data = data.filter((l) => l.result === resultFilter);
    return data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [moduleFilter, actionFilter, resultFilter]);

  const today = MOCK_LOGS.filter((l) => {
    const now = new Date(2026, 4, 14);
    return l.timestamp >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const failures = today.filter((l) => l.result === 'failure');
  const userCounts = today.reduce<Record<string, number>>((acc, l) => {
    acc[l.userName] = (acc[l.userName] ?? 0) + 1; return acc;
  }, {});
  const topUser = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0];
  const modCounts = today.reduce<Record<string, number>>((acc, l) => {
    acc[l.module] = (acc[l.module] ?? 0) + 1; return acc;
  }, {});
  const topMod = Object.entries(modCounts).sort((a, b) => b[1] - a[1])[0];

  const toggleModule = (m: AuditModule) =>
    setModuleFilter((p) => p.includes(m) ? p.filter((x) => x !== m) : [...p, m]);
  const toggleAction = (a: ActionType) =>
    setActionFilter((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a]);

  const columns: ColumnDef<AuditLog, any>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Horodatage',
      cell: (info) => (
        <span className="font-mono text-[11px] text-stone-600 whitespace-nowrap">{formatTs(info.getValue() as Date)}</span>
      ),
    },
    {
      id: 'user',
      header: 'Utilisateur',
      accessorFn: (l) => l.userName,
      cell: (info) => {
        const l = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">{l.userAvatar}</div>
            <span className="text-xs font-medium text-stone-800">{l.userName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'module',
      header: 'Module',
      cell: (info) => {
        const m = info.getValue() as AuditModule;
        return <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-semibold" style={{ background: MODULE_COLOR[m] }}>{m}</span>;
      },
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: (info) => {
        const a = info.getValue() as ActionType;
        return <span className="text-[10px] px-2 py-0.5 rounded font-bold text-white" style={{ background: ACTION_COLOR[a] }}>{a}</span>;
      },
    },
    {
      accessorKey: 'entity',
      header: 'Entité',
      cell: (info) => <span className="text-xs text-stone-700">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'details',
      header: 'Détails',
      cell: (info) => (
        <span className="text-xs text-stone-500 max-w-[200px] block truncate" title={info.getValue() as string}>
          {info.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'ip',
      header: 'IP',
      cell: (info) => <span className="font-mono text-[10px] text-stone-500">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'result',
      header: 'Résultat',
      cell: (info) => {
        const r = info.getValue() as AuditResult;
        return r === 'success'
          ? <CheckCircle2 size={15} className="text-green-600" />
          : <XCircle size={15} className="text-red-600" />;
      },
    },
    {
      id: 'action-btn',
      header: '',
      cell: (info) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedLog(info.row.original); }}
          className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-primary"
        >
          <ChevronRight size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
            <span>Administration</span><span>/</span>
            <span className="text-stone-600 font-medium">Audit</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <FileSearch size={22} className="text-primary" /> Logs d'audit
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Settings2 size={14} /> Configurer rétention
          </Button>
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Download size={14} /> Exporter
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Actions aujourd'hui", value: today.length, color: '#1E5BA8' },
          { label: 'Échecs', value: `${failures.length} (${today.length ? Math.round(failures.length / today.length * 100) : 0}%)`, color: '#DC2626' },
          { label: 'Utilisateur le + actif', value: topUser?.[0]?.split(' ')[0] ?? '—', color: '#9333EA' },
          { label: 'Module le + sollicité', value: topMod?.[0] ?? '—', color: '#CA8A04' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
            <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-stone-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm space-y-3">
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Filtres</div>
        <div className="flex flex-wrap gap-3">
          {/* Modules */}
          <div>
            <div className="text-xs text-stone-400 mb-1.5">Module</div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_MODULES.map((m) => (
                <button
                  key={m}
                  onClick={() => toggleModule(m)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                    moduleFilter.includes(m) ? 'text-white border-transparent' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}
                  style={moduleFilter.includes(m) ? { background: MODULE_COLOR[m] } : {}}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="text-xs text-stone-400 mb-1.5">Type d'action</div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_ACTIONS.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAction(a)}
                  className={`text-xs px-2.5 py-1 rounded font-bold border transition-colors ${
                    actionFilter.includes(a) ? 'text-white border-transparent' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}
                  style={actionFilter.includes(a) ? { background: ACTION_COLOR[a] } : {}}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          <div>
            <div className="text-xs text-stone-400 mb-1.5">Résultat</div>
            <div className="flex gap-1.5">
              {[{ v: '' as const, label: 'Tous' }, { v: 'success' as const, label: '✅ Succès' }, { v: 'failure' as const, label: '❌ Échec' }].map(({ v, label }) => (
                <button
                  key={v || 'all'}
                  onClick={() => setResultFilter(v)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                    resultFilter === v ? 'bg-stone-700 text-white border-transparent' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear */}
          {(moduleFilter.length > 0 || actionFilter.length > 0 || resultFilter) && (
            <button
              onClick={() => { setModuleFilter([]); setActionFilter([]); setResultFilter(''); }}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium self-end pb-0.5"
            >
              <X size={12} /> Effacer les filtres
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
          <span className="font-semibold text-stone-800 text-sm">Journaux d'activité ({logs.length})</span>
          <span className="text-xs text-stone-400">Cliquez sur une ligne pour le détail</span>
        </div>
        <DataTable
          data={logs}
          columns={columns}
          getRowKey={(l) => l.id}
          onRowClick={setSelectedLog}
          pageSize={15}
        />
      </div>

      {/* Drawer */}
      {selectedLog && <DetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
