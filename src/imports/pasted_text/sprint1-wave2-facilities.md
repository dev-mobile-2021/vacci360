# VACCI360 — Sprint 1 · Vague 2 : Formations sanitaires + Équipes mobiles

## Contexte

La Vague 1 du Sprint 1 (Géographie + Villages) est validée. On poursuit le Sprint 1 Référentiel avec :
1. Correction d'une régression : SplitMapView manquant sur `/referentiel/villages`
2. Master Facility Registry (`/referentiel/formations` liste + `/referentiel/formations/:id` détail)
3. Gestion des Équipes mobiles (`/referentiel/equipes` liste + `/referentiel/equipes/:id` détail)

## Stack (rappel, déjà en place)

- Tailwind v4 + tokens dans `src/styles/theme.css`
- `@make-kits` + wrappers custom dans `src/components/ui/`
- React Router v6
- @tanstack/react-table, react-leaflet/leaflet, papaparse, date-fns

**Réutilisez impérativement** les composants créés en Vague 1 :
- DataTable, FilterPanel, ImportDialog
- SplitMapView, MapView
- Tabs, Breadcrumb
- CoverageBar, AccessibilityBadge
- EmptyState (du Sprint 0)

Le pattern UI Vague 2 doit être strictement parallèle à celui de Villages. Si une page Villages contient une section avec un design particulier, Formations doit avoir une section équivalente avec le même design. Cohérence > originalité.

## Périmètre détaillé

### 0. Correction préalable — SplitMapView sur `/referentiel/villages`

Si la liste Villages n'affiche actuellement pas la vue Split (tableau + carte côte à côte avec drag handle), corrigez-la avant d'attaquer le reste.

Spec rappel :
- Split horizontal 60% tableau / 40% carte par défaut
- Drag handle vertical entre les deux panneaux pour ajuster le ratio (entre 30/70 et 70/30)
- Toggle en haut à droite : "Tableau seul" / "Tableau + carte" (défaut) / "Carte seule"
- Synchronisation bidirectionnelle :
  - Click sur ligne tableau → highlight marker carte + recentre carte sur le village
  - Click sur marker carte → highlight ligne tableau + scroll tableau jusqu'à elle
- Filtres affectent les deux vues simultanément
- Markers colorés selon couverture DTC3 (5 paliers OMS)
- Cluster automatique si >50 markers

### 1. Données mock à compléter

#### `src/data/mockFacilities.ts` (enrichir)

Le fichier existe depuis la Vague 1 avec environ 20 formations pour la province du Lac. Enrichissez-le pour atteindre **40 formations** avec données complètes :

