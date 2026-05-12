import {
  Globe,
  Home,
  Building2,
  Users,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import { TileCard } from '../components/data/TileCard';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Progress } from '../components/ui/progress';
import { useToast } from '../lib/toast';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from '../components/ui/breadcrumb';

const TILES = [
  {
    icon: Globe,
    title: 'Géographie',
    subtitle: 'Hiérarchie administrative',
    count: '6 niveaux',
    info: '23 provinces · 180 villages cartographiés',
    status: 'success' as const,
    href: '/referentiel/geographie',
  },
  {
    icon: Home,
    title: 'Villages',
    subtitle: 'Master Village Registry',
    count: '180 villages',
    info: '168 validés · 12 à valider',
    warningInfo: '5 sans rattachement FOSA',
    warningIcon: AlertTriangle,
    status: 'warning' as const,
    href: '/referentiel/villages',
  },
  {
    icon: Building2,
    title: 'Formations',
    subtitle: 'Master Facility Registry',
    count: '40 formations',
    info: '32 opérationnelles',
    warningInfo: '6 dégradées · 2 fermées',
    warningIcon: AlertTriangle,
    status: 'warning' as const,
    href: '/referentiel/formations',
  },
  {
    icon: Users,
    title: 'Équipes',
    subtitle: 'Équipes mobiles',
    count: '18 équipes',
    info: '8 disponibles · 6 en mission',
    warningInfo: '4 indisponibles',
    warningIcon: AlertTriangle,
    status: 'warning' as const,
    href: '/referentiel/equipes',
  },
];

const QUALITY_METRICS = [
  { label: 'Complétude', value: 87, status: 'success' as const },
  { label: 'Fraîcheur', text: 'Dernière sync DHIS2 il y a 4h', status: 'success' as const },
  { label: 'Cohérence', text: '0 incohérence détectée', status: 'success' as const },
  { label: 'Validation terrain', text: '12 villages en attente', status: 'warning' as const },
];

const RECENT_ACTIVITY = [
  {
    user: 'Fatimé Abakar',
    initials: 'FA',
    action: 'a validé 12 villages dans le canton de',
    entity: 'Bol Centre',
    timestamp: 'il y a 2h',
  },
  {
    user: 'Système',
    initials: 'SY',
    action: 'a importé 45 villages depuis',
    entity: 'DHIS2',
    timestamp: 'il y a 5h',
  },
  {
    user: 'Aminata Hassan',
    initials: 'AH',
    action: 'a créé la formation',
    entity: 'CS de Tataverom',
    timestamp: 'hier',
  },
  {
    user: 'Halime Saleh',
    initials: 'HS',
    action: 'a modifié',
    entity: '3 équipes mobiles',
    timestamp: 'hier',
  },
  {
    user: 'Mahamat Idriss',
    initials: 'MI',
    action: 'a exporté le',
    entity: 'référentiel complet',
    timestamp: 'il y a 2 jours',
  },
];

export default function ReferentielHubPage() {
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    showToast({
      title: 'Synchronisation DHIS2 démarrée',
      description: 'La synchronisation avec DHIS2 est en cours...',
      tone: 'neutral',
    });

    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          showToast({
            title: 'Synchronisation terminée',
            description: 'Les données ont été synchronisées avec succès.',
            tone: 'success',
          });
          return 100;
        }
        return prev + 33;
      });
    }, 1000);
  };

  const handleExport = () => {
    showToast({
      title: 'Export en préparation',
      description: 'Votre fichier sera prêt dans quelques instants.',
      tone: 'neutral',
    });
  };

  const handleImport = () => {
    showToast({
      title: 'Import de référentiel',
      description: 'Fonctionnalité en cours de développement.',
      tone: 'neutral',
    });
  };

  const handleReport = () => {
    showToast({
      title: 'Rapport de qualité',
      description: 'Fonctionnalité en cours de développement.',
      tone: 'neutral',
    });
  };

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Référentiel</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mt-2 text-stone-900">Référentiel de données</h1>
        <p className="mt-2 text-stone-600">
          Vue d'ensemble des données géographiques et opérationnelles.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-stone-800 mb-4">Vue d'ensemble</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TILES.map((tile) => (
            <TileCard key={tile.title} {...tile} />
          ))}
        </div>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Qualité globale des données</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {QUALITY_METRICS.map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-700">{metric.label}</span>
                    {metric.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-success-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-warning-600" />
                    )}
                  </div>
                  {metric.value !== undefined ? (
                    <div className="space-y-1">
                      <Progress value={metric.value} className="h-2" />
                      <p className="text-xs text-stone-500">{metric.value}%</p>
                    </div>
                  ) : (
                    <p className="text-sm text-stone-600">{metric.text}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-stone-200">
              <button
                onClick={handleReport}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Voir le rapport détaillé →
              </button>
            </div>
          </CardBody>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-stone-800 mb-4">Actions rapides</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleImport} variant="secondary">
            <Upload className="w-4 h-4 mr-2" />
            Importer un référentiel
          </Button>
          <Button onClick={handleExport} variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exporter tout
          </Button>
          <Button onClick={handleSync} variant="secondary" disabled={isSyncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Synchroniser DHIS2
          </Button>
          <Button onClick={handleReport} variant="secondary">
            <FileText className="w-4 h-4 mr-2" />
            Rapport de qualité
          </Button>
        </div>
        {isSyncing && (
          <div className="mt-4">
            <Progress value={syncProgress} className="h-2" />
            <p className="text-sm text-stone-600 mt-2">Synchronisation en cours... {syncProgress}%</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-stone-800 mb-4">Activité récente</h2>
        <Card>
          <CardBody>
            <div className="space-y-4">
              {RECENT_ACTIVITY.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Avatar initials={activity.initials} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700">
                      <span className="font-semibold">{activity.user}</span>{' '}
                      <span className="text-stone-600">{activity.action}</span>{' '}
                      <span className="text-primary-600 font-medium">{activity.entity}</span>
                    </p>
                  </div>
                  <time className="text-xs text-stone-500 whitespace-nowrap">{activity.timestamp}</time>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
