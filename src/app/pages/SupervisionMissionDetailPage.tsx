import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  AlertTriangle, CheckCircle2, XCircle, MapPin, Tent,
  Clock, PhoneCall, Flag, Square, ChevronRight, User,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../lib/toast';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import { NomadOpportunityCreateModal } from '../components/nomads/NomadOpportunityCreateModal';
import { mockMissions, MISSION_STATUS_LABEL, MISSION_STATUS_COLOR, type FieldReport } from '../data/mockMissions';
import { useSimulatedTracking } from '../lib/useSimulatedTracking';
import type { NomadOpportunity } from '../data/mockNomadOpportunities';

const TABS = [
  { key: 'realtime', label: 'Suivi temps réel' },
  { key: 'conformance', label: 'Conformité' },
  { key: 'reports', label: 'Rapports terrain' },
  { key: 'geofence', label: 'Géofence' },
  { key: 'history', label: 'Historique' },
] as const;
type TabKey = typeof TABS[number]['key'];

function SignalDot({ signal }: { signal: 'good' | 'weak' | 'lost' }) {
  if (signal === 'good') return <span className="inline-flex items-center gap-1 text-[11px] text-success"><span className="w-2 h-2 rounded-full bg-success animate-pulse inline-block" /> Bon signal</span>;
  if (signal === 'weak') return <span className="inline-flex items-center gap-1 text-[11px] text-warning"><span className="w-2 h-2 rounded-full bg-warning animate-[ping_1s_ease-in-out_infinite] inline-block" /> Signal faible</span>;
  return <span className="inline-flex items-center gap-1 text-[11px] text-danger"><span className="w-2 h-2 rounded-full bg-danger inline-block" /> Signal perdu</span>;
}

