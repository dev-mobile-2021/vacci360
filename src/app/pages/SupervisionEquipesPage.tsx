import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { MapPin, Signal, Users, ChevronRight, Phone, MessageSquare, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import { Modal } from '../components/ui/Modal';
import { mockMissions, MISSION_STATUS_LABEL, MISSION_STATUS_COLOR, type Mission } from '../data/mockMissions';
import { useSimulatedTracking } from '../lib/useSimulatedTracking';
import { useToast } from '../lib/toast';

function SignalDot({ strength }: { strength: 'good' | 'weak' | 'lost' | null }) {
  if (!strength || strength === 'lost') return <span className="w-2 h-2 rounded-full bg-danger inline-block" title="Signal perdu" />;
  if (strength === 'weak') return (
    <span className="relative inline-flex w-2 h-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
      <span className="relative inline-flex rounded-full w-2 h-2 bg-warning" />
    </span>
  );
  return (
    <span className="relative inline-flex w-2 h-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
      <span className="relative inline-flex rounded-full w-2 h-2 bg-success" />
    </span>
  );
}

function MissionTeamCard({ mission, onContact }: { mission: Mission; onContact: (m: Mission) => void }) {
  const navigate = useNavigate();
  const position = useSimulatedTracking(mission.id);
  const signal = position?.signalStrength ?? null;

  const progressPct = mission.actual.daysCompleted > 0
    ? Math.round((mission.actual.daysCompleted / mission.planned.totalDays) * 100)
    : 0;

  const statusColor = MISSION_STATUS_COLOR[mission.status];
  const statusLabel = MISSION_STATUS_LABEL[mission.status];

  return (
    <div className={`bg-white rounded-xl border p-4 ${mission.status === 'issue' ? 'border-danger/30' : 'border-stone-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-stone-900">{mission.teamName}</span>
            {mission.status === 'in_progress' && <SignalDot strength={signal} />}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">{mission.teamId} · {mission.id}</div>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>{statusLabel}</span>
      </div>

      {(mission.status === 'in_progress' || mission.status === 'issue') && position && (
        <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-2 bg-stone-50 rounded-lg px-2.5 py-1.5">
          <MapPin size={11} className="text-primary shrink-0" />
          <span className="truncate">{position.lat.toFixed(4)}°N, {position.lng.toFixed(4)}°E</span>
          <span className="ml-auto shrink-0 flex items-center gap-1">
            <Signal size={10} className={signal === 'good' ? 'text-success' : signal === 'weak' ? 'text-warning' : 'text-danger'} />
            {signal === 'good' ? 'Bon' : signal === 'weak' ? 'Faible' : 'Perdu'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="bg-stone-50 rounded-lg p-2">
          <div className="text-[10px] text-stone-400 mb-0.5">Villages</div>
          <div className="text-xs font-bold text-stone-700">
            <span className="text-success">{mission.actual.villagesVisited.length}</span>
            <span className="text-stone-300 mx-0.5">/</span>
            <span>{mission.planned.villages.length}</span>
          </div>
        </div>
        <div className="bg-stone-50 rounded-lg p-2">
          <div className="text-[10px] text-stone-400 mb-0.5">Enfants</div>
          <div className="text-xs font-bold text-stone-700">
            <span className="text-success">{mission.actual.childrenVaccinated}</span>
            <span className="text-stone-300 mx-0.5">/</span>
            <span>{mission.planned.targetChildren}</span>
          </div>
        </div>
        <div className="bg-stone-50 rounded-lg p-2">
          <div className="text-[10px] text-stone-400 mb-0.5">Jours</div>
          <div className="text-xs font-bold text-stone-700">
            <span className="text-primary">{mission.actual.daysCompleted}</span>
            <span className="text-stone-300 mx-0.5">/</span>
            <span>{mission.planned.totalDays}</span>
          </div>
        </div>
      </div>

      {mission.status === 'in_progress' && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
            <span>Progression mission</span>
            <span className="font-semibold text-primary">{progressPct}%</span>
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {mission.status === 'issue' && (
        <div className="bg-danger/5 border border-danger/20 rounded-lg px-2.5 py-1.5 mb-3 flex items-center gap-1.5">
          <AlertTriangle size={11} className="text-danger shrink-0" />
          <span className="text-[11px] text-danger">
            {mission.fieldReports.find((r) => r.type === 'issue')?.issue?.description ?? 'Incident actif'}
          </span>
        </div>
      )}

      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" className="flex-1 text-[11px]" onClick={() => onContact(mission)}>
          <Phone size={11} /> Contacter
        </Button>
        <Button size="sm" variant="outline" className="flex-1 text-[11px]" onClick={() => navigate(`/supervision/missions/${mission.id}`)}>
          <ChevronRight size={11} /> Voir mission
        </Button>
      </div>
    </div>
  );
}

interface ContactModalProps {
  mission: Mission | null;
  onClose: () => void;
}

function ContactModal({ mission, onClose }: ContactModalProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');

  if (!mission) return null;

  return (
    <Modal open={!!mission} onClose={onClose} title={`Contacter — ${mission.teamName}`} width={440}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" onClick={() => {
            toast({ type: 'success', title: 'Message envoyé', description: `Message transmis à ${mission.teamName}.` });
            onClose();
          }}>
            <MessageSquare size={13} /> Envoyer
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-stone-50 rounded-lg p-3 text-sm">
          <div className="font-medium text-stone-800">{mission.teamName}</div>
          <div className="text-xs text-stone-400 mt-0.5">{mission.teamId} · {MISSION_STATUS_LABEL[mission.status]}</div>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Canal de contact</label>
          <div className="grid grid-cols-3 gap-2">
            {['Radio HF', 'SMS', 'WhatsApp'].map((c) => (
              <label key={c} className="flex items-center gap-1.5 text-xs text-stone-700 bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 cursor-pointer hover:bg-stone-100">
                <input type="radio" name="canal" value={c} defaultChecked={c === 'Radio HF'} className="accent-primary" />
                {c}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Message</label>
          <textarea
            className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            rows={4}
            placeholder="Saisir le message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="urgent" className="accent-danger rounded" />
          <label htmlFor="urgent" className="text-xs text-stone-600">Marquer comme urgent</label>
        </div>
      </div>
    </Modal>
  );
}

export default function SupervisionEquipesPage() {
  const { toast } = useToast();
  const [contactMission, setContactMission] = useState<Mission | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('active');

  const missions = useMemo(() => {
    const statuses = statusFilter === 'active'
      ? ['in_progress', 'issue']
      : statusFilter === 'all'
        ? ['in_progress', 'issue', 'planned', 'completed']
        : [statusFilter];
    return mockMissions.filter((m) => statuses.includes(m.status));
  }, [statusFilter]);

  const kpis = useMemo(() => {
    const active = mockMissions.filter((m) => m.status === 'in_progress').length;
    const issues = mockMissions.filter((m) => m.status === 'issue').length;
    const planned = mockMissions.filter((m) => m.status === 'planned').length;
    const completed = mockMissions.filter((m) => m.status === 'completed').length;
    return { active, issues, planned, completed };
  }, []);

  return (
    <div className="space-y-5 pb-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/supervision">Supervision</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Équipes</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-xl font-bold text-stone-900">Suivi des équipes</h1>
          <Button variant="outline" size="sm" onClick={() => toast({ type: 'info', title: 'Diffusion', description: 'Message diffusé à toutes les équipes actives.' })}>
            <MessageSquare size={14} /> Diffuser un message
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'En cours', value: kpis.active, color: 'text-primary', icon: Clock },
          { label: 'En incident', value: kpis.issues, color: 'text-danger', icon: AlertTriangle, danger: kpis.issues > 0 },
          { label: 'Planifiées', value: kpis.planned, color: 'text-stone-600', icon: Users },
          { label: 'Terminées', value: kpis.completed, color: 'text-success', icon: CheckCircle2 },
        ].map((k) => (
          <div key={k.label} className={`bg-white rounded-xl border p-4 ${k.danger ? 'border-danger/30 bg-danger/5' : 'border-stone-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-500">{k.label}</span>
              <k.icon size={15} className={k.color} />
            </div>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {[
          { key: 'active', label: 'Actives' },
          { key: 'in_progress', label: 'En cours' },
          { key: 'issue', label: 'Incidents' },
          { key: 'planned', label: 'Planifiées' },
          { key: 'all', label: 'Toutes' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              statusFilter === f.key
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-stone-600 border-stone-200 hover:border-primary/40'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-stone-400">{missions.length} équipe(s)</span>
      </div>

      {/* Team cards grid */}
      {missions.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-10 text-center text-sm text-stone-400">
          Aucune équipe dans ce filtre
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          {missions.map((m) => (
            <MissionTeamCard key={m.id} mission={m} onContact={setContactMission} />
          ))}
        </div>
      )}

      <ContactModal mission={contactMission} onClose={() => setContactMission(null)} />
    </div>
  );
}
