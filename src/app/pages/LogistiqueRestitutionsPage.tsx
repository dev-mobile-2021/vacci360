import { useState, useMemo } from 'react';
import { Plus, AlertTriangle, CheckCircle2, Package } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../lib/toast';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import {
  mockAllocations, ALLOCATION_STATUS_LABEL, type Allocation,
} from '../data/mockAllocations';
import { ANTIGEN_COLORS } from '../data/mockStock';

const MATERIAL_ITEMS = [
  'Porte-vaccins',
  'Glacières',
  'Tablette collecte données',
  'GPS',
  'Documents mission',
];

const WASTE_REASONS = [
  'Rupture chaîne du froid',
  'Flacon entamé non utilisé',
  'Périmé pendant la mission',
  'Autre',
];

type VaccineRestitution = {
  antigenId: string;
  quantityAllocated: number;
  dosesUsed: number;
  dosesReturned: number;
  dosesWasted: number;
  wasteReason: string;
};

function ReturnModal({
  open,
  onClose,
  inMissionAllocations,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  inMissionAllocations: Allocation[];
  onSubmit: (allocationId: string, report: NonNullable<Allocation['returnReport']>) => void;
}) {
  const { toast } = useToast();
  const [selectedAlloc, setSelectedAlloc] = useState('');
  const [vaccines, setVaccines] = useState<VaccineRestitution[]>([]);
  const [materials, setMaterials] = useState<Record<string, boolean>>({});
  const [justification, setJustification] = useState('');

  const alloc = inMissionAllocations.find((a) => a.id === selectedAlloc) ?? null;

  // When allocation changes, reset vaccines
  const handleAllocChange = (id: string) => {
    setSelectedAlloc(id);
    const a = inMissionAllocations.find((x) => x.id === id);
    if (a) {
      setVaccines(
        a.vaccines.map((v) => ({
          antigenId: v.antigenId,
          quantityAllocated: v.quantityLoaded ?? v.quantityReserved,
          dosesUsed: 0,
          dosesReturned: 0,
          dosesWasted: 0,
          wasteReason: '',
        })),
      );
    }
  };

  const updateVaccine = (idx: number, field: keyof VaccineRestitution, value: number | string) => {
    setVaccines((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  };

  const totals = useMemo(() => {
    return vaccines.reduce(
      (acc, v) => ({
        used: acc.used + v.dosesUsed,
        returned: acc.returned + v.dosesReturned,
        wasted: acc.wasted + v.dosesWasted,
        allocated: acc.allocated + v.quantityAllocated,
      }),
      { used: 0, returned: 0, wasted: 0, allocated: 0 },
    );
  }, [vaccines]);

  const gap = totals.allocated - totals.used - totals.returned - totals.wasted;
  const needsJustification = gap > 0;
  const hasWaste = vaccines.some((v) => v.dosesWasted > 0);
  const missingWasteReason = hasWaste && vaccines.some((v) => v.dosesWasted > 0 && !v.wasteReason);

  const canSubmit =
    selectedAlloc &&
    vaccines.length > 0 &&
    (!needsJustification || justification.trim()) &&
    !missingWasteReason;

  const handleSubmit = () => {
    onSubmit(selectedAlloc, {
      dosesUsed: totals.used,
      dosesReturned: totals.returned,
      dosesWasted: totals.wasted,
      wasteReason: vaccines.find((v) => v.wasteReason)?.wasteReason,
      materialsReturned: Object.values(materials).every(Boolean),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enregistrer une restitution"
      width={560}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" disabled={!canSubmit} onClick={handleSubmit}>
            <CheckCircle2 size={14} /> Valider la restitution
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Allocation selector */}
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Allocation concernée *</label>
          <select
            className="w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            value={selectedAlloc}
            onChange={(e) => handleAllocChange(e.target.value)}
          >
            <option value="">Sélectionner une mission en cours...</option>
            {inMissionAllocations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.teamName} — {a.campaignName}
              </option>
            ))}
          </select>
        </div>

        {/* Vaccine breakdown */}
        {vaccines.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-stone-700 mb-2">Décompte par antigène</div>
            <div className="space-y-3">
              {vaccines.map((v, idx) => (
                <div key={v.antigenId} className="bg-stone-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: ANTIGEN_COLORS[v.antigenId] ?? '#78716C' }}
                    />
                    <span className="text-xs font-semibold text-stone-700">{v.antigenId}</span>
                    <span className="text-[11px] text-stone-400 ml-auto">Alloué : {v.quantityAllocated} doses</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['dosesUsed', 'dosesReturned', 'dosesWasted'] as const).map((field) => (
                      <div key={field}>
                        <label className="block text-[11px] text-stone-500 mb-1">
                          {field === 'dosesUsed' ? 'Utilisées' : field === 'dosesReturned' ? 'Retournées' : 'Gâchées'}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={v.quantityAllocated}
                          className="w-full text-sm border border-stone-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                          value={v[field]}
                          onChange={(e) => updateVaccine(idx, field, Number(e.target.value))}
                        />
                      </div>
                    ))}
                  </div>
                  {v.dosesWasted > 0 && (
                    <div>
                      <label className="block text-[11px] text-danger mb-1">Motif gaspillage *</label>
                      <select
                        className="w-full text-xs border border-danger/30 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-danger"
                        value={v.wasteReason}
                        onChange={(e) => updateVaccine(idx, 'wasteReason', e.target.value)}
                      >
                        <option value="">Sélectionner...</option>
                        {WASTE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Écart */}
            <div className={`mt-3 p-3 rounded-lg border ${gap > 0 ? 'bg-warning/5 border-warning/30' : 'bg-success/5 border-success/30'}`}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-stone-700">Écart calculé</span>
                <span className={`font-bold ${gap > 0 ? 'text-warning' : 'text-success'}`}>
                  {gap > 0 ? `+${gap}` : gap} doses
                </span>
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                {totals.allocated} alloués − {totals.used} utilisés − {totals.returned} retournés − {totals.wasted} gâchés
              </div>
            </div>

            {needsJustification && (
              <div className="mt-2">
                <label className="block text-xs font-medium text-warning mb-1">
                  Justification de l'écart * (obligatoire)
                </label>
                <textarea
                  rows={2}
                  className="w-full text-sm border border-warning/40 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-warning resize-none"
                  placeholder="Expliquez l'écart constaté..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* Materials checklist */}
        {vaccines.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-stone-700 mb-2">Matériel retourné</div>
            <div className="space-y-1.5">
              {MATERIAL_ITEMS.map((item) => (
                <label key={item} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={materials[item] ?? false}
                    onChange={(e) => setMaterials((m) => ({ ...m, [item]: e.target.checked }))}
                  />
                  <span className="text-sm text-stone-700">{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function LogistiqueRestitutionsPage() {
  const { toast } = useToast();
  const [returnOpen, setReturnOpen] = useState(false);
  const [allocations, setAllocations] = useState(mockAllocations);

  const returned = useMemo(
    () => allocations.filter((a) => a.status === 'returned' && a.returnReport),
    [allocations],
  );

  const inMission = useMemo(
    () => allocations.filter((a) => a.status === 'in_mission'),
    [allocations],
  );

  const handleSubmit = (allocationId: string, report: NonNullable<Allocation['returnReport']>) => {
    setAllocations((prev) =>
      prev.map((a) =>
        a.id === allocationId
          ? { ...a, status: 'returned' as const, returnedAt: new Date(), returnReport: report }
          : a,
      ),
    );
    toast({
      type: 'success',
      title: 'Restitution enregistrée',
      description: `${report.dosesReturned} doses retournées au stock. ${report.dosesWasted > 0 ? `${report.dosesWasted} doses gâchées enregistrées.` : ''}`,
    });
    setReturnOpen(false);
  };

  return (
    <div className="space-y-5 pb-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/logistique">Logistique</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Restitutions</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-xl font-bold text-stone-900">Restitutions</h1>
          <Button size="sm" onClick={() => setReturnOpen(true)} disabled={inMission.length === 0}>
            <Plus size={14} /> Nouvelle restitution
          </Button>
        </div>
      </div>

      {inMission.length === 0 && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-sm text-stone-500 flex items-center gap-2">
          <Package size={16} className="flex-shrink-0" />
          Aucune équipe en mission actuellement. Les restitutions s'enregistrent quand des équipes sont en statut «&nbsp;en mission&nbsp;».
        </div>
      )}

      {/* Table of returned allocations */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-stone-800">Restitutions validées ({returned.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                {['Équipe', 'Campagne', 'Date retour', 'Doses utilisées', 'Doses retournées', 'Doses gâchées', 'Matériel', 'Écart', 'Statut'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {returned.map((a) => {
                const r = a.returnReport!;
                const allocated = a.vaccines.reduce((s, v) => s + (v.quantityLoaded ?? v.quantityReserved), 0);
                const gap = allocated - r.dosesUsed - r.dosesReturned - r.dosesWasted;
                return (
                  <tr key={a.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50">
                    <td className="px-3 py-2.5">
                      <div className="text-xs font-medium text-stone-700">{a.teamName}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-stone-600">{a.campaignName}</td>
                    <td className="px-3 py-2.5 text-xs text-stone-500 whitespace-nowrap">
                      {a.returnedAt?.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-stone-800 font-medium">{r.dosesUsed}</td>
                    <td className="px-3 py-2.5 text-sm text-success font-medium">{r.dosesReturned}</td>
                    <td className="px-3 py-2.5">
                      {r.dosesWasted > 0 ? (
                        <span className="text-sm text-danger font-medium">{r.dosesWasted}</span>
                      ) : (
                        <span className="text-sm text-stone-400">0</span>
                      )}
                      {r.wasteReason && (
                        <div className="text-[10px] text-stone-400">{r.wasteReason}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {r.materialsReturned ? (
                        <span className="flex items-center gap-1 text-[11px] text-success">
                          <CheckCircle2 size={12} /> Complet
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-warning">
                          <AlertTriangle size={12} /> Incomplet
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-sm font-semibold ${gap === 0 ? 'text-success' : 'text-warning'}`}>
                        {gap === 0 ? '0' : `+${gap}`}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-success/10 text-success-700">
                        Validée
                      </span>
                    </td>
                  </tr>
                );
              })}
              {returned.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-stone-400">
                    Aucune restitution enregistrée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReturnModal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        inMissionAllocations={inMission}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
