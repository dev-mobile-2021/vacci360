import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip as RCTooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Users,
  Target, Activity, Tent, BarChart2, Map, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  mockNationalSummary,
  mockProvinceKPIs,
  getMonthlySeriesForAntigen,
  getHeatmapData,
  getScatterData,
  type ProvinceKPI,
} from '../data/mockAnalytics';
import { DataTable } from '../components/data/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

// ─── Leaflet fix ──────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Coverage color scale (OMS tiers) ─────────────────────────────────────────
function getCoverageColor(pct: number): string {
  if (pct >= 90) return '#16A34A';
  if (pct >= 80) return '#65A30D';
  if (pct >= 70) return '#CA8A04';
  if (pct >= 50) return '#EA580C';
  return '#DC2626';
}

function getCoverageTier(pct: number): string {
  if (pct >= 90) return '≥90% (Objectif OMS)';
  if (pct >= 80) return '80–89%';
  if (pct >= 70) return '70–79%';
  if (pct >= 50) return '50–69%';
  return '<50% (Critique)';
}

// ─── Month label helpers ──────────────────────────────────────────────────────
const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
function shortMonth(iso: string) {
  const m = parseInt(iso.split('-')[1], 10) - 1;
  return MONTH_SHORT[m];
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
  icon: React.ReactNode;
}