```ts
export type FacilityType = 'hospital' | 'health_center' | 'health_post' | 'health_house';
export type FacilityStatus = 'operational' | 'degraded' | 'closed' | 'under_construction';
export type VaccinationStrategy = 'fixed' | 'advanced' | 'mobile' | 'mixed';

export type ColdChainEquipment = {
  id: string;
  type: 'refrigerator' | 'freezer' | 'cold_box' | 'vaccine_carrier';
  brand: string;                    // ex: "Vestfrost MK 304"
  capacity: number;                  // litres ou nombre de doses
  status: 'operational' | 'degraded' | 'broken' | 'maintenance';
  lastMaintenance: Date | null;
  nextMaintenanceDue: Date | null;
  installedDate: Date;
};

export type StaffMember = {
  name: string;
  role: 'doctor' | 'nurse' | 'midwife' | 'community_agent' | 'administrator' | 'driver';
  pevTrained: boolean;             // formé à la vaccination PEV
  pevTrainingDate: Date | null;
};

export type Facility = {
  id: string;
  name: string;                     // ex: "Centre de Santé de Bol"
  code: string;                     // code FOSA officiel (ex: "TD-LAC-CS-001")
  type: FacilityType;
  status: FacilityStatus;
  
  // Hiérarchie géographique
  provinceId: string;
  departmentId: string;
  subPrefectureId: string;
  cantonId: string;
  
  // Localisation
  lat: number;
  lng: number;
  address: string;                  // adresse descriptive
  
  // Ressources humaines
  staff: StaffMember[];
  staffCount: number;               // pré-calculé
  pevTrainedCount: number;          // pré-calculé
  
  // Chaîne du froid
  coldChainEquipments: ColdChainEquipment[];
  coldChainCapacityDoses: number;   // capacité totale en doses
  coldChainOperational: boolean;    // au moins un équipement opérationnel
  
  // Zone de desserte
  villagesServed: number;           // pré-calculé depuis mockVillages
  populationCovered: number;        // pré-calculé
  targetPopulationUnder5: number;
  averageRadiusKm: number;
  
  // Activités PEV
  vaccinationStrategies: VaccinationStrategy[];
  sessionsPerMonth: number;
  lastSessionDate: Date | null;
  monthlyCoverage: {
    bcg: number;
    dtc1: number;
    dtc3: number;
    measles: number;
  };
  
  // Accessibilité
  roadAccess: {
    drySeasonAccess: AccessibilityRating;
    wetSeasonAccess: AccessibilityRating;
  };
  transportModesAvailable: ('foot' | 'bike' | 'motorbike' | '4x4' | 'pirogue')[];
  
  // Connectivité
  mobileNetwork: {
    available: boolean;
    quality: 'good' | 'intermittent' | 'poor';
    operators: string[];             // ex: ['Airtel', 'Tigo']
  };
  hasInternet: boolean;
  
  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt: Date | null;
  verifiedBy: string | null;
  dataQualityScore: number;
};
```

Variance à respecter dans les 40 facilities :
- 2-3 hôpitaux régionaux (Bol surtout)
- 15-18 centres de santé (CS)
- 18-22 postes de santé (PS) et cases de santé
- Statuts variés : 30 opérationnelles, 6 dégradées, 3 fermées, 1 en construction
- 5-7 facilities sans chaîne du froid opérationnelle (équipements en panne)
- Couverture variable (du 35% au 98%)
- Connectivité mixte (10 sans réseau, 15 intermittent, 15 bon)

Cohérence avec mockVillages : chaque village pointe vers une facility existante via facilityId.

#### `src/data/mockTeams.ts` (enrichir)

Le fichier existe avec ~10 équipes basiques. Enrichissez-le pour atteindre **18 équipes** pour la province du Lac avec données complètes :

```ts
export type TeamStatus = 'available' | 'on_mission' | 'resting' | 'training' | 'unavailable';
export type VehicleType = 'motorbike' | 'car' | '4x4' | 'pirogue' | 'foot';

export type TeamMember = {
  id: string;
  name: string;
  role: 'team_leader' | 'nurse' | 'midwife' | 'community_agent' | 'driver';
  phone: string;
  pevCertified: boolean;
  certificationDate: Date | null;
  yearsOfExperience: number;
};

export type EquipmentItem = {
  type: 'cold_box' | 'vaccine_carrier' | 'gps_device' | 'tablet' | 'thermometer' | 'first_aid_kit';
  quantity: number;
  status: 'operational' | 'damaged' | 'missing';
};

export type Team = {
  id: string;
  name: string;                     // ex: "Équipe Mobile Bol-A"
  code: string;                     // identifiant court (ex: "EM-BOL-A")
  
  // Rattachement
  homeFacilityId: string;
  responsibleDistrict: string;
  
  // Composition
  members: TeamMember[];
  membersCount: number;             // pré-calculé
  teamLeaderId: string;
  
  // Logistique
  vehicleType: VehicleType;
  vehicleId: string | null;         // immatriculation si applicable
  equipment: EquipmentItem[];
  
  // Statut opérationnel
  status: TeamStatus;
  currentMissionId: string | null;  // pour Sprint 5
  nextMissionStart: Date | null;
  
  // Historique
  totalMissionsCompleted: number;
  totalVillagesCovered: number;
  totalChildrenVaccinated: number;
  averageRating: number;            // 0-5, basé sur conformité
  
  // Zone d'intervention habituelle
  primaryInterventionZone: {
    cantons: string[];              // IDs des cantons habituellement couverts
    villagesCount: number;
  };
  
  // Disponibilités
  weeklySchedule: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  
  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
};
```

