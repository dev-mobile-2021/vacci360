import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, Download, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import { mockMissions } from '../data/mockMissions';
import { useToast } from '../lib/toast';

type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
type AlertStatus = 'active' | 'in_progress' | 'resolved';

interface Alert {
  id: string;
  missionId: string;
  teamId: string;
  teamName: string;
  severity: AlertSeverity;
  type: string;
  description: string;
  triggeredAt: Date;
  status: AlertStatus;
  assignedTo?: string;
  resolvedAt?: Date;
}

function buildAlerts(): Alert[] {
  const alerts: Alert[] = [];

  for (const m of mockMissions) {
    for (const fr of m.fieldReports) {
      if (fr.type === 'issue' && fr.issue) {
        const sev = fr.issue.severity as AlertSeverity;
        alerts.push({
          id: `alert-fr-${fr.id}`,
          missionId: m.id,
          teamId: m.teamId,
          teamName: m.teamName,
          severity: sev,
          type: typeLabel(fr.issue.type),
          description: fr.issue.description,
          triggeredAt: fr.reportedAt,
          status: fr.issue.actionTaken ? 'resolved' : sev === 'critical' ? 'active' : 'in_progress',
          assignedTo: fr.issue.actionTaken ? 'Superviseur' : undefined,
          resolvedAt: fr.issue.actionTaken ? new Date(fr.reportedAt.getTime() + 2 * 3_600_000) : undefined,
        });
      }
    }

    for (const ga of m.geofenceAlerts) {
      alerts.push({
        id: `alert-geo-${ga.id}`,
        missionId: m.id,
        teamId: ga.teamId,
        teamName: m.teamName,
        severity: 'high',
        type: 'Géofence',
        description: `Équipe hors zone prévue "${ga.expectedZone}"`,
        triggeredAt: ga.triggeredAt,
        status: ga.resolved ? 'resolved' : 'active',
        assignedTo: ga.resolvedBy,
        resolvedAt: ga.resolvedAt,
      });
    }
  }

  return alerts.sort((a, b) => {
    const sevOrder: Record<AlertSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    if (sevOrder[a.severity] !== sevOrder[b.severity]) return sevOrder[a.severity] - sevOrder[b.severity];
    return b.triggeredAt.getTime() - a.triggeredAt.getTime();
  });
}

function typeLabel(t: string): string {
  const map: Record<string, string> = {
    road_blocked: 'Route bloquée',
    team_sick: 'Équipe malade',
    cold_chain: 'Chaîne du froid',
    security: 'Sécurité',
    community_refusal: 'Refus communauté',
    other: 'Autre',
  };
  return map[t] ?? t;
}

const SEV_COLOR: Record<AlertSeverity, string> = {
  critical: 'text-danger',
  high: 'text-warning',
  medium: 'text-amber-600',
  low: 'text-stone-500',
};
const SEV_BG: Record<AlertSeverity, string> = {
  critical: 'bg-danger/10 border-danger/20',
  high: 'bg-warning/10 border-warning/20',
  medium: 'bg-amber-50 border-amber-200',
  low: 'bg-stone-50 border-stone-200',
};
const SEV_LABEL: Record<AlertSeverity, string> = {
  critical: 'Critique',
  high: 'Élevée',
  medium: 'Moyenne',
  low: 'Faible',
};

const STATUS_LABEL: Record<AlertStatus, string> = {
  active: 'Active',
  in_progress: 'En cours',
  resolved: 'Résolue',
};
const STATUS_COLOR: Record<AlertStatus, string> = {
  active: 'text-danger',
  in_progress: 'text-warning',
  resolved: 'text-success',
};

