import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Plus, CheckCircle2, Truck, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../lib/toast';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import {
  mockAllocations, ALLOCATION_STATUS_LABEL, ALLOCATION_STATUS_COLOR,
  type Allocation, type AllocationStatus,
} from '../data/mockAllocations';
import { ANTIGEN_COLORS } from '../data/mockStock';

type Tab = 'all' | 'reserved' | 'in_mission' | 'returned';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'reserved', label: 'En attente chargement' },
  { key: 'in_mission', label: 'En mission' },
  { key: 'returned', label: 'Retournées' },
];

function ConfirmLoadModal({
  allocation,
  open,
  onClose,
  onConfirm,
}: {
  allocation: Allocation | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
  if (!allocation) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirmer le chargement"
      width={440}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" onClick={() => onConfirm(allocation.id)}>
            <CheckCircle2 size={14} /> Confirmer le chargement
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-stone-600">
          Confirmez-vous que l'équipe <strong>{allocation.teamName}</strong> a physiquement chargé les ressources suivantes ?
        </p>
        <div className="bg-stone-50 rounded-lg p-3 space-y-2">
          <div className="text-xs font-semibold text-stone-600 mb-1">Vaccins</div>
          {allocation.vaccines.map((v) => (
            <div key={v.antigenId} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: ANTIGEN_COLORS[v.antigenId] ?? '#78716C' }}
                />
                {v.antigenId}
              </span>
              <strong>{v.quantityReserved} doses</strong>
            </div>
          ))}
          <div className="border-t border-stone-200 mt-2 pt-2 text-xs text-stone-500 space-y-1">
            <div className="flex justify-between">
              <span>Carburant</span><span>{allocation.fuelLiters} L</span>
            </div>
            <div className="flex justify-between">
              <span>Per diem</span><span>{allocation.perDiem.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-stone-400">
          En confirmant, le stock passe de «&nbsp;réservé&nbsp;» à «&nbsp;alloué&nbsp;» et l'équipe peut démarrer sa mission.
        </p>
      </div>
    </Modal>
  );
}

function StartMissionModal({
  allocation,
  open,
  onClose,
  onConfirm,
}: {
  allocation: Allocation | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
  if (!allocation) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Démarrer la mission"
      width={400}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" onClick={() => onConfirm(allocation.id)}>
            <Truck size={14} /> Démarrer la mission
          </Button>
        </>
      }
    >
      <p className="text-sm text-stone-600">
        Confirmez que l'équipe <strong>{allocation.teamName}</strong> part en mission pour la campagne{' '}
        <strong>{allocation.campaignName}</strong> depuis <strong>{allocation.facilityName}</strong>.
      </p>
    </Modal>
  );
}