Variance dans les 18 équipes :
- 12 équipes mobiles 4x4
- 4 équipes motorbike (zones difficiles)
- 2 équipes pirogue (rives du Lac Tchad)
- Statuts mixtes : 8 available, 6 on_mission, 2 resting, 1 training, 1 unavailable
- Tailles variables : 3 à 6 membres par équipe
- Certifications PEV variées (90-100% au sein de chaque équipe)

### 2. Page `/referentiel/formations` — Liste filtrable

**Pattern identique à `/referentiel/villages`** avec adaptations métier.

**Header de page** :
- H1 "Master Facility Registry"
- Body Stone-600 "Référentiel des formations sanitaires impliquées dans la vaccination."
- Actions à droite : "Nouvelle formation" (primary), "Importer CSV" (secondary), "Exporter" (dropdown)
- Breadcrumb : Référentiel / Formations sanitaires

**Barre de filtres** (réutiliser FilterPanel) :
- Recherche globale (nom + code)
- Province / Département / Canton (cascading)
- Type FOSA (multi-toggles : Hôpital, Centre Santé, Poste Santé, Case Santé)
- Statut (multi-toggles : Opérationnelle, Dégradée, Fermée, En construction)
- Chaîne du froid (toggle : Opérationnelle, Dégradée, Hors service)
- Stratégies vaccinales (multi : Fixe, Avancée, Mobile, Mixte)
- Connectivité (multi : Bonne, Intermittente, Sans réseau)
- Couverture DTC3 (range slider 0-100%)
- Recherche par formation desservant un canton (autocomplete)
- Bouton "Réinitialiser"

**Tableau Formations** (utiliser DataTable) :

Colonnes :
1. Checkbox sélection
2. Nom de la formation (body-strong) + code FOSA en mono small Stone-500
3. Type (badge selon type : H, CS, PS, CdS)
4. Localisation (canton + département, small)
5. Statut (badge coloré)
6. Personnel (count + "(X formés PEV)" en small)
7. Chaîne du froid (icône Snowflake colorée selon état : Success/Warning/Danger)
8. Capacité doses (number formatté)
9. Villages desservis (count)
10. Couverture DTC3 (CoverageBar compact)
11. Connectivité (icône WifiHigh/WifiLow/WifiOff colorée)
12. Actions (MoreVertical menu)

Tri par défaut : statut "Fermée" et "Dégradée" en haut (alertes), puis par nom.

**Vue Split** :
- Tableau gauche, carte droite
- Markers carte avec icônes différenciées par type FOSA (carrés Primary pour CS, ronds pour PS, croix pour Hôpitaux)
- Couleur du marker selon statut (Success/Warning/Danger)
- Popup au click marker : mini-fiche formation avec nom, type, statut, lien "Voir détail"

**Vue alternative — "Cartographie de desserte"** :
- Toggle additionnel dans le toolbar de la carte : "Afficher zones de desserte"
- Quand activé : affiche les polygones (cercles) autour de chaque facility avec son rayon d'action
- Code couleur : zones couvertes en Success-100 translucide, zones non couvertes en Danger-100 translucide
- Permet de visualiser les "trous de couverture"

**Empty states** : identiques au pattern Villages.

### 3. Page `/referentiel/formations/:id` — Détail formation

**Pattern identique à `/referentiel/villages/:id`** avec onglets adaptés.

**Header de page** :
- Breadcrumb : Référentiel / Formations / [Nom]
- Bouton retour
- H1 : nom de la formation
- Sous-titre : code FOSA mono + type + localisation hiérarchique
- Badge statut à droite
- Actions : "Voir sur carte", "Imprimer", "Modifier", "Plus" (dropdown)