export default function SupervisionAlertesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<'all' | 'critical' | 'in_progress' | 'resolved'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allAlerts = useMemo(buildAlerts, []);

  const filtered = useMemo(() => {
    if (tab === 'all') return allAlerts;
    if (tab === 'critical') return allAlerts.filter((a) => a.severity === 'critical');
    if (tab === 'in_progress') return allAlerts.filter((a) => a.status === 'active' || a.status === 'in_progress');
    return allAlerts.filter((a) => a.status === 'resolved');
  }, [allAlerts, tab]);

  const kpis = useMemo(() => {
    const critiques = allAlerts.filter((a) => a.severity === 'critical').length;
    const actives = allAlerts.filter((a) => a.status === 'active' || a.status === 'in_progress').length;
    const resolvedToday = allAlerts.filter((a) => a.status === 'resolved').length;
    return { critiques, actives, resolvedToday, avgResolutionH: 2.4 };
  }, [allAlerts]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((a) => a.id)));
    }
  };

  const tabs: { key: typeof tab; label: string; count: number }[] = [
    { key: 'all', label: 'Toutes', count: allAlerts.length },
    { key: 'critical', label: 'Critiques', count: allAlerts.filter((a) => a.severity === 'critical').length },
    { key: 'in_progress', label: 'En cours', count: allAlerts.filter((a) => a.status !== 'resolved').length },
    { key: 'resolved', label: 'Résolues', count: allAlerts.filter((a) => a.status === 'resolved').length },
  ];

  return (
    <div className="space-y-5 pb-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/supervision">Supervision</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Alertes</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-xl font-bold text-stone-900">Centre d&apos;alertes</h1>
          <Button variant="outline" size="sm" onClick={() => toast({ type: 'info', title: 'Export', description: 'Disponible Sprint 6.' })}>
            <Download size={14} /> Exporter
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Critiques', value: kpis.critiques, color: 'text-danger', icon: ShieldAlert, danger: kpis.critiques > 0 },
          { label: 'Actives', value: kpis.actives, color: 'text-warning', icon: AlertTriangle },
          { label: 'Résolues aujourd\'hui', value: kpis.resolvedToday, color: 'text-success', icon: CheckCircle2 },
          { label: 'Temps moyen résolution', value: `${kpis.avgResolutionH}h`, color: 'text-stone-700', icon: Clock },
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

      {/* VacciBot synthèse encart */}
      {kpis.critiques > 0 && (
        <div className="rounded-lg border-l-4 p-4 flex gap-3" style={{ borderColor: '#E11D74', background: '#FFF1F5' }}>
          <Sparkles size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#E11D74' }} />
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: '#E11D74' }}>Synthèse situationnelle — VacciBot</div>
            <p className="text-xs text-stone-700 leading-relaxed">
              <strong>{kpis.critiques} alerte{kpis.critiques > 1 ? 's' : ''} critique{kpis.critiques > 1 ? 's' : ''}</strong> sont actives en ce moment.
              {' '}Les alertes géofence récurrentes dans le district de Bol suggèrent un problème routier récurrent ou une contrainte sécuritaire.
              Recommandation : contacter le superviseur de zone et envisager une révision du périmètre de mission.
            </p>
          </div>
        </div>
      )}

      {/* Tabs + Bulk actions */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-100 px-4">
          <div className="flex">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSelected(new Set()); }}
                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    tab === t.key ? 'bg-primary/10 text-primary' : 'bg-stone-100 text-stone-500'
                  }`}>{t.count}</span>
                )}
              </button>
            ))}
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500">{selected.size} sélectionnée(s)</span>
              <Button size="sm" variant="outline" onClick={() => {
                toast({ type: 'success', title: 'Alertes résolues', description: `${selected.size} alerte(s) marquée(s) comme résolue(s).` });
                setSelected(new Set());
              }}>
                Marquer résolues
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                toast({ type: 'warning', title: 'Escalade', description: `${selected.size} alerte(s) escaladée(s) au niveau supérieur.` });
                setSelected(new Set());
              }}>
                Escalader
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="px-3 py-2.5 w-8">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                {['Sévérité', 'Type', 'Équipe', 'Description', 'Déclenchée', 'Statut', 'Assigné', 'Actions'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-stone-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((alert) => (
                <tr key={alert.id} className={`border-b border-stone-100 last:border-0 hover:bg-stone-50/60 ${selected.has(alert.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" className="rounded" checked={selected.has(alert.id)} onChange={() => toggleSelect(alert.id)} />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${SEV_BG[alert.severity]} ${SEV_COLOR[alert.severity]}`}>
                      {alert.severity === 'critical' && <ShieldAlert size={9} />}
                      {SEV_LABEL[alert.severity]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-stone-600 whitespace-nowrap">{alert.type}</td>
                  <td className="px-3 py-2.5">
                    <div className="text-xs font-medium text-stone-800">{alert.teamName}</div>
                    <div className="text-[11px] text-stone-400">{alert.teamId}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-stone-600 max-w-xs">
                    <div className="truncate">{alert.description}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-stone-500 whitespace-nowrap">
                    {alert.triggeredAt.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-semibold ${STATUS_COLOR[alert.status]}`}>{STATUS_LABEL[alert.status]}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-stone-500">
                    {alert.assignedTo ?? <span className="text-stone-300">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                        onClick={() => navigate(`/supervision/missions/${alert.missionId}`)}
                      >
                        Mission <ChevronRight size={10} />
                      </button>
                      {alert.status !== 'resolved' && (
                        <button
                          className="text-[11px] text-success hover:underline"
                          onClick={() => toast({ type: 'success', title: 'Alerte résolue', description: `Alerte ${alert.id} marquée comme résolue.` })}
                        >
                          Résoudre
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm text-stone-400">Aucune alerte dans cette catégorie</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
