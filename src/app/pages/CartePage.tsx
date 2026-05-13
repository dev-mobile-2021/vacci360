import { useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Sun, CloudRain, Layers, Maximize2, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { getVillages, getFacilities } from '../data/mockGeography';
import { calcIsochroneRadiusKm } from '../components/map/MapLayer';
import { VillageMarker } from '../components/map/VillageMarker';
import { VillagePopup } from '../components/map/VillagePopup';
import { FacilityMarker } from '../components/map/FacilityMarker';
import { IsochroneLayer } from '../components/map/IsochroneLayer';
import { ConnectivityLayer } from '../components/map/ConnectivityLayer';
import { NomadsLayer } from '../components/map/NomadsLayer';
import {
  DEFAULT_LAYERS,
  DTC3_COVERAGE_THRESHOLDS,
  TRANSPORT_ICONS,
  TRANSPORT_LABELS,
  type LayerId,
  type TransportMode,
  type Season,
} from '../components/map/MapLayer';
import type { Village } from '../types/village';
import type { Facility } from '../types/facility';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Province du Lac center
const LAC_CENTER: [number, number] = [13.45, 14.40];
const LAC_ZOOM = 9;

const TRANSPORTS: TransportMode[] = ['4x4', 'motorbike', 'bike', 'foot', 'pirogue'];

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom, { animate: false });
  return null;
}