**Bandeaux alertes conditionnels** :
- Si statut "closed" : banner danger "Cette formation est actuellement fermée. Les villages desservis sont redirigés vers [nom facility de secours]."
- Si chaîne du froid HS : banner warning "La chaîne du froid de cette formation est hors service depuis [date]. Les vaccinations sont suspendues."
- Si dernière vérification > 90j : banner info "Les données n'ont pas été vérifiées depuis [X] jours."

**Tabs** :
- Informations (par défaut)
- Ressources
- Zone de desserte
- Activités PEV
- Audit

**Tab "Informations"** — Grid 2 colonnes :

Colonne gauche :
- Card "Identification"
  - Nom officiel, code FOSA (mono copiable)
  - Type (badge)
  - Hiérarchie complète (Province > Département > Sous-préfecture > Canton)
- Card "Localisation"
  - Coordonnées GPS (mono copiables)
  - Carte Leaflet mini avec marker
  - Adresse descriptive
  - Bouton "Itinéraire depuis votre position"

Colonne droite :
- Card "Accessibilité"
  - AccessibilityBadge double (saison sèche/pluies)
  - Modes de transport disponibles (chips icônes)
  - Notes contextuelles
- Card "Connectivité"
  - Indicateur réseau mobile (icône WiFi colorée + qualité)
  - Opérateurs disponibles (chips)
  - Internet disponible (oui/non)
- Card "Métadonnées"
  - Date de création
  - Dernière mise à jour + auteur
  - Dernière vérification terrain
  - Score qualité données (jauge)

**Tab "Ressources"** :

Section "Personnel" :
- Header : "Équipe sur place (X membres dont Y formés PEV)"
- Tableau ou cards avec :
  - Avatar (initiales)
  - Nom
  - Rôle (badge)
  - Formé PEV (badge Success/Stone) + date de formation
  - Téléphone (lien tel:)
- Bouton "Ajouter un membre" (placeholder si édition non implémentée)

Section "Chaîne du froid" :
- Header : "Équipements de stockage et transport"
- KPI résumé : "Capacité totale : X doses · Y équipements opérationnels sur Z"
- Liste d'equipment cards :
  - Type (icône + nom)
  - Marque et modèle
  - Capacité
  - Statut (badge avec couleur appropriée)
  - Date dernière maintenance
  - Prochaine maintenance prévue (avec alerte si dépassée)
  - Date d'installation
  - Bouton "Signaler problème" pour status operational/degraded

Si chaîne du froid HS ou aucun équipement : empty state spécifique avec call-to-action.

Section "Autres équipements" (optionnel, pour les hôpitaux) :
- Liste simple : matériel médical pertinent au PEV

**Tab "Zone de desserte"** :

Section header :
- KPIs résumés en row : "X villages · Y habitants · Z enfants <5 ans · Rayon moyen W km"

Section "Carte de desserte" :
- Grande carte Leaflet (50% hauteur écran)
- Marker central : la formation
- Markers villages desservis colorés selon couverture DTC3
- Polygones d'isochrones (rayon moyen en cercle ou polygone réel si données dispo)
- Légende avec 5 paliers couverture

Section "Liste des villages desservis" :
- Mini DataTable (réutiliser composant)
- Colonnes : Nom village, Distance (km), Population, Couverture DTC3, Dernière visite, Action (lien vers fiche village)
- Tri par défaut : villages les moins bien couverts en haut
- Filtres simples : couverture, distance, dernière visite

**Tab "Activités PEV"** :

Section "Stratégies vaccinales" :
- Chips affichant les stratégies configurées (Fixe/Avancée/Mobile/Mixte)
- Pour chaque stratégie active : nombre de séances par mois, jours typiques

Section "Indicateurs de couverture mensuelle" :
- Grid 4 cards : BCG, DTC1, DTC3, Rougeole
- Pour chaque : pourcentage + CoverageBar + tendance vs mois précédent

