import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Play, Plus, Edit2, Trash2, CheckCircle2,
  AlertCircle, RotateCcw, ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useToast } from '../lib/toast';

// ─── Mock workflow data ───────────────────────────────────────────────────────

type StateType = 'initial' | 'intermediate' | 'final' | 'error';

interface WfState {
  id: string;
  order: number;
  name: string;
  type: StateType;
  actors: string[];
  slHours?: number;
}

interface Transition {
  id: string;
  from: string;
  to: string;
  label: string;
  requiresComment: boolean;
  notifyRoles: string[];
}

interface WorkflowDetail {
  id: string;
  name: string;
  module: string;
  status: 'active' | 'draft' | 'archived';
  description: string;
  states: WfState[];
  transitions: Transition[];
}

const WORKFLOWS: Record<string, WorkflowDetail> = {
  'wf-microplan': {
    id: 'wf-microplan',
    name: 'Validation micro-plans',
    module: 'Planification',
    status: 'active',
    description: 'Circuit complet de validation des micro-plans, du brouillon jusqu\'à l\'exécution terrain.',
    states: [
      { id: 's-draft', order: 1, name: 'Brouillon', type: 'initial', actors: ['planificateur', 'gestionnaire_provincial'] },
      { id: 's-generated', order: 2, name: 'Généré', type: 'intermediate', actors: ['planificateur'], slHours: 24 },
      { id: 's-adjusted', order: 3, name: 'Ajusté', type: 'intermediate', actors: ['planificateur', 'superviseur'], slHours: 24 },
      { id: 's-submitted', order: 4, name: 'Soumis', type: 'intermediate', actors: ['gestionnaire_provincial', 'gestionnaire_national'], slHours: 48 },
      { id: 's-validated', order: 5, name: 'Validé', type: 'intermediate', actors: ['superviseur', 'chef_equipe'] },
      { id: 's-execution', order: 6, name: 'En exécution', type: 'final', actors: [] },
      { id: 's-rejected', order: 0, name: 'Rejeté', type: 'error', actors: [] },
      { id: 's-closed', order: 7, name: 'Clôturé', type: 'final', actors: [] },
    ],
    transitions: [
      { id: 't1', from: 's-draft', to: 's-generated', label: 'Générer', requiresComment: false, notifyRoles: [] },
      { id: 't2', from: 's-generated', to: 's-adjusted', label: 'Ajuster', requiresComment: false, notifyRoles: [] },
      { id: 't3', from: 's-adjusted', to: 's-submitted', label: 'Soumettre', requiresComment: false, notifyRoles: ['gestionnaire_provincial'] },
      { id: 't4', from: 's-submitted', to: 's-validated', label: 'Valider', requiresComment: false, notifyRoles: ['planificateur', 'superviseur'] },
      { id: 't5', from: 's-submitted', to: 's-rejected', label: 'Rejeter', requiresComment: true, notifyRoles: ['planificateur'] },
      { id: 't6', from: 's-validated', to: 's-execution', label: 'Démarrer', requiresComment: false, notifyRoles: ['chef_equipe'] },
      { id: 't7', from: 's-execution', to: 's-closed', label: 'Clôturer', requiresComment: true, notifyRoles: ['gestionnaire_provincial', 'gestionnaire_national'] },
    ],
  },
};

const FALLBACK_DETAIL: WorkflowDetail = {
  id: 'wf-users',
  name: 'Validation utilisateurs',
  module: 'Administration',
  status: 'active',
  description: 'Processus de création et d\'activation des comptes utilisateurs.',
  states: [
    { id: 's-pending', order: 1, name: 'Inscription', type: 'initial', actors: ['admin'] },
    { id: 's-review', order: 2, name: 'En revue', type: 'intermediate', actors: ['admin'], slHours: 48 },
    { id: 's-active', order: 3, name: 'Actif', type: 'final', actors: [] },
    { id: 's-disabled', order: 0, name: 'Désactivé', type: 'error', actors: [] },
  ],
  transitions: [
    { id: 't1', from: 's-pending', to: 's-review', label: 'Soumettre', requiresComment: false, notifyRoles: ['admin'] },
    { id: 't2', from: 's-review', to: 's-active', label: 'Activer', requiresComment: false, notifyRoles: [] },
    { id: 't3', from: 's-review', to: 's-disabled', label: 'Refuser', requiresComment: true, notifyRoles: [] },
  ],
};

// ─── State type display ────────────────────────────────────────────────────────

