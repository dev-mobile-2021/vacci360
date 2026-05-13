# VACCI360 — Sprint 1 · Vague 1 : Référentiel (Géographie + Villages)

## Contexte

Le Sprint 0 (Shell applicatif) est validé. On entre maintenant dans le premier sprint métier : la mise en place du référentiel de données qui alimentera tous les autres modules. Sans ce référentiel, rien d'autre ne peut fonctionner.

Cette vague 1 du Sprint 1 livre :
1. Le socle de données mock du référentiel (géographie + villages + formations + équipes + users)
2. L'écran Géographie (hiérarchie navigable Pays → Province → Département → Sous-préfecture → Canton → Village)
3. L'écran Villages liste (tableau filtrable + carte split-view)
4. L'écran Village détail (fiche avec onglets)
5. Patterns réutilisables (DataTable, FilterPanel, ImportDialog, SplitMapView)

Les Formations, Équipes et Utilisateurs seront traités dans les vagues 2 et 3.

## Stack (rappel, déjà en place depuis Sprint 0)

- Tailwind v4 + tokens dans `src/styles/theme.css`
- `@make-kits` + wrappers custom dans `src/components/ui/`
- React Router v6
- Inter via `src/styles/fonts.css`
- Contexts existants : `auth`, `scope`, `notifications`, `toast`, `offline`

**Réutilisez impérativement** tous les composants UI créés au Sprint 0 (Button, Input, Card, Badge, Avatar, Drawer, Modal, EmptyState, etc.). Ne re-créez pas.

## Nouvelles dépendances à installer

- `@tanstack/react-table` pour les tableaux de données avancés
- `react-leaflet` + `leaflet` pour les cartes interactives (alternative légère à Mapbox pour Sprint 1)
- `papaparse` pour l'import CSV
- `date-fns` pour la manipulation de dates (formats relatifs, formatage)
- `zustand` pour la gestion d'état du filtre (léger, pas besoin de Redux)

Si l'une de ces librairies n'est pas compatible avec l'environnement Figma Make, signalez-le et proposez une alternative.

## Périmètre détaillé de la vague 1

### 1. Socle de données mock

Créer les fichiers suivants avec des données réalistes et cohérentes basées sur la géographie réelle du Tchad :

#### `src/data/mockGeography.ts`

Hiérarchie complète :
```ts
export type GeoLevel = 'country' | 'province' | 'department' | 'sub_prefecture' | 'canton' | 'village';

export type GeoNode = {
  id: string;
  level: GeoLevel;
  name: string;
  code: string;             // code administratif (ex: "TD-LAC-BOL-001")
  parentId: string | null;
  population: number;        // population estimée
  centroidLat: number;
  centroidLng: number;
  childrenCount: number;     // pré-calculé pour affichage
};
```

Données minimales requises :
- 1 Pays : Tchad (id: `td`)
- 23 Provinces du Tchad (id format: `td-{province-slug}`) avec lat/lng et populations réelles approximatives. Au minimum les 3 pilotes complètement développées : Lac, Kanem, Hadjer-Lamis
- Pour Province du Lac : 3 Départements (Mamdi avec préfecture Bol, Wayi avec préfecture Liwa, Kaya avec préfecture Ngouri)
- Pour chaque département du Lac : 2-3 Sous-préfectures
- Pour chaque sous-préfecture : 3-5 Cantons
- Pour chaque canton : 8-15 Villages (au total ~150-200 villages dans la province du Lac)

Pour les autres provinces (Kanem, Hadjer-Lamis), développer une hiérarchie similaire mais moins exhaustive (50-80 villages chacune).

Pour les 20 provinces restantes, juste les nœuds province sans descendre dans le détail.

#### `src/data/mockVillages.ts`