function AllocationCard({ allocation, onConfirmLoad, onStartMission, onRetour }: {
  allocation: Allocation;
  onConfirmLoad: (a: Allocation) => void;
  onStartMission: (a: Allocation) => void;
  onRetour: (a: Allocation) => void;
}) {
  const s = allocation.status;
  const colorClass = ALLOCATION_STATUS_COLOR[s];

  return (
    <tr className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors">
      {/* Campagne */}
      <td className="px-3 py-3">
        <div className="text-xs font-medium text-stone-800">{allocation.campaignName}</div>
        <div className="text-[11px] text-stone-400">{allocation.facilityName}</div>
      </td>

      {/* Équipe */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0">
            {allocation.teamName.split(' ').map((w) => w[0]).join('').slice(0, 2)}
          </div>
          <span className="text-xs font-medium text-stone-700">{allocation.teamName}</span>
        </div>
      </td>

      {/* Vaccins */}
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {allocation.vaccines.map((v) => (
            <span
              key={v.antigenId}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
              style={{ backgroundColor: ANTIGEN_COLORS[v.antigenId] ?? '#78716C' }}
            >
              {v.antigenId} ×{v.quantityReserved}
            </span>
          ))}
        </div>
      </td>

      {/* Consommables + carburant */}
      <td className="px-3 py-3 text-[11px] text-stone-500">
        <div>{allocation.fuelLiters}L carburant</div>
        <div>{allocation.consumables.length} types consomm.</div>
      </td>

      {/* Statut */}
      <td className="px-3 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${colorClass}`}>
          {ALLOCATION_STATUS_LABEL[s]}
        </span>
      </td>

      {/* Dates */}
      <td className="px-3 py-3 text-[11px] text-stone-500 whitespace-nowrap">
        <div>Réservé {allocation.reservedAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</div>
        {allocation.loadedAt ? (
          <div className="text-stone-400">Chargé {allocation.loadedAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</div>
        ) : (
          <div className="text-warning font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse inline-block" />
            Chargement en attente
          </div>
        )}
      </td>

      {/* Actions */}
      <td className="px-3 py-3">
        <div className="flex gap-1.5">
          {s === 'reserved' && (
            <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => onConfirmLoad(allocation)}>
              <CheckCircle2 size={12} /> Confirmer chargement
            </Button>
          )}
          {s === 'loaded' && (
            <Button size="sm" className="text-xs h-7 px-2" onClick={() => onStartMission(allocation)}>
              <Truck size={12} /> Démarrer mission
            </Button>
          )}
          {s === 'in_mission' && (
            <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => onRetour(allocation)}>
              <RotateCcw size={12} /> Restitution
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function LogistiqueAllocationsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('all');
  const [allocations, setAllocations] = useState(mockAllocations);
  const [loadModal, setLoadModal] = useState<Allocation | null>(null);
  const [missionModal, setMissionModal] = useState<Allocation | null>(null);

  const filtered = useMemo(() => {
    if (tab === 'all') return allocations;
    if (tab === 'reserved') return allocations.filter((a) => a.status === 'reserved');
    if (tab === 'in_mission') return allocations.filter((a) => a.status === 'in_mission');
    if (tab === 'returned') return allocations.filter((a) => a.status === 'returned');
    return allocations;
  }, [tab, allocations]);

  const tabCounts = useMemo(() => ({
    all: allocations.length,
    reserved: allocations.filter((a) => a.status === 'reserved').length,
    in_mission: allocations.filter((a) => a.status === 'in_mission').length,
    returned: allocations.filter((a) => a.status === 'returned').length,
  }), [allocations]);

  const handleConfirmLoad = (id: string) => {
    setAllocations((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: 'loaded' as AllocationStatus, loadedAt: new Date(), loadedConfirmedBy: 'Utilisateur actuel' }
          : a,
      ),
    );
    toast({ type: 'success', title: 'Chargement confirmé', description: 'Le stock est passé de «réservé» à «alloué». L\'équipe peut démarrer.' });
    setLoadModal(null);
  };

  const handleStartMission = (id: string) => {
    setAllocations((prev) =>
      prev.map((a) => a.id === id ? { ...a, status: 'in_mission' as AllocationStatus } : a),
    );
    toast({ type: 'success', title: 'Mission démarrée', description: 'L\'équipe est maintenant en mission.' });
    setMissionModal(null);
  };

  const handleRetour = (allocation: Allocation) => {
    navigate('/logistique/restitutions');
  };

  return (
    <div className="space-y-5 pb-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/logistique">Logistique</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Allocations</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-xl font-bold text-stone-900">Allocations</h1>
          <Button size="sm" onClick={() => toast({ type: 'info', title: 'Nouvelle allocation', description: 'Fonctionnalité complète disponible dans Sprint 4.' })}>
            <Plus size={14} /> Nouvelle allocation
          </Button>
        </div>
      </div>

      {/* Workflow legend */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
        <strong>Flux obligatoire : </strong>
        réservé → <em>Confirmer chargement</em> → chargé → <em>Démarrer mission</em> → en mission → <em>Enregistrer restitution</em> → retourné
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              tab === t.key
                ? 'text-primary border-b-2 border-primary -mb-px'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {t.label}
            {tabCounts[t.key as keyof typeof tabCounts] > 0 && (
              <span className={`ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full ${
                tab === t.key ? 'bg-primary/10 text-primary' : 'bg-stone-100 text-stone-500'
              }`}>
                {tabCounts[t.key as keyof typeof tabCounts]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                {['Campagne / FOSA', 'Équipe', 'Vaccins alloués', 'Consomm. / Carburant', 'Statut', 'Dates', 'Actions'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <AllocationCard
                  key={a.id}
                  allocation={a}
                  onConfirmLoad={(al) => setLoadModal(al)}
                  onStartMission={(al) => setMissionModal(al)}
                  onRetour={handleRetour}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-stone-400">
                    Aucune allocation dans cette catégorie
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmLoadModal
        allocation={loadModal}
        open={!!loadModal}
        onClose={() => setLoadModal(null)}
        onConfirm={handleConfirmLoad}
      />
      <StartMissionModal
        allocation={missionModal}
        open={!!missionModal}
        onClose={() => setMissionModal(null)}
        onConfirm={handleStartMission}
      />
    </div>
  );
}
