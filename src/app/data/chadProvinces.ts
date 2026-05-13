/** Données réelles approximatives des 23 provinces du Tchad. */
export interface ProvinceSeed {
  slug: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  population: number;
}

export const CHAD_PROVINCES: ProvinceSeed[] = [
  { slug: 'batha', name: 'Batha', code: 'TD-BA', lat: 13.85, lng: 18.55, population: 535000 },
  { slug: 'borkou', name: 'Borkou', code: 'TD-BO', lat: 17.92, lng: 18.97, population: 99000 },
  { slug: 'chari-baguirmi', name: 'Chari-Baguirmi', code: 'TD-CB', lat: 11.95, lng: 15.55, population: 622000 },
  { slug: 'ennedi-est', name: 'Ennedi Est', code: 'TD-EE', lat: 16.40, lng: 22.30, population: 100000 },
  { slug: 'ennedi-ouest', name: 'Ennedi Ouest', code: 'TD-EO', lat: 17.00, lng: 21.50, population: 75000 },
  { slug: 'guera', name: 'Guéra', code: 'TD-GR', lat: 11.45, lng: 18.45, population: 553000 },
  { slug: 'hadjer-lamis', name: 'Hadjer-Lamis', code: 'TD-HL', lat: 12.50, lng: 16.00, population: 567000 },
  { slug: 'kanem', name: 'Kanem', code: 'TD-KA', lat: 14.45, lng: 15.42, population: 415000 },
  { slug: 'lac', name: 'Lac', code: 'TD-LC', lat: 13.45, lng: 14.40, population: 451000 },
  { slug: 'logone-occidental', name: 'Logone Occidental', code: 'TD-LO', lat: 8.65, lng: 16.05, population: 683000 },
  { slug: 'logone-oriental', name: 'Logone Oriental', code: 'TD-LR', lat: 8.55, lng: 16.65, population: 796000 },
  { slug: 'mandoul', name: 'Mandoul', code: 'TD-MA', lat: 8.95, lng: 17.65, population: 638000 },
  { slug: 'mayo-kebbi-est', name: 'Mayo-Kebbi Est', code: 'TD-ME', lat: 9.85, lng: 14.90, population: 770000 },
  { slug: 'mayo-kebbi-ouest', name: 'Mayo-Kebbi Ouest', code: 'TD-MO', lat: 10.05, lng: 14.10, population: 565000 },
  { slug: 'moyen-chari', name: 'Moyen-Chari', code: 'TD-MC', lat: 9.15, lng: 18.30, population: 633000 },
  { slug: 'ndjamena', name: "N'Djamena", code: 'TD-ND', lat: 12.13, lng: 15.05, population: 1100000 },
  { slug: 'ouaddai', name: 'Ouaddaï', code: 'TD-OD', lat: 13.85, lng: 21.05, population: 759000 },
  { slug: 'salamat', name: 'Salamat', code: 'TD-SA', lat: 10.95, lng: 20.65, population: 354000 },
  { slug: 'sila', name: 'Sila', code: 'TD-SI', lat: 12.10, lng: 21.40, population: 388000 },
  { slug: 'tandjile', name: 'Tandjilé', code: 'TD-TA', lat: 9.55, lng: 16.50, population: 700000 },
  { slug: 'tibesti', name: 'Tibesti', code: 'TD-TI', lat: 21.35, lng: 17.00, population: 30000 },
  { slug: 'wadi-fira', name: 'Wadi Fira', code: 'TD-WF', lat: 14.45, lng: 22.00, population: 549000 },
  { slug: 'barh-el-gazel', name: 'Barh-el-Gazel', code: 'TD-BG', lat: 14.25, lng: 16.20, population: 287000 },
];

/** Hiérarchie complète pour les 3 provinces pilotes. */
export interface DepartmentSeed {
  slug: string;
  name: string;
  prefecture: string;
  lat: number;
  lng: number;
  subPrefectures: SubPrefectureSeed[];
}

export interface SubPrefectureSeed {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  cantons: CantonSeed[];
}

