# VACCI360 — Sprint 0 · Vague 2 (compléments fonctionnels)

La vague 1 est validée. Vous allez maintenant compléter le Sprint 0 avec les composants restants.

## Stack et conventions (rappel)

Vous restez sur la stack adoptée en vague 1 :
- Tailwind v4 + tokens dans `src/styles/theme.css` (déjà en place, NE PAS DUPLIQUER)
- `@make-kits` (avec wrappers custom dans `src/components/ui/` si nécessaire)
- React Router v6
- Inter via `src/styles/fonts.css` (déjà en place)
- Auth mock et scope mock dans `src/lib/` (déjà en place, vous étendez)

Réutilisez impérativement les composants UI déjà créés en vague 1 (Button, Input, Card, Badge, Avatar, etc.). Ne re-créez pas. Si un composant manque, créez-le dans `src/components/ui/` en respectant la cohérence des composants existants.

## Périmètre de la vague 2

Vous devez livrer les éléments suivants, dans cet ordre logique :

1. SelectScopePage `/select-scope`
2. Système de notifications (context + drawer + cloche fonctionnelle)
3. ProfilePage `/profile`
4. VacciBotFAB + panneau chat simulé
5. OfflineBanner + détection navigator.onLine
6. Système de Toasts global
7. Empty states sur les routes placeholder

Si l'ensemble dépasse votre capacité de génération en une passe, prévenez-moi et coupez en deux sous-vagues : (2a) éléments 1 à 4, (2b) éléments 5 à 7. Sinon, livrez tout d'un bloc.

## Spécifications détaillées

### 1. SelectScopePage `/select-scope`

**Affichage conditionnel** :
- Affichée uniquement si l'utilisateur connecté a accès à plusieurs scopes
- Sinon, redirection automatique vers `/dashboard` après login
- Logique : dans `src/lib/auth.ts`, le mock user a maintenant un champ `accessibleScopes: string[]`. Si length > 1, redirection vers `/select-scope`, sinon `/dashboard`

**Logique post-login** :
- Login réussi → vérifier `accessibleScopes` du user
- Si 1 seul scope → set le scope actif et rediriger vers `/dashboard`
- Si plusieurs scopes → rediriger vers `/select-scope`

