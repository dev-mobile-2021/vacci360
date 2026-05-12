import type { AppNotification } from '../lib/notifications';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function buildMockNotifications(): AppNotification[] {
  const now = Date.now();
  return [
    {
      id: 'n1',
      type: 'critical',
      title: 'Rupture stock pentavalent',
      description: 'CS Mao a épuisé son stock. Réapprovisionnement urgent requis.',
      timestamp: new Date(now - 30 * MIN),
      read: false,
      actionUrl: '/logistique',
      actionLabel: 'Voir le stock',
    },
    {
      id: 'n2',
      type: 'info',
      title: 'Validation requise',
      description: 'Micro-plan campagne février 2026 soumis par Fatimé Abakar (GP Lac).',
      timestamp: new Date(now - 2 * HOUR),
      read: false,
      actionUrl: '/planification',
      actionLabel: 'Examiner',
    },
    {
      id: 'n3',
      type: 'ai',
      title: 'Opportunité vaccination identifiée',
      description: 'VacciBot a détecté une concentration de population nomade à Moussoro la semaine prochaine.',
      timestamp: new Date(now - 4 * HOUR),
      read: false,
      actionUrl: '/nomades',
      actionLabel: 'Voir détail',
    },
    {
      id: 'n4',
      type: 'success',
      title: 'Synchronisation DHIS2 réussie',
      description: '1 247 enregistrements importés depuis DHIS2.',
      timestamp: new Date(now - 1 * DAY),
      read: true,
    },
    {
      id: 'n5',
      type: 'warning',
      title: 'Couverture en baisse',
      description: 'Couverture DTC3 du district de Bol passée sous 70% (68%).',
      timestamp: new Date(now - 1 * DAY - 2 * HOUR),
      read: true,
      actionUrl: '/dashboard',
    },
    {
      id: 'n6',
      type: 'warning',
      title: '12 villages non visités',
      description: 'Plus de 90 jours sans visite vaccinale dans le district de Bol.',
      timestamp: new Date(now - 2 * DAY),
      read: true,
      actionUrl: '/referentiel/villages',
    },
    {
      id: 'n7',
      type: 'critical',
      title: 'Perte signal GPS équipe',
      description: 'Équipe 3 sans signal depuis 4h sur la route Massakory. Tentative de contact.',
      timestamp: new Date(now - 3 * DAY),
      read: true,
      actionUrl: '/supervision',
    },
    {
      id: 'n8',
      type: 'success',
      title: 'Micro-plan validé',
      description: 'Votre micro-plan #2026-001 a été validé par le Gestionnaire National.',
      timestamp: new Date(now - 5 * DAY),
      read: true,
    },
    {
      id: 'n9',
      type: 'info',
      title: 'Nouvelle campagne nationale',
      description: 'Campagne ROR lancée — préparation des micro-plans avant le 28 février.',
      timestamp: new Date(now - 7 * DAY),
      read: true,
    },
    {
      id: 'n10',
      type: 'ai',
      title: "Suggestion d'optimisation",
      description: "Réorganiser l'itinéraire de l'équipe 5 pourrait économiser 145 km de trajet.",
      timestamp: new Date(now - 10 * DAY),
      read: true,
      actionUrl: '/planification',
    },
  ];
}