export interface CantonSeed {
  slug: string;
  name: string;
  /** Number of villages to generate inside this canton. */
  villagesCount: number;
}

/** Noms de villages plausibles au Tchad — utilisés pour le random. */
export const VILLAGE_NAMES_POOL = [
  'Koundjourou', 'Tchoukoutalia', 'Bagasola', 'Daboua', 'Tataverom', 'Forkouloum',
  'Kalom', 'Yakoua', 'Mberi', 'Magri', 'Kaiga', 'Kindjéria', 'Ngarangou', 'Médikouka',
  'Doum-Doum', 'Boulélé', 'Ngouboua', 'Tchingam', 'Toumour', 'Sokoyé', 'Karal',
  'Massakory', 'Massaguet', 'Bokoro', 'Ngoura', 'Dourbali', 'Linia', 'Mandalia',
  'Mani', 'Maï-Lara', 'Rig-Rig', 'Ziguey', 'Nokou', 'Wadjigui', 'Mondo', 'Am-Doback',
  'Nguri', 'Ngalamia', 'Soumourdou', 'Diguindo', 'Tourba', 'Boukoufoura', 'Kadjemba',
  'Méléa', 'Massa', 'Karmé', 'Bombokouri', 'Ngam', 'Sibitoye', 'Dougia', 'Ngoumati',
  'Borogop', 'Mara', 'Bidigué', 'Dababa', 'Amssinéné', 'Bissi-Mafou', 'Soumar',
  'Bourtaïl', 'Bisney', 'Ardélik', 'Galilé', 'Tagal', 'Iséirom', 'Liboye', 'Korédékon',
  'Ngarmadjéri', 'Béréa', 'Faya', 'Tarat', 'Wagam', 'Médégué', 'Soumour', 'Bisselo',
  'Dabia', 'Kouri', 'Loul', 'Ngarba', 'Mara-Toumour', 'Kaya-Mbalna', 'Ngoumi',
  'Soroye', 'Khaweidi', 'Goré-Boyo', 'Yobé', 'Tchéré', 'Madiago', 'Médjé', 'Ngabra',
  'Bourkou', 'Ardébé', 'Birka', 'Tikem', 'Bélouf', 'Aldiour', 'Foulatari', 'Ngoursi',
];

export const LAC_DEPARTMENTS: DepartmentSeed[] = [
  {
    slug: 'mamdi',
    name: 'Mamdi',
    prefecture: 'Bol',
    lat: 13.4658,
    lng: 14.7136,
    subPrefectures: [
      { slug: 'bol', name: 'Bol', lat: 13.4658, lng: 14.7136, cantons: [
        { slug: 'bol-centre', name: 'Bol Centre', villagesCount: 15 },
        { slug: 'bol-rural', name: 'Bol Rural', villagesCount: 14 },
        { slug: 'kiskra', name: 'Kiskra', villagesCount: 11 },
      ]},
      { slug: 'kangalom', name: 'Kangalom', lat: 13.30, lng: 14.85, cantons: [
        { slug: 'kangalom-c', name: 'Kangalom', villagesCount: 12 },
        { slug: 'guitté', name: 'Guitté', villagesCount: 13 },
      ]},
    ],
  },
  {
    slug: 'wayi',
    name: 'Wayi',
    prefecture: 'Liwa',
    lat: 13.7283,
    lng: 14.4192,
    subPrefectures: [
      { slug: 'liwa', name: 'Liwa', lat: 13.7283, lng: 14.4192, cantons: [
        { slug: 'liwa-c', name: 'Liwa', villagesCount: 14 },
        { slug: 'kaiga-kindjiria', name: 'Kaiga-Kindjiria', villagesCount: 12 },
        { slug: 'tchoukoutalia', name: 'Tchoukoutalia', villagesCount: 12 },
      ]},
      { slug: 'daboua', name: 'Daboua', lat: 13.84, lng: 14.81, cantons: [
        { slug: 'daboua-c', name: 'Daboua', villagesCount: 11 },
        { slug: 'fitiné', name: 'Fitiné', villagesCount: 10 },
      ]},
    ],
  },
  {
    slug: 'kaya',
    name: 'Kaya',
    prefecture: 'Ngouri',
    lat: 13.6822,
    lng: 15.3936,
    subPrefectures: [
      { slug: 'ngouri', name: 'Ngouri', lat: 13.6822, lng: 15.3936, cantons: [
        { slug: 'ngouri-c', name: 'Ngouri', villagesCount: 12 },
        { slug: 'isséirom', name: 'Isséirom', villagesCount: 10 },
        { slug: 'tagal', name: 'Tagal', villagesCount: 11 },
      ]},
      { slug: 'doum-doum', name: 'Doum-Doum', lat: 13.36, lng: 15.27, cantons: [
        { slug: 'doum-doum-c', name: 'Doum-Doum', villagesCount: 11 },
        { slug: 'forkouloum', name: 'Forkouloum', villagesCount: 9 },
      ]},
    ],
  },
];