function FieldReportCard({ report, onCreateOpportunity }: {
  report: FieldReport;
  onCreateOpportunity?: (report: FieldReport) => void;
}) {
  const typeConfig = {
    arrival: { icon: MapPin, color: 'text-primary', bg: 'bg-primary/5 border-primary/10', label: 'Arrivée' },
    departure: { icon: MapPin, color: 'text-stone-500', bg: 'bg-stone-50 border-stone-200', label: 'Départ' },
    completion: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/5 border-success/10', label: 'Vaccination complète' },
    issue: { icon: AlertTriangle, color: report.issue?.severity === 'critical' ? 'text-danger' : 'text-warning', bg: report.issue?.severity === 'critical' ? 'bg-danger/5 border-danger/20' : 'bg-warning/5 border-warning/20', label: 'Incident' },
    nomad_contact: { icon: Tent, color: 'text-ai-600', bg: 'bg-ai-50 border-l-4 border-l-ai border border-ai/10', label: 'Contact nomade' },
  }[report.type];

  const Icon = typeConfig.icon;

  return (
    <div className={`rounded-lg p-3 ${typeConfig.bg}`}>
      <div className="flex items-start gap-2.5">
        <Icon size={14} className={`${typeConfig.color} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-semibold text-stone-700">{typeConfig.label} — {report.villageName}</span>
            <span className="text-[10px] text-stone-400">
              {report.reportedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="text-[11px] text-stone-500">Par {report.reportedBy}</div>

          {report.vaccinations && report.vaccinations.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {report.vaccinations.map((v) => (
                <span key={v.antigen} className="text-[10px] bg-success/10 text-success-700 px-1.5 py-0.5 rounded font-medium">
                  {v.antigen} : {v.dosesGiven} doses · {v.children} enfants
                </span>
              ))}
            </div>
          )}

          {report.issue && (
            <div className="mt-1.5 text-xs text-stone-700">{report.issue.description}</div>
          )}

          {report.type === 'nomad_contact' && report.nomadContact && (
            <div className="mt-2 space-y-1.5">
              <div className="text-xs text-stone-700">
                <span className="font-medium">{report.nomadContact.groupType === 'seasonal_nomad' ? 'Nomade saisonnier' : report.nomadContact.groupType === 'displaced' ? 'Déplacés' : 'Réfugiés'}</span>
                {' · '}{report.nomadContact.estimatedPopulation} personnes · {report.nomadContact.estimatedChildren} enfants
              </div>
              <div className="text-xs text-stone-600">{report.nomadContact.location.description}</div>
              <div className="text-[11px] text-stone-400">Fenêtre : {report.nomadContact.windowAvailable}</div>
              {!report.nomadContact.opportunityCreated ? (
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center gap-1 text-[10px] bg-warning/10 text-warning-700 px-1.5 py-0.5 rounded font-medium">
                    <AlertTriangle size={9} /> Non documenté
                  </span>
                  {onCreateOpportunity && (
                    <button
                      className="text-[11px] font-semibold bg-ai text-white px-2.5 py-1 rounded hover:bg-ai/90 transition-colors"
                      onClick={() => onCreateOpportunity(report)}
                    >
                      Créer l'opportunité nomade
                    </button>
                  )}
                </div>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-success font-medium">
                  <CheckCircle2 size={11} /> Opportunité créée
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SupervisionMissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('realtime');
  const [nomadModalOpen, setNomadModalOpen] = useState(false);
  const [nomadPrefilled, setNomadPrefilled] = useState<Partial<NomadOpportunity> | undefined>();
  const [sourceReportId, setSourceReportId] = useState<string | undefined>();
  const [skipReasons, setSkipReasons] = useState<Record<string, string>>({});

  const mission = mockMissions.find((m) => m.id === id) ?? mockMissions[0];
  const position = useSimulatedTracking(mission.id);

  const hasUntreatedNomad = mission.fieldReports.some(
    (r) => r.type === 'nomad_contact' && !r.nomadContact?.opportunityCreated,
  );

  const openNomadModal = (report: FieldReport) => {
    if (report.nomadContact) {
      setNomadPrefilled({
        groupType: report.nomadContact.groupType,
        estimatedPopulation: report.nomadContact.estimatedPopulation,
        estimatedChildren: report.nomadContact.estimatedChildren,
        location: report.nomadContact.location,
      });
    }
    setSourceReportId(report.id);
    setNomadModalOpen(true);
  };

  // ─── Tab content ─────────────────────────────────────────────────────────────

  const renderRealtime = () => (
    <div className="grid grid-cols-5 gap-4">
      {/* Left panel */}
      <div className="col-span-2 space-y-4">
        {/* Position */}
        <div className="bg-stone-50 rounded-lg p-3 space-y-2">
          <div className="text-xs font-semibold text-stone-700 mb-1">Position actuelle</div>
          {position ? (
            <>
              <div className="text-xs text-stone-600">{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</div>
              <SignalDot signal={position.signalStrength} />
              <div className="text-[11px] text-stone-400">
                {position.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                {' · '}{position.speed} km/h
              </div>
            </>
          ) : (
            <div className="text-xs text-stone-400">Signal perdu</div>
          )}
        </div>

        {/* Village timeline today */}
        <div>
          <div className="text-xs font-semibold text-stone-700 mb-2">Mission du jour</div>
          <div className="space-y-1.5">
            {mission.planned.villages.slice(0, 4).map((v) => {
              const visited = mission.actual.villagesVisited.includes(v.id);
              const skipped = mission.actual.villagesSkipped.some((s) => s.villageId === v.id);
              return (
                <div key={v.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${
                  visited ? 'bg-success/5 border border-success/10' :
                  skipped ? 'bg-danger/5 border border-danger/10' :
                  'bg-stone-50 border border-stone-100'
                }`}>
                  {visited ? <CheckCircle2 size={12} className="text-success flex-shrink-0" /> :
                   skipped ? <XCircle size={12} className="text-danger flex-shrink-0" /> :
                   <Clock size={12} className="text-stone-300 flex-shrink-0" />}
                  <span className="font-medium text-stone-700">{v.plannedArrival}</span>
                  <span className="text-stone-600">{v.name}</span>
                  <span className="text-stone-400 ml-auto">{v.targetChildren} enf.</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Villages', value: `${mission.actual.villagesVisited.length}/${mission.planned.villages.length}` },
            { label: 'Enfants', value: mission.actual.childrenVaccinated },
            { label: 'Distance', value: `${mission.actual.distanceKm} km` },
            { label: 'Jours', value: `${mission.actual.daysCompleted}/${mission.planned.totalDays}` },
          ].map((k) => (
            <div key={k.label} className="bg-stone-50 rounded-lg p-2.5 text-center">
              <div className="text-xs font-bold text-stone-800">{k.value}</div>
              <div className="text-[10px] text-stone-400">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right map */}
      <div className="col-span-3 bg-stone-100 rounded-xl border border-stone-200 min-h-[320px] flex items-center justify-center">
        <div className="text-center text-stone-400">
          <MapPin size={24} className="mx-auto mb-2" />
          <div className="text-xs">Carte mission en temps réel</div>
          {position && (
            <div className="text-[10px] mt-1 text-stone-500">{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderConformance = () => {
    const skipped = mission.actual.villagesSkipped;
    return (
      <div className="space-y-4">
        {/* Score jauge */}
        <div className="flex items-center gap-6 bg-stone-50 rounded-xl p-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e7e5e4" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={mission.conformanceScore >= 80 ? '#137F3D' : mission.conformanceScore >= 60 ? '#C77700' : '#B91C1C'}
                strokeWidth="3"
                strokeDasharray={`${mission.conformanceScore} ${100 - mission.conformanceScore}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${mission.conformanceScore >= 80 ? 'text-success' : mission.conformanceScore >= 60 ? 'text-warning' : 'text-danger'}`}>
                {mission.conformanceScore}%
              </span>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-stone-800 mb-1">Score de conformité global</div>
            <div className="text-xs text-stone-500">Basé sur le respect des itinéraires et horaires planifiés.</div>
          </div>
        </div>

        {/* Plan vs Réalisé table */}
        <div className="border border-stone-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                {['Village', 'Heure prévue', 'Heure réelle', 'Écart', 'Statut'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-stone-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mission.planned.villages.map((v, i) => {
                const visited = mission.actual.villagesVisited.includes(v.id);
                const skip = mission.actual.villagesSkipped.find((s) => s.villageId === v.id);
                const ecart = visited ? (i % 3 === 0 ? '+45min' : i % 3 === 1 ? '+5min' : '0') : '—';
                return (
                  <tr key={v.id} className={`border-b border-stone-50 last:border-0 ${skip ? 'bg-danger/5' : ''}`}>
                    <td className="px-3 py-2.5 text-xs font-medium text-stone-700">{v.name}</td>
                    <td className="px-3 py-2.5 text-xs text-stone-500">{v.plannedArrival}</td>
                    <td className="px-3 py-2.5 text-xs text-stone-600">
                      {skip ? <span className="text-danger">Skippé</span> : visited ? v.plannedArrival : <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {skip ? '—' : visited ? (
                        <span className={ecart !== '0' ? 'text-warning' : 'text-success'}>{ecart}</span>
                      ) : <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {skip ? (
                        <div className="space-y-1">
                          <span className="flex items-center gap-1 text-[11px] text-danger"><XCircle size={10} /> Skippé</span>
                          {skipReasons[v.id] ? (
                            <span className="text-[10px] text-stone-500">{skipReasons[v.id]}</span>
                          ) : (
                            <input
                              type="text"
                              className="text-[10px] border border-danger/30 rounded px-1.5 py-0.5 w-36 focus:outline-none"
                              placeholder="Motif obligatoire *"
                              onChange={(e) => setSkipReasons((r) => ({ ...r, [v.id]: e.target.value }))}
                            />
                          )}
                        </div>
                      ) : visited ? (
                        <span className="flex items-center gap-1 text-[11px] text-success"><CheckCircle2 size={10} /> Conforme</span>
                      ) : (
                        <span className="text-[11px] text-stone-300">Planifié</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Ressources */}
        <div>
          <div className="text-xs font-semibold text-stone-700 mb-2">Ressources — doses prévues vs consommées</div>
          <div className="grid grid-cols-3 gap-3">
            {['DTC', 'BCG', 'Rotavirus'].map((a) => (
              <div key={a} className="bg-stone-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-stone-700 mb-2">{a}</div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-stone-500">Prévues</span><span>120</span></div>
                  <div className="flex justify-between"><span className="text-stone-500">Consommées</span><span className="text-success">{Math.round(120 * mission.conformanceScore / 100)}</span></div>
                  <div className="flex justify-between"><span className="text-stone-500">Gâchées</span><span className="text-danger">2</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderReports = () => (
    <div className="space-y-3">
      {mission.fieldReports.length === 0 && (
        <div className="py-8 text-center text-sm text-stone-400">Aucun rapport terrain pour cette mission</div>
      )}
      {[...mission.fieldReports].reverse().map((r) => (
        <FieldReportCard key={r.id} report={r} onCreateOpportunity={openNomadModal} />
      ))}
    </div>
  );

  const renderGeofence = () => (
    <div className="space-y-4">
      <div className="bg-stone-100 rounded-xl h-40 flex items-center justify-center border border-stone-200">
        <div className="text-center text-stone-400 text-xs">Carte géofence — zones attendues vs positions réelles</div>
      </div>
      <div className="border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              {['Déclenchée', 'Zone attendue', 'Position réelle', 'Statut', 'Résolution'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-stone-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mission.geofenceAlerts.map((alert) => (
              <tr key={alert.id} className="border-b border-stone-50 last:border-0">
                <td className="px-3 py-2.5 text-xs text-stone-500 whitespace-nowrap">
                  {alert.triggeredAt.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-3 py-2.5 text-xs text-stone-600">{alert.expectedZone}</td>
                <td className="px-3 py-2.5 text-xs text-stone-500">{alert.actualPosition.lat.toFixed(3)}, {alert.actualPosition.lng.toFixed(3)}</td>
                <td className="px-3 py-2.5">
                  {alert.resolved ? (
                    <span className="flex items-center gap-1 text-[11px] text-success"><CheckCircle2 size={10} /> Résolu</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-danger"><AlertTriangle size={10} /> Non résolu</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-[11px] text-stone-400">
                  {alert.resolution ?? (alert.resolved ? 'Résolu' : <button className="text-primary hover:underline" onClick={() => toast({ type: 'success', title: 'Alerte résolue' })}>Résoudre</button>)}
                </td>
              </tr>
            ))}
            {mission.geofenceAlerts.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-sm text-stone-400">Aucune alerte géofence</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-2">
      {[
        { date: mission.startDate, action: 'Mission démarrée', user: mission.teamName },
        ...mission.fieldReports.map((r) => ({ date: r.reportedAt, action: `Rapport ${r.type} — ${r.villageName}`, user: r.reportedBy })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime()).map((e, i) => (
        <div key={i} className="flex items-start gap-2.5 text-xs py-2 border-b border-stone-50 last:border-0">
          <div className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-1.5 flex-shrink-0" />
          <div>
            <span className="text-stone-700 font-medium">{e.action}</span>
            {e.user && <span className="text-stone-400"> · {e.user}</span>}
            <div className="text-stone-400">{e.date.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const tabContent: Record<TabKey, () => JSX.Element> = {
    realtime: renderRealtime,
    conformance: renderConformance,
    reports: renderReports,
    geofence: renderGeofence,
    history: renderHistory,
  };

  return (
    <div className="space-y-4 pb-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/supervision">Supervision</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{mission.teamName}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-start justify-between mt-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900">{mission.teamName}</h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${MISSION_STATUS_COLOR[mission.status]}`}>
                {MISSION_STATUS_LABEL[mission.status]}
              </span>
            </div>
            <div className="text-xs text-stone-400 mt-0.5">{mission.id} · Plan {mission.microPlanId}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast({ type: 'info', title: 'Contact', description: 'Appel simulé.' })}>
              <PhoneCall size={14} /> Contacter
            </Button>
            <Button variant="outline" size="sm" className="text-warning border-warning/30"
              onClick={() => toast({ type: 'warning', title: 'Signalement envoyé' })}>
              <Flag size={14} /> Signaler
            </Button>
            <Button variant="ghost" size="sm" className="text-danger"
              onClick={() => toast({ type: 'danger', title: 'Mission arrêtée' })}>
              <Square size={14} /> Arrêter
            </Button>
          </div>
        </div>
      </div>

      {/* Banners */}
      {mission.status === 'issue' && (
        <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 text-sm text-danger-700">
          <AlertTriangle size={15} className="text-danger flex-shrink-0" />
          <span>{mission.fieldReports.find((r) => r.issue?.severity === 'critical')?.issue?.description ?? 'Incident signalé sur la mission.'}</span>
        </div>
      )}

      {hasUntreatedNomad && (
        <div className="flex items-center gap-3 bg-warning/10 border border-warning/30 rounded-lg px-4 py-3">
          <Tent size={15} className="text-warning flex-shrink-0" />
          <span className="text-sm text-warning-700 flex-1">Contact nomade signalé non documenté.</span>
          <button
            className="text-sm font-medium text-warning-700 underline flex items-center gap-1"
            onClick={() => {
              const r = mission.fieldReports.find((fr) => fr.type === 'nomad_contact' && !fr.nomadContact?.opportunityCreated);
              if (r) openNomadModal(r);
              else setNomadModalOpen(true);
            }}
          >
            Créer l'opportunité <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="flex border-b border-stone-100 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-4">
          {tabContent[activeTab]()}
        </div>
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
