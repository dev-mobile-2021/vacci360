# VACCI360 — Sprint 0 : Shell applicatif

## Contexte du projet

VACCI360 est une plateforme web de gestion et d'optimisation du Programme Élargi de Vaccination (PEV) au Tchad. Elle aide les gestionnaires de santé publique à planifier, suivre et optimiser les campagnes de vaccination dans un contexte difficile : populations dispersées, zones reculées, mobilité saisonnière des nomades, infrastructures limitées.

Les utilisateurs sont des professionnels santé publique du Ministère de la Santé Publique du Tchad et de ses délégations provinciales. Ils sont déjà familiers avec DHIS2 (système d'information sanitaire national déjà déployé). L'interface doit s'inscrire dans cette continuité visuelle institutionnelle, sobre et efficace.

L'application gère 6 rôles utilisateurs distincts (RBAC) :
- Admin Système (AD) : configuration, users, audit
- Gestionnaire PEV National (GN) : vue stratégique, validation micro-plans, tous modules
- Gestionnaire Provincial (GP) : opérationnel province, création micro-plans
- Superviseur District (SD) : supervision équipes, suivi terrain
- Agent Terrain (AT) : usage mobile uniquement (hors scope ce projet)
- Analyste Données (AN) : lecture et exports

## Objectif du Sprint 0

Générer la fondation applicative complète mais avec **contenu vide / placeholders** pour les modules métier. Les modules seront remplis dans des sprints ultérieurs.

Ce sprint doit livrer :
1. Page de connexion `/login`
2. Page de sélection de scope post-login `/select-scope`
3. Layout principal authentifié (Shell) avec sidebar + header + zone contenu
4. Page d'accueil `/dashboard` avec placeholders (vide pour l'instant, hello user)
5. Centre de notifications (drawer depuis cloche)
6. Page profil utilisateur `/profile`
7. FAB VacciBot avec panneau de chat minimaliste
8. Page 404
9. Indicateur offline (bandeau persistant si déconnecté)
10. Système de routing entre tous ces écrans

## Stack technique

- **React 18** avec TypeScript
- **Vite** pour le bundling
- **React Router v6** pour le routing
- **Tailwind CSS** pour le styling, configuré avec design tokens custom ci-dessous
- **Lucide React** pour les icônes
- **shadcn/ui** comme bibliothèque de composants de base (à adapter à notre charte)

## Design tokens (à appliquer dans tailwind.config.js et globals.css)

```js
const tokens = {
  colors: {
    // Marque
    primary: {
      50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 500: '#3B82F6',
      DEFAULT: '#1E5BA8', 600: '#1E5BA8', 700: '#1E4A8C', 800: '#1E3A6F', 900: '#172554',
    },
    secondary: {
      50: '#ECFEFF', 100: '#CFFAFE', DEFAULT: '#0891B2', 600: '#0891B2', 700: '#0E7490',
    },
    // IA - rose santé
    ai: {
      50: '#FFF1F5', 100: '#FFE4ED', DEFAULT: '#E11D74', 600: '#BE185D', 700: '#9D174D',
    },
    // Sémantique
    success: { 50: '#F0FDF4', 100: '#DCFCE7', DEFAULT: '#137F3D', 700: '#15803D' },
    warning: { 50: '#FFFBEB', 100: '#FEF3C7', DEFAULT: '#C77700', 700: '#B45309' },
    danger:  { 50: '#FEF2F2', 100: '#FEE2E2', DEFAULT: '#B91C1C', 700: '#991B1B' },
    info:    { 50: '#F0F9FF', 100: '#E0F2FE', DEFAULT: '#0369A1', 700: '#075985' },
    // Stone (gris chauds)
    stone: {
      50: '#FAFAF9', 100: '#F5F5F4', 200: '#E7E5E4', 300: '#D6D3D1',
      400: '#A8A29E', 500: '#78716C', 600: '#57534E', 700: '#44403C',
      800: '#292524', 900: '#1C1917',
    },
  },
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    tiny: ['11px', { lineHeight: '14px', fontWeight: '500' }],
    caption: ['12px', { lineHeight: '16px' }],
    small: ['13px', { lineHeight: '18px' }],
    body: ['14px', { lineHeight: '20px' }],
    h4: ['16px', { lineHeight: '24px', fontWeight: '600' }],
    h3: ['18px', { lineHeight: '26px', fontWeight: '600' }],
    h2: ['20px', { lineHeight: '28px', fontWeight: '600' }],
    h1: ['24px', { lineHeight: '32px', fontWeight: '700' }],
    display: ['32px', { lineHeight: '40px', fontWeight: '700' }],
  },
  borderRadius: { sm: '4px', DEFAULT: '8px', lg: '12px', xl: '16px' },
  spacing: { /* échelle 4px : 1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40, 12=48, 16=64 */ },
};
```