const STATE_TYPE_COLOR: Record<StateType, string> = {
  initial: '#1E5BA8', intermediate: '#78716C', final: '#16A34A', error: '#B91C1C',
};
const STATE_TYPE_LABEL: Record<StateType, string> = {
  initial: 'Initial', intermediate: 'Intermédiaire', final: 'Final', error: 'Erreur',
};

// ─── SVG state diagram ────────────────────────────────────────────────────────

function StateDiagram({ wf, activeStateId }: { wf: WorkflowDetail; activeStateId: string | null }) {
  const mainStates = wf.states.filter((s) => s.type !== 'error').sort((a, b) => a.order - b.order);
  const errorStates = wf.states.filter((s) => s.type === 'error');

  const NODE_W = 100;
  const NODE_H = 40;
  const H_GAP = 40;
  const ROW_Y = 60;
  const SVG_W = mainStates.length * (NODE_W + H_GAP) + H_GAP;
  const SVG_H = errorStates.length > 0 ? 180 : 120;

  const xOf = (idx: number) => H_GAP + idx * (NODE_W + H_GAP);

  return (
    <div className="overflow-x-auto pb-2">
      <svg width={SVG_W} height={SVG_H} style={{ display: 'block', minWidth: '100%' }}>
        {/* Arrows between main states */}
        {mainStates.map((state, i) => {
          if (i === mainStates.length - 1) return null;
          const x1 = xOf(i) + NODE_W;
          const x2 = xOf(i + 1);
          const y = ROW_Y + NODE_H / 2;
          const transition = wf.transitions.find((t) => t.from === state.id && t.to === mainStates[i + 1].id);
          return (
            <g key={`arr-${i}`}>
              <line x1={x1} y1={y} x2={x2 - 8} y2={y} stroke="#C7C3BF" strokeWidth={1.5} markerEnd="url(#arrow)" />
              {transition && (
                <text x={(x1 + x2) / 2} y={y - 8} textAnchor="middle" fontSize={9} fill="#78716C">
                  {transition.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Arrow to error state from submitted */}
        {errorStates.map((es, ei) => {
          const srcState = wf.states.find((s) => wf.transitions.some((t) => t.from === s.id && t.to === es.id));
          const srcIdx = srcState ? mainStates.indexOf(srcState) : -1;
          if (srcIdx < 0) return null;
          const x1 = xOf(srcIdx) + NODE_W / 2;
          const y1 = ROW_Y + NODE_H;
          const x2 = xOf(srcIdx) + NODE_W / 2;
          const y2 = ROW_Y + NODE_H + 40;
          const ex = xOf(srcIdx);
          const ey = y2 + 5;
          const t = wf.transitions.find((tr) => tr.from === srcState?.id && tr.to === es.id);
          return (
            <g key={`err-${ei}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2 - 8} stroke="#FECACA" strokeWidth={1.5} strokeDasharray="4 2" markerEnd="url(#arrow-red)" />
              {t && <text x={x1 + 5} y={(y1 + y2) / 2} fontSize={9} fill="#DC2626">{t.label}</text>}
              <rect x={ex} y={ey} width={NODE_W} height={NODE_H} rx={6} fill="#FEF2F2" stroke="#FECACA" strokeWidth={1.5} />
              <text x={ex + NODE_W / 2} y={ey + NODE_H / 2 - 4} textAnchor="middle" fontSize={10} fontWeight="600" fill="#B91C1C">{es.name}</text>
              <text x={ex + NODE_W / 2} y={ey + NODE_H / 2 + 9} textAnchor="middle" fontSize={9} fill="#DC2626">Erreur</text>
            </g>
          );
        })}

        {/* Main state nodes */}
        {mainStates.map((state, i) => {
          const x = xOf(i);
          const y = ROW_Y;
          const color = STATE_TYPE_COLOR[state.type];
          const isActive = state.id === activeStateId;
          return (
            <g key={state.id}>
              <rect
                x={x} y={y} width={NODE_W} height={NODE_H} rx={8}
                fill={isActive ? color : `${color}18`}
                stroke={isActive ? color : `${color}55`}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <text x={x + NODE_W / 2} y={y + NODE_H / 2 - 4} textAnchor="middle" fontSize={10} fontWeight="600"
                fill={isActive ? 'white' : color}>
                {state.name}
              </text>
              <text x={x + NODE_W / 2} y={y + NODE_H / 2 + 9} textAnchor="middle" fontSize={9}
                fill={isActive ? 'rgba(255,255,255,0.8)' : '#78716C'}>
                {STATE_TYPE_LABEL[state.type]}
              </text>
            </g>
          );
        })}

        {/* Arrow markers */}
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#C7C3BF" />
          </marker>
          <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#FECACA" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

// ─── Simulation modal ─────────────────────────────────────────────────────────

function SimulationModal({ wf, onClose }: { wf: WorkflowDetail; onClose: () => void }) {
  const initialState = wf.states.find((s) => s.type === 'initial')!;
  const [currentId, setCurrentId] = useState(initialState?.id ?? wf.states[0].id);
  const [path, setPath] = useState<string[]>([initialState?.id ?? wf.states[0].id]);

  const currentState = wf.states.find((s) => s.id === currentId);
  const availableTransitions = wf.transitions.filter((t) => t.from === currentId);

  const follow = (t: Transition) => {
    setCurrentId(t.to);
    setPath((p) => [...p, t.to]);
  };

  const reset = () => {
    setCurrentId(initialState?.id ?? wf.states[0].id);
    setPath([initialState?.id ?? wf.states[0].id]);
  };

  const getStateName = (id: string) => wf.states.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <Play size={16} className="text-primary" /> Simulation du workflow
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-lg leading-none">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Current state */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            <div className="text-xs text-stone-500 mb-1">État actuel</div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: STATE_TYPE_COLOR[currentState?.type ?? 'intermediate'] }}
              />
              <span className="font-semibold text-stone-900">{currentState?.name ?? '—'}</span>
              <Badge variant="secondary" className="text-xs">{STATE_TYPE_LABEL[currentState?.type ?? 'intermediate']}</Badge>
            </div>
          </div>

          {/* Path */}
          <div>
            <div className="text-xs text-stone-500 mb-2">Chemin parcouru</div>
            <div className="flex flex-wrap items-center gap-1">
              {path.map((id, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-xs bg-stone-100 px-2 py-0.5 rounded-full text-stone-700 font-medium">{getStateName(id)}</span>
                  {i < path.length - 1 && <ChevronRight size={12} className="text-stone-400" />}
                </span>
              ))}
            </div>
          </div>

          {/* Available transitions */}
          <div>
            <div className="text-xs text-stone-500 mb-2">Transitions disponibles</div>
            {availableTransitions.length === 0 ? (
              <div className="text-sm text-stone-400 italic">Aucune transition — état terminal.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableTransitions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => follow(t)}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1"
                  >
                    {t.label} <ChevronRight size={12} />
                    {t.requiresComment && <span className="text-xs opacity-70">(commentaire requis)</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-stone-200 flex justify-between">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 font-medium"
          >
            <RotateCcw size={14} /> Réinitialiser
          </button>
          <Button onClick={onClose} variant="secondary" size="sm">Fermer</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminWorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const wf = WORKFLOWS[id ?? ''] ?? FALLBACK_DETAIL;

  const [activeTab, setActiveTab] = useState<'diagram' | 'states' | 'transitions'>('diagram');
  const [simulOpen, setSimulOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [activeStateId, setActiveStateId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (activateOpen) { setActivateOpen(false); return; }
      if (simulOpen) { setSimulOpen(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [simulOpen, activateOpen]);

  const handleActivate = () => {
    setActivateOpen(false);
    toast({ type: 'success', title: 'Workflow activé', message: `"${wf.name}" est maintenant actif.` });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
            <button onClick={() => navigate('/admin/workflow')} className="hover:text-stone-700">Administration</button>
            <span>/</span>
            <button onClick={() => navigate('/admin/workflow')} className="hover:text-stone-700">Workflow Engine</button>
            <span>/</span>
            <span className="text-stone-600 font-medium">{wf.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin/workflow')} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500">
              <ArrowLeft size={16} />
            </button>
            <h1 className="text-xl font-bold text-stone-900">{wf.name}</h1>
            <Badge variant={wf.status === 'active' ? 'success' : wf.status === 'draft' ? 'warning' : 'secondary'}>
              {wf.status === 'active' ? 'Actif' : wf.status === 'draft' ? 'Brouillon' : 'Archivé'}
            </Badge>
          </div>
          <p className="text-sm text-stone-500 mt-1 ml-9">{wf.description}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setSimulOpen(true)} variant="secondary" size="sm" className="gap-1.5">
            <Play size={14} /> Tester le workflow
          </Button>
          {wf.status === 'draft' && (
            <Button onClick={() => setActivateOpen(true)} size="sm" className="gap-1.5">
              <CheckCircle2 size={14} /> Activer ce workflow
            </Button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-stone-100 rounded-lg p-1 gap-1 w-fit">
        {(['diagram', 'states', 'transitions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === t ? 'bg-white text-primary shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
          >
            {t === 'diagram' ? 'Diagramme' : t === 'states' ? 'États' : 'Transitions'}
          </button>
        ))}
      </div>

      {/* Diagram */}
      {activeTab === 'diagram' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
          <div className="px-4 py-3 border-b border-stone-100">
            <span className="font-semibold text-stone-800 text-sm">Diagramme d'états</span>
            <span className="text-xs text-stone-400 ml-2">Cliquez sur un état pour le mettre en surbrillance</span>
          </div>
          <div className="p-5">
            <StateDiagram wf={wf} activeStateId={activeStateId} />
          </div>
          <div className="px-4 py-3 border-t border-stone-100 flex flex-wrap gap-3">
            {Object.entries(STATE_TYPE_COLOR).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: color }} />
                <span className="text-xs text-stone-600">{STATE_TYPE_LABEL[type as StateType]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* States table */}
      {activeTab === 'states' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
          <div className="px-4 py-3 border-b border-stone-100 flex justify-between items-center">
            <span className="font-semibold text-stone-800 text-sm">Configuration des états ({wf.states.length})</span>
            <Button size="sm" className="gap-1.5"><Plus size={13} /> Ajouter un état</Button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                {['Ordre', 'Nom', 'Type', 'Acteurs autorisés', 'SLA', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-stone-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wf.states.sort((a, b) => a.order - b.order).map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setActiveStateId(s.id === activeStateId ? null : s.id)}
                  className="border-b border-stone-100 hover:bg-stone-50 cursor-pointer transition-colors"
                  style={{ background: s.id === activeStateId ? '#EFF6FF' : undefined }}
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-stone-100 px-1.5 py-0.5 rounded">{s.order}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-stone-900">{s.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: STATE_TYPE_COLOR[s.type] }}>
                      {STATE_TYPE_LABEL[s.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.actors.length === 0
                        ? <span className="text-xs text-stone-400">—</span>
                        : s.actors.map((a) => (
                          <span key={a} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{a}</span>
                        ))
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-stone-600">{s.slHours ? `${s.slHours}h` : '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded hover:bg-stone-200 text-stone-500 hover:text-primary">
                        <Edit2 size={12} />
                      </button>
                      {s.type !== 'initial' && (
                        <button className="p-1.5 rounded hover:bg-red-50 text-stone-500 hover:text-red-600">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transitions table */}
      {activeTab === 'transitions' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
          <div className="px-4 py-3 border-b border-stone-100 flex justify-between items-center">
            <span className="font-semibold text-stone-800 text-sm">Transitions ({wf.transitions.length})</span>
            <Button size="sm" className="gap-1.5"><Plus size={13} /> Ajouter une transition</Button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                {['De', 'Vers', 'Label', 'Commentaire', 'Notifier', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-stone-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wf.transitions.map((t) => {
                const fromState = wf.states.find((s) => s.id === t.from);
                const toState = wf.states.find((s) => s.id === t.to);
                return (
                  <tr key={t.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: `${STATE_TYPE_COLOR[fromState?.type ?? 'intermediate']}20`, color: STATE_TYPE_COLOR[fromState?.type ?? 'intermediate'] }}>
                        {fromState?.name ?? t.from}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: `${STATE_TYPE_COLOR[toState?.type ?? 'intermediate']}20`, color: STATE_TYPE_COLOR[toState?.type ?? 'intermediate'] }}>
                        {toState?.name ?? t.to}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-stone-800">{t.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {t.requiresComment
                        ? <span className="text-xs text-amber-600 font-medium flex items-center gap-1"><AlertCircle size={11} /> Obligatoire</span>
                        : <span className="text-xs text-stone-400">Non</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {t.notifyRoles.length === 0
                          ? <span className="text-xs text-stone-400">—</span>
                          : t.notifyRoles.map((r) => <span key={r} className="text-xs bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">{r}</span>)
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded hover:bg-stone-200 text-stone-500 hover:text-primary"><Edit2 size={12} /></button>
                        <button className="p-1.5 rounded hover:bg-red-50 text-stone-500 hover:text-red-600"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Simulation modal */}
      {simulOpen && <SimulationModal wf={wf} onClose={() => setSimulOpen(false)} />}

      {/* Activation confirm modal */}
      {activateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-stone-900 mb-2">Activer ce workflow ?</h3>
            <p className="text-sm text-stone-600 mb-5">
              Ce workflow remplacera le workflow actif pour le module <strong>{wf.module}</strong>.
              Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setActivateOpen(false)}>Annuler</Button>
              <Button onClick={handleActivate}>Confirmer l'activation</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
