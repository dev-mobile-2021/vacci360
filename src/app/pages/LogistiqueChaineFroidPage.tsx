import { useState, useMemo } from 'react';
import { Wrench, AlertTriangle, CheckCircle2, Clock, Thermometer, MoreVertical } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../lib/toast';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import { getFacilities } from '../data/mockFacilities';
import type { ColdChainEquipment } from '../types/facility';

const NOW = Date.now();
const DAY = 86_400_000;

// Augment with facility context
type EquipmentRow = ColdChainEquipment & {
  facilityName: string;
  facilityId: string;
  mockTemp: number; // simulated current temperature
};

function getEquipmentRows(): EquipmentRow[] {
  const facilities = getFacilities().filter((f) => f.provinceId === 'td-lac' || f.provinceId === 'td-kanem');
  const rows: EquipmentRow[] = [];
  facilities.forEach((f) => {
    f.coldChainEquipments.forEach((eq) => {
      const tempOffset = eq.status === 'operational' ? (Math.random() * 4 + 2) : (Math.random() * 10 + 8);
      rows.push({
        ...eq,
        facilityName: f.name,
        facilityId: f.id,
        mockTemp: Math.round(tempOffset * 10) / 10,
      });
    });
  });
  return rows;
}

const EQUIPMENT_TYPE_LABEL: Record<ColdChainEquipment['type'], string> = {
  refrigerator: 'Réfrigérateur',
  freezer: 'Congélateur',
  cold_box: 'Boîte froide',
  vaccine_carrier: 'Porte-vaccins',
};

