import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, FileText, Download, Users, Syringe } from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import { mockMissions } from '../data/mockMissions';
import { useToast } from '../lib/toast';

interface TeamAccordionItemProps {
  mission: typeof mockMissions[0];
}

function TeamAccordionItem({ mission }: TeamAccordionItemProps) {
  const [open, setOpen] = useState(false);

  const issueReports = mission.fieldReports.filter((r) => r.type === 'issue');
  const nomadReports = mission.fieldReports.filter((r) => r.type === 'nomad_contact');
  const conformanceColor = mission.conformanceScore >= 80 ? 'text-success' : mission.conformanceScore >= 60 ? 'text-warning' : 'text-danger';

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-stone-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown size={14} className="text-stone-400 shrink-0" /> : <ChevronRight size={14} className="text-stone-400 shrink-0" />}
          <div>
            <div className="text-sm font-semibold text-stone-800">{mission.teamName}</div>
            <div className="text-[11px] text-stone-400">{mission.id}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-stone-500">
            <span className="font-semibold text-success">{mission.actual.villagesVisited.length}</span>/{mission.planned.villages.length} villages
          </span>
          <span className="text-stone-500">
            <span className="font-semibold text-success">{mission.actual.childrenVaccinated}</span> enfants
          </span>
          {mission.conformanceScore > 0 && (
            <span className={`font-bold ${conformanceColor}`}>{mission.conformanceScore}%</span>
          )}
          {issueReports.length > 0 && (
            <span className="flex items-center gap-1 text-danger text-[11px]">
              <AlertTriangle size={10} /> {issueReports.length}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-stone-100 bg-stone-50 px-4 py-3 space-y-3">
          {/* Villages visitées */}
          <div>
            <div className="text-[11px] font-semibold text-stone-500 uppercase mb-1.5">Villages</div>
            <div className="flex flex-wrap gap-1.5">
              {mission.planned.villages.map((v) => {
                const visited = mission.actual.villagesVisited.includes(v.id);
                const skipped = mission.actual.villagesSkipped.find((s) => s.villageId === v.id);
                return (
                  <span
                    key={v.id}
                    className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                      visited ? 'bg-success/10 border-success/20 text-success' :
                      skipped ? 'bg-danger/10 border-danger/20 text-danger' :
                      'bg-stone-100 border-stone-200 text-stone-400'
                    }`}
                    title={skipped ? `Skippé : ${skipped.reason}` : undefined}
                  >
                    {v.name}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Incidents */}
          {issueReports.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-stone-500 uppercase mb-1.5">Incidents</div>
              <div className="space-y-1.5">
                {issueReports.map((r) => (
                  <div key={r.id} className="bg-white border border-danger/20 rounded-lg px-3 py-2 text-xs text-stone-700">
                    <span className="font-semibold text-danger mr-1.5">[{r.issue?.severity?.toUpperCase()}]</span>
                    {r.issue?.description}
                    {r.issue?.actionTaken && (
                      <div className="text-success mt-0.5 text-[11px]">Action : {r.issue.actionTaken}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contacts nomades */}
          {nomadReports.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-stone-500 uppercase mb-1.5">Contacts nomades</div>
              <div className="space-y-1.5">
                {nomadReports.map((r) => (
                  <div key={r.id} className="bg-white border border-ai/20 rounded-lg px-3 py-2 text-xs text-stone-700">
                    <span className="font-semibold text-ai mr-1.5">[NOMADE]</span>
                    {r.nomadContact?.groupType} · {r.nomadContact?.estimatedPopulation} personnes
                    <span className={`ml-2 text-[11px] ${r.nomadContact?.opportunityCreated ? 'text-success' : 'text-warning'}`}>
                      {r.nomadContact?.opportunityCreated ? '✓ Opportunité créée' : '⚠ Opportunité en attente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SupervisionRapportJournalierPage() {
  const { toast } = useToast();
  const [observations, setObservations] = useState('');
  const [validated, setValidated] = useState(false);

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const summary = useMemo(() => {
    const active = mockMissions.filter((m) => m.status === 'in_progress' || m.status === 'issue');
    const totalVaccinated = active.reduce((s, m) => s + m.actual.childrenVaccinated, 0);
    const totalVisited = active.reduce((s, m) => s + m.actual.villagesVisited.length, 0);
    const totalPlanned = active.reduce((s, m) => s + m.planned.villages.length, 0);
    const criticalIssues = active.filter((m) => m.fieldReports.some((r) => r.issue?.severity === 'critical' && !r.issue.actionTaken));
    const unresolvedAlerts = mockMissions.flatMap((m) => m.geofenceAlerts.filter((a) => !a.resolved));
    const nomadPending = mockMissions
      .flatMap((m) => m.fieldReports.filter((r) => r.type === 'nomad_contact' && r.nomadContact && !r.nomadContact.opportunityCreated))
      .length;
    const avgScore = (() => {
      const scores = mockMissions.filter((m) => m.conformanceScore > 0).map((m) => m.conformanceScore);
      return Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1));
    })();
    return { active: active.length, totalVaccinated, totalVisited, totalPlanned, criticalIssues: criticalIssues.length, unresolvedAlerts: unresolvedAlerts.length, nomadPending, avgScore };
  }, []);

  const activeMissions = useMemo(
    () => mockMissions.filter((m) => ['in_progress', 'issue', 'completed'].includes(m.status)),
    [],
  );

  const unresolvedGeoAlerts = useMemo(
    () => mockMissions.flatMap((m) => m.geofenceAlerts.filter((a) => !a.resolved).map((a) => ({ ...a, teamName: m.teamName, missionId: m.id }))),
    [],
  );

  const unresolvedIssues = useMemo(
    () => mockMissions.flatMap((m) =>
      m.fieldReports
        .filter((r) => r.type === 'issue' && r.issue && !r.issue.actionTaken)
        .map((r) => ({ ...r, teamName: m.teamName })),
    ),
    [],
  );

  return (
    <div className="space-y-5 pb-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/supervision">Supervision</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Rapport journalier</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-xl font-bold text-stone-900">Rapport journalier</h1>
            <p className="text-xs text-stone-400 mt-0.5 capitalize">{today}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast({ type: 'info', title: 'Export PDF', description: 'Disponible Sprint 6.' })}>
              <FileText size={14} /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast({ type: 'info', title: 'Export Excel', description: 'Disponible Sprint 6.' })}>
              <Download size={14} /> Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Section 1 — Synthèse auto-calculée */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <h2 className="text-sm font-semibold text-stone-800 mb-3">Synthèse du jour</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Équipes actives', value: summary.active, icon: Users, color: 'text-primary' },
            { label: 'Enfants vaccinés', value: summary.totalVaccinated.toLocaleString('fr-FR'), icon: Syringe, color: 'text-success' },
            { label: `Villages (${summary.totalVisited}/${summary.totalPlanned})`, value: `${Math.round((summary.totalVisited / Math.max(summary.totalPlanned, 1)) * 100)}%`, icon: CheckCircle2, color: 'text-success' },
            { label: 'Score conformité moy.', value: `${summary.avgScore}%`, icon: FileText, color: summary.avgScore >= 80 ? 'text-success' : 'text-warning' },
          ].map((k) => (
            <div key={k.label} className="bg-stone-50 rounded-lg p-3 text-center">
              <k.icon size={16} className={`${k.color} mx-auto mb-1`} />
              <div className={`text-lg font-bold ${k.color}`}>{k.value}</div>
              <div className="text-[10px] text-stone-400 mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>
        {(summary.criticalIssues > 0 || summary.nomadPending > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.criticalIssues > 0 && (
              <div className="flex items-center gap-1.5 bg-danger/5 border border-danger/20 rounded-lg px-3 py-1.5 text-xs text-danger">
                <AlertTriangle size={11} />
                {summary.criticalIssues} incident(s) critique(s) non résolus
              </div>
            )}
            {summary.nomadPending > 0 && (
              <div className="flex items-center gap-1.5 bg-ai-50 border border-ai/20 rounded-lg px-3 py-1.5 text-xs text-ai-600">
                <Users size={11} />
                {summary.nomadPending} contact(s) nomade(s) sans opportunité
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2 — Accordéon par équipe */}
      <div>
        <h2 className="text-sm font-semibold text-stone-800 mb-3">Rapport par équipe</h2>
        <div className="space-y-2">
          {activeMissions.map((m) => (
            <TeamAccordionItem key={m.id} mission={m} />
          ))}
        </div>
      </div>

      {/* Section 3 — Alertes non résolues */}
      {(unresolvedGeoAlerts.length > 0 || unresolvedIssues.length > 0) && (
        <div className="bg-white rounded-xl border border-danger/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-danger" />
            <h2 className="text-sm font-semibold text-stone-800">Alertes non résolues</h2>
            <span className="ml-1 text-xs text-danger font-bold">({unresolvedGeoAlerts.length + unresolvedIssues.length})</span>
          </div>
          <div className="space-y-2">
            {unresolvedIssues.map((r) => (
              <div key={r.id} className="flex items-start gap-2 bg-danger/5 border border-danger/10 rounded-lg px-3 py-2">
                <span className="text-[10px] font-bold text-danger bg-danger/10 px-1.5 py-0.5 rounded uppercase mt-0.5 shrink-0">{r.issue?.severity}</span>
                <div>
                  <div className="text-xs font-medium text-stone-800">{r.teamName}</div>
                  <div className="text-[11px] text-stone-500">{r.issue?.description}</div>
                </div>
                <span className="ml-auto text-[11px] text-stone-400 shrink-0">
                  {r.reportedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {unresolvedGeoAlerts.map((a) => (
              <div key={a.id} className="flex items-start gap-2 bg-warning/5 border border-warning/10 rounded-lg px-3 py-2">
                <span className="text-[10px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded uppercase mt-0.5 shrink-0">GEO</span>
                <div>
                  <div className="text-xs font-medium text-stone-800">{a.teamName}</div>
                  <div className="text-[11px] text-stone-500">Hors zone prévue "{a.expectedZone}"</div>
                </div>
                <span className="ml-auto text-[11px] text-stone-400 shrink-0">
                  {a.triggeredAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4 — Observations superviseur */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <h2 className="text-sm font-semibold text-stone-800 mb-3">Observations du superviseur</h2>
        <textarea
          className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
          rows={5}
          placeholder="Saisir les observations, difficultés rencontrées, recommandations pour demain..."
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          disabled={validated}
        />
        <div className="text-[11px] text-stone-400 mt-1 text-right">{observations.length} caractères</div>
      </div>

      {/* Section 5 — Validation */}
      <div className={`rounded-xl border p-4 ${validated ? 'bg-success/5 border-success/30' : 'bg-white border-stone-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-stone-800">Validation du rapport</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {validated
                ? "Rapport validé et transmis au Gestionnaire Provincial."
                : "En validant, vous certifiez l'exactitude des données et le rapport sera transmis."}
            </p>
          </div>
          {validated ? (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 size={20} />
              <span className="text-sm font-semibold">Validé</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toast({ type: 'info', title: 'Brouillon sauvegardé', description: 'Le rapport a été sauvegardé.' })}>
                Sauvegarder brouillon
              </Button>
              <Button size="sm" onClick={() => {
                setValidated(true);
                toast({ type: 'success', title: 'Rapport validé', description: 'Transmis au Gestionnaire Provincial.' });
              }}>
                <CheckCircle2 size={13} /> Valider et transmettre
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