export default function CartePage() {
  const villages = useMemo(() => getVillages(), []);
  const facilities = useMemo(() => getFacilities(), []);
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [season, setSeason] = useState<Season>('dry');
  const [transport, setTransport] = useState<TransportMode>('4x4');
  const [duration, setDuration] = useState(60);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isochroneActive, setIsochroneActive] = useState(false);
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);
  const [legendOpen, setLegendOpen] = useState(true);

  const isLayerVisible = useCallback(
    (id: LayerId) => layers.find((l) => l.id === id)?.visible ?? false,
    [layers],
  );

  const toggleLayer = (id: LayerId) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id && l.toggleable ? { ...l, visible: !l.visible } : l)),
    );
  };

  const facilityMap = useMemo(() => {
    const m = new Map<string, Facility>();
    facilities.forEach((f) => m.set(f.id, f));
    return m;
  }, [facilities]);

  // Only show villages from Province du Lac for performance
  const lacVillages = useMemo(
    () => villages.filter((v) => v.id.startsWith('vil-td-lac') || v.centroidLat > 12.8 && v.centroidLat < 14.2),
    [villages],
  );
  const lacFacilities = useMemo(
    () => facilities.filter((f) => f.provinceId === 'td-lac'),
    [facilities],
  );

  const villagesWithoutCoverage = useMemo(
    () => lacVillages.filter((v) => !v.facilityId || v.facilityDistanceKm > 30),
    [lacVillages],
  );

  const statusText = useMemo(() => {
    const vCount = lacVillages.length;
    const fCount = lacFacilities.length;
    const parts = [`${vCount} villages · ${fCount} FOSA · Province du Lac`];
    if (isochroneActive && selectedFacility) {
      const r = calcIsochroneRadiusKm(transport, season, duration);
      const area = Math.round(Math.PI * r * r);
      parts.push(`Zone isochrone : ${area} km²`);
    }
    return parts.join(' — ');
  }, [lacVillages, lacFacilities, isochroneActive, selectedFacility, transport, season, duration]);

  const handleCalculateIsochrone = () => {
    if (!selectedFacility) return;
    setIsochroneActive(true);
    setLayers((prev) => prev.map((l) => (l.id === 'isochrones' ? { ...l, visible: true } : l)));
  };

  const handleFacilityClick = (facility: Facility) => {
    setSelectedFacility(facility);
    setIsochroneActive(false);
  };

  return (
    <div className="relative -m-6 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Pulse animation style */}
      <style>{`
        .pulse-ring { animation: pulse-ring 1.8s ease-in-out infinite; }
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.2; }
        }
        .leaflet-popup-content { margin: 0; }
        .leaflet-popup-content-wrapper { padding: 0; border-radius: 8px; overflow: hidden; }
        .village-popup .leaflet-popup-content-wrapper { padding: 0; }
      `}</style>

      {/* Leaflet Map */}
      <MapContainer
        center={LAC_CENTER}
        zoom={LAC_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Villages */}
        {isLayerVisible('villages') &&
          lacVillages.map((v) => (
            <VillageMarker
              key={v.id}
              village={v}
              onClick={setSelectedVillage}
              isSelected={selectedVillage?.id === v.id}
            />
          ))}

        {/* Village popup */}
        {selectedVillage && (
          <VillagePopup
            village={selectedVillage}
            facility={facilityMap.get(selectedVillage.facilityId)}
          />
        )}

        {/* Facilities */}
        {isLayerVisible('facilities') &&
          lacFacilities.map((f) => (
            <FacilityMarker
              key={f.id}
              facility={f}
              isSelected={selectedFacility?.id === f.id}
              onClick={handleFacilityClick}
            />
          ))}

        {/* Isochrone */}
        {isLayerVisible('isochrones') && isochroneActive && selectedFacility && (
          <IsochroneLayer
            centerLat={selectedFacility.lat}
            centerLng={selectedFacility.lng}
            transport={transport}
            season={season}
            durationMin={duration}
            villages={lacVillages}
          />
        )}

        {/* Connectivity */}
        {isLayerVisible('connectivity') && <ConnectivityLayer />}

        {/* Nomads */}
        {isLayerVisible('nomads') && <NomadsLayer type="nomads" />}

        {/* Displaced */}
        {isLayerVisible('displaced') && <NomadsLayer type="displaced" />}
      </MapContainer>

      {/* Toolbar flottant en haut */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white shadow-md rounded-lg px-3 py-2 flex items-center gap-2 flex-wrap max-w-[calc(100vw-340px)]">
        {/* Saison toggle */}
        <div className="flex rounded-md border border-stone-200 overflow-hidden flex-shrink-0">
          <button
            onClick={() => setSeason('dry')}
            className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
              season === 'dry' ? 'bg-amber-100 text-amber-700' : 'text-stone-500 hover:bg-stone-50'
            }`}
          >
            <Sun size={13} /> Saison sèche
          </button>
          <button
            onClick={() => setSeason('wet')}
            className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors border-l border-stone-200 ${
              season === 'wet' ? 'bg-blue-100 text-blue-700' : 'text-stone-500 hover:bg-stone-50'
            }`}
          >
            <CloudRain size={13} /> Saison des pluies
          </button>
        </div>

        {/* Transport */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {TRANSPORTS.map((t) => (
            <button
              key={t}
              onClick={() => setTransport(t)}
              title={TRANSPORT_LABELS[t]}
              className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition-colors ${
                transport === t ? 'bg-primary text-white' : 'bg-stone-100 hover:bg-stone-200'
              }`}
            >
              {TRANSPORT_ICONS[t]}
            </button>
          ))}
        </div>

        {/* Duration slider */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-stone-500 whitespace-nowrap">⏱️ {duration} min</span>
          <input
            type="range"
            min={30}
            max={240}
            step={15}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-24 accent-primary"
          />
        </div>

        <button
          onClick={handleCalculateIsochrone}
          disabled={!selectedFacility}
          className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 flex-shrink-0"
        >
          Calculer isochrone
        </button>

        <button
          onClick={() => {}}
          className="w-8 h-8 rounded-md bg-stone-100 hover:bg-stone-200 flex items-center justify-center flex-shrink-0"
          title="Plein écran"
        >
          <Maximize2 size={14} />
        </button>

        <button
          onClick={() => {}}
          className="w-8 h-8 rounded-md bg-stone-100 hover:bg-stone-200 flex items-center justify-center flex-shrink-0"
          title="Exporter carte"
        >
          <Download size={14} />
        </button>
      </div>

      {/* Panel couches flottant à droite */}
      <div className="absolute top-4 right-4 z-[1000] bg-white shadow-md rounded-lg w-52">
        <button
          onClick={() => setLayerPanelOpen((v) => !v)}
          className="w-full px-3 py-2.5 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-800">
            <Layers size={15} />
            Couches
          </div>
          {layerPanelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {layerPanelOpen && (
          <div className="border-t border-stone-100 py-1">
            {layers.map((layer) => (
              <div key={layer.id} className="px-3 py-1.5">
                <label
                  className={`flex items-center gap-2.5 text-xs ${
                    !layer.toggleable ? 'opacity-60' : 'cursor-pointer'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={layer.visible}
                      disabled={!layer.toggleable}
                      onChange={() => toggleLayer(layer.id)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        layer.visible
                          ? 'border-transparent'
                          : 'border-stone-300 bg-white'
                      }`}
                      style={layer.visible ? { backgroundColor: layer.color } : {}}
                      onClick={() => toggleLayer(layer.id)}
                    >
                      {layer.visible && (
                        <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white fill-white">
                          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span
                    className="flex-1"
                    style={{ color: layer.toggleable && !layer.visible ? '#78716C' : '#1C1917' }}
                  >
                    {layer.icon} {layer.label}
                  </span>
                </label>
                {layer.disclaimer && layer.visible && (
                  <p className="text-[10px] text-stone-400 mt-0.5 pl-6">{layer.disclaimer}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Légende flottante en bas-gauche */}
      <div className="absolute bottom-10 left-4 z-[1000] bg-white/95 shadow-md rounded-lg px-3 py-2.5 min-w-40">
        <button
          onClick={() => setLegendOpen((v) => !v)}
          className="flex items-center justify-between w-full mb-1"
        >
          <span className="text-xs font-semibold text-stone-700">Légende</span>
          {legendOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
        {legendOpen && (
          <div className="space-y-1">
            {isLayerVisible('villages') && (
              <>
                <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mt-1 mb-0.5">
                  Couverture DTC3
                </div>
                {DTC3_COVERAGE_THRESHOLDS.map((t) => (
                  <div key={t.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="text-[11px] text-stone-600">{t.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-3 h-3 rounded-full border-2 border-red-500 flex-shrink-0" />
                  <span className="text-[11px] text-stone-600">Aucune FOSA accessible</span>
                </div>
              </>
            )}
            {isLayerVisible('nomads') && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-6 border-b-2 border-dashed flex-shrink-0" style={{ borderColor: '#92400E' }} />
                <span className="text-[11px] text-stone-600">Nomades (route)</span>
              </div>
            )}
            {isLayerVisible('displaced') && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: '#A8A29E50', border: '1px dashed #78716C' }} />
                <span className="text-[11px] text-stone-600">Déplacés (zone)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Barre de statut en bas */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white/90 px-4 py-1.5 text-xs text-stone-500 flex items-center justify-between border-t border-stone-200">
        <span>{statusText}</span>
        {villagesWithoutCoverage.length > 0 && (
          <span className="text-danger font-medium">
            ⚠ {villagesWithoutCoverage.length} villages sans FOSA accessible
          </span>
        )}
      </div>
    </div>
  );
}