export const KANEM_DEPARTMENTS: DepartmentSeed[] = [
  {
    slug: 'kanem-dept',
    name: 'Kanem',
    prefecture: 'Mao',
    lat: 14.1192,
    lng: 15.3133,
    subPrefectures: [
      { slug: 'mao', name: 'Mao', lat: 14.1192, lng: 15.3133, cantons: [
        { slug: 'mao-c', name: 'Mao', villagesCount: 10 },
        { slug: 'mondo', name: 'Mondo', villagesCount: 8 },
      ]},
      { slug: 'nokou', name: 'Nokou', lat: 14.62, lng: 15.41, cantons: [
        { slug: 'nokou-c', name: 'Nokou', villagesCount: 9 },
      ]},
    ],
  },
  {
    slug: 'wadi-bissam',
    name: 'Wadi Bissam',
    prefecture: 'Rig-Rig',
    lat: 14.30, lng: 14.45,
    subPrefectures: [
      { slug: 'rig-rig', name: 'Rig-Rig', lat: 14.30, lng: 14.45, cantons: [
        { slug: 'rig-rig-c', name: 'Rig-Rig', villagesCount: 8 },
        { slug: 'ziguey', name: 'Ziguey', villagesCount: 8 },
      ]},
    ],
  },
  {
    slug: 'nord-kanem',
    name: 'Nord-Kanem',
    prefecture: 'Nokou',
    lat: 14.6178, lng: 15.4133,
    subPrefectures: [
      { slug: 'wadjigui', name: 'Wadjigui', lat: 14.85, lng: 15.50, cantons: [
        { slug: 'wadjigui-c', name: 'Wadjigui', villagesCount: 9 },
        { slug: 'tarat', name: 'Tarat', villagesCount: 8 },
      ]},
    ],
  },
];

export const HADJER_LAMIS_DEPARTMENTS: DepartmentSeed[] = [
  {
    slug: 'dababa',
    name: 'Dababa',
    prefecture: 'Bokoro',
    lat: 12.3814,
    lng: 17.0589,
    subPrefectures: [
      { slug: 'bokoro', name: 'Bokoro', lat: 12.3814, lng: 17.0589, cantons: [
        { slug: 'bokoro-c', name: 'Bokoro', villagesCount: 9 },
        { slug: 'ngama', name: 'Ngama', villagesCount: 8 },
      ]},
    ],
  },
  {
    slug: 'haraze-al-biar',
    name: 'Haraze-Al-Biar',
    prefecture: 'Massakory',
    lat: 12.9764, lng: 15.4314,
    subPrefectures: [
      { slug: 'massakory', name: 'Massakory', lat: 12.9764, lng: 15.4314, cantons: [
        { slug: 'massakory-c', name: 'Massakory', villagesCount: 10 },
        { slug: 'karal', name: 'Karal', villagesCount: 9 },
      ]},
      { slug: 'turba', name: 'Tourba', lat: 13.16, lng: 15.20, cantons: [
        { slug: 'turba-c', name: 'Tourba', villagesCount: 8 },
      ]},
    ],
  },
];
