import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Download, FileText, AlertTriangle, CheckCircle2, XCircle, TrendingDown } from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import { mockMissions, MISSION_STATUS_LABEL, type Mission } from '../data/mockMissions';
import { useToast } from '../lib/toast';

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-success' : score >= 60 ? 'bg-warning' : 'bg-danger';
  const textColor = score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-danger';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold w-10 text-right ${textColor}`}>{score}%</span>
    </div>
  );
}

export default function SupervisionConformitePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scoreMin, setScoreMin] = useState(0);
  const [scoreMax, setScoreMax] = useState(100);
  const [statusFilter, setStatusFilter] = useState('all');

  const completedMissions = useMemo(
    () => mockMissions.filter((m) => ['completed', 'in_progress', 'issue', 'interrupted'].includes(m.status)),
    [],
  );

  const filtered = useMemo(
    () => completedMissions.filter((m) =>
      m.conformanceScore >= scoreMin &&
      m.conformanceScore <= scoreMax &&
      (statusFilter === 'all' || m.status === statusFilter),
    ),
    [completedMissions, scoreMin, scoreMax, statusFilter],
  );

  const kpis = useMemo(() => {
    const scores = completedMissions.map((m) => m.conformanceScore).filter((s) => s > 0);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1));
    const conformes = completedMissions.filter((m) => m.conformanceScore >= 80).length;
    const nonConformes = completedMissions.filter((m) => m.conformanceScore > 0 && m.conformanceScore < 60).length;
    return { avg, conformes, nonConformes };
  }, [completedMissions]);

  const topSkipped = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    completedMissions.forEach((m) => {
      m.actual.villagesSkipped.forEach((s) => {
        counts[s.villageId] = { name: s.villageName, count: (counts[s.villageId]?.count ?? 0) + 1 };
      });
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [completedMissions]);

  const lowConformanceTeams = completedMissions
    .filter((m) => m.conformanceScore > 0 && m.conformanceScore < 75)
    .sort((a, b) => a.conformanceScore - b.conformanceScore)
    .slice(0, 3);

  return (
    <div className="space-y-5 pb-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/supervision">Supervision</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Conformité</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-xl font-bold text-stone-900">Rapport de conformité</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast({ type: 'info', title: 'Export PDF', description: 'Disponible Sprint 6.' })}>
              <FileText size={14} /> Exporter PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast({ type: 'info', title: 'Export Excel', description: 'Disponible Sprint 6.' })}>
              <Download size={14} /> Exporter Excel
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Score moyen', value: `${kpis.avg}%`, color: kpis.avg >= 80 ? 'text-success' : 'text-warning', icon: CheckCircle2 },
          { label: 'Missions conformes (≥80%)', value: kpis.conformes, color: 'text-success', icon: CheckCircle2 },
          { label: 'Non conformes (<60%)', value: kpis.nonConformes, color: kpis.nonConformes > 0 ? 'text-danger' : 'text-stone-400', icon: XCircle, danger: kpis.nonConformes > 0 },
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

      {/* Filters */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 flex items-end gap-4 flex-wrap">
        <div className="flex-1 min-w-40">
          <label className="block text-xs font-medium text-stone-700 mb-1">Statut</label>
          <select
            className="w-full text-sm border border-stone-200 rounded px-2.5 py-1.5 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous</option>
            <option value="completed">Terminées</option>
            <option value="in_progress">En cours</option>
            <option value="issue">Incident</option>
          </select>
        </div>
        <div className="flex-1 min-w-48">
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Score conformité : {scoreMin}% — {scoreMax}%
          </label>
          <div className="flex gap-2">
            <input type="range" min={0} max={100} value={scoreMin} className="flex-1 accent-primary"
              onChange={(e) => setScoreMin(Math.min(Number(e.target.value), scoreMax - 5))} />
            <input type="range" min={0} max={100} value={scoreMax} className="flex-1 accent-primary"
              onChange={(e) => setScoreMax(Math.max(Number(e.target.value), scoreMin + 5))} />
          </div>
        </div>
      </div>

      {/* DataTable */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-stone-800">Missions ({filtered.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                {['Équipe / Mission', 'Période', 'Villages P/V/S', 'Score', 'Écart horaire', 'Doses P/C/G', 'Issues', 'Actions'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-stone-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const totalPlanned = m.planned.villages.length;
                const visited = m.actual.villagesVisited.length;
                const skipped = m.actual.villagesSkipped.length;
                const issueCount = m.fieldReports.filter((r) => r.type === 'issue').length;
                return (
                  <tr key={m.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/60">
                    <td className="px-3 py-2.5">
                      <div className="text-xs font-medium text-stone-800">{m.teamName}</div>
                      <div className="text-[11px] text-stone-400">{m.id}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-stone-500 whitespace-nowrap">
                      {m.startDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} →{' '}
                      {m.endDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-stone-600">
                      <span className="text-stone-500">{totalPlanned}</span>
                      {' / '}
                      <span className="text-success font-medium">{visited}</span>
                      {' / '}
                      <span className={skipped > 0 ? 'text-danger font-medium' : 'text-stone-300'}>{skipped}</span>
                    </td>
                    <td className="px-3 py-2.5 w-36">
                      {m.conformanceScore > 0 ? <ScoreBar score={m.conformanceScore} /> : <span className="text-stone-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-stone-500">
                      {m.actual.daysCompleted > 0 ? '+18 min moy.' : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      <span className="text-stone-500">{m.planned.targetChildren}</span>
                      {' / '}
                      <span className="text-success font-medium">{m.actual.childrenVaccinated}</span>
                      {' / '}
                      <span className="text-danger">3</span>
                    </td>
                    <td className="px-3 py-2.5">
                      {issueCount > 0 ? (
                        <span className="flex items-center gap-1 text-[11px] text-danger">
                          <AlertTriangle size={10} /> {issueCount}
                        </span>
                      ) : (
                        <span className="text-stone-300 text-[11px]">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5">
                        <button
                          className="text-[11px] text-primary hover:underline"
                          onClick={() => navigate(`/supervision/missions/${m.id}`)}
                        >
                          Détail
                        </button>
                        {skipped > 0 && (
                          <button
                            className="text-[11px] text-warning hover:underline"
                            onClick={() => toast({ type: 'warning', title: 'Justification', description: `${m.teamName} — demande envoyée.` })}
                          >
                            Justifier
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-10 text-center text-sm text-stone-400">Aucune mission dans ce filtre</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top écarts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingDown size={14} className="text-danger" />
            <h3 className="text-sm font-semibold text-stone-800">Villages systématiquement skippés</h3>
          </div>
          {topSkipped.length === 0 ? (
            <div className="text-sm text-stone-400 py-2">Aucun village systématiquement skippé</div>
          ) : (
            <div className="space-y-2">
              {topSkipped.map((v, i) => (
                <div key={v.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-danger/10 text-danger text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-stone-700">{v.name}</span>
                  </div>
                  <span className="text-xs text-danger font-medium">{v.count}× skippé</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle size={14} className="text-warning" />
            <h3 className="text-sm font-semibold text-stone-800">Équipes à faible conformité</h3>
          </div>
          {lowConformanceTeams.length === 0 ? (
            <div className="text-sm text-stone-400 py-2">Toutes les équipes sont conformes</div>
          ) : (
            <div className="space-y-3">
              {lowConformanceTeams.map((m) => (
                <div key={m.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-stone-700">{m.teamName}</span>
                    <span className={`text-xs font-bold ${m.conformanceScore < 60 ? 'text-danger' : 'text-warning'}`}>{m.conformanceScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mb-1">
                    <div className={`h-full rounded-full ${m.conformanceScore < 60 ? 'bg-danger' : 'bg-warning'}`} style={{ width: `${m.conformanceScore}%` }} />
                  </div>
                  <div className="text-[10px] text-stone-400">Recommandation : formation renforcement protocoles PEV</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
