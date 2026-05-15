import { useState, useMemo } from 'react';
import { Plus, ArrowRightLeft, Download, MoreVertical, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../lib/toast';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from '../components/ui/breadcrumb';
import {
  mockStock, ANTIGEN_COLORS, ANTIGEN_LIST, STOCK_STATUS_LABEL,
  type VaccineStock,
} from '../data/mockStock';

const NOW = Date.now();
const DAY = 86_400_000;

type SortKey = 'antigen' | 'locationName' | 'expiryDate' | 'quantityAvailable' | 'status';
type SortDir = 'asc' | 'desc';

function daysUntilExpiry(d: Date) {
  return Math.ceil((d.getTime() - NOW) / DAY);
}

function StatusBadge({ status }: { status: VaccineStock['status'] }) {
  const styles: Record<VaccineStock['status'], string> = {
    available: 'bg-success/10 text-success-700',
    reserved: 'bg-blue-100 text-blue-700',
    allocated: 'bg-primary/10 text-primary-700',
    expired: 'bg-stone-100 text-stone-500',
    shortage: 'bg-danger/10 text-danger-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${styles[status]}`}>
      {STOCK_STATUS_LABEL[status]}
    </span>
  );
}

function AntigenBadge({ antigen }: { antigen: string }) {
  const color = ANTIGEN_COLORS[antigen] ?? '#78716C';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {antigen}
    </span>
  );
}

// ─── New stock modal ──────────────────────────────────────────────────────────

function NewStockModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    antigen: '', lot: '', expiry: '', quantity: '', location: '', unit: '10',
  });
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  const handleConfirm = () => {
    toast({
      type: 'success',
      title: 'Stock ajouté',
      description: `${form.quantity} doses ${form.antigen} ajoutées au stock de ${form.location || '—'}.`,
    });
    onClose();
    setForm({ antigen: '', lot: '', expiry: '', quantity: '', location: '', unit: '10' });
    setStep('form');
  };

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); setStep('form'); }}
      title="Nouvelle entrée stock"
      width={480}
      footer={
        step === 'form' ? (
          <>
            <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
            <Button
              size="sm"
              disabled={!form.antigen || !form.lot || !form.expiry || !form.quantity}
              onClick={() => setStep('confirm')}
            >
              Vérifier →
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={() => setStep('form')}>← Modifier</Button>
            <Button size="sm" onClick={handleConfirm}>Valider l'entrée</Button>
          </>
        )
      }
    >
      {step === 'form' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Antigène *</label>
              <select
                className="w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.antigen}
                onChange={(e) => setForm((f) => ({ ...f, antigen: e.target.value }))}
              >
                <option value="">Choisir...</option>
                {ANTIGEN_LIST.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">N° de lot *</label>
              <input
                type="text"
                className="w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="ex: BCG-2026-001"
                value={form.lot}
                onChange={(e) => setForm((f) => ({ ...f, lot: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Date péremption *</label>
              <input
                type="date"
                className="w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.expiry}
                onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Quantité (flacons) *</label>
              <input
                type="number"
                min={1}
                className="w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Destination</label>
            <select
              className="w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            >
              <option value="">Dépôt National</option>
              <option value="Dépôt Provincial — Lac">Dépôt Provincial — Lac</option>
              <option value="Dépôt Provincial — Kanem">Dépôt Provincial — Kanem</option>
              <option value="Dépôt Provincial — Hadjer-Lamis">Dépôt Provincial — Hadjer-Lamis</option>
              <option value="CS Bol Centre">CS Bol Centre</option>
              <option value="PS Kaya">PS Kaya</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-stone-600">Veuillez confirmer l'entrée suivante :</p>
          <div className="bg-stone-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-stone-500">Antigène</span><strong>{form.antigen}</strong></div>
            <div className="flex justify-between"><span className="text-stone-500">Lot</span><code className="text-xs bg-white border border-stone-200 px-1.5 py-0.5 rounded">{form.lot}</code></div>
            <div className="flex justify-between"><span className="text-stone-500">Péremption</span><strong>{form.expiry}</strong></div>
            <div className="flex justify-between"><span className="text-stone-500">Quantité</span><strong>{form.quantity} flacons</strong></div>
            <div className="flex justify-between"><span className="text-stone-500">Destination</span><strong>{form.location || 'Dépôt National'}</strong></div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Transfer modal ───────────────────────────────────────────────────────────

function TransferModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ antigen: '', lot: '', quantity: '', from: '', to: '' });
  const [error, setError] = useState('');

  const maxAvailable = useMemo(() => {
    if (!form.antigen || !form.lot) return Infinity;
    const entry = mockStock.find(
      (s) => s.antigen === form.antigen && s.lot === form.lot && s.locationName === form.from,
    );
    return entry?.quantityAvailable ?? 0;
  }, [form.antigen, form.lot, form.from]);

  const handleSubmit = () => {
    const qty = Number(form.quantity);
    if (qty > maxAvailable) {
      setError(`Quantité invalide : seulement ${maxAvailable} doses disponibles (réservé/alloué exclu).`);
      return;
    }
    toast({ type: 'success', title: 'Transfert enregistré', description: `${qty} doses ${form.antigen} transférées vers ${form.to}.` });
    onClose();
    setForm({ antigen: '', lot: '', quantity: '', from: '', to: '' });
    setError('');
  };

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); setError(''); }}
      title="Transfert de stock"
      width={460}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" disabled={!form.antigen || !form.quantity || !form.from || !form.to} onClick={handleSubmit}>
            Enregistrer le transfert
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Antigène</label>
            <select
              className="w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              value={form.antigen}
              onChange={(e) => setForm((f) => ({ ...f, antigen: e.target.value }))}
            >
              <option value="">Choisir...</option>
              {ANTIGEN_LIST.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Lot</label>
            <input
              className="w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="N° de lot"
              value={form.lot}
              onChange={(e) => setForm((f) => ({ ...f, lot: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Source</label>
          <select
            className="w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.from}
            onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))}
          >
            <option value="">Sélectionner la source</option>
            <option value="Dépôt National N'Djaména">Dépôt National N'Djaména</option>
            <option value="Dépôt Provincial — Lac">Dépôt Provincial — Lac</option>
            <option value="Dépôt Provincial — Kanem">Dépôt Provincial — Kanem</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Destination</label>
          <select
            className="w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.to}
            onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
          >
            <option value="">Sélectionner la destination</option>
            <option value="Dépôt Provincial — Lac">Dépôt Provincial — Lac</option>
            <option value="Dépôt Provincial — Kanem">Dépôt Provincial — Kanem</option>
            <option value="CS Bol Centre">CS Bol Centre</option>
            <option value="PS Kaya">PS Kaya</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Quantité
            {maxAvailable !== Infinity && (
              <span className="ml-1 text-stone-400 font-normal">({maxAvailable} disponibles)</span>
            )}
          </label>
          <input
            type="number"
            min={1}
            className="w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.quantity}
            onChange={(e) => { setForm((f) => ({ ...f, quantity: e.target.value })); setError(''); }}
          />
          {error && <p className="text-xs text-danger mt-1">{error}</p>}
          <p className="text-[11px] text-stone-400 mt-1">
            Seules les doses disponibles peuvent être transférées (hors réservées / allouées).
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LogistiqueStockPage() {
  const [sortKey, setSortKey] = useState<SortKey>('locationName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterAntigen, setFilterAntigen] = useState<string[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterExpiry, setFilterExpiry] = useState<string>('');
  const [filterLot, setFilterLot] = useState('');
  const [newStockOpen, setNewStockOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleFilter = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const filtered = useMemo(() => {
    let data = [...mockStock];
    if (filterAntigen.length) data = data.filter((s) => filterAntigen.includes(s.antigen));
    if (filterLevel) data = data.filter((s) => s.level === filterLevel);
    if (filterStatus.length) data = data.filter((s) => filterStatus.includes(s.status));
    if (filterLot) data = data.filter((s) => s.lot.toLowerCase().includes(filterLot.toLowerCase()));
    if (filterExpiry === '<30') data = data.filter((s) => daysUntilExpiry(s.expiryDate) < 30);
    else if (filterExpiry === '30-90') data = data.filter((s) => { const d = daysUntilExpiry(s.expiryDate); return d >= 30 && d <= 90; });
    else if (filterExpiry === '>90') data = data.filter((s) => daysUntilExpiry(s.expiryDate) > 90);

    data.sort((a, b) => {
      let av: string | number = '', bv: string | number = '';
      if (sortKey === 'antigen') { av = a.antigen; bv = b.antigen; }
      else if (sortKey === 'locationName') { av = a.locationName; bv = b.locationName; }
      else if (sortKey === 'expiryDate') { av = a.expiryDate.getTime(); bv = b.expiryDate.getTime(); }
      else if (sortKey === 'quantityAvailable') { av = a.quantityAvailable; bv = b.quantityAvailable; }
      else if (sortKey === 'status') { av = a.status; bv = b.status; }
      const cmp = typeof av === 'number' ? av - (bv as number) : (av as string).localeCompare(bv as string);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return data;
  }, [filterAntigen, filterLevel, filterStatus, filterLot, filterExpiry, sortKey, sortDir]);

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp size={12} className="text-stone-300" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-stone-600" /> : <ChevronDown size={12} className="text-stone-600" />;
  }

  const STATUS_FILTERS: VaccineStock['status'][] = ['available', 'reserved', 'allocated', 'shortage', 'expired'];

  return (
    <div className="space-y-5 pb-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/logistique">Logistique</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Stocks vaccins</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-xl font-bold text-stone-900">Stocks vaccins</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}>
              <ArrowRightLeft size={14} /> Transfert
            </Button>
            <Button variant="outline" size="sm">
              <Download size={14} /> Exporter
            </Button>
            <Button size="sm" onClick={() => setNewStockOpen(true)}>
              <Plus size={14} /> Nouvelle entrée
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Antigène */}
          <div>
            <label className="block text-[11px] text-stone-500 mb-1 font-medium uppercase tracking-wide">Antigène</label>
            <div className="flex gap-1 flex-wrap">
              {ANTIGEN_LIST.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleFilter(filterAntigen, a, setFilterAntigen)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                    filterAntigen.includes(a)
                      ? 'text-white border-transparent'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}
                  style={filterAntigen.includes(a) ? { backgroundColor: ANTIGEN_COLORS[a] } : {}}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Niveau */}
          <div>
            <label className="block text-[11px] text-stone-500 mb-1 font-medium uppercase tracking-wide">Niveau</label>
            <select
              className="text-sm border border-stone-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="">Tous</option>
              <option value="national">National</option>
              <option value="provincial">Provincial</option>
              <option value="facility">FOSA</option>
            </select>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-[11px] text-stone-500 mb-1 font-medium uppercase tracking-wide">Statut</label>
            <div className="flex gap-1 flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleFilter(filterStatus, s, setFilterStatus)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                    filterStatus.includes(s)
                      ? s === 'shortage' ? 'bg-danger/10 text-danger-700 border-danger/30'
                        : s === 'reserved' ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : s === 'allocated' ? 'bg-primary/10 text-primary-700 border-primary/30'
                        : 'bg-success/10 text-success-700 border-success/30'
                      : 'bg-white text-stone-500 border-stone-200'
                  }`}
                >
                  {STOCK_STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Péremption */}
          <div>
            <label className="block text-[11px] text-stone-500 mb-1 font-medium uppercase tracking-wide">Péremption</label>
            <select
              className="text-sm border border-stone-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              value={filterExpiry}
              onChange={(e) => setFilterExpiry(e.target.value)}
            >
              <option value="">Toutes</option>
              <option value="<30">&lt; 30 jours</option>
              <option value="30-90">30–90 jours</option>
              <option value=">90">&gt; 90 jours</option>
            </select>
          </div>

          {/* Lot search */}
          <div className="ml-auto">
            <label className="block text-[11px] text-stone-500 mb-1 font-medium uppercase tracking-wide">Lot</label>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                className="text-sm border border-stone-200 rounded-md pl-7 pr-2.5 py-1.5 w-40 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Rechercher..."
                value={filterLot}
                onChange={(e) => setFilterLot(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="text-xs text-stone-400">{filtered.length} résultats</div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                {(
                  [
                    { key: 'antigen', label: 'Antigène' },
                    { key: null, label: 'Lot' },
                    { key: 'locationName', label: 'Localisation' },
                    { key: 'expiryDate', label: 'Péremption' },
                    { key: 'quantityAvailable', label: 'Disponible' },
                    { key: null, label: 'Réservé' },
                    { key: null, label: 'Alloué' },
                    { key: null, label: 'Consommé' },
                    { key: 'status', label: 'Statut' },
                    { key: null, label: '' },
                  ] as { key: SortKey | null; label: string }[]
                ).map(({ key, label }) => (
                  <th
                    key={label}
                    onClick={() => key && handleSort(key)}
                    className={`px-3 py-2.5 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap ${key ? 'cursor-pointer select-none hover:text-stone-700' : ''}`}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {key && <SortIcon k={key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const days = daysUntilExpiry(s.expiryDate);
                const isExpirySoon = days < 30 && days >= 0;
                const rowClass = s.status === 'shortage'
                  ? 'bg-danger/5'
                  : s.status === 'reserved'
                  ? 'bg-blue-50/60'
                  : '';
                return (
                  <tr
                    key={s.id}
                    className={`border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors ${rowClass}`}
                  >
                    <td className="px-3 py-2.5">
                      {/* Hachure overlay for reserved rows */}
                      <AntigenBadge antigen={s.antigen} />
                    </td>
                    <td className="px-3 py-2.5">
                      <code className="text-[11px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">{s.lot}</code>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-xs font-medium text-stone-700">{s.locationName}</div>
                      <div className="text-[11px] text-stone-400 capitalize">{
                        s.level === 'national' ? 'National' : s.level === 'provincial' ? 'Provincial' : 'FOSA'
                      }</div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={isExpirySoon ? 'animate-pulse font-semibold text-warning text-xs' : 'text-xs text-stone-700'}>
                        {s.expiryDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </span>
                      {isExpirySoon && (
                        <div className="text-[10px] text-warning font-medium">{days}j restants</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`text-sm font-semibold ${s.quantityAvailable > 0 ? 'text-success' : 'text-stone-400'}`}>
                        {s.quantityAvailable.toLocaleString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-sm text-blue-700">{s.quantityReserved.toLocaleString('fr-FR')}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-sm text-primary">{s.quantityAllocated.toLocaleString('fr-FR')}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-sm text-stone-500">{s.quantityConsumed.toLocaleString('fr-FR')}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <button className="p-1 rounded hover:bg-stone-100 text-stone-400">
                        <MoreVertical size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm text-stone-400">
                    Aucun résultat pour les filtres sélectionnés
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewStockModal open={newStockOpen} onClose={() => setNewStockOpen(false)} />
      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} />
    </div>
  );
}
