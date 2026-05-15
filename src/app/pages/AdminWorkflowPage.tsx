import { useState } from 'react';
import { useNavigate } from 'react-router';
import { GitBranch, Plus, Upload, Download, Eye, Archive, CheckCircle2, FileEdit } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { DataTable } from '../components/data/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

// ─── Mock data ────────────────────────────────────────────────────────────────

type WorkflowStatus = 'active' | 'draft' | 'archived';

interface Workflow {
  id: string;
  name: string;
  module: string;
  statesCount: number;
  status: WorkflowStatus;
  lastModified: string;
  lastModifiedBy: string;
  description: string;
}

const MOCK_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-microplan',
    name: 'Validation micro-plans',
    module: 'Planification',
    statesCount: 6,
    status: 'active',
    lastModified: '10 mai 2026',
    lastModifiedBy: 'Admin système',
    description: 'Circuit de validation des micro-plans du brouillon jusqu\'à l\'exécution.',
  },
  {
    id: 'wf-users',
    name: 'Validation utilisateurs',
    module: 'Administration',
    statesCount: 4,
    status: 'active',
    lastModified: '2 avril 2026',
    lastModifiedBy: 'Admin système',
    description: 'Processus de création et d\'activation des comptes utilisateurs.',
  },
  {
    id: 'wf-report',
    name: 'Signalement terrain',
    module: 'Supervision',
    statesCount: 5,
    status: 'active',
    lastModified: '15 mars 2026',
    lastModifiedBy: 'Chef de zone Lac',
    description: 'Workflow de traitement des signalements et incidents terrain.',
  },
  {
    id: 'wf-allocation',
    name: 'Allocation ressources',
    module: 'Logistique',
    statesCount: 5,
    status: 'draft',
    lastModified: '5 mai 2026',
    lastModifiedBy: 'Gestionnaire national',
    description: 'Nouveau circuit d\'approbation des allocations de vaccins.',
  },
  {
    id: 'wf-nomad',
    name: 'Opportunités nomades',
    module: 'Nomades',
    statesCount: 4,
    status: 'archived',
    lastModified: '1 jan 2026',
    lastModifiedBy: 'Admin système',
    description: 'Ancien workflow remplacé par la version 2.',
  },
];

const STATUS_LABEL: Record<WorkflowStatus, string> = {
  active: 'Actif', draft: 'Brouillon', archived: 'Archivé',
};
const STATUS_COLOR: Record<WorkflowStatus, string> = {
  active: 'success', draft: 'warning', archived: 'stone',
};
const MODULE_COLOR: Record<string, string> = {
  Planification: '#1E5BA8',
  Administration: '#9333EA',
  Supervision: '#EA580C',
  Logistique: '#CA8A04',
  Nomades: '#E11D74',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminWorkflowPage() {
  const navigate = useNavigate();
  const [data] = useState(MOCK_WORKFLOWS);

  const columns: ColumnDef<Workflow, any>[] = [
    {
      accessorKey: 'name',
      header: 'Nom',
      cell: (info) => {
        const w = info.row.original;
        return (
          <div>
            <div className="font-medium text-stone-900">{w.name}</div>
            <div className="text-xs text-stone-500 mt-0.5">{w.description.slice(0, 55)}…</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'module',
      header: 'Module',
      cell: (info) => {
        const m = info.getValue() as string;
        return (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
            style={{ background: MODULE_COLOR[m] ?? '#78716C' }}
          >
            {m}
          </span>
        );
      },
    },
    {
      accessorKey: 'statesCount',
      header: 'États',
      cell: (info) => (
        <span className="text-sm font-semibold text-stone-700">{info.getValue() as number}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: (info) => {
        const s = info.getValue() as WorkflowStatus;
        return <Badge variant={STATUS_COLOR[s] as any}>{STATUS_LABEL[s]}</Badge>;
      },
    },
    {
      id: 'modified',
      header: 'Dernière modification',
      accessorFn: (w) => w.lastModified,
      cell: (info) => {
        const w = info.row.original;
        return (
          <div>
            <div className="text-xs text-stone-700">{w.lastModified}</div>
            <div className="text-[11px] text-stone-400">par {w.lastModifiedBy}</div>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: (info) => {
        const w = info.row.original;
        return (
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/admin/workflow/${w.id}`); }}
              className="p-1.5 rounded-md hover:bg-stone-100 text-stone-600 hover:text-primary transition-colors"
              title="Voir détail"
            >
              <Eye size={14} />
            </button>
            {w.status !== 'archived' && (
              <button
                className="p-1.5 rounded-md hover:bg-stone-100 text-stone-600 hover:text-amber-600 transition-colors"
                title="Modifier"
              >
                <FileEdit size={14} />
              </button>
            )}
            {w.status === 'active' && (
              <button
                className="p-1.5 rounded-md hover:bg-stone-100 text-stone-600 hover:text-green-600 transition-colors"
                title="Actif"
              >
                <CheckCircle2 size={14} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const active = data.filter((w) => w.status === 'active').length;
  const drafts = data.filter((w) => w.status === 'draft').length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
            <span>Administration</span>
            <span>/</span>
            <span className="text-stone-600 font-medium">Workflow Engine</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <GitBranch size={22} className="text-primary" />
            Workflow Engine
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Upload size={14} /> Importer
          </Button>
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Download size={14} /> Exporter
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus size={14} /> Nouveau workflow
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Workflows actifs', value: active, color: '#16A34A', icon: <CheckCircle2 size={18} /> },
          { label: 'En brouillon', value: drafts, color: '#CA8A04', icon: <FileEdit size={18} /> },
          { label: 'Archivés', value: data.filter((w) => w.status === 'archived').length, color: '#78716C', icon: <Archive size={18} /> },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-3 shadow-sm">
            <div className="rounded-lg p-2.5" style={{ background: `${k.color}18` }}>
              <div style={{ color: k.color }}>{k.icon}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-stone-900">{k.value}</div>
              <div className="text-xs text-stone-500">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
        <div className="px-4 py-3 border-b border-stone-100">
          <span className="font-semibold text-stone-800 text-sm">Workflows configurés ({data.length})</span>
        </div>
        <DataTable
          data={data}
          columns={columns}
          getRowKey={(w) => w.id}
          onRowClick={(w) => navigate(`/admin/workflow/${w.id}`)}
        />
      </div>
    </div>
  );
}