Importer Inter depuis Google Fonts dans le head de l'index.html.

## Architecture des composants

```
src/
├── App.tsx                          # Router principal
├── main.tsx                         # Entry point
├── index.css                        # Tailwind + tokens CSS variables
├── lib/
│   ├── auth.ts                     # Mock auth context
│   ├── scope.ts                    # Mock scope context (multi-tenant scoping)
│   ├── notifications.ts            # Mock notifications context
│   └── offline.ts                  # Détection offline (navigator.onLine)
├── types/
│   └── index.ts                    # Types : User, Role, Scope, Notification, etc.
├── components/
│   ├── shell/
│   │   ├── AppShell.tsx           # Layout principal (sidebar + header + outlet)
│   │   ├── Sidebar.tsx            # Navigation 3 espaces (Pilotage/Action/Référentiel)
│   │   ├── Header.tsx             # Logo + scope + recherche + cloche + profil
│   │   ├── ScopeSelector.tsx      # Dropdown scope géographique
│   │   ├── NotificationBell.tsx   # Cloche avec badge count
│   │   ├── NotificationDrawer.tsx # Drawer latéral droite
│   │   ├── UserMenu.tsx           # Menu profil
│   │   ├── OfflineBanner.tsx      # Bandeau offline
│   │   └── VacciBotFAB.tsx        # FAB + panneau chat
│   ├── ui/                         # Composants atomiques (button, input, card, badge, etc.)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Drawer.tsx
│   │   ├── Modal.tsx
│   │   └── Toast.tsx
│   └── layout/
│       └── EmptyState.tsx          # Empty state réutilisable
├── pages/
│   ├── LoginPage.tsx
│   ├── SelectScopePage.tsx
│   ├── DashboardPage.tsx          # Placeholder hello user
│   ├── ProfilePage.tsx
│   └── NotFoundPage.tsx
└── data/
    ├── mockUsers.ts                # Users mock pour test des rôles
    ├── mockScopes.ts               # Provinces/districts du Tchad
    └── mockNotifications.ts        # Notifications types variés
```

## Spécifications écran par écran

### 1. LoginPage `/login`

**Layout** : split-screen
- Côté gauche (60% sur desktop, 100% mobile) : formulaire centré verticalement
- Côté droit (40%, caché mobile) : panneau institutionnel avec :
  - Logo VACCI360 (placeholder texte stylisé "VACCI360" en bleu primary 700, font weight 700, taille 32px)
  - Sous-titre "Plateforme Intégrée d'Optimisation de la Vaccination"
  - Mention "Programme Élargi de Vaccination · République du Tchad"
  - Background : Primary-50 avec un motif géométrique très subtil (cercles concentriques en Primary-100, opacity 30%)

**Formulaire** :
- Titre H1 "Connexion"
- Texte body Stone-600 "Accédez à votre espace de gestion PEV"
- Champ Email/Identifiant (label, placeholder "votre.email@sante.gouv.td")
- Champ Mot de passe (avec icône eye toggle pour montrer/cacher)
- Lien "Mot de passe oublié ?" en Primary, alignement droite, taille small
- Bouton "Se connecter" (btn-primary, full width, hauteur 44px)
- Sélecteur de langue en bas : "Français" (par défaut) / "العربية" (arabe, désactivé pour V1)

