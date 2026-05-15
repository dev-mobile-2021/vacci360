import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { useToast } from '../../lib/toast';
import { cn } from '../../lib/cn';

type Step = 'upload' | 'mapping' | 'preview' | 'done';

const TARGET_FIELDS = [
  { key: 'name', label: 'Nom du village', required: true },
  { key: 'code', label: 'Code', required: false },
  { key: 'lat', label: 'Latitude', required: true },
  { key: 'lng', label: 'Longitude', required: true },
  { key: 'population', label: 'Population', required: true },
  { key: 'canton', label: 'Canton', required: false },
] as const;

type TargetKey = (typeof TARGET_FIELDS)[number]['key'];

function autoMatch(headers: string[]): Record<TargetKey, string> {
  const out = {} as Record<TargetKey, string>;
  const lower = headers.map((h) => h.toLowerCase().trim());
  const find = (...candidates: string[]) => {
    for (const c of candidates) {
      const idx = lower.findIndex((h) => h.includes(c));
      if (idx >= 0) return headers[idx];
    }
    return '';
  };
  out.name = find('nom', 'name', 'village');
  out.code = find('code', 'id');
  out.lat = find('lat');
  out.lng = find('lng', 'lon');
  out.population = find('pop');
  out.canton = find('canton');
  return out;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ImportDialog({ open, onClose }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<TargetKey, string>>(
    {} as Record<TargetKey, string>,
  );
  const { toast } = useToast();

  const reset = () => {
    setStep('upload');
    setFileName('');
    setRows([]);
    setHeaders([]);
    setMapping({} as Record<TargetKey, string>);
  };

  const close = () => {
    reset();
    onClose();
  };

  const onFile = (file: File) => {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = res.meta.fields ?? [];
        setHeaders(cols);
        setRows(res.data);
        setMapping(autoMatch(cols));
        setStep('mapping');
      },
      error: () => {
        toast({ type: 'danger', title: 'Échec de parsing', description: 'Fichier illisible.' });
      },
    });
  };

  const missingRequired = TARGET_FIELDS
    .filter((f) => f.required)
    .filter((f) => !mapping[f.key]);

  const renderUpload = () => (
    <div className="space-y-4">
      <p className="text-stone-600 text-[13px]">
        Importez un fichier CSV de villages. Les colonnes seront alignées avec le référentiel à l'étape suivante.
      </p>
      <label
        className={cn(
          'flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone-300 rounded-lg py-10 cursor-pointer hover:bg-stone-50',
        )}
      >
        <Upload className="h-6 w-6 text-stone-400" />
        <div className="text-stone-700 text-[14px]">Cliquez ou déposez un fichier CSV</div>
        <div className="text-stone-500 text-[12px]">Encodage UTF-8, séparateur virgule</div>
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </label>
    </div>
  );

  const renderMapping = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[13px] text-stone-700">
        <FileSpreadsheet className="h-4 w-4 text-primary-700" />
        <span className="font-medium">{fileName}</span>
        <span className="text-stone-500">— {rows.length} lignes, {headers.length} colonnes</span>
      </div>
      <div className="border border-stone-200 rounded-md divide-y divide-stone-100">
        {TARGET_FIELDS.map((f) => (
          <div key={f.key} className="flex items-center gap-3 px-3 py-2 text-[13px]">
            <div className="w-40 shrink-0">
              <div className="text-stone-800 font-medium">{f.label}</div>
              {f.required && <div className="text-[11px] text-danger-700">Requis</div>}
            </div>
            <select
              value={mapping[f.key] ?? ''}
              onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })}
              className="flex-1 h-9 rounded-md border border-stone-300 bg-white px-2 text-stone-800"
            >
              <option value="">— Ignorer —</option>
              {headers.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {missingRequired.length > 0 && (
        <div className="flex items-center gap-2 text-[12px] text-warning-700 bg-warning-100 px-3 py-2 rounded-md">
          <AlertCircle className="h-4 w-4" />
          Champs requis non mappés : {missingRequired.map((f) => f.label).join(', ')}
        </div>
      )}
    </div>
  );

  const renderPreview = () => {
    const sample = rows.slice(0, 5);
    return (
      <div className="space-y-3">
        <p className="text-stone-700 text-[13px]">
          Aperçu des 5 premières lignes après alignement :
        </p>
        <div className="overflow-auto border border-stone-200 rounded-md max-h-64">
          <table className="w-full text-[12px]">
            <thead className="bg-stone-50">
              <tr>
                {TARGET_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                  <th key={f.key} className="text-left px-2 py-1.5 text-stone-600 font-medium">
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sample.map((r, i) => (
                <tr key={i} className="border-t border-stone-100">
                  {TARGET_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                    <td key={f.key} className="px-2 py-1.5 text-stone-800">
                      {r[mapping[f.key]] || <span className="text-stone-400">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-[12px] text-stone-500">
          {rows.length} lignes prêtes à être importées (mode mock — aucune écriture réelle).
        </div>
      </div>
    );
  };

  const renderDone = () => (
    <div className="flex flex-col items-center gap-3 py-8">
      <CheckCircle2 className="h-10 w-10 text-success-600" />
      <div className="text-stone-900 font-medium">Import simulé avec succès</div>
      <div className="text-stone-500 text-[13px] text-center">
        {rows.length} villages ont été préparés. La persistance réelle sera ajoutée avec Supabase.
      </div>
    </div>
  );

  const titles: Record<Step, string> = {
    upload: 'Importer des villages — étape 1/3',
    mapping: 'Aligner les colonnes — étape 2/3',
    preview: 'Aperçu et validation — étape 3/3',
    done: 'Import terminé',
  };

  const footer = (() => {
    if (step === 'upload') {
      return <Button variant="ghost" onClick={close}>Annuler</Button>;
    }
    if (step === 'mapping') {
      return (
        <>
          <Button variant="ghost" onClick={() => setStep('upload')}>Retour</Button>
          <Button
            disabled={missingRequired.length > 0}
            onClick={() => setStep('preview')}
          >
            Continuer
          </Button>
        </>
      );
    }
    if (step === 'preview') {
      return (
        <>
          <Button variant="ghost" onClick={() => setStep('mapping')}>Retour</Button>
          <Button
            onClick={() => {
              setStep('done');
              toast({
                type: 'success',
                title: 'Import simulé',
                description: `${rows.length} villages préparés.`,
              });
            }}
          >
            Importer
          </Button>
        </>
      );
    }
    return <Button onClick={close}>Fermer</Button>;
  })();

  return (
    <Modal open={open} onClose={close} title={titles[step]} footer={footer} width={620}>
      {step === 'upload' && renderUpload()}
      {step === 'mapping' && renderMapping()}
      {step === 'preview' && renderPreview()}
      {step === 'done' && renderDone()}
    </Modal>
  );
}