const STATUS_STYLES: Record<ColdChainEquipment['status'], { badge: string; dot: string; label: string }> = {
  operational: { badge: 'bg-success/10 text-success-700', dot: 'bg-success', label: 'Opérationnel' },
  degraded: { badge: 'bg-warning/10 text-warning-700', dot: 'bg-warning animate-pulse', label: 'Dégradé' },
  broken: { badge: 'bg-danger/10 text-danger-700', dot: 'bg-danger', label: 'En panne' },
  maintenance: { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', label: 'Maintenance' },
};

function ReportBreakdownModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const equipmentRows = useMemo(() => getEquipmentRows(), []);
  const [form, setForm] = useState({
    equipmentId: '',
    breakdownType: '',
    description: '',
    urgency: 'normal' as 'normal' | 'critical',
  });

  const handleSubmit = () => {
    if (form.urgency === 'critical') {
      toast({
        type: 'danger',
        title: 'Panne critique signalée',
        description: 'Équipe technique notifiée automatiquement. Intervention prioritaire requise.',
      });
    } else {
      toast({
        type: 'success',
        title: 'Panne signalée',
        description: 'Équipe technique notifiée. Intervention planifiée sous 48h.',
      });
    }
    onClose();
    setForm({ equipmentId: '', breakdownType: '', description: '', urgency: 'normal' });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Signaler une panne"
      width={460}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button
            size="sm"
            variant={form.urgency === 'critical' ? 'destructive' : 'default'}
            disabled={!form.equipmentId || !form.breakdownType}
            onClick={handleSubmit}
          >
            Signaler la panne
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Équipement concerné *</label>
          <select
            className="w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.equipmentId}
            onChange={(e) => setForm((f) => ({ ...f, equipmentId: e.target.value }))}
          >
            <option value="">Sélectionner...</option>
            {equipmentRows.slice(0, 12).map((eq) => (
              <option key={eq.id} value={eq.id}>
                {EQUIPMENT_TYPE_LABEL[eq.type]} — {eq.facilityName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Type de panne *</label>
          <select
            className="w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.breakdownType}
            onChange={(e) => setForm((f) => ({ ...f, breakdownType: e.target.value }))}
          >
            <option value="">Sélectionner...</option>
            <option value="compressor">Compresseur défaillant</option>
            <option value="thermostat">Thermostat HS</option>
            <option value="power">Problème alimentation électrique</option>
            <option value="door_seal">Joint de porte endommagé</option>
            <option value="display">Affichage / capteur</option>
            <option value="other">Autre</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Description</label>
          <textarea
            rows={3}
            className="w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            placeholder="Décrivez la panne observée..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-2">Niveau d'urgence</label>
          <div className="flex gap-3">
            {(['normal', 'critical'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setForm((f) => ({ ...f, urgency: lvl }))}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  form.urgency === lvl
                    ? lvl === 'critical'
                      ? 'bg-danger/10 border-danger/40 text-danger-700'
                      : 'bg-primary/10 border-primary/30 text-primary-700'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {lvl === 'normal' ? 'Normal (48h)' : '🚨 Critique (immédiat)'}
              </button>
            ))}
          </div>
          {form.urgency === 'critical' && (
            <p className="text-xs text-danger mt-2">
              Une notification sera envoyée automatiquement au gestionnaire provincial.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function LogistiqueChaineFroidPage() {
  const [reportOpen, setReportOpen] = useState(false);
  const { toast } = useToast();

  const equipmentRows = useMemo(() => getEquipmentRows(), []);

  const kpis = useMemo(() => {
    const total = equipmentRows.length;
    const operational = equipmentRows.filter((e) => e.status === 'operational').length;
    const tempAlerts = equipmentRows.filter((e) => e.mockTemp > 8).length;
    const maintenanceDue = equipmentRows.filter(
      (e) => e.nextMaintenanceDue && e.nextMaintenanceDue.getTime() < NOW,
    ).length;
    return { total, operational, tempAlerts, maintenanceDue };
  }, [equipmentRows]);

  return (
    <div className="space-y-5 pb-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/logistique">Logistique</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Chaîne du froid</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-xl font-bold text-stone-900">Chaîne du froid</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast({ type: 'info', title: 'Maintenance planifiée', description: 'Fonctionnalité disponible dans Sprint 6.' })}>
              <Clock size={14} /> Planifier maintenance
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setReportOpen(true)}>
              <AlertTriangle size={14} /> Signaler panne
            </Button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-stone-500">Équipements opérationnels</span>
            <CheckCircle2 size={16} className="text-success" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{kpis.operational}<span className="text-base font-normal text-stone-400">/{kpis.total}</span></div>
          <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full"
              style={{ width: `${(kpis.operational / Math.max(kpis.total, 1)) * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-stone-500">Alertes température</span>
            <Thermometer size={16} className="text-danger" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{kpis.tempAlerts}</div>
          <div className="text-xs text-stone-500 mt-1">équipements hors plage 2–8°C</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-stone-500">Maintenance dépassée</span>
            <Wrench size={16} className="text-warning" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{kpis.maintenanceDue}</div>
          <div className="text-xs text-stone-500 mt-1">date de maintenance dépassée</div>
        </div>
      </div>

      {/* Equipment table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-800">Équipements frigorifiques ({equipmentRows.length})</h2>
          <span className="text-xs text-stone-400">Provinces du Lac + Kanem</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                {[
                  'FOSA', 'Type', 'Marque/Modèle', 'Capacité', 'Statut',
                  'Dernière maintenance', 'Prochaine maintenance', 'Temp. actuelle', '',
                ].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {equipmentRows.map((eq) => {
                const s = STATUS_STYLES[eq.status];
                const maintenanceOverdue = eq.nextMaintenanceDue && eq.nextMaintenanceDue.getTime() < NOW;
                const tempOk = eq.mockTemp >= 2 && eq.mockTemp <= 8;
                return (
                  <tr key={eq.id} className={`border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors ${eq.status === 'broken' ? 'bg-danger/5' : eq.status === 'degraded' ? 'bg-warning/5' : ''}`}>
                    <td className="px-3 py-2.5">
                      <div className="text-xs font-medium text-stone-700">{eq.facilityName}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-stone-600">{EQUIPMENT_TYPE_LABEL[eq.type]}</td>
                    <td className="px-3 py-2.5">
                      <code className="text-[11px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                        {eq.brand || 'N/A'}
                      </code>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-stone-600">{eq.capacity} doses</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${s.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-stone-500">
                      {eq.lastMaintenance
                        ? eq.lastMaintenance.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
                        : <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {eq.nextMaintenanceDue ? (
                        <span className={`text-xs ${maintenanceOverdue ? 'text-danger font-semibold' : 'text-stone-500'}`}>
                          {eq.nextMaintenanceDue.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                          {maintenanceOverdue && <span className="ml-1 text-[10px]">⚠ Dépassée</span>}
                        </span>
                      ) : <span className="text-stone-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-sm font-semibold ${tempOk ? 'text-success' : 'text-danger'}`}>
                        {eq.mockTemp}°C
                      </span>
                      <div className="text-[10px] text-stone-400">plage: 2–8°C</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <button className="p-1 rounded hover:bg-stone-100 text-stone-400">
                        <MoreVertical size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ReportBreakdownModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
