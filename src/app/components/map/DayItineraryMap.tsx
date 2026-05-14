import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getVillageCoords, getFacilityCoords } from '../../data/planCoords';
import type { DayItinerary } from '../../data/mockMicroPlans';

// Fix Leaflet default icon paths
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createNumberIcon(num: number, isNomad: boolean, isSelected: boolean): L.DivIcon {
  const bg = isNomad ? '#E11D74' : isSelected ? '#1E5BA8' : '#78716C';
  const border = isSelected ? '#1E5BA8' : 'rgba(255,255,255,0.9)';
  return L.divIcon({
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:${bg};color:white;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;
      border:2.5px solid ${border};
      box-shadow:0 1px 4px rgba(0,0,0,.3);
    ">${num}</div>`,
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

function createFosaIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      width:22px;height:22px;border-radius:4px;
      background:#1E5BA8;color:white;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,.3);
    ">🏥</div>`,
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

function PanToSelected({ selectedId, itinVillages }: {
  selectedId: string | null;
  itinVillages: DayItinerary['villages'];
}) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const v = itinVillages.find((v) => v.villageId === selectedId);
    if (v) {
      const coords = getVillageCoords(v.villageId);
      map.panTo(coords, { animate: true });
    }
  }, [selectedId, itinVillages, map]);
  return null;
}

interface Props {
  itin: DayItinerary;
  selectedId?: string | null;
  onMarkerClick?: (villageId: string) => void;
}

export function DayItineraryMap({ itin, selectedId, onMarkerClick }: Props) {
  const fosaCoords = getFacilityCoords(itin.facilityStart);
  const villagePositions = itin.villages.map((v) => getVillageCoords(v.villageId));
  const allPositions: [number, number][] = [fosaCoords, ...villagePositions];

  const center: [number, number] = villagePositions.length > 0
    ? [
        villagePositions.reduce((s, c) => s + c[0], 0) / villagePositions.length,
        villagePositions.reduce((s, c) => s + c[1], 0) / villagePositions.length,
      ]
    : fosaCoords;

  return (
    <div className="rounded-lg overflow-hidden border border-stone-200" style={{ height: 250 }}>
      <MapContainer
        key={itin.day}
        center={center}
        zoom={10}
        style={{ height: '100%', width: '100%', background: '#F5F5F4' }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OSM &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        />
        <PanToSelected selectedId={selectedId ?? null} itinVillages={itin.villages} />

        {/* Day route polyline */}
        {allPositions.length > 1 && (
          <Polyline
            positions={allPositions}
            pathOptions={{ color: '#1E5BA8', weight: 2.5, opacity: 0.65, dashArray: '6 4' }}
          />
        )}

        {/* FOSA start */}
        <Marker position={fosaCoords} icon={createFosaIcon()}>
          <Popup>
            <strong style={{ fontSize: 12 }}>{itin.facilityStart}</strong>
            <div style={{ fontSize: 11, color: '#78716c' }}>Point de départ</div>
          </Popup>
        </Marker>

        {/* Village numbered markers */}
        {itin.villages.map((v) => {
          const coords = getVillageCoords(v.villageId);
          const isSelected = v.villageId === selectedId;
          const isNomad = !!v.nomadOpportunityId;
          return (
            <Marker
              key={v.villageId}
              position={coords}
              icon={createNumberIcon(v.order, isNomad, isSelected)}
              eventHandlers={{ click: () => onMarkerClick?.(v.villageId) }}
            >
              <Popup>
                <div style={{ minWidth: 160, fontFamily: 'sans-serif' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <strong style={{ fontSize: 12 }}>{v.villageName}</strong>
                    {isNomad && (
                      <span style={{ background: '#FFF1F5', color: '#E11D74', padding: '1px 5px', borderRadius: 4, fontSize: 10 }}>
                        ⛺ Nomade
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#78716c', lineHeight: 1.6 }}>
                    <div>Ordre : {v.order} · {v.estimatedArrival}</div>
                    <div>Enfants ciblés : {v.targetChildren}</div>
                    <div>Durée estimée : {v.estimatedDuration} min</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