function KpiCard({ label, value, sub, trend, color = '#1E5BA8', icon }: KpiProps) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 flex gap-3 items-start shadow-sm">
      <div className="rounded-lg p-2.5 flex-shrink-0" style={{ background: `${color}18` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="min-w-0">
        <div className="text-xs text-stone-500 font-medium truncate">{label}</div>
        <div className="text-2xl font-bold text-stone-900 leading-tight mt-0.5">{value}</div>
        {sub && (
          <div className="flex items-center gap-1 mt-0.5">
            {trend === 'up' && <TrendingUp size={12} className="text-green-600" />}
            {trend === 'down' && <TrendingDown size={12} className="text-red-600" />}
            {trend === 'stable' && <Minus size={12} className="text-amber-500" />}
            <span className="text-xs text-stone-500">{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Choropleth map panel ─────────────────────────────────────────────────────
function ChoroplethPanel({ provinces }: { provinces: ProvinceKPI[] }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map size={16} className="text-primary" />
          <span className="font-semibold text-stone-800 text-sm">Couverture DTC3 par province</span>
        </div>
        <span className="text-xs text-stone-400">Cercles proportionnels aux enfants ciblés</span>
      </div>

      <div style={{ height: 380 }}>
        <MapContainer
          center={[15.45, 18.73]}
          zoom={5}
          style={{ height: '100%', width: '100%', background: '#F5F5F4' }}
          scrollWheelZoom={false}
          zoomControl
        >
          <TileLayer
            attribution='&copy; OSM &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          />
          {provinces.map((p) => {
            const r = Math.max(8, Math.min(28, Math.sqrt(p.totalChildren / 600)));
            const color = getCoverageColor(p.dtc3Coverage);
            return (
              <CircleMarker
                key={p.provinceId}
                center={[p.lat, p.lng]}
                radius={r}
                pathOptions={{ color, weight: 1.5, fillColor: color, fillOpacity: 0.75 }}
              >
                <Popup>
                  <div style={{ minWidth: 190, fontFamily: 'sans-serif' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{p.provinceName}</div>
                    <div style={{ fontSize: 11, color: '#78716c', lineHeight: 1.7 }}>
                      <div>DTC3 : <strong style={{ color }}>{p.dtc3Coverage}%</strong> — {getCoverageTier(p.dtc3Coverage)}</div>
                      <div>BCG : {p.bcgCoverage}% · VPO : {p.vpoCoverage}%</div>
                      <div>Rougeole : {p.rougeoleCoverage}%</div>
                      <div>Enfants ciblés : {p.totalChildren.toLocaleString('fr-FR')}</div>
                      <div>Enfants manqués : <strong style={{ color: '#DC2626' }}>{p.missedChildren.toLocaleString('fr-FR')}</strong></div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-stone-100 flex flex-wrap gap-3">
        {[
          { label: '≥ 90%', color: '#16A34A' },
          { label: '80–89%', color: '#65A30D' },
          { label: '70–79%', color: '#CA8A04' },
          { label: '50–69%', color: '#EA580C' },
          { label: '< 50%', color: '#DC2626' },
        ].map((t) => (
          <div key={t.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
            <span className="text-xs text-stone-600">{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Heatmap panel ────────────────────────────────────────────────────────────
function HeatmapPanel() {
  const data = useMemo(() => getHeatmapData(), []);
  const provinces = [...new Set(data.map((d) => d.province))];
  const antigens = [...new Set(data.map((d) => d.antigen))];

  function heatColor(cov: number): string {
    if (cov >= 90) return '#16A34A';
    if (cov >= 80) return '#65A30D';
    if (cov >= 70) return '#CA8A04';
    if (cov >= 50) return '#EA580C';
    return '#DC2626';
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
        <BarChart2 size={16} className="text-primary" />
        <span className="font-semibold text-stone-800 text-sm">Heatmap couverture — Provinces pilotes</span>
      </div>
      <div className="p-4 overflow-x-auto">
        <table className="w-full text-center border-separate" style={{ borderSpacing: 3 }}>
          <thead>
            <tr>
              <th className="text-xs text-stone-500 font-medium text-left pr-2 pb-1">Province</th>
              {antigens.map((a) => (
                <th key={a} className="text-xs text-stone-500 font-medium pb-1 px-1">{a}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {provinces.map((prov) => (
              <tr key={prov}>
                <td className="text-xs text-stone-700 font-medium text-left pr-2 py-1">{prov}</td>
                {antigens.map((ant) => {
                  const row = data.find((d) => d.province === prov && d.antigen === ant);
                  const cov = row?.coverage ?? 0;
                  return (
                    <td key={ant} className="rounded" style={{ background: heatColor(cov), padding: '6px 8px' }}>
                      <span className="text-xs font-bold text-white">{cov}%</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Province data table ──────────────────────────────────────────────────────
const PROVINCE_COLUMNS: ColumnDef<ProvinceKPI, any>[] = [
  {
    accessorKey: 'provinceName',
    header: 'Province',
    cell: (info) => <span className="font-medium text-stone-900">{info.getValue() as string}</span>,
  },
  {
    accessorKey: 'dtc3Coverage',
    header: 'DTC3',
    cell: (info) => {
      const p = info.row.original;
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-stone-100 rounded-full h-1.5 w-16">
            <div
              className="h-1.5 rounded-full"
              style={{ width: `${p.dtc3Coverage}%`, background: getCoverageColor(p.dtc3Coverage) }}
            />
          </div>
          <span className="text-xs font-semibold" style={{ color: getCoverageColor(p.dtc3Coverage) }}>
            {p.dtc3Coverage}%
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'bcgCoverage',
    header: 'BCG',
    cell: (info) => <span className="text-xs">{info.getValue() as number}%</span>,
  },
  {
    accessorKey: 'rougeoleCoverage',
    header: 'Rougeole',
    cell: (info) => <span className="text-xs">{info.getValue() as number}%</span>,
  },
  {
    accessorKey: 'missedChildren',
    header: 'Enfants manqués',
    cell: (info) => {
      const v = info.getValue() as number;
      return (
        <span className={`text-xs font-medium ${v > 5000 ? 'text-red-600' : 'text-stone-600'}`}>
          {v.toLocaleString('fr-FR')}
        </span>
      );
    },
  },
  {
    accessorKey: 'trend',
    header: 'Tendance',
    cell: (info) => {
      const p = info.row.original;
      return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
          p.trend === 'up' ? 'bg-green-50 text-green-700' :
          p.trend === 'down' ? 'bg-red-50 text-red-700' :
          'bg-amber-50 text-amber-700'
        }`}>
          {p.trend === 'up' ? <TrendingUp size={11} /> : p.trend === 'down' ? <TrendingDown size={11} /> : <Minus size={11} />}
          {p.trend === 'up' ? 'Hausse' : p.trend === 'down' ? 'Baisse' : 'Stable'}
        </span>
      );
    },
  },
];

// ─── Main page ────────────────────────────────────────────────────────────────
type Tab = 'pilotage' | 'analyse';
type ChartAntigen = 'DTC3' | 'BCG' | 'VPO' | 'Rougeole' | 'PCV13';

const ANTIGEN_COLORS: Record<string, string> = {
  DTC3: '#1E5BA8', BCG: '#16A34A', VPO: '#9333EA', Rougeole: '#EA580C', PCV13: '#CA8A04',
};

export default function ExecutifPage() {
  const [tab, setTab] = useState<Tab>('pilotage');
  const [chartAntigen, setChartAntigen] = useState<ChartAntigen>('DTC3');
  const [showAllProvinces, setShowAllProvinces] = useState(false);

  const nat = mockNationalSummary;
  const provinces = useMemo(
    () => [...mockProvinceKPIs].sort((a, b) => b.dtc3Coverage - a.dtc3Coverage),
    [],
  );
  const displayedProvinces = showAllProvinces ? provinces : provinces.slice(0, 10);

  const trendSeries = useMemo(
    () => getMonthlySeriesForAntigen(chartAntigen, 'all').map((r) => ({
      ...r, month: shortMonth(r.month),
    })),
    [chartAntigen],
  );

  const barData = useMemo(
    () => provinces.slice(0, 12).map((p) => ({
      name: p.provinceName.split('-')[0].trim(),
      DTC3: p.dtc3Coverage,
      BCG: p.bcgCoverage,
    })),
    [provinces],
  );

  const scatterData = useMemo(() => getScatterData(), []);

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Tableau de bord exécutif</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Données vaccinales au 14 mai 2026 · Tchad — 23 provinces
          </p>
        </div>
        <div className="flex bg-stone-100 rounded-lg p-1 gap-1 self-start sm:self-auto">
          <button
            onClick={() => setTab('pilotage')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === 'pilotage' ? 'bg-white text-primary shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Pilotage
          </button>
          <button
            onClick={() => setTab('analyse')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === 'analyse' ? 'bg-white text-primary shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Analyse
          </button>
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="DTC3 national"
          value={`${nat.dtc3NationalCoverage}%`}
          sub="Objectif OMS : 90%"
          trend={nat.dtc3NationalCoverage >= 80 ? 'up' : 'down'}
          color="#1E5BA8"
          icon={<Target size={18} />}
        />
        <KpiCard
          label="BCG national"
          value={`${nat.bcgNationalCoverage}%`}
          sub="Couverture nationale"
          trend="up"
          color="#16A34A"
          icon={<Activity size={18} />}
        />
        <KpiCard
          label="Enfants ciblés"
          value={Math.round(nat.totalChildren / 1000) + 'k'}
          sub={`${Math.round(nat.totalVaccinated / 1000)}k vaccinés`}
          color="#9333EA"
          icon={<Users size={18} />}
        />
        <KpiCard
          label="Missions actives"
          value={nat.activeMissions}
          sub={`${nat.activeTeams} équipes terrain`}
          color="#EA580C"
          icon={<Activity size={18} />}
        />
        <KpiCard
          label="Provinces ≥ 80%"
          value={nat.provincesAbove80}
          sub={`${nat.provincesBelow50} provinces critiques (<50%)`}
          trend={nat.provincesAbove80 >= 10 ? 'up' : 'down'}
          color="#CA8A04"
          icon={<AlertTriangle size={18} />}
        />
        <KpiCard
          label="Contacts nomades"
          value={nat.nomadContactsYTD}
          sub="Depuis janvier 2026"
          trend="up"
          color="#E11D74"
          icon={<Tent size={18} />}
        />
      </div>

      {/* ── PILOTAGE TAB ─────────────────────────────────────────────────────── */}
      {tab === 'pilotage' && (
        <div className="space-y-4">
          {/* Map + Trend line side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChoroplethPanel provinces={provinces} />

            {/* Trend line chart */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
              <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary" />
                  <span className="font-semibold text-stone-800 text-sm">Évolution mensuelle — Provinces pilotes</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(['DTC3', 'BCG', 'VPO', 'Rougeole', 'PCV13'] as ChartAntigen[]).map((a) => (
                    <button
                      key={a}
                      onClick={() => setChartAntigen(a)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors border ${
                        chartAntigen === a
                          ? 'text-white border-transparent'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                      }`}
                      style={chartAntigen === a ? { background: ANTIGEN_COLORS[a], borderColor: ANTIGEN_COLORS[a] } : {}}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendSeries} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0efed" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <RCTooltip formatter={(v: number) => [`${v}%`, chartAntigen]} />
                    <ReferenceLine y={90} stroke="#16A34A" strokeDasharray="4 3" label={{ value: 'OMS 90%', position: 'insideTopLeft', fontSize: 10, fill: '#16A34A' }} />
                    <ReferenceLine y={80} stroke="#CA8A04" strokeDasharray="4 3" label={{ value: '80%', position: 'insideTopLeft', fontSize: 10, fill: '#CA8A04' }} />
                    <Line
                      type="monotone"
                      dataKey="coverage"
                      stroke={ANTIGEN_COLORS[chartAntigen]}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: ANTIGEN_COLORS[chartAntigen] }}
                      activeDot={{ r: 5 }}
                      name={chartAntigen}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Province DataTable */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <span className="font-semibold text-stone-800 text-sm">Couverture par province (DTC3)</span>
              <span className="text-xs text-stone-400">{provinces.length} provinces</span>
            </div>
            <DataTable
              data={displayedProvinces}
              columns={PROVINCE_COLUMNS}
              getRowKey={(p) => p.provinceId}
            />
            {provinces.length > 10 && (
              <div className="px-4 py-2.5 border-t border-stone-100 flex justify-center">
                <button
                  onClick={() => setShowAllProvinces((v) => !v)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  {showAllProvinces ? <><ChevronUp size={14} /> Réduire</> : <><ChevronDown size={14} /> Voir toutes les provinces ({provinces.length})</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ANALYSE TAB ──────────────────────────────────────────────────────── */}
      {tab === 'analyse' && (
        <div className="space-y-4">
          {/* Bar chart + heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Grouped bar chart */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
              <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
                <BarChart2 size={16} className="text-primary" />
                <span className="font-semibold text-stone-800 text-sm">DTC3 vs BCG — Top 12 provinces</span>
              </div>
              <div className="p-4" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 4, right: 8, left: -25, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0efed" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <RCTooltip formatter={(v: number, name: string) => [`${v}%`, name]} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <ReferenceLine y={90} stroke="#16A34A" strokeDasharray="4 3" />
                    <Bar dataKey="DTC3" fill="#1E5BA8" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="BCG" fill="#16A34A" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <HeatmapPanel />
          </div>

          {/* Scatter + summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Scatter: coverage vs missed */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
              <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
                <Activity size={16} className="text-primary" />
                <span className="font-semibold text-stone-800 text-sm">Couverture DTC3 vs Enfants manqués</span>
              </div>
              <div className="p-4" style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0efed" />
                    <XAxis
                      type="number"
                      dataKey="coverage"
                      name="DTC3"
                      domain={[20, 100]}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${v}%`}
                      label={{ value: 'Couverture DTC3 (%)', position: 'insideBottom', offset: -2, fontSize: 11 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="missed"
                      name="Enfants manqués"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    />
                    <RCTooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const d = payload[0].payload as { name: string; coverage: number; missed: number };
                        return (
                          <div className="bg-white border border-stone-200 rounded-lg p-2 text-xs shadow-lg">
                            <div className="font-semibold text-stone-800 mb-1">{d.name}</div>
                            <div className="text-stone-600">DTC3 : {d.coverage}%</div>
                            <div className="text-red-600">Manqués : {d.missed.toLocaleString('fr-FR')}</div>
                          </div>
                        );
                      }}
                    />
                    <ReferenceLine x={80} stroke="#CA8A04" strokeDasharray="4 3" />
                    <Scatter
                      data={scatterData}
                      fill="#1E5BA8"
                      fillOpacity={0.7}
                      shape={(props: { cx?: number; cy?: number; payload?: { coverage: number } }) => {
                        const { cx = 0, cy = 0, payload } = props;
                        const color = getCoverageColor(payload?.coverage ?? 0);
                        return <circle cx={cx} cy={cy} r={6} fill={color} fillOpacity={0.8} stroke={color} strokeWidth={1} />;
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary alert panel */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
              <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <span className="font-semibold text-stone-800 text-sm">Points d'attention prioritaires</span>
              </div>
              <div className="p-4 space-y-3">
                {/* Bottom provinces alert */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                    <AlertTriangle size={12} /> Provinces critiques (&lt; 50% DTC3)
                  </div>
                  {provinces.filter((p) => p.dtc3Coverage < 50).map((p) => (
                    <div key={p.provinceId} className="flex items-center justify-between text-xs mb-1">
                      <span className="text-stone-700">{p.provinceName}</span>
                      <span className="font-bold text-red-600">{p.dtc3Coverage}%</span>
                    </div>
                  ))}
                </div>

                {/* Missed children */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                    <Users size={12} /> Enfants non vaccinés (DTC3)
                  </div>
                  <div className="text-2xl font-bold text-amber-700">
                    {mockProvinceKPIs.reduce((s, p) => s + p.missedChildren, 0).toLocaleString('fr-FR')}
                  </div>
                  <div className="text-xs text-amber-600 mt-0.5">
                    sur {mockNationalSummary.totalChildren.toLocaleString('fr-FR')} enfants ciblés nationalement
                  </div>
                </div>

                {/* OMS target progress */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-blue-700 mb-2">Progression vers l'objectif OMS 90%</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-blue-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-600 transition-all"
                        style={{ width: `${Math.min(100, (nat.dtc3NationalCoverage / 90) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-blue-700">{nat.dtc3NationalCoverage}% / 90%</span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {nat.provincesAbove80} provinces ≥ 80% · Objectif : toutes les 23 provinces
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