**États** :
- Default (champs vides)
- Filled (champs remplis, bouton actif)
- Loading (bouton avec spinner inline + texte "Connexion...")
- Error (bandeau danger inline au-dessus du formulaire : "Identifiants incorrects. Veuillez réessayer.")
- Success → redirection vers /select-scope

**Auth mock** :
Utiliser ces credentials pour tester chaque rôle :
- `admin@sante.td` / `admin123` → Admin Système
- `national@sante.td` / `national123` → Gestionnaire National
- `provincial.lac@sante.td` / `lac123` → Gestionnaire Provincial (province Lac)
- `superviseur.bol@sante.td` / `bol123` → Superviseur District (Bol)
- `analyste@sante.td` / `analyste123` → Analyste National

### 2. SelectScopePage `/select-scope`

**Affiché uniquement si l'utilisateur a accès à plusieurs scopes**. Sinon, redirection automatique vers `/dashboard`.

**Layout** : centré, max-width 600px

**Contenu** :
- Logo VACCI360 en haut centré
- H2 "Sélectionnez votre périmètre de travail"
- Texte body Stone-600 "Vous avez accès à plusieurs zones. Choisissez celle sur laquelle vous souhaitez travailler. Vous pourrez en changer à tout moment."
- Liste de cards cliquables, chaque card représentant un scope :
  - Niveau (Pays/Province/District) en tiny uppercase Stone-500
  - Nom (h4)
  - Statistiques rapides : "X districts, Y villages, Z formations sanitaires"
  - Icône check si déjà sélectionné par défaut