Section "Historique des séances" :
- Timeline ou tableau des séances récentes
- Date, type de séance, antigène, nombre enfants vaccinés, équipe responsable
- Pagination 12 mois

Section "Performance comparée" :
- Graphique recharts : ligne temporelle 12 mois de couverture DTC3
- Comparaison avec moyenne du district (ligne en pointillé)
- Comparaison avec objectif PEV (95%)

**Tab "Audit"** : identique à pattern Villages (tableau modifications chronologique).

### 4. Page `/referentiel/equipes` — Liste équipes mobiles

**Layout** : différent des autres listes — privilégier les **cards** plutôt qu'un tableau, car une équipe se "raconte" mieux visuellement.

**Header de page** :
- H1 "Équipes mobiles"
- Body Stone-600 "Gestion des équipes de vaccination opérationnelles."
- Actions : "Nouvelle équipe" (primary), "Affecter à une mission" (secondary, placeholder)
- Breadcrumb : Référentiel / Équipes

**Barre de filtres** :
- Recherche (nom + code)
- Statut (multi-toggles : Disponible, En mission, Au repos, Formation, Indisponible)
- Type véhicule (multi)
- Formation de rattachement (autocomplete)
- District d'intervention (multi)
- Bouton reset

**Vue par défaut — Grid de cards** :

Grid responsive (3 colonnes desktop, 2 tablette, 1 mobile à venir).

Chaque card Équipe :
```
┌──────────────────────────────────────────────┐
│ ● Disponible              [...]              │  ← statut + menu actions
│                                              │
│ Équipe Mobile Bol-A                          │  ← nom
│ EM-BOL-A · CS de Bol                         │  ← code + facility
│                                              │
│ ┌─┬─┬─┬─┐                                    │
│ │ASGOSF│ + 1                                 │  ← avatars stack
│ └─┴─┴─┴─┘                                    │
│                                              │
│ 🚗 4×4 Toyota Hilux  ·  TD-1234              │  ← véhicule
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ 24 missions  ·  847 enfants vaccinés    │ │  ← KPIs
│ │ ⭐ 4.6/5 conformité                     │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ 📍 Zone d'intervention : Cantons Bol Centre,│
│    Bol Nord, Tataverom (45 villages)         │  ← zone d'action
│                                              │
│ Prochaine mission : 15 février 2026         │  ← prochaine activité
│                                              │
│ [Voir le détail →]                          │  ← CTA
└──────────────────────────────────────────────┘
```

Détails visuels par card :
- Border 0.5px Stone-200, radius 12px, padding 16px, hover border Primary-300
- Indicateur statut en haut-gauche : point coloré pulsant si "En mission", statique sinon
  - Available : Success
  - On mission : Primary pulsant
  - Resting : Stone
  - Training : Info
  - Unavailable : Danger
- Menu actions en haut-droite (MoreVertical) : Voir détail, Modifier, Affecter à mission, Suspendre
- Avatars stack : 4 visibles max + "+N" si plus de 4 membres
- Hover sur avatar : tooltip avec nom et rôle
- KPI block : background Stone-50, padding 12px, radius 8px
- Note conformité : étoiles colorées Warning (jaune ambre)
- CTA "Voir le détail" → navigue vers `/referentiel/equipes/:id`

**Vue alternative — Tableau** :
Toggle en haut-droite : "Vue cards" (défaut) / "Vue tableau".
Le tableau réutilise DataTable avec colonnes simplifiées.

**Vue cartographie** :
Toggle additionnel : "Voir sur carte".
Affiche les équipes sur la carte, positionnées sur leur facility de rattachement.
Markers différenciés par véhicule (icône moto, voiture, pirogue).
Couleur selon statut.
Click marker → popup mini-card avec lien vers détail.

**Empty state** :
- Aucune équipe : icône Users 64px, "Aucune équipe enregistrée", body explicatif, bouton "Créer la première équipe"
- Filtres sans résultat : empty state filtres habituel

### 5. Page `/referentiel/equipes/:id` — Détail équipe

