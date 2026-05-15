import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Download, FileText, AlertTriangle, CheckCircle2, Users, Wifi,
  WifiOff, MapPin, Tent, ChevronRight, Radio,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import { NomadOpportunityCreateModal } from '../components/nomads/NomadOpportunityCreateModal';
import { mockMissions, MISSION_STATUS_COLOR, MISSION_STATUS_LABEL, type Mission } from '../data/mockMissions';
import { useSimulatedTracking } from '../lib/useSimulatedTracking';
import type { NomadOpportunity } from '../data/mockNomadOpportunities';

// ─── Signal dot ───────────────────────────────────────────────────────────────

function SignalDot({ signal }: { signal: 'good' | 'weak' | 'lost' }) {
  if (signal === 'good') return (
    <span className="inline-flex items-center gap-1 text-[11px] text-success">
      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" /> Bon
    </span>
  );
  if (signal === 'weak') return (
    <span className="inline-flex items-center gap-1 text-[11px] text-warning">
      <span className="w-1.5 h-1.5 rounded-full bg-warning animate-[ping_1s_ease-in-out_infinite] inline-block" /> Faible
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-danger">
      <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block" /> Perdu
    </span>
  );
}

// ─── Mission card ──────────────────────────────────────────────────────────────

function MissionCard({ mission, onSelect, selected }: { mission: Mission; onSelect: () => void; selected: boolean }) {
  const navigate = useNavigate();
  const position = useSimulatedTracking(mission.id);
  const signal = position?.signalStrength ?? 'lost';

  const unresolvedAlerts = mission.geofenceAlerts.filter((a) => !a.resolved).length;
  const hasIssue = mission.status === 'issue';
  const progress = mission.actual.villagesVisited.length / Math.max(mission.planned.villages.length, 1);

  return (
    <div
      className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${
        selected ? 'border-primary shadow-md shadow-primary/10' : hasIssue ? 'border-danger/40 bg-danger/5' : 'border-stone-200 hover:border-stone-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasIssue ? 'bg-danger' : 'bg-success animate-pulse'}`} />
            <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
              {MISSION_STATUS_LABEL[mission.status]}
            </span>
          </div>
          <div className="text-sm font-semibold text-stone-800 mt-0.5">{mission.teamName}</div>
          <div className="text-[11px] text-stone-400">{mission.id}</div>
        </div>
        {hasIssue && <AlertTriangle size={16} className="text-danger flex-shrink-0" />}
        {unresolvedAlerts > 0 && !hasIssue && (
          <span className="text-[10px] bg-warning/10 text-warning-700 font-medium px-1.5 py-0.5 rounded">
            {unresolvedAlerts} alerte{unresolvedAlerts > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {position && (
        <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-2">
          <MapPin size={11} className="text-primary" />
          <span>{position.lat.toFixed(3)}, {position.lng.toFixed(3)}</span>
          <span className="ml-auto"><SignalDot signal={signal} /></span>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
          <span>{mission.actual.villagesVisited.length}/{mission.planned.villages.length} villages</span>
          <span>{mission.actual.childrenVaccinated} enfants</span>
        </div>
        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${hasIssue ? 'bg-danger' : 'bg-primary'}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className={`font-medium ${mission.conformanceScore >= 80 ? 'text-success' : mission.conformanceScore >= 60 ? 'text-warning' : 'text-danger'}`}>
          Conformité {mission.conformanceScore}%
        </span>
        {unresolvedAlerts > 0 && (
          <span className="text-warning">{unresolvedAlerts} géofence</span>
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <Button size="sm" variant="outline" className="flex-1 text-xs h-7"
          onClick={(e) => { e.stopPropagation(); navigate(`/supervision/missions/${mission.id}`); }}>
          Suivre <ChevronRight size={12} />
        </Button>
        <Button size="sm" variant="ghost" className="text-xs h-7 px-2"
          onClick={(e) => { e.stopPropagation(); }}>
          Contacter
        </Button>
      </div>
    </div>
  );
}

// ─── Map panel ─────────────────────────────────────────────────────────────────

function MapPanel({ missions }: { missions: Mission[] }) {
  return (
    <div className="bg-stone-100 rounded-xl border border-stone-200 h-full min-h-[500px] relative overflow-hidden flex items-center justify-center">
      <div className="text-center text-stone-400 pointer-events-none">
        <MapPin size={28} className="mx-auto mb-2" />
        <div className="text-sm font-medium">Carte supervision temps réel</div>
        <div className="text-xs mt-1 text-stone-300">Markers équipes — mise à jour 30s</div>
      </div>

      {/* Simulated team markers */}
      {missions.filter((m) => m.routePositions.length > 0).map((mission, i) => {
        const pos = mission.routePositions[mission.currentPositionIndex];
        const x = 12 + (i * 17) % 76;
        const y = 15 + (i * 13) % 65;
        const isIssue = mission.status === 'issue';
        const hasNomad = mission.fieldReports.some((r) => r.type === 'nomad_contact');
        return (
          <div
            key={mission.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div
              title={`${mission.teamName}\n${pos?.lat?.toFixed(3)}, ${pos?.lng?.toFixed(3)}`}
              className={`w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-pointer
                ${isIssue ? 'bg-danger' : 'bg-primary'} hover:scale-110 transition-transform`}
            >
              <Users size={13} className="text-white" />
            </div>
            {isIssue && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-danger rounded-full border-2 border-white flex items-center justify-center">
                <AlertTriangle size={8} className="text-white" />
              </div>
            )}
            {hasNomad && !isIssue && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-ai rounded-full border-2 border-white flex items-center justify-center">
                <Tent size={8} className="text-white" />
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/90 rounded-lg border border-stone-200 px-3 py-2 space-y-1">
        {[
          { color: 'bg-primary', label: 'En mission' },
          { color: 'bg-danger', label: 'Incident' },
          { color: 'bg-ai rounded-full', label: 'Contact nomade' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2 text-[10px] text-stone-600">
            <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function SupervisionPage() {
  const navigate = useNavigate();
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [nomadModalOpen, setNomadModalOpen] = useState(false);
  const [nomadPrefilled, setNomadPrefilled] = useState<Partial<NomadOpportunity> | undefined>();
  const [sourceReportId, setSourceReportId] = useState<string | undefined>();

  const inProgressMissions = useMemo(
    () => mockMissions.filter((m) => m.status === 'in_progress' || m.status === 'issue'),
    [],
  );

  const kpis = useMemo(() => {
    const inProgress = mockMissions.filter((m) => m.status === 'in_progress').length;
    const activeAlerts = mockMissions.reduce(
      (sum, m) => sum + m.geofenceAlerts.filter((a) => !a.resolved).length, 0,
    );
    const issueCount = mockMissions.filter((m) => m.status === 'issue').length;
    const avgConformance = Math.round(
      mockMissions.filter((m) => m.status === 'in_progress').reduce((s, m) => s + m.conformanceScore, 0) /
      Math.max(mockMissions.filter((m) => m.status === 'in_progress').length, 1),
    );
    const today = new Date();
    const todayVisits = mockMissions.flatMap((m) => m.fieldReports).filter(
      (r) => r.type === 'completion' && r.reportedAt.toDateString() === today.toDateString(),
    ).length;
    return { inProgress, activeAlerts: activeAlerts + issueCount, avgConformance, todayVisits };
  }, []);

  const criticalIssue = useMemo(
    () => mockMissions.find((m) => m.status === 'issue' && m.fieldReports.some((r) => r.issue?.severity === 'critical')),
    [],
  );

  const untreatedNomadReport = useMemo(() => {
    for (const m of mockMissions) {
      const r = m.fieldReports.find((fr) => fr.type === 'nomad_contact' && !fr.nomadContact?.opportunityCreated);
      if (r) return { mission: m, report: r };
    }
    return null;
  }, []);

  const openNomadModal = (mission: Mission, reportId: string, prefill?: Partial<NomadOpportunity>) => {
    setNomadPrefilled(prefill);
    setSourceReportId(reportId);
    setNomadModalOpen(true);
  };

  return (
    <div className="space-y-4 pb-6 h-full flex flex-col">
      {/* Header */}
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbPage>Supervision</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-xl font-bold text-stone-900">Supervision terrain</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/supervision/rapport-journalier')}>
              <FileText size={14} /> Rapport journalier
            </Button>
            <Button variant="outline" size="sm">
              <Download size={14} /> Exporter
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 flex-shrink-0">
        {[
          { label: 'Équipes en mission', value: kpis.inProgress, icon: Radio, color: 'text-primary' },
          { label: 'Alertes actives', value: kpis.activeAlerts, icon: AlertTriangle, color: kpis.activeAlerts > 0 ? 'text-danger' : 'text-stone-400', danger: kpis.activeAlerts > 0 },
          { label: 'Conformité moyenne', value: `${kpis.avgConformance}%`, icon: CheckCircle2, color: kpis.avgConformance >= 80 ? 'text-success' : 'text-warning' },
          { label: "Villages visités aujourd'hui", value: kpis.todayVisits, icon: MapPin, color: 'text-stone-600' },
        ].map((k) => (
          <div key={k.label} className={`bg-white rounded-xl border p-4 ${k.danger ? 'border-danger/30 bg-danger/5' : 'border-stone-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-500">{k.label}</span>
              <k.icon size={16} className={k.color} />
            </div>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Banners */}
      {criticalIssue && (
        <div className="flex items-center gap-3 bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 flex-shrink-0">
          <AlertTriangle size={15} className="text-danger flex-shrink-0" />
          <span className="text-sm text-danger-700 flex-1">
            <strong>ALERTE :</strong> {criticalIssue.teamName} signale un incident critique — {criticalIssue.fieldReports.find((r) => r.issue?.severity === 'critical')?.issue?.type?.replace(/_/g, ' ')}.
          </span>
          <button
            className="text-sm font-medium text-danger underline flex items-center gap-1 whitespace-nowrap"
            onClick={() => navigate(`/supervision/missions/${criticalIssue.id}`)}
          >
            Voir <ChevronRight size={14} />
          </button>
        </div>
      )}

      {untreatedNomadReport && (
        <div className="flex items-center gap-3 bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 flex-shrink-0">
          <Tent size={15} className="text-warning flex-shrink-0" />
          <span className="text-sm text-warning-700 flex-1">
            <strong>{untreatedNomadReport.mission.teamName}</strong> a signalé un contact nomade non documenté.
          </span>
          <button
            className="text-sm font-medium text-warning-700 underline flex items-center gap-1 whitespace-nowrap"
            onClick={() => openNomadModal(
              untreatedNomadReport.mission,
              untreatedNomadReport.report.id,
              untreatedNomadReport.report.nomadContact ? {
                groupType: untreatedNomadReport.report.nomadContact.groupType,
                estimatedPopulation: untreatedNomadReport.report.nomadContact.estimatedPopulation,
                estimatedChildren: untreatedNomadReport.report.nomadContact.estimatedChildren,
                location: untreatedNomadReport.report.nomadContact.location,
              } : undefined,
            )}
          >
            Créer l'opportunité <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Split layout */}
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Left — mission cards */}
        <div className="space-y-3 overflow-y-auto pr-1">
          {inProgressMissions.map((m) => (
            <MissionCard
              key={m.id}
              mission={m}
              selected={selectedMissionId === m.id}
              onSelect={() => setSelectedMissionId(m.id === selectedMissionId ? null : m.id)}
            />
          ))}
          {inProgressMissions.length === 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-sm text-stone-400">
              Aucune équipe en mission actuellement
            </div>
          )}

          {/* Planned missions */}
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide pt-1">
            À venir ({mockMissions.filter((m) => m.status === 'planned').length})
          </div>
          {mockMissions.filter((m) => m.status === 'planned').map((m) => (
            <div key={m.id} className="bg-white border border-stone-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-stone-700">{m.teamName}</div>
                <div className="text-[11px] text-stone-400">
                  Départ {m.startDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} · {m.planned.villages.length} villages
                </div>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${MISSION_STATUS_COLOR['planned']}`}>
                {MISSION_STATUS_LABEL['planned']}
              </span>
            </div>
          ))}
        </div>

        {/* Right — map */}
        <MapPanel missions={inProgressMissions} />
      </div>

      <NomadOpportunityCreateModal
        isOpen={nomadModalOpen}
        onClose={() => setNomadModalOpen(false)}
        prefilled={nomadPrefilled}
        sourceFieldReportId={sourceReportId}
      />
    </div>
  );
}