**Layout de la page** :
- Centré, max-width 640px, padding vertical 80px
- Background : Stone-50 (cohérent avec le reste de l'app)

**Contenu** :
- Logo "VACCI360" en haut, centré (Primary-700, font 700, taille 32px)
- H2 centré "Sélectionnez votre périmètre de travail"
- Body Stone-600, centré : "Vous avez accès à plusieurs zones. Choisissez celle sur laquelle vous souhaitez travailler. Vous pourrez en changer à tout moment depuis l'en-tête."
- Liste verticale de cards cliquables (gap 12px) :

```
┌──────────────────────────────────────────────────────┐
│ [icône] PROVINCE                            [check]  │
│ Province du Lac                                       │
│ 3 districts · 245 villages · 18 formations sanitaires│
└──────────────────────────────────────────────────────┘
```

Chaque card scope :
- Icône Globe/MapPin/Building selon niveau (Pays/Province/District)
- Niveau en tiny uppercase Stone-500 (ex: "PROVINCE")
- Nom du scope en h4
- Statistiques en small Stone-600
- Border 0.5px Stone-200, radius 12px, padding 16px
- Hover : border Primary-300, bg Primary-50, cursor pointer
- Selected : border 2px Primary, bg Primary-50, icône check Primary à droite

**Mock scopes accessibles selon le rôle** :
- Admin : National Tchad + toutes provinces
- Gestionnaire National : National Tchad + 3 provinces pilotes (Lac, Kanem, Hadjer-Lamis)
- Gestionnaire Provincial : sa province uniquement (skip select-scope)
- Superviseur District : son district uniquement (skip select-scope)
- Analyste : National Tchad + 3 provinces pilotes (lecture)

**Footer page** :
- Checkbox "Définir comme scope par défaut" (cochée par défaut)
- Si cochée : sauvegarder dans le mock user (stocké en localStorage pour persister entre rechargements)
- Bouton primary "Continuer" (full width, désactivé tant qu'aucun scope sélectionné)
- Lien ghost "Se déconnecter" (en bas, taille small)

### 2. Système de notifications

**Architecture** :

Créer un context `src/lib/notifications.tsx` qui gère :
```ts
type NotificationType = 'critical' | 'warning' | 'info' | 'success' | 'ai';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;  // route vers laquelle naviguer au click
  actionLabel?: string; // ex "Voir le micro-plan"
};

type NotificationContext = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  archiveNotification: (id: string) => void;
};
```

**NotificationBell** dans le header (déjà placé en vague 1, rendre fonctionnel) :
- Icône Bell, taille 20px
- Badge danger en haut-droite avec le count des non-lues (caché si 0)
- Au click → ouvre le NotificationDrawer
- Si > 99 non-lues, afficher "99+"

**NotificationDrawer** :
- Drawer depuis la droite, largeur 420px, hauteur full
- Animation slide-in 200ms
- Backdrop semi-transparent (rgba(0,0,0,0.4)) cliquable pour fermer
- ESC pour fermer

**Header drawer** :
- H3 "Notifications"
- Bouton "Tout marquer comme lu" (btn-ghost small, désactivé si 0 non-lues)
- Bouton X de fermeture

**Tabs** (sous le header) :
- "Toutes ({total})"
- "Non lues ({unread})"
- "Archivées ({archived})" — basique, on archive en cliquant sur l'item

**Liste des notifications** :
Chaque item de liste :
```
┌────────────────────────────────────────┐
│ ● [icône] Titre                  Time  │
│            Description courte sur 2... │
│            [Voir détail →]             │
└────────────────────────────────────────┘
```
- Point Primary à gauche si non-lue (sinon transparent)
- Icône colorée selon type :
  - critical → AlertTriangle, danger
  - warning → AlertCircle, warning
  - info → Info, info
  - success → CheckCircle, success
  - ai → Sparkles, AI (rose santé)
- Titre body-strong Stone-800
- Description small Stone-600 max 2 lignes (truncate)
- Timestamp tiny Stone-500 (format relatif : "à l'instant", "il y a 5min", "il y a 2h", "hier", "12 fév")
- Si actionUrl présent : lien "Voir détail →" en small Primary
- Hover sur item : bg Stone-50
- Click sur item : marque comme lu + (si actionUrl) navigue vers l'URL et ferme le drawer

**Mock notifications** (créer `src/data/mockNotifications.ts` avec au moins 10 entrées variées et timestamps réalistes) :

```ts
export const mockNotifications: Notification[] = [
  {
    id: 'n1', type: 'critical',
    title: 'Rupture stock pentavalent',
    description: 'CS Mao a épuisé son stock. Réapprovisionnement urgent requis.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
    actionUrl: '/logistique/stock-vaccins',
    actionLabel: 'Voir le stock',
  },
  {
    id: 'n2', type: 'info',
    title: 'Validation requise',
    description: 'Micro-plan campagne février 2026 soumis par Fatimé Abakar (GP Lac).',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    actionUrl: '/planification',
    actionLabel: 'Examiner',
  },
  {
    id: 'n3', type: 'ai',
    title: 'Opportunité vaccination identifiée',
    description: 'VacciBot a détecté une concentration de population nomade à Moussoro la semaine prochaine.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: false,
    actionUrl: '/nomades/opportunites',
    actionLabel: 'Voir détail',
  },
  {
    id: 'n4', type: 'success',
    title: 'Synchronisation DHIS2 réussie',
    description: '1 247 enregistrements importés depuis DHIS2.',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: 'n5', type: 'warning',
    title: 'Couverture en baisse',
    description: 'Couverture DTC3 du district de Bol passée sous 70% (68%).',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/pilotage',
  },
  {
    id: 'n6', type: 'warning',
    title: '12 villages non visités',
    description: 'Plus de 90 jours sans visite vaccinale dans le district de Bol.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/referentiel/villages',
  },
  {
    id: 'n7', type: 'critical',
    title: 'Perte signal GPS équipe',
    description: 'Équipe 3 sans signal depuis 4h sur la route Massakory. Tentative de contact.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/supervision',
  },
  {
    id: 'n8', type: 'success',
    title: 'Micro-plan validé',
    description: 'Votre micro-plan #2026-001 a été validé par le Gestionnaire National.',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: 'n9', type: 'info',
    title: 'Nouvelle campagne nationale',
    description: 'Campagne ROR lancée — préparation des micro-plans avant le 28 février.',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: 'n10', type: 'ai',
    title: 'Suggestion d\'optimisation',
    description: 'Réorganiser l\'itinéraire de l\'équipe 5 pourrait économiser 145 km de trajet.',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/planification',
  },
];
```

**Empty state** (si aucune notification visible dans le tab actif) :
- Icône BellOff 48px Stone-400, centrée
- H4 "Vous êtes à jour"
- Body Stone-600 "Aucune notification dans cette catégorie pour le moment."

### 3. ProfilePage `/profile`

Page accessible depuis le menu utilisateur (avatar header → "Profil").

**Layout** : container max-width 800px, padding 24px, alignement gauche

**Header de page** :
- H1 "Mon profil"
- Body Stone-600 "Gérez vos informations personnelles et vos préférences"

**Sections en cards séparées (gap 24px)** :

#### Card "Informations personnelles"
- Header card : H3 "Informations personnelles"
- Avatar 80px (initiales sur Primary-100) + bouton "Modifier la photo" (btn-ghost small) — désactivé pour V1
- Grid 2 colonnes pour les champs :
  - Nom complet (input, valeur depuis mock user)
  - Email (input, désactivé, "Pour modifier votre email, contactez votre administrateur")
  - Téléphone (input, format "+235 ...")
  - Fonction (select : "Médecin chef de district", "Gestionnaire PEV", "Superviseur", "Analyste", "Autre")
- Footer card : bouton primary "Enregistrer les modifications" (aligné droite)
- Toast success au save : "Vos informations ont été mises à jour"

#### Card "Préférences"
- Header : H3 "Préférences"
- Liste de paramètres :
  - **Langue** (radio buttons) : Français (sélectionné), العربية (désactivé "Disponible bientôt")
  - **Fuseau horaire** (select) : Africa/Ndjamena (par défaut)
  - **Format de date** (radio) : DD/MM/YYYY (par défaut), MM/DD/YYYY
  - **Densité tableaux** (radio) : Confortable (par défaut), Compact
  - **Préférences de notifications** (groupe de toggles) :
    - Notifications in-app (activé)
    - Email (activé)
    - SMS (désactivé)
    - WhatsApp (désactivé)
- Footer : bouton primary "Enregistrer les préférences"

#### Card "Sécurité"
- Header : H3 "Sécurité"
- Bloc "Mot de passe" :
  - Body Stone-600 "Dernière modification : il y a 2 mois"
  - Bouton secondary "Changer le mot de passe" (ouvre une modale avec 3 champs : actuel, nouveau, confirmation)
- Bloc "Authentification à deux facteurs" :
  - Toggle (désactivé par défaut sauf pour Admin où c'est activé)
  - Body small "Recommandé pour les comptes ayant accès aux données sensibles"
- Bloc "Sessions actives" :
  - Lien "Voir mes sessions actives" (ouvre un placeholder "Fonctionnalité disponible bientôt")
  - Bouton danger ghost "Déconnecter toutes les autres sessions"

#### Card "À propos"
- Header : H3 "À propos"
- Liste plate :
  - Version application : `1.0.0-sprint0`
  - Lien "Conditions d'utilisation" (placeholder)
  - Lien "Politique de confidentialité" (placeholder)
  - Lien "Contacter le support"
- Footer card : Body tiny Stone-500 "VACCI360 — Plateforme PEV Tchad · Ministère de la Santé Publique"

### 4. VacciBotFAB

**FAB** (Floating Action Button) :
- Position fixed, bas-droite, 24px du bord
- Bouton circulaire 56px de diamètre
- Background AI #E11D74
- Icône Sparkles (Lucide), couleur blanche, 24px
- Shadow-lg
- Hover : transform scale(1.05), bg AI-600
- Tooltip au hover : "Demander à VacciBot"
- Badge "Nouveau" en AI-50 sur AI-700, attaché coin haut-droite (visible uniquement la première semaine d'usage — pour V1, toujours visible)
- Click → ouvre le panneau chat

**Panneau chat** :
- Position fixed, bas-droite, 24px du bord (même position que le FAB)
- Dimensions : 400px × 600px
- Background blanc
- Border 0.5px Stone-200
- Border-radius 12px
- Shadow-xl
- Animation : slide-up + fade-in 200ms à l'ouverture
- Z-index élevé pour passer au-dessus du contenu
- Non bloquant : on peut continuer à utiliser l'app derrière

**Header du panneau** (bg AI-50, padding 16px, border-radius 12px 12px 0 0) :
- À gauche : avatar bot circulaire 36px (bg AI, icône Sparkles blanche 18px)
- À côté avatar :
  - "VacciBot" en body-strong Stone-800
  - Sous-titre tiny Stone-600 : icône cercle vert 6px + "En ligne · Assistant IA"
- À droite (boutons icône 32px) :
  - Bouton expand : icône Maximize2 (place pour version pleine page /vaccibot, juste un alert pour V1 "Disponible dans le module VacciBot du Sprint 6")
  - Bouton minimize : icône Minus, ferme le panneau (icône inverse au close)
  - Bouton close : icône X

**Zone messages** (flex-1, scroll, padding 16px, gap 12px entre messages) :

Message d'accueil du bot (toujours présent au premier ouverture) :
```
[avatar bot]
"Bonjour [Prénom] 👋

Je suis VacciBot, votre assistant IA pour le PEV. Je peux vous aider à :
- Analyser des données de couverture vaccinale
- Identifier des villages prioritaires
- Comparer des micro-plans
- Générer des rapports

Que souhaitez-vous savoir ?"
```

Sous le message : 3 chips de suggestion cliquables (border 0.5px AI-100, bg AI-50, padding 8px 12px, radius full, text AI-700) :
- "Couverture province du Lac"
- "Villages non visités depuis 3 mois"
- "Comparer 2 micro-plans"

Style des bulles :
- Bot : alignée gauche, bg AI-50, max-width 80%, radius 12px (top-left plus serré), padding 12px
- User : alignée droite, bg Primary-50, max-width 80%, radius 12px (top-right plus serré), padding 12px

**Footer panneau** (padding 12px, border-top Stone-200) :
- Input "Posez votre question..." (full width, hauteur 40px, sans bouton intégré)
- À droite de l'input : bouton send circulaire 36px (bg AI, icône Send blanche)
- Texte tiny Stone-500 sous l'input : "VacciBot peut faire des erreurs. Vérifiez les informations importantes."

**Comportement chat (Sprint 0 simulé)** :
- Au click sur une suggestion ou Enter dans l'input :
  1. Ajouter la requête utilisateur en bulle droite
  2. Vider l'input
  3. Afficher "VacciBot réfléchit..." avec animation 3 dots roses (bg AI-50, padding 12px, radius 12px, alignée gauche)
  4. Après 1500ms, remplacer par le message :
     "Merci pour votre question. Je m'entraîne actuellement à analyser les données du PEV Tchad. Cette fonctionnalité sera pleinement disponible dans une prochaine version (Sprint 6 - Assistant IA). Pour l'instant, je vous invite à explorer les modules au fur et à mesure de leur déploiement."
- Persistance des messages dans la session (mais reset au refresh)

### 5. OfflineBanner + détection navigator.onLine

**Hook custom** dans `src/lib/offline.ts` :
```ts
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return isOnline;
};
```

**OfflineBanner** :
- Composant dans `src/components/shell/OfflineBanner.tsx`
- Placé dans AppShell, AU-DESSUS du Header (sticky top, z-index supérieur)
- Affiché uniquement si `!isOnline`
- Style :
  - Background Stone-700
  - Texte blanc
  - Padding 12px 24px
  - Hauteur ~44px
  - Display flex, items center, gap 8px
  - Icône CloudOff (Lucide) 16px à gauche
  - Texte body : "Mode hors ligne — Vos modifications seront synchronisées dès la reconnexion"
  - À droite : indicateur "0 élément en attente" (pour V1, toujours 0)
- Animation slide-down 200ms à l'apparition, slide-up à la disparition
- Quand le banner est visible, ajuster le padding-top du contenu pour ne pas le recouvrir

**Toast de reconnexion** (cf. système de toasts ci-dessous) :
- Quand la connexion revient (transition false → true), déclencher automatiquement un toast success :
  - Titre : "Connexion rétablie"
  - Description : "0 élément en attente de synchronisation"
  - Auto-dismiss après 4s

### 6. Système de Toasts global

**ToastProvider** dans `src/lib/toast.tsx` :
```ts
type ToastType = 'success' | 'warning' | 'danger' | 'info';

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number; // ms, default 5000 (success), 7000 (warning/info), persistant (danger)
};

type ToastContext = {
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
};

export const useToast = () => useContext(ToastContext);
```

**ToastContainer** :
- Position : fixed top-right (24px du bord), z-index très élevé
- Stack vertical des toasts (gap 8px)
- Direction d'apparition : slide-in depuis la droite, fade
- Direction de disparition : slide-out vers la droite, fade
- Animation 250ms ease-out

**Toast individuel** :
- Background blanc
- Border 0.5px + border-left 4px de la couleur du type :
  - success : border-left Success
  - warning : border-left Warning
  - danger : border-left Danger
  - info : border-left Info
- Border-radius 8px (mais 0 sur le côté gauche à cause du border-left)
- Padding 12px 16px
- Min-width 320px, max-width 420px
- Shadow-lg
- Layout :
  - Icône type 20px à gauche (CheckCircle/AlertCircle/AlertTriangle/Info, dans la couleur du type)
  - Titre body-strong + description small Stone-600 (si présente)
  - Bouton X 16px en haut-droite, opacity 0.5, hover opacity 1

**Comportement** :
- Auto-dismiss selon `duration`
- Hover sur le toast : pause le timer
- Click X : dismiss immédiat
- Maximum 5 toasts simultanés (les plus anciens disparaissent)

**Tester depuis ProfilePage** : "Enregistrer les modifications" → toast success.

### 7. Empty states sur les routes placeholder

Toutes les routes placeholder du Sprint 0 (pages "Module en cours de développement") doivent maintenant afficher un empty state propre :

**Composant `EmptyState` réutilisable** dans `src/components/layout/EmptyState.tsx` :
```tsx
type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  sprintName?: string;       // ex: "Sprint 1 — Référentiel"
  cta?: { label: string; onClick: () => void };
};
```

Layout :
- Centré horizontalement et verticalement dans la zone contenu (au moins 60vh de hauteur)
- Icône 64px Stone-300, centrée
- H2 (titre)
- Body Stone-600 (description, max-width 480px, centré)
- Si sprintName : badge Stone-100 / Stone-700 sous la description : "🚧 [sprintName]"
- Si cta : bouton secondary avec le label

**Mapping par route** :
- `/carte` → EmptyState : icon Map, title "Carte interactive", description "Visualisation cartographique des villages, formations sanitaires et accessibilité.", sprintName "Sprint 2 — Cartographie"
- `/alertes` → icon Bell, "Centre d'alertes", "Configurez et consultez les alertes opérationnelles.", "Sprint 2"
- `/planification` → icon ClipboardList, "Micro-plans", "Génération, simulation et validation des micro-plans de campagne.", "Sprint 4 — Planification"
- `/supervision` → icon Activity, "Supervision", "Suivi en temps réel des équipes mobiles et de leur conformité.", "Sprint 5 — Exécution"
- `/logistique` → icon Package, "Logistique", "Gestion des stocks de vaccins, chaîne du froid et allocations.", "Sprint 3 — Logistique"
- `/nomades` → icon Tent, "Populations nomades", "Identification des opportunités de vaccination des groupes mobiles.", "Sprint 4"
- `/referentiel/geographie` → icon Globe, "Hiérarchie géographique", "Pays, provinces, départements, sous-préfectures, cantons et villages.", "Sprint 1 — Référentiel"
- `/referentiel/villages` → icon Home, "Master Village Registry", "Base de données enrichie des villages du Tchad.", "Sprint 1"
- `/referentiel/formations` → icon Building2, "Master Facility Registry", "Référentiel des formations sanitaires (CS, PS, Cases).", "Sprint 1"
- `/referentiel/equipes` → icon Users, "Équipes mobiles", "Composition et affectation des équipes de vaccination.", "Sprint 1"
- `/admin/utilisateurs` → icon UserCog, "Gestion des utilisateurs", "Comptes, rôles et permissions (RBAC).", "Sprint 1"
- `/admin/workflow` → icon GitBranch, "Workflow Engine", "Configuration des workflows de validation.", "Sprint 6"
- `/admin/notifications` → icon BellRing, "Configuration notifications", "Règles et canaux de notification.", "Sprint 6"
- `/admin/parametres` → icon Settings, "Paramètres système", "Configuration globale de la plateforme.", "Sprint 6"
- `/admin/audit` → icon FileSearch, "Logs d'audit", "Traçabilité des actions utilisateurs.", "Sprint 6"

### Adaptations à faire dans l'AppShell (vague 1)

- Importer et placer `OfflineBanner` au-dessus du Header dans `AppShell.tsx`
- Wrapper l'app avec `<NotificationProvider>` et `<ToastProvider>` dans `App.tsx`
- Connecter la `NotificationBell` (vague 1) au context notifications maintenant créé
- Connecter le menu avatar (vague 1) → "Profil" navigue maintenant vers `/profile`
- Ajouter le `<VacciBotFAB />` dans `AppShell.tsx`, présent sur toutes les pages authentifiées

## Tests à pouvoir effectuer après cette vague

1. Login avec un user multi-scope (Admin) → arrivée sur `/select-scope`, choix d'un scope, arrivée sur `/dashboard`
2. Login avec un user mono-scope (GP Lac) → arrivée directe sur `/dashboard`
3. Cliquer sur la cloche → drawer notifications, voir 10 mocks variés, basculer entre tabs, marquer comme lu, cliquer sur une notif avec actionUrl → navigation
4. Aller sur `/profile`, modifier des préférences, save → toast success
5. Cliquer sur le FAB VacciBot, taper une question → bot réfléchit puis répond message générique
6. Couper le wifi → banner offline apparaît, le rallumer → banner disparaît + toast "Connexion rétablie"
7. Naviguer sur n'importe quelle route placeholder (ex `/planification`) → voir empty state propre avec sprintName

## Contraintes de cohérence

- Tous les nouveaux composants suivent les tokens du Sprint 0 vague 1 (couleurs, typo, espacements)
- Réutiliser les composants UI existants (Button, Card, Input, Badge, Avatar) sans les redéfinir
- Tous les boutons icône-seule doivent avoir un aria-label
- Tous les modals/drawers fermables avec ESC
- Tous les inputs ont un label associé (visible ou aria-label si masqué)
- Animations : préférer `transition` CSS aux animations JS, durées 150-250ms

Allez-y. Si l'ensemble dépasse votre capacité de génération, prévenez-moi et coupez en sous-vagues 2a et 2b.