import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Sun, CloudRain, BarChart2, Download, ArrowLeftRight } from 'lucide-react';
import { getVillages, getFacilities } from '../data/mockGeography';
import { VillageMarker } from '../components/map/VillageMarker';
import { FacilityMarker } from '../components/map/FacilityMarker';
import { IsochroneLayer, haversineKm } from '../components/map/IsochroneLayer';
import {
  calcIsochroneRadiusKm,
  TRANSPORT_ICONS,
  TRANSPORT_LABELS,
  type TransportMode,
  type Season,
} from '../components/map/MapLayer';
import type { Facility } from '../types/facility';
import { FACILITY_TYPE_LABEL, FACILITY_STATUS_LABEL } from '../types/facility';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TRANSPORTS: TransportMode[] = ['4x4', 'motorbike', 'bike', 'foot', 'pirogue'];

interface AnalysisResult {
  transport: TransportMode;
  season: Season;
  durationMin: number;
  radiusKm: number;
  facilityId: string;
  inZone: string[];
  outZone: string[];
}

export default function CarteAccessibilitePage() {
  const villages = useMemo(() => getVillages(), []);
  const facilities = useMemo(() => getFacilities(), []);
  const lacFacilities = useMemo(() => facilities.filter((f) => f.provinceId === 'td-lac'), [facilities]);
  const lacVillages = useMemo(
    () => villages.filter((v) => v.centroidLat > 12.8 && v.centroidLat < 14.2),
    [villages],
  );

  const [search, setSearch] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [transport, setTransport] = useState<TransportMode>('4x4');
  const [duration, setDuration] = useState(60);
  const [season, setSeason] = useState<Season>('dry');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<AnalysisResult | null>(null);

  const filteredFacilities = useMemo(
    () =>
      lacFacilities.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          FACILITY_TYPE_LABEL[f.type].toLowerCase().includes(search.toLowerCase()),
      ),
    [lacFacilities, search],
  );

  const runAnalysis = (fac: Facility, s: Season): AnalysisResult => {
    const r = calcIsochroneRadiusKm(transport, s, duration);
    const inZone: string[] = [];
    const outZone: string[] = [];
    for (const v of lacVillages) {
      const d = haversineKm(fac.lat, fac.lng, v.centroidLat, v.centroidLng);
      if (d <= r) inZone.push(v.id);
      else outZone.push(v.id);
    }
    return { transport, season: s, durationMin: duration, radiusKm: r, facilityId: fac.id, inZone, outZone };
  };

  const handleLaunch = () => {
    if (!selectedFacility) return;
    setResult(runAnalysis(selectedFacility, season));
    setCompareResult(null);
    setComparing(false);
  };

  const handleCompare = () => {
    if (!selectedFacility) return;
    const dry = runAnalysis(selectedFacility, 'dry');
    const wet = runAnalysis(selectedFacility, 'wet');
    setResult(dry);
    setCompareResult(wet);
    setComparing(true);
  };

  const villageMap = useMemo(() => {
    const m = new Map(lacVillages.map((v) => [v.id, v]));
    return m;
  }, [lacVillages]);

  const inZoneVillages = useMemo(
    () => (result ? result.inZone.map((id) => villageMap.get(id)!).filter(Boolean) : []),
    [result, villageMap],
  );
  const outZoneVillages = useMemo(
    () => (result ? result.outZone.map((id) => villageMap.get(id)!).filter(Boolean) : []),
    [result, villageMap],
  );
  const popCovered = inZoneVillages.reduce((s, v) => s + v.population, 0);
  const area = result ? Math.round(Math.PI * result.radiusKm ** 2) : 0;

  const highlightMode = (vid: string): 'none' | 'in-zone' | 'out-zone' => {
    if (!result) return 'none';
    if (result.inZone.includes(vid)) return 'in-zone';
    return 'out-zone';
  };

  const mapCenter: [number, number] = selectedFacility
    ? [selectedFacility.lat, selectedFacility.lng]
    : [13.45, 14.40];

  return (
    <div className="-m-6 flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {/* LEFT PANEL */}
      <div className="w-96 flex-shrink-0 bg-white border-r border-stone-200 flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200">
          <h2 className="text-lg font-bold text-stone-900">Analyse d'accessibilité</h2>
          <p className="text-sm text-stone-500 mt-0.5">Calcul des zones d'intervention par isochrone</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Point de départ */}
          <section>
            <h3 className="text-sm font-semibold text-stone-700 mb-2">Point de départ</h3>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Rechercher une FOSA..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="max-h-36 overflow-y-auto border border-stone-200 rounded-md divide-y divide-stone-100">
              {filteredFacilities.slice(0, 20).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFacility(f)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-stone-50 transition-colors ${
                    selectedFacility?.id === f.id ? 'bg-primary-50 text-primary font-medium' : 'text-stone-700'
                  }`}
                >
                  <div className="font-medium">{f.name}</div>
                  <div className="text-stone-400">{FACILITY_TYPE_LABEL[f.type]} · {FACILITY_STATUS_LABEL[f.status]}</div>
                </button>
              ))}
            </div>
            {selectedFacility && (
              <div className="mt-2 p-2.5 bg-primary-50 rounded-md text-xs text-primary-700 border border-primary-100">
                <div className="font-semibold">{selectedFacility.name}</div>
                <div className="text-primary-500 mt-0.5">
                  {FACILITY_TYPE_LABEL[selectedFacility.type]} · {selectedFacility.villagesServed} villages desservis
                </div>
              </div>
            )}
          </section>

          {/* Paramètres */}
          <section>
            <h3 className="text-sm font-semibold text-stone-700 mb-2">Paramètres de déplacement</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-stone-500 block mb-1.5">Mode de transport</label>
                <div className="flex gap-1.5 flex-wrap">
                  {TRANSPORTS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTransport(t)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                        transport === t
                          ? 'bg-primary text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {TRANSPORT_ICONS[t]} {TRANSPORT_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">
                  Durée max : <span className="font-semibold text-stone-700">{duration} min</span>
                </label>
                <input
                  type="range" min={30} max={240} step={15}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
                  <span>30 min</span><span>240 min</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1.5">Saison</label>
                <div className="flex rounded-md border border-stone-200 overflow-hidden">
                  <button
                    onClick={() => setSeason('dry')}
                    className={`flex-1 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      season === 'dry' ? 'bg-amber-100 text-amber-700' : 'text-stone-500 hover:bg-stone-50'
                    }`}
                  >
                    <Sun size={12} /> Sèche
                  </button>
                  <button
                    onClick={() => setSeason('wet')}
                    className={`flex-1 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 border-l border-stone-200 transition-colors ${
                      season === 'wet' ? 'bg-blue-100 text-blue-700' : 'text-stone-500 hover:bg-stone-50'
                    }`}
                  >
                    <CloudRain size={12} /> Pluies
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={handleLaunch}
              disabled={!selectedFacility}
              className="mt-3 w-full py-2 bg-primary text-white text-sm font-medium rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              <BarChart2 size={14} /> Lancer l'analyse
            </button>
          </section>

          {/* Résultats */}
          {result && (
            <section>
              <h3 className="text-sm font-semibold text-stone-700 mb-2">Résultats</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: 'Zone couverte', value: `${area} km²`, tone: 'primary' },
                  { label: 'Villages accessibles', value: inZoneVillages.length, tone: 'success' },
                  { label: 'Population couverte', value: popCovered.toLocaleString(), tone: 'info' },
                  { label: 'Villages hors zone', value: outZoneVillages.length, tone: 'danger' },
                ].map(({ label, value, tone }) => (
                  <div key={label} className="bg-stone-50 rounded-md p-2.5 text-center">
                    <div className={`text-lg font-bold text-${tone}`}>{value}</div>
                    <div className="text-[10px] text-stone-500">{label}</div>
                  </div>
                ))}
              </div>

              {/* Villages in zone (top 5) */}
              <div className="mb-2">
                <div className="text-xs font-semibold text-success mb-1">
                  Villages accessibles ({inZoneVillages.length})
                </div>
                <div className="max-h-28 overflow-y-auto space-y-0.5">
                  {inZoneVillages.slice(0, 8).map((v) => (
                    <div key={v.id} className="flex justify-between text-xs px-2 py-1 bg-green-50 rounded">
                      <span className="text-stone-700 truncate max-w-32">{v.name}</span>
                      <span className="text-stone-500 flex-shrink-0">{v.facilityDistanceKm} km</span>
                    </div>
                  ))}
                  {inZoneVillages.length > 8 && (
                    <div className="text-[10px] text-stone-400 text-center py-0.5">
                      +{inZoneVillages.length - 8} autres
                    </div>
                  )}
                </div>
              </div>

              {/* Villages out of zone (top 5) */}
              {outZoneVillages.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-danger mb-1">
                    Villages hors zone ({outZoneVillages.length})
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-0.5">
                    {outZoneVillages.slice(0, 6).map((v) => (
                      <div key={v.id} className="flex justify-between text-xs px-2 py-1 bg-red-50 rounded">
                        <span className="text-stone-700 truncate max-w-32">{v.name}</span>
                        <span className="text-stone-500 flex-shrink-0">{v.facilityDistanceKm} km</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {}}
                className="w-full py-1.5 border border-stone-200 text-xs text-stone-600 rounded-md hover:bg-stone-50 flex items-center justify-center gap-1.5 mb-3"
              >
                <Download size={12} /> Exporter l'analyse
              </button>

              {/* Comparaison saisonnière */}
              <div className="border-t border-stone-200 pt-3">
                <button
                  onClick={handleCompare}
                  className="w-full py-1.5 bg-stone-100 text-xs text-stone-700 rounded-md hover:bg-stone-200 flex items-center justify-center gap-1.5 font-medium"
                >
                  <ArrowLeftRight size={12} /> Comparer saison sèche vs pluies
                </button>

                {comparing && compareResult && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-amber-50 rounded-md p-2.5 text-center border border-amber-100">
                      <div className="text-[10px] font-semibold text-amber-700 mb-1.5">☀️ Saison sèche</div>
                      <div className="text-sm font-bold text-stone-800">{result.inZone.length}</div>
                      <div className="text-[10px] text-stone-500">villages accessibles</div>
                      <div className="text-xs font-semibold text-stone-700 mt-1">{result.radiusKm.toFixed(0)} km</div>
                    </div>
                    <div className="bg-blue-50 rounded-md p-2.5 text-center border border-blue-100">
                      <div className="text-[10px] font-semibold text-blue-700 mb-1.5">🌧️ Saison pluies</div>
                      <div className="text-sm font-bold text-stone-800">{compareResult.inZone.length}</div>
                      <div className="text-[10px] text-stone-500">villages accessibles</div>
                      <div className="text-xs font-semibold text-stone-700 mt-1">{compareResult.radiusKm.toFixed(0)} km</div>
                    </div>
                    <div className="col-span-2 text-center text-xs font-medium text-danger">
                      Δ {result.inZone.length - compareResult.inZone.length > 0 ? '-' : '+'}{Math.abs(result.inZone.length - compareResult.inZone.length)} villages en saison pluies
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* RIGHT MAP */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={9}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          {lacVillages.map((v) => (
            <VillageMarker
              key={v.id}
              village={v}
              highlightMode={highlightMode(v.id)}
            />
          ))}

          {lacFacilities.map((f) => (
            <FacilityMarker
              key={f.id}
              facility={f}
              isSelected={selectedFacility?.id === f.id}
              onClick={setSelectedFacility}
            />
          ))}

          {result && selectedFacility && (
            <IsochroneLayer
              centerLat={selectedFacility.lat}
              centerLng={selectedFacility.lng}
              transport={transport}
              season={season}
              durationMin={duration}
              villages={lacVillages}
            />
          )}

          {comparing && compareResult && selectedFacility && (
            <Circle
              center={[selectedFacility.lat, selectedFacility.lng]}
              radius={compareResult.radiusKm * 1000}
              pathOptions={{
                color: '#2563EB',
                fillColor: '#BFDBFE',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '8 4',
              }}
            />
          )}
        </MapContainer>

        {/* Legend overlay */}
        {result && (
          <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 shadow-md rounded-lg px-3 py-2 text-xs">
            <div className="font-semibold text-stone-700 mb-1">Légende</div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-stone-600">Dans la zone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-stone-600">Hors zone</span>
            </div>
            {comparing && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-6 border-b-2 border-dashed border-blue-500" />
                <span className="text-stone-600">Zone saison pluies</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