Type Village enrichi (selon le brief original) :
```ts
export type AccessibilityRating = 'easy' | 'moderate' | 'difficult' | 'very_difficult';
export type SeasonAccessibility = {
  drySeasonAccess: AccessibilityRating;
  wetSeasonAccess: AccessibilityRating;
};

export type Village = GeoNode & {
  level: 'village';
  facilityId: string;              // FOSA de rattachement
  facilityDistanceKm: number;
  facilityTravelTimeMin: number;
  estimatedChildrenUnder5: number; // population cible vaccination
  accessibility: SeasonAccessibility;
  infrastructure: {
    hasSchool: boolean;
    hasWaterPoint: boolean;
    hasMarket: boolean;
    hasMosque: boolean;
  };
  lastVaccinationVisit: Date | null;
  daysSinceLastVisit: number | null;
  vaccinationCoverage: {           // par antigène en %
    bcg: number;
    dtc1: number;
    dtc3: number;
    measles: number;
    overall: number;
  };
  dataQualityScore: number;        // 0-100, score de fiabilité des données
  validationStatus: 'pending' | 'validated' | 'needs_review';
  validatedBy: string | null;
  validatedAt: Date | null;
  photos: string[];                // URLs placeholders Picsum
};
```

Générer **150-200 villages réalistes** pour la province du Lac avec :
- Variation d'accessibilité (saison sèche/pluies)
- Couverture vaccinale variée (certains <50%, d'autres >95%)
- Dates de dernière visite variées (de "il y a 5 jours" à "jamais visité")
- Quelques villages avec données obsolètes (>180 jours)
- Mix de statuts de validation

Utiliser des noms de villages réels du Tchad (Koundjourou, Tchoukoutalia, Bol, Liwa, Ngouri, Bagasola, Daboua, Tataverom, Forkouloum, etc.) avec des coordonnées GPS plausibles autour des centres administratifs.

#### `src/data/mockFacilities.ts`

Type Facility (préparation Vague 2, mais nécessaire dès maintenant pour le rattachement des villages) :
```ts
export type FacilityType = 'hospital' | 'health_center' | 'health_post' | 'health_house';

export type Facility = {
  id: string;
  name: string;
  code: string;                    // code FOSA officiel
  type: FacilityType;
  provinceId: string;
  districtId: string;
  cantonId: string;
  lat: number;
  lng: number;
  status: 'operational' | 'degraded' | 'closed';
  staffCount: number;
  coldChainCapacity: number;       // nb doses stockables
  villagesServed: number;          // pré-calculé
  populationCovered: number;
  connectivity: 'good' | 'intermittent' | 'none';
};
```

Générer ~20 formations pour la province du Lac.

#### `src/data/mockTeams.ts`

Type Team (préparation Vague 2) :
```ts
export type Team = {
  id: string;
  name: string;                    // ex: "Équipe Mobile Bol-A"
  homeFacilityId: string;
  members: { name: string; role: 'nurse' | 'community_agent' | 'driver' | 'supervisor' }[];
  vehicle: string;
  status: 'available' | 'on_mission' | 'resting';
};
```

Générer 8-10 équipes pour la province du Lac.

### 2. Page `/referentiel/geographie` — Hiérarchie navigable

**Route** : `/referentiel/geographie`

**Layout** : split-view 50/50
- Gauche : arbre hiérarchique navigable
- Droite : carte interactive Leaflet + panneau détails

**Header de page** :
- H1 "Hiérarchie géographique"
- Body Stone-600 "Naviguez dans l'organisation administrative du Tchad et de ses zones d'intervention vaccinale."
- Actions à droite : bouton secondary "Importer", bouton secondary "Exporter GeoJSON"
- Breadcrumb : Référentiel / Géographie

**Panneau gauche — Arbre hiérarchique** :
- Background blanc, border 0.5px Stone-200, radius 12px
- Padding 16px
- Barre de recherche en haut : input "Rechercher dans la hiérarchie..."
- Boutons d'action haut-droite : "Tout déplier", "Tout replier"
- Arbre TreeView avec :
  - Niveau Pays (Tchad) en racine, expand par défaut
  - 23 Provinces (chevron droit pour expand)
  - Au click sur expand, charge département puis sous-préfecture puis canton puis villages
  - Chaque nœud affiche : icône niveau (Globe/Building/MapPin/Home), nom, count enfants en badge Stone-100
  - Hover : bg Stone-50
  - Selected : bg Primary-50, text Primary-700, border-left 3px Primary
  - Niveau village : feuille (pas d'expand), icône Home2, click affiche détail dans panneau droit

**Panneau droit — Carte + détails** :
- Background blanc, border 0.5px Stone-200, radius 12px
- En haut : carte Leaflet 50% hauteur du panneau
  - Style sobre (CartoDB Positron ou similaire, niveaux de gris)
  - Zoom sur le scope sélectionné dans l'arbre
  - Marker au centroïde du nœud sélectionné
  - Polygons des nœuds enfants si disponibles
  - Légende minimaliste en bas-gauche
  - Contrôles : zoom, plein écran
- En bas : panneau détails du nœud sélectionné
  - Niveau en tiny uppercase Stone-500
  - Nom en H3
  - Code administratif en mono Stone-500
  - Grid 2 colonnes de stats :
    - Population estimée
    - Nb d'enfants <5 ans (si applicable)
    - Nb d'unités géographiques enfants
    - Coordonnées GPS (lat, lng formatées)
  - Si niveau Province ou Département : mini-graphique couverture vaccinale (barre horizontale avec les 5 paliers OMS)
  - Boutons : "Voir villages de cette zone" (si niveau >= canton) → navigue vers `/referentiel/villages?filter=...`, "Voir formations" → idem

**Empty state** (si rien sélectionné) :
- Icône Globe 64px Stone-300
- "Sélectionnez un niveau administratif"
- "Cliquez sur un élément dans l'arbre pour voir ses détails"

### 3. Page `/referentiel/villages` — Liste filtrable

**Route** : `/referentiel/villages`

**Layout** : split-view ajustable
- Gauche (60% par défaut, ajustable via drag handle) : tableau de données
- Droite (40%) : carte ou détail au survol/sélection
- Toggle pour basculer entre vue "Tableau seul" / "Tableau + carte" / "Carte seule"

**Header de page** :
- H1 "Master Village Registry"
- Body Stone-600 "Base de données géoréférencée des villages du Tchad pour la planification vaccinale."
- Actions à droite :
  - Bouton primary "Nouveau village" (icône Plus)
  - Bouton secondary "Importer CSV"
  - Bouton secondary "Exporter" (dropdown : CSV, GeoJSON, Excel)
- Breadcrumb : Référentiel / Villages

**Barre de filtres** (collée sous le header, sticky) :
- Background Stone-50, border-radius 8px, padding 12px
- Inputs filtres en flex-wrap horizontal :
  - Recherche globale (input + icône Search) : recherche dans nom + code
  - Province (select multi)
  - Département (select multi, dépendant province)
  - Canton (select multi, dépendant département)
  - Accessibilité saison sèche (badges toggles : Facile, Modéré, Difficile, Très difficile)
  - Couverture vaccinale (range slider 0-100% avec deux poignées)
  - Statut validation (toggle : Tous, Validés, En attente, À réviser)
  - Visite récente (select : "Toutes", "Visités < 30j", "30-90j", "> 90j", "Jamais visités")
- Bouton "Réinitialiser les filtres" (btn-ghost small, aligné droite)
- Bouton "Sauvegarder ce filtre" (btn-ghost small)
- Indicateur résultats : "147 villages sur 187" en small Stone-600

**Tableau Villages** (utiliser @tanstack/react-table) :

Colonnes :
1. Checkbox sélection (header : select all)
2. Nom du village (body-strong) + sous-texte canton (small Stone-500)
3. Population (number formatté avec séparateurs)
4. Enfants <5 ans
5. Distance FOSA (km avec 1 décimale)
6. Accessibilité (deux pastilles côte à côte : icône soleil pour sèche, icône goutte pour pluies, couleur selon rating)
7. Dernière visite (date relative type "il y a 12 jours" ou "Jamais" en danger)
8. Couverture DTC3 (mini barre horizontale colorée selon 5 paliers OMS + valeur en %)
9. Statut validation (badge selon état)
10. Actions (icône MoreVertical → menu : Voir détail, Modifier, Marquer validé, Supprimer)

Comportements :
- Tri sur toutes les colonnes (sauf actions et accessibilité)
- Tri par défaut : "Jamais visités" en haut, puis "Dernière visite" ascendante
- Pagination : 25 lignes par défaut, options 10/25/50/100
- Click sur ligne (hors checkbox et actions) → ouvre détail village dans drawer droite (si vue split) ou navigue vers `/referentiel/villages/:id`
- Hover ligne : bg Stone-50
- Ligne sélectionnée : bg Primary-50

Actions bulk (visible quand >= 1 ligne sélectionnée) :
- Barre flottante en haut du tableau : "X villages sélectionnés"
- Boutons : "Valider", "Exporter sélection", "Ajouter à un micro-plan" (placeholder), "Supprimer" (danger)

**Panneau carte** (côté droit) :
- Carte Leaflet centrée sur la zone des villages affichés
- Markers villages avec couleur selon couverture DTC3 (5 paliers OMS)
- Taille marker proportionnelle à la population
- Cluster automatique si >50 markers visibles
- Click sur marker → highlight ligne tableau correspondante + popup avec mini-fiche
- Filtre carte synchronisé avec filtres tableau
- Légende des couleurs en bas-gauche
- Toggle "Afficher couverture DTC3" / "Couverture BCG" / "Couverture Rougeole"

**Empty state** :
- Si aucune donnée importée : icône Home 64px Stone-300, "Aucun village enregistré", body "Importez votre référentiel CSV ou créez le premier village manuellement.", boutons "Importer CSV" (primary) et "Créer manuellement" (secondary)
- Si filtres sans résultat : icône Search 64px Stone-300, "Aucun village ne correspond à vos filtres", body "Essayez d'élargir vos critères de recherche.", bouton "Réinitialiser les filtres"

### 4. Page `/referentiel/villages/:id` — Détail village

**Route** : `/referentiel/villages/:id`

**Layout** : page complète avec sidebar contextuelle gauche

**Header de page** :
- Breadcrumb : Référentiel / Villages / [Nom village]
- À gauche : bouton retour avec icône ArrowLeft + "Retour à la liste"
- H1 : nom du village
- Sous-titre : code administratif (mono Stone-500) + canton + département + province
- Badge statut validation à droite (Validé / En attente / À réviser)
- Actions à droite :
  - Bouton secondary "Voir sur carte"
  - Bouton secondary "Imprimer fiche"
  - Bouton primary "Modifier" (active mode édition inline)
  - Dropdown "Plus" : Valider, Supprimer, Historique

**Bandeau alerte** (si applicable, sous le header) :
- Si villages jamais visités ou >180 jours : banner warning "Ce village n'a pas été visité depuis 187 jours. Considérez son ajout à un micro-plan prioritaire."
- Si data quality score <50 : banner info "Les données de ce village nécessitent une vérification terrain. Score de qualité : 42/100."

**Tabs** (sous le bandeau) :
- Informations (par défaut)
- Historique vaccinal
- Documents & photos
- Audit

**Tab "Informations"** — Layout grid 2 colonnes :

Colonne gauche :
- Card "Localisation"
  - Coordonnées GPS (lat, lng en mono)
  - Carte Leaflet mini (300px hauteur) avec marker
  - Adresse descriptive (canton, sous-préfecture, etc.)
  - Bouton "Ouvrir dans Google Maps"
- Card "Population"
  - Population totale (display number)
  - Enfants <5 ans (calcul ~18% pop)
  - Date d'estimation
  - Sources : RGPH, WorldPop, etc.
- Card "Infrastructure"
  - Liste icônes + label :
    - École (icône avec check/cross selon présence)
    - Point d'eau
    - Marché
    - Mosquée

Colonne droite :
- Card "Rattachement FOSA"
  - Nom de la formation + lien vers fiche FOSA (placeholder Sprint 1 vague 2)
  - Type FOSA (badge)
  - Distance en km
  - Temps de trajet estimé
  - Mode de transport recommandé
- Card "Accessibilité saisonnière"
  - Section "Saison sèche" : icône Sun, badge couleur selon rating + texte explicatif
  - Section "Saison des pluies" : icône CloudRain, idem
  - Note : routes praticables / impraticables, points critiques
- Card "Métadonnées"
  - Date de création de la fiche
  - Dernière modification + par qui
  - Score qualité des données (jauge 0-100 avec couleur)
  - Validations effectuées (date + utilisateur)

**Tab "Historique vaccinal"** :
- Header : "Couverture vaccinale par antigène"
- Grid 5 cards (BCG, DTC1, DTC3, Rougeole, Couverture globale)
  - Chaque card : nom antigène, % en display number, jauge horizontale colorée 5 paliers OMS, tendance vs mois précédent (flèche + delta)
- Section "Timeline des passages d'équipes"
  - Liste verticale chronologique inversée des visites
  - Chaque entrée : date, équipe responsable, nb enfants vaccinés par antigène, observations
  - Format vertical avec ligne de connexion à gauche, point coloré selon résultat (success/warning)
- Graphique évolution couverture sur 12 mois (utiliser recharts)
- Empty state si jamais visité : "Aucune visite vaccinale enregistrée. Ce village n'a jamais été couvert par une campagne."

**Tab "Documents & photos"** :
- Header + bouton "Ajouter document"
- Grid de cards :
  - Photo géoréférencée (preview + nom + date + GPS de prise de vue)
  - PV de validation (PDF preview + nom + date + auteur)
- Empty state si aucun document : icône File 48px Stone-300, "Aucun document attaché", bouton "Ajouter le premier document"

**Tab "Audit"** :
- Header : "Historique des modifications"
- Tableau chronologique :
  - Timestamp (date complète + heure)
  - Utilisateur (avatar + nom)
  - Action (Création / Modification / Validation / Suppression de champ)
  - Champs modifiés (liste compacte)
  - Détails (lien "Voir" → modale avec diff before/after)

### 5. Composants réutilisables à créer

Ces composants seront massivement réutilisés dans les vagues suivantes et les autres sprints.

#### `src/components/data/DataTable.tsx`

Tableau générique typé sur @tanstack/react-table avec :
- Props : columns, data, onRowClick, enableSelection, enablePagination, defaultSort
- Header sticky avec tri
- Pagination intégrée
- Sélection multi avec checkbox header
- État loading (skeleton rows)
- État empty (slot personnalisable)
- Densité confortable/compact selon préférence user

#### `src/components/data/FilterPanel.tsx`

Panneau de filtres composable avec :
- Slot pour les inputs filtres
- Logique de "filtres actifs" (chips affichant les filtres en cours avec X pour retirer)
- Bouton "Réinitialiser tous"
- Compteur résultats (props : totalCount, filteredCount)
- Sauvegarde de presets de filtres (stockés localStorage)

#### `src/components/data/ImportDialog.tsx`

Modal d'import CSV avec :
- Drop zone fichier
- Preview première lignes
- Mapping colonnes (assistant)
- Validation pre-import (détection doublons, erreurs format)
- Barre progression import
- Rapport post-import (X importés, Y doublons ignorés, Z erreurs)
- Téléchargement template CSV vide

#### `src/components/map/SplitMapView.tsx`

Container split tableau + carte avec :
- Drag handle pour ajuster ratio (entre 30/70 et 70/30)
- Toggle vue (Tableau seul / Split / Carte seule)
- Synchronisation des sélections entre les deux vues
- Resize observer pour recalculer la carte

#### `src/components/map/MapView.tsx`

Wrapper Leaflet réutilisable avec :
- Props : center, zoom, markers, polygons, popups, onMarkerClick
- Style sobre par défaut (CartoDB Positron ou équivalent)
- Plugin clustering automatique pour >50 markers
- Légende intégrée customisable
- Contrôles standard (zoom, plein écran, géolocalisation)

#### `src/components/ui/Tabs.tsx`

Tabs réutilisables avec :
- Props : tabs (label, count optionnel), activeTab, onChange
- Style : underline Primary sur tab actif
- Variant "pills" pour usage alternatif

#### `src/components/ui/Breadcrumb.tsx`

Fil d'Ariane avec :
- Props : items (label, href optionnel)
- Séparateur ChevronRight
- Dernier item non cliquable (page courante)
- Truncate avec "..." si trop long

#### `src/components/data/CoverageBar.tsx`

Barre horizontale colorée selon 5 paliers OMS avec :
- Props : value (0-100), antigen (optionnel pour le label)
- Couleurs auto : <50% Danger, 50-70% Warning, 70-85% Jaune, 85-95% Success-light, >95% Success
- Variant : compact (badge inline) ou full (barre + label)

#### `src/components/data/AccessibilityBadge.tsx`

Double pastille accessibilité saison sèche / saison pluies avec :
- Props : drySeasonAccess, wetSeasonAccess
- Icônes Sun / CloudRain
- Couleurs : easy Success, moderate Info, difficult Warning, very_difficult Danger
- Tooltip détaillé au hover

### 6. Mise à jour de la sidebar

Maintenant que ces écrans existent réellement, retirer les EmptyState placeholders pour :
- `/referentiel/geographie` → écran fonctionnel
- `/referentiel/villages` → écran fonctionnel
- `/referentiel/villages/:id` → écran fonctionnel

Conserver les EmptyState pour :
- `/referentiel/formations` (vague 2)
- `/referentiel/equipes` (vague 2)
- Tous les autres modules métier (sprints suivants)

### 7. Adaptations contextuelles

Le scope sélectionné dans le header doit filtrer automatiquement les données affichées dans les écrans Référentiel :
- Si scope = National Tchad → tous les villages visibles
- Si scope = Province du Lac → seulement les villages de cette province
- Si scope = District de Bol → seulement les villages de ce district
- Le filtre Province dans `/referentiel/villages` doit être pré-rempli/grisé selon le scope

Affichage du scope dans le breadcrumb si pertinent (ex : "Province du Lac · Référentiel / Villages").

## Tests à pouvoir effectuer après cette vague

1. Connexion en tant qu'Admin → naviguer vers Référentiel / Géographie → voir l'arbre Tchad, déplier Lac, descendre jusqu'à un village, voir ses détails à droite
2. Naviguer vers Référentiel / Villages → voir le tableau de ~150-200 villages du Lac
3. Filtrer par accessibilité "Difficile en saison des pluies" → tableau et carte se mettent à jour
4. Trier par "Dernière visite" → voir en haut les villages jamais visités
5. Sélectionner 5 villages via checkbox → barre d'actions bulk apparaît
6. Cliquer sur un village → voir sa fiche détaillée avec 4 onglets
7. Sur la fiche : voir les 5 cards de couverture vaccinale par antigène, la timeline des passages d'équipes
8. Changer de scope (Header → "District de Bol") → la liste Villages se filtre automatiquement
9. Cliquer "Importer CSV" → voir la modale d'import avec drop zone et preview
10. Exporter en GeoJSON → téléchargement déclenché

## Contraintes de cohérence

- Tous les nouveaux écrans utilisent l'AppShell du Sprint 0 (sidebar + header)
- Toutes les couleurs depuis les tokens (jamais hardcodé)
- Tous les composants nouveaux dans `src/components/` (data/, map/, ui/, layout/)
- Toutes les données mock dans `src/data/` (un fichier par entité)
- Tous les types dans `src/types/` (un fichier par domaine : `geography.ts`, `village.ts`, etc.)
- Tableaux avec @tanstack/react-table impérativement
- Cartes avec Leaflet (gratuit, pas de clé API requise)
- Aucune route ne doit retourner 404 (toutes déclarées même en placeholder)

## Performance

- Lazy loading des routes lourdes (carte, tableau)
- Virtualization du tableau si >100 lignes (option @tanstack/react-table)
- Marker clustering sur carte si >50 markers
- Memoization des filtres et tris (useMemo)

Allez-y avec cette vague 1. Si l'ensemble dépasse votre capacité de génération en une passe, prévenez-moi et coupez en sous-vagues 1a (socle données + Géographie) et 1b (Villages liste + détail).