import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Package, Thermometer, ClipboardList, RotateCcw, Archive, TrendingUp,
  AlertTriangle, XCircle, AlertCircle, CheckCircle2, Truck, Clock,
} from 'lucide-react';
import { TileCard } from '../components/data/TileCard';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import { mockStock } from '../data/mockStock';
import { mockAllocations } from '../data/mockAllocations';

const NOW = Date.now();
const DAY = 86_400_000;

const ALERTS = [
  {
    id: 'a1',
    level: 'critical' as const,
    title: 'Rupture VPO — Province du Kanem',
    description: 'Aucune dose disponible · Approvisionnement national bloqué',
    time: 'Il y a 2 jours',
  },
  {
    id: 'a2',
    level: 'critical' as const,
    title: 'Rupture Rougeole — Province Hadjer-Lamis',
    description: 'Stock épuisé · 14 villages non couverts',
    time: 'Il y a 3 jours',
  },
  {
    id: 'a3',
    level: 'warning' as const,
    title: 'Péremption DTC — Lot DTC-2025-112 (Kanem)',
    description: 'Expiration dans 25 jours · 1 000 doses concernées',
    time: 'Aujourd\'hui',
  },
  {
    id: 'a4',
    level: 'warning' as const,
    title: 'Chaîne du froid dégradée — CdS Liwa Nord',
    description: 'Réfrigérateur HS · 61 doses BCG perdues',
    time: 'Il y a 12 jours',
  },
  {
    id: 'a5',
    level: 'warning' as const,
    title: 'Inventaire incomplet — 2 équipements manquants',
    description: 'Thermomètre CS Ngouri + Mégaphone CdS Liwa Nord',
    time: 'Il y a 45 jours',
  },
];

const ALERT_STYLES = {
  critical: { bg: 'bg-danger/5 border-danger/20', icon: XCircle, iconColor: 'text-danger' },
  warning: { bg: 'bg-warning/5 border-warning/20', icon: AlertCircle, iconColor: 'text-warning' },
  info: { bg: 'bg-primary/5 border-primary/20', icon: CheckCircle2, iconColor: 'text-primary' },
};

export default function LogistiqueHubPage() {
  const navigate = useNavigate();

  const kpis = useMemo(() => {
    const totalDoses = mockStock
      .filter((s) => s.level !== 'national' && s.status !== 'expired')
      .reduce((sum, s) => sum + s.quantityAvailable, 0);
    const shortageCount = mockStock.filter((s) => s.status === 'shortage').length;
    const expiryAlerts = mockStock.filter(
      (s) => s.expiryDate.getTime() - NOW < 30 * DAY && s.quantityAvailable > 0,
    ).length;
    const reserved = mockAllocations.filter((a) => a.status === 'reserved').length;
    const inMission = mockAllocations.filter((a) => a.status === 'in_mission').length;
    return { totalDoses, shortageCount, reserved, inMission, alertCount: shortageCount + expiryAlerts };
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Logistique</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-xl font-bold text-stone-900 mt-1">Logistique et Ressources</h1>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total doses */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-2">
          <div className="flex items-start justify-between">
            <span className="text-sm text-stone-500 font-medium">Stock vaccins (doses)</span>
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Package size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">{kpis.totalDoses.toLocaleString('fr-FR')}</div>
          <div className="text-xs text-stone-500">doses disponibles (hors national)</div>
          {kpis.shortageCount > 0 && (
            <div className="flex items-center gap-1 text-xs font-medium text-danger">
              <AlertTriangle size={12} />
              {kpis.shortageCount} rupture{kpis.shortageCount > 1 ? 's' : ''} détectée{kpis.shortageCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Reserved */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-2">
          <div className="flex items-start justify-between">
            <span className="text-sm text-stone-500 font-medium">En attente chargement</span>
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">{kpis.reserved}</div>
          <div className="text-xs text-stone-500">allocations réservées</div>
        </div>

        {/* In mission */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-2">
          <div className="flex items-start justify-between">
            <span className="text-sm text-stone-500 font-medium">En mission</span>
            <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center flex-shrink-0">
              <Truck size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">{kpis.inMission}</div>
          <div className="text-xs text-stone-500">équipes actuellement sur le terrain</div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-2">
          <div className="flex items-start justify-between">
            <span className="text-sm text-stone-500 font-medium">Alertes stock</span>
            <div className="w-9 h-9 rounded-lg bg-danger/10 text-danger flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">{kpis.alertCount}</div>
          <div className="text-xs text-stone-500">péremptions + ruptures</div>
        </div>
      </div>

      {/* Module tiles */}
      <div>
        <h2 className="text-sm font-semibold text-stone-700 mb-3 uppercase tracking-wide">Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <TileCard
            icon={Package}
            title="Stocks vaccins"
            subtitle="Gestion des doses par antigène"
            count={`${mockStock.length} lots`}
            info={`${kpis.totalDoses.toLocaleString('fr-FR')} doses disponibles`}
            warningInfo={kpis.shortageCount > 0 ? `${kpis.shortageCount} ruptures de stock` : undefined}
            warningIcon={kpis.shortageCount > 0 ? AlertTriangle : undefined}
            status={kpis.shortageCount > 0 ? 'warning' : 'success'}
            href="/logistique/stock"
          />
          <TileCard
            icon={Thermometer}
            title="Chaîne du froid"
            subtitle="Équipements frigorifiques"
            count="18 équipements"
            info="14 opérationnels · 2 dégradés"
            warningInfo="2 pannes signalées ce mois"
            warningIcon={AlertTriangle}
            status="warning"
            href="/logistique/chaine-froid"
          />
          <TileCard
            icon={ClipboardList}
            title="Allocations"
            subtitle="Ressources par campagne"
            count={`${mockAllocations.length} allocations`}
            info={`${kpis.inMission} en mission · ${kpis.reserved} en attente`}
            status={kpis.reserved > 0 ? 'warning' : 'success'}
            href="/logistique/allocations"
          />
          <TileCard
            icon={RotateCcw}
            title="Restitutions"
            subtitle="Retours terrain et bilans"
            count="3 retours"
            info="Dernière restitution il y a 18 jours"
            status="success"
            href="/logistique/restitutions"
          />
          <TileCard
            icon={Archive}
            title="Inventaire"
            subtitle="Équipements non-consommables"
            count="15 équipements"
            info="13 opérationnels · 2 manquants"
            warningInfo="2 équipements non localisés"
            warningIcon={AlertTriangle}
            status="warning"
            href="/logistique/inventaire"
          />
          <TileCard
            icon={TrendingUp}
            title="Prévisions"
            subtitle="Planification des besoins futurs"
            count="Sprint 6"
            info="Disponible prochainement"
            status="success"
            href="/logistique/previsions"
          />
        </div>
      </div>

      {/* Alerts section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-danger" />
            Alertes logistiques
          </CardTitle>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="space-y-2">
            {ALERTS.map((a) => {
              const s = ALERT_STYLES[a.level];
              const Icon = s.icon;
              return (
                <div key={a.id} className={`flex gap-3 p-3 rounded-lg border ${s.bg}`}>
                  <Icon size={16} className={`flex-shrink-0 mt-0.5 ${s.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-stone-800">{a.title}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">{a.description}</div>
                  </div>
                  <span className="text-[10px] text-stone-400 flex-shrink-0 mt-0.5">{a.time}</span>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
