import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ClipboardList, Download, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../lib/toast';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import {
  mockInventory, INVENTORY_STATUS_LABEL, EQUIPMENT_CATEGORY_LABEL,
  type InventoryItem,
} from '../data/mockAllocations';
import { mockStock, ANTIGEN_LIST } from '../data/mockStock';

const STATUS_STYLES: Record<InventoryItem['status'], { badge: string; icon: React.ElementType; iconColor: string }> = {
  operational: { badge: 'bg-success/10 text-success-700', icon: CheckCircle2, iconColor: 'text-success' },
  damaged: { badge: 'bg-warning/10 text-warning-700', icon: AlertTriangle, iconColor: 'text-warning' },
  missing: { badge: 'bg-danger/10 text-danger-700', icon: XCircle, iconColor: 'text-danger' },
};

// ─── Inventory checklist modal ────────────────────────────────────────────────

function InventoryCheckModal({
  open,
  onClose,
  items,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onConfirm: (confirmed: Record<string, boolean>) => void;
}) {
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  const byLocation = useMemo(() => {
    const map = new Map<string, InventoryItem[]>();
    items.forEach((item) => {
      const existing = map.get(item.locationName) ?? [];
      map.set(item.locationName, [...existing, item]);
    });
    return map;
  }, [items]);

  const allChecked = items.every((i) => checks[i.id] !== undefined);
  const presentCount = Object.values(checks).filter(Boolean).length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Lancer l'inventaire"
      width={520}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" disabled={!allChecked} onClick={() => onConfirm(checks)}>
            <CheckCircle2 size={14} /> Valider l'inventaire ({presentCount}/{items.length})
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-stone-600">
          Confirmez la présence physique de chaque équipement par localisation.
        </p>
        {Array.from(byLocation.entries()).map(([loc, locItems]) => (
          <div key={loc}>
            <div className="text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wide">{loc}</div>
            <div className="space-y-1.5 pl-2">
              {locItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChecks((c) => ({ ...c, [item.id]: true }))}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                        checks[item.id] === true
                          ? 'bg-success/10 border-success/30 text-success-700 font-medium'
                          : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      Présent
                    </button>
                    <button
                      onClick={() => setChecks((c) => ({ ...c, [item.id]: false }))}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                        checks[item.id] === false
                          ? 'bg-danger/10 border-danger/30 text-danger-700 font-medium'
                          : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                  <span className="text-xs text-stone-700 flex-1">{item.designation}</span>
                  <code className="text-[10px] text-stone-400">{item.serialNumber}</code>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ─── Forecast section ─────────────────────────────────────────────────────────

function ForecastSection() {
  const navigate = useNavigate();

  const forecasts = useMemo(() => {
    return ANTIGEN_LIST.map((antigen) => {
      const facilityStocks = mockStock.filter(
        (s) => s.antigen === antigen && s.level === 'facility',
      );
      const totalAvailable = facilityStocks.reduce((sum, s) => sum + s.quantityAvailable, 0);
      const avgConsumed = facilityStocks.reduce((sum, s) => sum + s.quantityConsumed, 0) / Math.max(facilityStocks.length, 1);
      const avgPerCampaign = Math.round(avgConsumed * 1.2);
      const campaignsCovered = avgPerCampaign > 0 ? Math.floor(totalAvailable / avgPerCampaign) : 0;
      return { antigen, totalAvailable, avgPerCampaign, campaignsCovered };
    });
  }, []);

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-800">Prévisions basées sur les campagnes passées</h3>
          <p className="text-xs text-stone-400 mt-0.5">Calculées sur la consommation des 6 dernières campagnes</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/logistique/previsions')}
        >
          Voir prévisions détaillées
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100">
              {['Antigène', 'Conso. moy./campagne', 'Stock FOSA disponible', 'Campagnes couvertes', 'Alerte'].map((h) => (
                <th key={h} className="py-2 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide pr-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {forecasts.map((f) => (
              <tr key={f.antigen} className="border-b border-stone-50 last:border-0">
                <td className="py-2 pr-4">
                  <span className="text-sm font-medium text-stone-700">{f.antigen}</span>
                </td>
                <td className="py-2 pr-4 text-sm text-stone-600">
                  ~{f.avgPerCampaign.toLocaleString('fr-FR')} doses
                </td>
                <td className="py-2 pr-4 text-sm text-stone-600">
                  {f.totalAvailable.toLocaleString('fr-FR')} doses
                </td>
                <td className="py-2 pr-4">
                  <span className={`text-sm font-semibold ${f.campaignsCovered < 2 ? 'text-danger' : f.campaignsCovered < 4 ? 'text-warning' : 'text-success'}`}>
                    {f.campaignsCovered} campagne{f.campaignsCovered !== 1 ? 's' : ''}
                  </span>
                </td>
                <td className="py-2">
                  {f.campaignsCovered < 2 && (
                    <span className="flex items-center gap-1 text-[11px] text-danger font-medium">
                      <AlertTriangle size={12} /> Stock critique
                    </span>
                  )}
                  {f.campaignsCovered >= 2 && f.campaignsCovered < 4 && (
                    <span className="flex items-center gap-1 text-[11px] text-warning font-medium">
                      <AlertTriangle size={12} /> Stock faible
                    </span>
                  )}
                  {f.campaignsCovered >= 4 && (
                    <span className="flex items-center gap-1 text-[11px] text-success">
                      <CheckCircle2 size={12} /> OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LogistiqueInventairePage() {
  const { toast } = useToast();
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [items, setItems] = useState(mockInventory);

  const kpis = useMemo(() => {
    const total = items.length;
    const operational = items.filter((i) => i.status === 'operational').length;
    const damaged = items.filter((i) => i.status === 'damaged').length;
    const missing = items.filter((i) => i.status === 'missing').length;
    return { total, operational, damaged, missing };
  }, [items]);

  const handleInventoryConfirm = (checks: Record<string, boolean>) => {
    const now = new Date();
    setItems((prev) =>
      prev.map((item) => {
        if (checks[item.id] === undefined) return item;
        return {
          ...item,
          lastVerifiedAt: now,
          status: checks[item.id] ? 'operational' : 'missing',
        };
      }),
    );
    const missingCount = Object.values(checks).filter((v) => !v).length;
    toast({
      type: missingCount > 0 ? 'warning' : 'success',
      title: 'Inventaire enregistré',
      description: `${Object.values(checks).filter(Boolean).length} équipements présents${missingCount > 0 ? ` · ${missingCount} manquants signalés` : ''}.`,
    });
    setInventoryOpen(false);
  };

  return (
    <div className="space-y-5 pb-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/logistique">Logistique</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Inventaire</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-xl font-bold text-stone-900">Inventaire des équipements</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast({ type: 'info', title: 'Export', description: 'Export CSV disponible dans Sprint 6.' })}>
              <Download size={14} /> Exporter
            </Button>
            <Button size="sm" onClick={() => setInventoryOpen(true)}>
              <ClipboardList size={14} /> Lancer inventaire
            </Button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total équipements', value: kpis.total, color: 'text-stone-800' },
          { label: 'Opérationnels', value: kpis.operational, color: 'text-success' },
          { label: 'Endommagés', value: kpis.damaged, color: 'text-warning' },
          { label: 'Manquants', value: kpis.missing, color: 'text-danger' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="text-xs text-stone-500 mb-1">{k.label}</div>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Equipment table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-stone-800">Équipements non-consommables</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                {['Catégorie', 'Désignation', 'N° Série', 'Localisation', 'Statut', 'Dernière vérif.', 'Assigné à', ''].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const s = STATUS_STYLES[item.status];
                const Icon = s.icon;
                return (
                  <tr key={item.id} className={`border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors ${item.status === 'missing' ? 'bg-danger/5' : ''}`}>
                    <td className="px-3 py-2.5">
                      <span className="text-[11px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                        {EQUIPMENT_CATEGORY_LABEL[item.type]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-stone-700">{item.designation}</td>
                    <td className="px-3 py-2.5">
                      <code className="text-[11px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">{item.serialNumber}</code>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-stone-600">{item.locationName}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${s.badge}`}>
                        <Icon size={11} className={s.iconColor} />
                        {INVENTORY_STATUS_LABEL[item.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-stone-500 whitespace-nowrap">
                      {item.lastVerifiedAt
                        ? item.lastVerifiedAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
                        : <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-stone-500">
                      {item.assignedTeamName ?? <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <button className="text-[11px] text-primary hover:underline" onClick={() => toast({ type: 'info', title: 'Détail équipement', description: 'Détails complets disponibles Sprint 6.' })}>
                        Voir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forecast section */}
      <ForecastSection />

      <InventoryCheckModal
        open={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
        items={items}
        onConfirm={handleInventoryConfirm}
      />
    </div>
  );
}
