import { useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  Activity,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { getVillages, getFacilities } from '../data/mockGeography';
import { VillageMarker } from '../components/map/VillageMarker';
import { mockCampaigns, CAMPAIGN_STATUS_LABEL } from '../data/mockCampaigns';
import type { CampaignStatus } from '../data/mockCampaigns';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LAC_CENTER: [number, number] = [13.45, 14.40];

const TREND_DATA = [
  { month: 'Juin', dtc3: 58, dtc1: 64 },
  { month: 'Juil', dtc3: 60, dtc1: 66 },
  { month: 'Août', dtc3: 59, dtc1: 65 },
  { month: 'Sep', dtc3: 61, dtc1: 67 },
  { month: 'Oct', dtc3: 63, dtc1: 69 },
  { month: 'Nov', dtc3: 65, dtc1: 71 },
  { month: 'Déc', dtc3: 64, dtc1: 70 },
  { month: 'Jan', dtc3: 67, dtc1: 73 },
  { month: 'Fév', dtc3: 68, dtc1: 74 },
  { month: 'Mar', dtc3: 69, dtc1: 75 },
  { month: 'Avr', dtc3: 71, dtc1: 77 },
  { month: 'Mai', dtc3: 72, dtc1: 78 },
];

const PRIORITY_ZONES = [
  { name: 'Canton Liwa', coverage: 31, villages: 12, pop: 4200 },
  { name: 'Canton Ngouri', coverage: 38, villages: 9, pop: 3100 },
  { name: 'Canton Mao', coverage: 42, villages: 7, pop: 2800 },
  { name: 'Canton Mondo', coverage: 46, villages: 11, pop: 3700 },
  { name: 'Canton Baga-Sola', coverage: 51, villages: 8, pop: 2400 },
];

const ALERTS = [
  {
    id: 'a1',
    level: 'critical' as const,
    title: 'Rupture de stock DTC1 — Kanem',
    description: 'Livraison retardée, ~22 villages non couverts',
    date: '13 mai 2026',
  },
  {
    id: 'a2',
    level: 'warning' as const,
    title: 'Chaîne du froid dégradée — Bol CS',
    description: 'Température hors plage depuis 18h — intervention requise',
    date: '12 mai 2026',
  },
  {
    id: 'a3',
    level: 'warning' as const,
    title: 'Couverture DTC3 < 50% — Canton Liwa',
    description: '7 villages sous le seuil OMS depuis 3 mois consécutifs',
    date: '10 mai 2026',
  },
  {
    id: 'a4',
    level: 'info' as const,
    title: 'Campagne Polio OPV2 confirmée',
    description: 'Démarrage prévu le 02 juin 2026 — 60 villages ciblés',
    date: '9 mai 2026',
  },
];

const STATUS_STYLES: Record<CampaignStatus, { dot: string; badge: string; label: string }> = {
  in_progress: { dot: 'bg-primary', badge: 'bg-primary/10 text-primary-700', label: CAMPAIGN_STATUS_LABEL.in_progress },
  completed: { dot: 'bg-success', badge: 'bg-success/10 text-success-700', label: CAMPAIGN_STATUS_LABEL.completed },
  planned: { dot: 'bg-stone-400', badge: 'bg-stone-100 text-stone-600', label: CAMPAIGN_STATUS_LABEL.planned },
  issue: { dot: 'bg-danger', badge: 'bg-danger/10 text-danger-700', label: CAMPAIGN_STATUS_LABEL.issue },
};

const ALERT_STYLES = {
  critical: { bg: 'bg-danger/5 border-danger/20', icon: XCircle, iconColor: 'text-danger' },
  warning: { bg: 'bg-warning/5 border-warning/20', icon: AlertCircle, iconColor: 'text-warning' },
  info: { bg: 'bg-primary/5 border-primary/20', icon: CheckCircle2, iconColor: 'text-primary' },
};

function KpiCard({
  label,
  value,
  sub,
  trend,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  trend?: { dir: 'up' | 'down'; text: string };
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-sm text-stone-500 font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-stone-900">{value}</div>
        <div className="text-xs text-stone-500 mt-0.5">{sub}</div>
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 text-xs font-medium ${
            trend.dir === 'up' ? 'text-success' : 'text-danger'
          }`}
        >
          {trend.dir === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {trend.text}
        </div>
      )}
    </div>
  );
}

export default function PilotagePage() {
  const villages = useMemo(() => getVillages(), []);
  const facilities = useMemo(() => getFacilities(), []);

  const lacVillages = useMemo(
    () => villages.filter((v) => v.centroidLat > 12.8 && v.centroidLat < 14.2),
    [villages],
  );

  const lacFacilities = useMemo(
    () => facilities.filter((f) => f.provinceId === 'td-lac'),
    [facilities],
  );

  const kpiData = useMemo(() => {
    const total = lacVillages.length;
    const covered = lacVillages.filter((v) => v.dtc3Coverage >= 0.85).length;
    const avgDtc3 = lacVillages.length
      ? Math.round(lacVillages.reduce((s, v) => s + v.dtc3Coverage * 100, 0) / lacVillages.length)
      : 0;
    const childrenVacc = Math.round(lacVillages.reduce((s, v) => s + v.population * 0.05 * (v.dtc3Coverage), 0));
    return { total, covered, avgDtc3, childrenVacc };
  }, [lacVillages]);

  const activeCampaigns = useMemo(
    () => mockCampaigns.filter((c) => c.status === 'in_progress' || c.status === 'issue'),
    [],
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Tableau de bord — Pilotage</h1>
          <p className="text-sm text-stone-500 mt-0.5">Province du Lac · Mise à jour aujourd'hui</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500 bg-stone-100 rounded-md px-3 py-1.5">
          <Calendar size={13} />
          Mai 2026 · Saison sèche
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Couverture DTC3 moy."
          value={`${kpiData.avgDtc3}%`}
          sub={`Cible OMS : 95% · Province du Lac`}
          trend={{ dir: 'up', text: '+14 pts sur 12 mois' }}
          icon={Activity}
          color="bg-primary/10 text-primary"
        />
        <KpiCard
          label="Villages couverts (≥85%)"
          value={`${kpiData.covered}/${kpiData.total}`}
          sub={`${Math.round((kpiData.covered / Math.max(kpiData.total, 1)) * 100)}% des villages`}
          trend={{ dir: 'up', text: '+6 villages ce trimestre' }}
          icon={MapPin}
          color="bg-success/10 text-success"
        />
        <KpiCard
          label="Enfants vaccinés DTC3"
          value={kpiData.childrenVacc.toLocaleString('fr-FR')}
          sub="Enfants <5 ans estimés"
          trend={{ dir: 'up', text: '+1 240 ce mois' }}
          icon={Users}
          color="bg-emerald-100 text-emerald-700"
        />
        <KpiCard
          label="Alertes actives"
          value="3"
          sub="dont 1 critique (rupture stock)"
          trend={{ dir: 'down', text: '-1 par rapport à la semaine passée' }}
          icon={AlertTriangle}
          color="bg-danger/10 text-danger"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left: trend chart + campaigns */}
        <div className="xl:col-span-3 space-y-5">
          {/* Trend chart */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-stone-800">Tendance couverture vaccinale</h2>
                <p className="text-xs text-stone-500">12 derniers mois · Province du Lac</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-stone-500">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-0.5 bg-primary inline-block" /> DTC3
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-0.5 bg-emerald-500 inline-block" /> DTC1
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-stone-400 inline-block" /> Cible 95%
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={TREND_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#78716C' }} tickLine={false} axisLine={false} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: '#78716C' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <RechartTooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E7E5E4' }}
                  formatter={(value: number) => [`${value}%`]}
                />
                <ReferenceLine y={95} stroke="#A8A29E" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Cible', position: 'right', fontSize: 10, fill: '#A8A29E' }} />
                <Line dataKey="dtc3" stroke="#2563EB" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="DTC3" />
                <Line dataKey="dtc1" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="DTC1" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Campaigns */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-stone-800">Campagnes vaccinales</h2>
              <span className="text-xs text-stone-500">{mockCampaigns.length} campagnes</span>
            </div>
            <div className="space-y-2">
              {mockCampaigns.map((c) => {
                const s = STATUS_STYLES[c.status];
                const pct = c.coverageTarget > 0 ? Math.round((c.coverageActual / c.coverageTarget) * 100) : 0;
                return (
                  <div key={c.id} className="flex items-center gap-3 py-2 border-b border-stone-100 last:border-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stone-800 truncate">{c.name}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${s.badge} flex-shrink-0`}>
                          {s.label}
                        </span>
                      </div>
                      {c.issueDescription && (
                        <p className="text-[11px] text-danger mt-0.5">{c.issueDescription}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {c.status !== 'planned' ? (
                        <>
                          <div className="text-sm font-semibold text-stone-800">{c.coverageActual}%</div>
                          <div className="text-[10px] text-stone-400">/ {c.coverageTarget}% cible</div>
                        </>
                      ) : (
                        <div className="text-xs text-stone-400">
                          <Clock size={11} className="inline mr-0.5" />
                          {new Date(c.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: mini-map + priority zones */}
        <div className="xl:col-span-2 space-y-5">
          {/* Mini map */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100">
              <h2 className="text-sm font-semibold text-stone-800">Carte couverture DTC3</h2>
              <p className="text-xs text-stone-500">Cercles colorés = villages Province du Lac</p>
            </div>
            <div style={{ height: 280 }}>
              <MapContainer
                center={LAC_CENTER}
                zoom={8}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
                scrollWheelZoom={false}
                dragging={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                {lacVillages.map((v) => (
                  <VillageMarker key={v.id} village={v} onClick={() => {}} isSelected={false} />
                ))}
              </MapContainer>
            </div>
            <div className="px-4 py-2 flex items-center gap-3 text-[10px] text-stone-500 border-t border-stone-100 flex-wrap">
              {[
                { color: '#DC2626', label: '<50%' },
                { color: '#F97316', label: '50–70%' },
                { color: '#EAB308', label: '70–85%' },
                { color: '#84CC16', label: '85–95%' },
                { color: '#16A34A', label: '>95%' },
              ].map((t) => (
                <span key={t.label} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* Priority zones */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-stone-800">Zones prioritaires</h2>
              <span className="text-[11px] text-danger font-medium">Couverture DTC3 ↓</span>
            </div>
            <div className="space-y-2.5">
              {PRIORITY_ZONES.map((z, i) => (
                <div key={z.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-stone-400 w-4 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-stone-700 truncate">{z.name}</span>
                      <span
                        className={`text-xs font-bold ml-2 flex-shrink-0 ${
                          z.coverage < 50 ? 'text-danger' : z.coverage < 70 ? 'text-warning' : 'text-stone-600'
                        }`}
                      >
                        {z.coverage}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${z.coverage}%`,
                          backgroundColor:
                            z.coverage < 50 ? '#DC2626' : z.coverage < 70 ? '#F97316' : '#EAB308',
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      {z.villages} villages · ~{z.pop.toLocaleString('fr-FR')} hab.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-800">Alertes récentes</h2>
          <span className="text-xs text-stone-500">{ALERTS.length} alertes · Toutes provinces</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {ALERTS.map((a) => {
            const s = ALERT_STYLES[a.level];
            const Icon = s.icon;
            return (
              <div key={a.id} className={`flex gap-3 p-3 rounded-lg border ${s.bg}`}>
                <Icon size={16} className={`flex-shrink-0 mt-0.5 ${s.iconColor}`} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-stone-800">{a.title}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{a.description}</div>
                  <div className="text-[10px] text-stone-400 mt-1">{a.date}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