**Header de page** :
- Breadcrumb : Référentiel / Équipes / [Nom équipe]
- Bouton retour
- H1 : nom de l'équipe
- Sous-titre : code + facility de rattachement + district
- Badge statut à droite (avec point pulsant si en mission)
- Actions :
  - Bouton primary "Affecter à une mission" (placeholder Sprint 4)
  - Bouton secondary "Contacter l'équipe" (ouvre modale avec téléphones des membres)
  - Bouton secondary "Voir historique"
  - Dropdown "Plus" : Modifier, Suspendre, Dupliquer, Supprimer

**Bandeaux alertes conditionnels** :
- Si statut "on_mission" : banner info avec icône Activity "Mission en cours : [nom mission] · Démarrée [il y a X heures] · [Y/Z villages visités]"
- Si membres non certifiés PEV : banner warning "X membre(s) de cette équipe ne sont pas certifiés PEV."
- Si équipement endommagé : banner warning "Certains équipements nécessitent une vérification."

**Tabs** :
- Composition (par défaut)
- Logistique
- Zone et planning
- Historique et performance
- Audit

**Tab "Composition"** :

Section header :
- "X membres · Y certifiés PEV · Leader : [Nom]"

Section "Membres de l'équipe" :
- Cards individuelles ou tableau
- Pour chaque membre :
  - Avatar circulaire 48px (initiales)
  - Nom + rôle (badge)
  - Téléphone (cliquable tel:)
  - Certification PEV (badge Success avec date ou Stone si non certifié)
  - Années d'expérience (small Stone-600)
  - Badge "Leader" si applicable
  - Menu actions : Voir profil, Retirer de l'équipe, Réassigner rôle
- Bouton "Ajouter un membre"
- Empty state si moins de 3 membres : warning "Une équipe PEV doit compter au minimum 3 membres."

Section "Compétences couvertes" :
- Liste des rôles présents avec count
- Identification des rôles manquants (ex: "Aucun chauffeur dans cette équipe")
- Recommandations si déséquilibre

**Tab "Logistique"** :

Section "Véhicule" :
- Card avec icône type véhicule
- Type, marque, modèle, immatriculation
- État (badge)
- Carburant estimé pour mission moyenne
- Bouton "Signaler un problème véhicule"

Section "Équipements" :
- Tableau des équipements assignés
- Type, quantité, statut
- Bouton "Demander réapprovisionnement"
- Indicateur global : "X équipements opérationnels sur Y total"

Section "Capacité opérationnelle" :
- Calcul auto : population pouvant être couverte par jour selon équipement
- Stock vaccins recommandé pour mission type
- Autonomie en jours

**Tab "Zone et planning"** :

Section "Zone d'intervention" :
- Carte Leaflet (50% hauteur)
- Polygone(s) des cantons couverts en Primary-100 translucide
- Markers des villages dans la zone (couleur selon couverture DTC3)
- Marker de la facility de rattachement
- KPIs : nb cantons, nb villages, population couverte

Section "Disponibilité hebdomadaire" :
- Calendrier hebdomadaire visuel
- Jours travaillés vs jours off
- Jours actuellement en mission
- Bouton "Modifier les disponibilités"

Section "Prochaines missions planifiées" :
- Timeline horizontale ou liste verticale
- Pour chaque : date, durée prévue, zone, micro-plan associé
- Empty state si aucune planifiée : "Aucune mission planifiée. Affecter cette équipe à un micro-plan."

**Tab "Historique et performance"** :

Section "KPIs globaux" :
- Grid de 4 metric cards :
  - Missions complétées (count)
  - Villages couverts (count cumulé)
  - Enfants vaccinés (count cumulé)
  - Note conformité moyenne (étoiles + score sur 5)

Section "Évolution mensuelle" :
- Graphique recharts ligne ou aire
- 12 mois : nb enfants vaccinés par mois
- Optionnel : superposer la moyenne des équipes du district