- Checkbox "Définir comme scope par défaut" (cochée par défaut)
- Bouton primary "Continuer" (désactivé tant qu'aucun scope sélectionné)

**Mock scopes** (basés sur la géographie réelle du Tchad) :
- National : Tchad (23 provinces, 23 districts pilotes pour V1)
- Provincial : Lac, Kanem, Hadjer-Lamis (provinces pilotes)
- District : Bol, Mao, Massakory

### 3. AppShell (layout principal authentifié)

Structure persistante autour de toutes les pages internes.

**Header** (hauteur 64px, sticky top, bg blanc, border-bottom 0.5px Stone-200) :
- Gauche : Logo "VACCI360" (Primary-700, font 600, taille 18px) + version "v1.0" en tiny Stone-500
- Centre-gauche : ScopeSelector dropdown
  - Affiche le scope actuel : "Province du Lac" avec icône MapPin
  - Cliquable → dropdown avec liste des scopes accessibles + lien "Tous mes scopes"
- Centre : Barre de recherche globale (max-width 480px)
  - Placeholder "Rechercher village, formation, équipe... (Ctrl+K)"
  - Icône Search à gauche
  - Raccourci clavier visible à droite
- Droite : 
  - NotificationBell (icône Bell + badge danger avec count, ex "3")
  - UserMenu (avatar circle 36px avec initiales sur Primary-100, dropdown avec : Profil, Préférences, Aide, Déconnexion)

**Sidebar** (largeur 256px étendue / 64px rétractée, hauteur full, bg Stone-50, border-right 0.5px Stone-200) :
- Bouton toggle en haut-droite pour rétracter/étendre
- Navigation organisée en 3 sections :

```
PILOTAGE
  - Vue d'ensemble       (Home icon)         /dashboard
  - Carte                (Map icon)          /carte                [placeholder]
  - Alertes              (Bell icon)         /alertes              [placeholder]

ACTION
  - Micro-plans          (ClipboardList)     /planification        [placeholder]
  - Supervision          (Activity)          /supervision          [placeholder]
  - Logistique           (Package)           /logistique           [placeholder]
  - Opportunités nomades (Tent)              /nomades              [placeholder]

RÉFÉRENTIEL
  - Géographie           (Globe)             /referentiel/geographie [placeholder]
  - Villages             (Home2)             /referentiel/villages   [placeholder]
  - Formations           (Building)          /referentiel/formations [placeholder]
  - Équipes              (Users)             /referentiel/equipes    [placeholder]

[Si rôle = Admin]
ADMINISTRATION
  - Utilisateurs         (UserCog)           /admin/utilisateurs   [placeholder]
  - Workflow Engine      (GitBranch)         /admin/workflow       [placeholder]
  - Notifications        (BellRing)          /admin/notifications  [placeholder]
  - Paramètres           (Settings)          /admin/parametres     [placeholder]
  - Audit                (FileSearch)        /admin/audit          [placeholder]
```

Chaque item de navigation :
- Icône 20px + label body
- Hover : bg Primary-50, text Primary-700
- Active (route courante) : bg Primary-100, text Primary-800, border-left 3px Primary
- En mode rétracté, n'afficher que les icônes (tooltip au hover avec le nom)

Les sections cachées selon le rôle :
- AT (Agent Terrain) : tout caché (utilise mobile, hors scope)
- AN (Analyste) : sections visibles en mode lecture
- SD : tout sauf "Admin" et "Référentiel" en édition

**Footer sidebar** (collé en bas) :
- Indicateur statut système (point vert "Système opérationnel" ou rouge si problème)
- Lien "Aide & Documentation"
- Mention "© Ministère Santé Publique · 2026"

**Zone contenu** (flex-1, padding 24px, bg Stone-50, scroll si nécessaire) :
- Contient l'`<Outlet />` du router
- Les pages individuelles gèrent leur propre layout interne

### 4. DashboardPage `/dashboard` (placeholder Sprint 0)

Pour l'instant, contenu minimal avec :
- H1 "Bonjour, [Prénom Nom]"
- Body Stone-600 "Bienvenue sur votre espace VACCI360. Les modules seront disponibles progressivement."
- Card simple "Sprint 0 — Shell applicatif" avec liste des fonctionnalités déjà disponibles à tester :
  - Navigation entre les espaces
  - Centre de notifications
  - VacciBot
  - Profil utilisateur
  - Mode offline (déconnecter wifi pour tester)
- Carte avec rappel du scope actuel et possibilité d'en changer

### 5. NotificationDrawer (depuis cloche header)

**Drawer** depuis la droite, largeur 400px, hauteur full, animation slide-in 200ms.

**Header drawer** :
- Titre "Notifications" (h3)
- Bouton "Tout marquer comme lu" (btn-ghost small)
- Bouton X de fermeture

**Tabs** :
- "Toutes (12)"
- "Non lues (3)"
- "Importantes (1)"

**Liste notifications** :
Chaque item :
- Icône colorée selon type (alerte/info/succès/IA)
- Titre body-strong
- Description small Stone-600 (max 2 lignes truncate)
- Timestamp tiny Stone-500 ("Il y a 2h", "Hier", "12 fév")
- Indicateur non-lu (point Primary à gauche)
- Hover : bg Stone-50, cursor pointer
- Click → marque comme lu + (si applicable) navigue vers l'écran concerné

**Mock notifications** (au moins 8 entrées variées) :
- Alerte critique : "Rupture stock pentavalent — CS Mao" (danger, il y a 30min)
- Validation requise : "Micro-plan campagne février soumis par GP Lac" (info, il y a 2h)
- Suggestion IA : "Opportunité vaccination identifiée à Moussoro" (ai, il y a 4h)
- Système : "Sync DHIS2 réussie — 1247 enregistrements" (success, hier)
- Couverture : "Couverture DTC3 du district passée sous 70%" (warning, hier)
- Rappel : "12 villages non visités depuis plus de 90 jours" (warning, il y a 2 jours)
- Équipe : "Équipe 3 perte signal GPS — Route Massakory" (danger, il y a 3 jours)
- Validation : "Votre micro-plan #2026-001 a été validé" (success, il y a 5 jours)

**Empty state** (si aucune notification) :
- Icône BellOff 48px Stone-400
- "Vous êtes à jour"
- "Aucune notification pour le moment"

### 6. ProfilePage `/profile`

Page paramétrage personnel.

**Sections** (en cards séparées) :

**Informations personnelles** :
- Avatar (avec bouton "Modifier")
- Nom complet (input)
- Email (input désactivé)
- Téléphone (input)
- Fonction (select : "Médecin chef de district", "Gestionnaire PEV", etc.)
- Bouton "Enregistrer les modifications"

**Préférences** :
- Langue (radio : Français / العربية désactivé)
- Fuseau horaire (Africa/Ndjamena par défaut)
- Format date (DD/MM/YYYY ou MM/DD/YYYY)
- Densité tableaux (Confortable / Compact)
- Notifications (toggles : Email / SMS / WhatsApp / In-app)

**Sécurité** :
- Bouton "Changer le mot de passe"
- Toggle "Authentification à deux facteurs"
- Lien "Voir mes sessions actives" (placeholder)
- Bouton danger "Déconnecter toutes les sessions"

**À propos** :
- Version app : "1.0.0-sprint0"
- Lien CGU
- Lien Politique de confidentialité
- Mention Anthropic réalisation (placeholder pour le moment)

### 7. VacciBotFAB

**FAB** (Floating Action Button) en bas-droite, position fixed (24px du bord).
- Bouton circulaire 56px, bg AI (#E11D74), shadow-lg
- Icône Sparkles ou MessageCircleHeart (Lucide), couleur blanche, 24px
- Hover : scale 1.05, bg AI-600
- Tooltip au hover : "Demander à VacciBot"
- Badge tiny "Nouveau" en AI-50 (pour V1, on signale comme nouvelle feature)

**Panneau chat** (au click sur le FAB) :
- Position : fixed bas-droite, 380px x 560px
- Background blanc, border 0.5px Stone-200, radius 12px, shadow-xl
- **Header** (bg AI-50, padding 16px) :
  - Avatar bot (cercle 32px, bg AI, icône Sparkles blanc)
  - "VacciBot"
  - Sous-titre tiny "Assistant IA · En ligne"
  - Bouton minimize (icône ChevronDown)
  - Bouton expand (ouvrir page complète /vaccibot, placeholder)
- **Zone messages** (flex-1, scroll, padding 16px, bg blanc) :
  - Message bot d'accueil : "Bonjour ! Je suis VacciBot, votre assistant IA pour le PEV. Je peux vous aider à analyser des données, générer des rapports, ou répondre à vos questions sur la vaccination au Tchad. Que souhaitez-vous savoir ?"
  - Suggestions (3 chips cliquables sous le message) :
    - "Couverture province du Lac"
    - "Villages non visités"
    - "Comparer 2 micro-plans"
- **Footer** (padding 12px, border-top Stone-200) :
  - Input "Posez votre question..." (full width, hauteur 40px)
  - Bouton send (icône Send, bg AI)

**Important Sprint 0** : le chat est cosmétique, pas de vraie IA branchée. Quand l'utilisateur tape, simuler 1.5s de "VacciBot réfléchit..." (3 dots animés) puis afficher un message générique : "Cette fonctionnalité sera disponible dans une prochaine version. Pour l'instant, je m'entraîne ! 🌱"

### 8. NotFoundPage `/`*

- Icône MapOff 64px Stone-400
- H1 "Page introuvable"
- Body "Cette page n'existe pas ou a été déplacée."
- Bouton primary "Retour au tableau de bord"
- Lien ghost "Signaler un problème"

### 9. OfflineBanner

Composant qui détecte `navigator.onLine` et affiche en haut de l'app :

**Quand offline** :
- Bandeau plein largeur, bg Stone-700, texte blanc, padding 12px
- Icône CloudOff 16px
- Texte body "Mode hors ligne — Vos modifications seront synchronisées dès reconnexion"
- Position : sticky top, au-dessus du header
- Animation slide-down 200ms

**Quand reconnecté** :
- Toast success en haut-droite : "Connexion rétablie · 0 élément en attente de synchronisation"
- Auto-dismiss après 4s

## États globaux à couvrir

Pour chaque écran, tu dois prévoir :
- **Default** : état nominal
- **Loading** : skeleton ou spinner approprié
- **Error** : message d'erreur + bouton retry
- **Empty** : empty state explicite si applicable

## Données mock à créer

Crée des fichiers `data/mockXXX.ts` qui exportent des données réalistes :

**mockUsers.ts** :
```ts
export const mockUsers = [
  { id: 'u1', email: 'admin@sante.td', name: 'Mahamat Idriss', role: 'admin', initials: 'MI', avatar: null },
  { id: 'u2', email: 'national@sante.td', name: 'Dr. Aminata Hassan', role: 'gestionnaire_national', initials: 'AH', avatar: null },
  { id: 'u3', email: 'provincial.lac@sante.td', name: 'Fatimé Abakar', role: 'gestionnaire_provincial', scope: 'lac', initials: 'FA', avatar: null },
  { id: 'u4', email: 'superviseur.bol@sante.td', name: 'Abdoulaye Saleh', role: 'superviseur_district', scope: 'bol', initials: 'AS', avatar: null },
  { id: 'u5', email: 'analyste@sante.td', name: 'Marie Ngarbatina', role: 'analyste', initials: 'MN', avatar: null },
];
```

**mockScopes.ts** : créer une hiérarchie réaliste Tchad → Provinces (Lac, Kanem, Hadjer-Lamis, Batha, Borkou, Chari-Baguirmi, Ennedi, Guéra, Logone Occidental, Logone Oriental, Mandoul, Mayo-Kebbi Est, Mayo-Kebbi Ouest, Moyen-Chari, Ouaddaï, Salamat, Sila, Tandjilé, Tibesti, Wadi Fira, N'Djamena) → Districts (au moins pour les 3 provinces pilotes : Lac avec Bol/Liwa/Ngouri, Kanem avec Mao/Nokou/Mondo, Hadjer-Lamis avec Massakory/Massaguet).

## Contraintes de qualité

- **Accessibilité** : tous les éléments interactifs doivent avoir un focus ring visible (2px Primary-500, offset 2px). Utiliser des aria-labels sur les boutons icône-seule.
- **Responsive** : layout fonctionnel à partir de 1024px (desktop). Tablet 768-1023px : sidebar rétractée par défaut. Mobile : bandeau "Veuillez utiliser un ordinateur pour cette interface" pour le V1 web (l'app mobile est un projet séparé).
- **Performance** : utiliser React.lazy pour les pages lourdes. Skeleton loaders sur les transitions.
- **Composants réutilisables** : penser DRY. Les composants UI dans `components/ui/` doivent être pleinement réutilisables (props bien typées TypeScript).
- **Cohérence** : tous les espacements en multiples de 4px. Toutes les couleurs depuis les tokens (jamais de couleurs hardcodées dans les composants).
- **Police** : Inter chargée depuis Google Fonts avec font-display:swap. Fallback system-ui.

## Tests minimaux à valider visuellement

Une fois généré, je dois pouvoir :
1. Me connecter avec chacun des 5 comptes mock et voir une sidebar adaptée à mon rôle
2. Sélectionner un scope si j'ai plusieurs accès
3. Naviguer entre les sections de la sidebar (même si les pages sont placeholder)
4. Cliquer sur la cloche et voir le drawer notifications avec les mocks
5. Cliquer sur le FAB VacciBot et avoir une mini-conversation simulée
6. Aller sur mon profil et modifier des préférences (mock, pas de persistance backend)
7. Me déconnecter et revenir au login
8. Couper le wifi → voir le bandeau offline apparaître, le rallumer → voir le toast de reconnexion
9. Tomber sur une page inexistante → voir la 404 avec bouton retour

## Ce qu'il NE faut PAS faire dans ce sprint

- Pas de vraies API, tout est mock localement
- Pas de modules métier (cartes, micro-plans, supervision, etc.) — juste des routes placeholder qui affichent "Module en cours de développement — Sprint X"
- Pas de mode dark (V2)
- Pas de support arabe (V2)
- Pas de tests automatisés (V2)
- Pas de PWA / service worker (sera ajouté quand on traitera vraiment l'offline en Sprint 5)

## Livrable attendu

Un projet React + TypeScript + Tailwind fonctionnel, naviguable, avec tous les écrans listés ci-dessus, prêt pour itérations dans les sprints suivants. La structure de fichiers doit être propre et extensible pour qu'on puisse ajouter les modules métier sans tout refactorer.

Génère ce projet en respectant scrupuleusement les design tokens, l'architecture de composants et les spécifications fonctionnelles.