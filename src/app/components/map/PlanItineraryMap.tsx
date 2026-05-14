import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2 } from 'lucide-react';
import { getVillageCoords } from '../../data/planCoords';
import type { DayItinerary } from '../../data/mockMicroPlans';

// Fix Leaflet default icon paths under bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const TEAM_COLORS = [
  '#1E5BA8', '#16A34A', '#9333EA', '#EA580C', '#CA8A04', '#DB2777',
];

interface Props {
  itineraries: DayItinerary[];
  height?: number;
  nomadStopsCount?: number;
}

interface VillageInfo {
  villageId: string;
  villageName: string;
  teamId: string;
  teamIdx: number;
  day: number;
  estimatedArrival: string;
  targetChildren: number;
  isNomad: boolean;
  coords: [number, number];
}

export function PlanItineraryMap({ itineraries, height = 400, nomadStopsCount = 0 }: Props) {
  const [fullscreen, setFullscreen] = useState(false);

  const teams = useMemo(() => [...new Set(itineraries.map((i) => i.teamId))], [itineraries]);

  const villages = useMemo<VillageInfo[]>(() => {
    const list: VillageInfo[] = [];
    itineraries.forEach((itin) => {
      const teamIdx = teams.indexOf(itin.teamId);
      itin.villages.forEach((v) => {
        list.push({
          villageId: v.villageId,
          villageName: v.villageName,
          teamId: itin.teamId,
          teamIdx,
          day: itin.day,
          estimatedArrival: v.estimatedArrival,
          targetChildren: v.targetChildren,
          isNomad: !!v.nomadOpportunityId,
          coords: getVillageCoords(v.villageId),
        });
      });
    });
    return list;
  }, [itineraries, teams]);

  const teamLines = useMemo(() => {
    return teams.map((teamId, teamIdx) => {
      const positions = itineraries
        .filter((i) => i.teamId === teamId)
        .flatMap((i) => i.villages.map((v) => getVillageCoords(v.villageId)));
      const days = itineraries.filter((i) => i.teamId === teamId).length;
      const villageCount = itineraries
        .filter((i) => i.teamId === teamId)
        .reduce((s, i) => s + i.villages.length, 0);
      return { teamId, teamIdx, positions, days, villageCount };
    });
  }, [teams, itineraries]);

  const center = useMemo<[number, number]>(() => {
    if (villages.length === 0) return [13.47, 14.72];
    return [
      villages.reduce((s, v) => s + v.coords[0], 0) / villages.length,
      villages.reduce((s, v) => s + v.coords[1], 0) / villages.length,
    ];
  }, [villages]);

  const mapKey = fullscreen ? 'fs' : 'normal';

  return (
    <div
      className={`relative border border-stone-200 bg-stone-100 ${fullscreen ? 'fixed inset-0 z-[9999] rounded-none' : 'rounded-xl overflow-hidden'}`}
      style={{ height: fullscreen ? '100vh' : `${height}px` }}
    >
      <MapContainer
        key={mapKey}
        center={center}
        zoom={9}
        style={{ height: '100%', width: '100%', background: '#F5F5F4' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        />

        {/* Team route polylines */}
        {teamLines.map(({ teamId, teamIdx, positions, days, villageCount }) =>
          positions.length > 1 ? (
            <Polyline
              key={`line-${teamId}`}
              positions={positions}
              pathOptions={{
                color: TEAM_COLORS[teamIdx % TEAM_COLORS.length],
                weight: 3,
                opacity: 0.7,
                dashArray: undefined,
              }}
            >
              <Popup>
                <div style={{ minWidth: 160, fontFamily: 'sans-serif' }}>
                  <strong style={{ fontSize: 13 }}>{teamId}</strong>
                  <div style={{ fontSize: 11, color: '#78716c', marginTop: 4 }}>
                    {days} jour{days > 1 ? 's' : ''} · {villageCount} village{villageCount > 1 ? 's' : ''}
                  </div>
                </div>
              </Popup>
            </Polyline>
          ) : null
        )}

        {/* Village markers */}
        {villages.map((v) => {
          const color = v.isNomad ? '#E11D74' : '#78716C';
          const borderColor = v.isNomad ? '#BE185D' : '#57534E';
          return (
            <CircleMarker
              key={`${v.villageId}-${v.day}`}
              center={v.coords}
              radius={v.isNomad ? 8 : 6}
              pathOptions={{
                color: borderColor,
                weight: 2,
                fillColor: color,
                fillOpacity: 0.85,
              }}
            >
              <Popup>
                <div style={{ minWidth: 180, fontFamily: 'sans-serif' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <strong style={{ fontSize: 13 }}>{v.villageName}</strong>
                    {v.isNomad && (
                      <span style={{
                        background: '#FFF1F5', color: '#E11D74', padding: '1px 6px',
                        borderRadius: 4, fontSize: 10, fontWeight: 600,
                      }}>
                        ⛺ Arrêt nomade
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#78716c', lineHeight: 1.6 }}>
                    <div>Équipe : {v.teamId}</div>
                    <div>Jour {v.day} · Arrivée {v.estimatedArrival}</div>
                    <div>Enfants ciblés : {v.targetChildren}</div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Fullscreen toggle */}
      <button
        onClick={() => setFullscreen((f) => !f)}
        style={{
          position: 'absolute', top: 8, right: 8, zIndex: 999,
          background: 'white', border: '1px solid #e7e5e4',
          borderRadius: 6, padding: '5px 7px', cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,.12)', display: 'flex',
        }}
        title={fullscreen ? 'Réduire' : 'Plein écran'}
      >
        {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 20, left: 8, zIndex: 999,
        background: 'rgba(255,255,255,0.96)', border: '1px solid #e7e5e4',
        borderRadius: 8, padding: '8px 10px', fontSize: 11,
        boxShadow: '0 1px 4px rgba(0,0,0,.1)', maxWidth: 180,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 6, color: '#1c1917', fontSize: 11 }}>Légende</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {teams.map((teamId, idx) => (
            <div key={teamId} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 18, height: 3, borderRadius: 2, background: TEAM_COLORS[idx % TEAM_COLORS.length], flexShrink: 0 }} />
              <span style={{ color: '#44403c', fontSize: 11 }}>{teamId}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #e7e5e4', marginTop: 2, paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#78716C', flexShrink: 0 }} />
              <span style={{ color: '#44403c', fontSize: 11 }}>Planifié</span>
            </div>
            {nomadStopsCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E11D74', flexShrink: 0 }} />
                <span style={{ color: '#44403c', fontSize: 11 }}>Arrêt nomade</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