Section "Historique missions" :
- Tableau chronologique inversé
- Date, nom mission, zone, durée, villages visités/planifiés, enfants vaccinés, note conformité, écart vs plan
- Filtre par période (3 mois, 6 mois, 1 an, tout)
- Lien "Voir détail mission" (placeholder Sprint 5)

Section "Points forts et axes d'amélioration" :
- Card synthèse algorithmique simple (depuis les données mock) :
  - Points forts : zones où l'équipe excelle
  - Axes d'amélioration : couverture en baisse, villages systématiquement non visités, etc.

**Tab "Audit"** : identique pattern, historique des modifications.

### 6. Mise à jour de la sidebar

Retirer les EmptyState placeholders pour :
- `/referentiel/formations` → écran fonctionnel
- `/referentiel/formations/:id` → écran fonctionnel
- `/referentiel/equipes` → écran fonctionnel
- `/referentiel/equipes/:id` → écran fonctionnel

### 7. Intégration avec le scope global

Identique à la Vague 1 : le scope du header filtre automatiquement les listes Formations et Équipes.

### 8. Liens croisés entre entités

Maintenant que toutes les entités du référentiel existent :
- Sur une fiche Village (Tab Informations, card "Rattachement FOSA") → le lien doit naviguer vers la fiche Formation correspondante
- Sur une fiche Formation (Tab Zone de desserte, liste des villages) → chaque ligne lie vers la fiche Village
- Sur une fiche Formation (champ "Équipes opérant depuis cette FOSA") → ajouter cette section avec liens vers fiches Équipes
- Sur une fiche Équipe (champ "Facility de rattachement") → lien vers fiche Formation
- Sur une fiche Équipe (Tab Zone, villages dans la zone) → liens vers fiches Villages

Cohérence : naviguer entre toutes les entités du référentiel doit être fluide et toujours bidirectionnel.

## Tests à pouvoir effectuer après cette vague

1. Connexion en tant que Gestionnaire Provincial Lac → Référentiel / Formations → voir 40 facilities
2. Filtrer par "Chaîne du froid hors service" → 5-7 résultats avec banners explicites sur leur fiche
3. Cliquer sur une formation → voir 5 onglets, naviguer dans "Zone de desserte" → carte affichant villages couverts
4. Click sur un village dans la liste de la formation → navigation vers fiche village
5. Sur fiche village → cliquer "Rattachement FOSA" → retour à la fiche formation
6. Aller dans Référentiel / Équipes → vue cards par défaut
7. Toggle vers vue tableau → même données en format différent
8. Toggle vers vue carte → équipes positionnées sur leur facility
9. Cliquer sur une équipe → fiche détaillée
10. Tab "Zone et planning" → carte + calendrier hebdomadaire
11. Tab "Historique et performance" → graphique 12 mois + tableau missions
12. Vérifier que les filtres scope du header affectent bien Formations et Équipes
13. Liste Villages : vue split tableau+carte fonctionne (correction SplitMapView)
14. Click marker carte sur Villages → ligne tableau highlight et scroll vers elle

## Contraintes de cohérence (rappel)

- Aucune nouvelle dépendance npm (tout est déjà installé)
- Réutilisation maximale des composants Vague 1
- Pattern UI strictement parallèle à Villages
- Toutes les données mock cohérentes entre elles (un village pointe vers une facility existante, une équipe pointe vers une facility existante, etc.)
- Tokens design system respectés partout
- Navigation bidirectionnelle entre entités du référentiel

## Performance

- Pagination tableaux 25 par défaut
- Lazy loading des onglets (charger seulement le tab actif)
- Marker clustering sur cartes >50 markers
- Memoization des computations lourdes (villages servis par facility, etc.)

Allez-y avec cette Vague 2. Si l'ensemble dépasse votre capacité, découpez en :
- Vague 2a : Correction SplitMapView + mockFacilities enrichi + Formations liste + Formation détail
- Vague 2b : mockTeams enrichi + Équipes liste + Équipe détail + liens croisés

Sinon, livrez tout d'un bloc. Prévenez-moi de votre choix.