import { Circle, Tooltip } from 'react-leaflet';
import type { Village } from '../../types/village';
import type { TransportMode, Season } from './MapLayer';
import { calcIsochroneRadiusKm, TRANSPORT_LABELS } from './MapLayer';

interface Props {
  centerLat: number;
  centerLng: number;
  transport: TransportMode;
  season: Season;
  durationMin: number;
  villages: Village[];
}

// Haversine distance in km between two lat/lng points
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function IsochroneLayer({ centerLat, centerLng, transport, season, durationMin, villages }: Props) {
  const radiusKm = calcIsochroneRadiusKm(transport, season, durationMin);
  const radiusM = radiusKm * 1000;

  const villagesInZone = villages.filter(
    (v) => haversineKm(centerLat, centerLng, v.centroidLat, v.centroidLng) <= radiusKm,
  );

  const areaKm2 = Math.round(Math.PI * radiusKm ** 2);
  const popCovered = villagesInZone.reduce((s, v) => s + v.population, 0);

  return (
    <Circle
      center={[centerLat, centerLng]}
      radius={radiusM}
      pathOptions={{
        color: '#1E5BA8',
        fillColor: '#DBEAFE',
        fillOpacity: 0.35,
        weight: 2,
        dashArray: '6 4',
      }}
    >
      <Tooltip sticky>
        <div className="text-xs">
          <div className="font-semibold text-stone-800 mb-0.5">
            Isochrone {durationMin} min · {TRANSPORT_LABELS[transport]}
          </div>
          <div className="text-stone-500">
            Rayon : {radiusKm.toFixed(1)} km · Zone : {areaKm2} km²
          </div>
          <div className="text-stone-500">
            {villagesInZone.length} villages · {popCovered.toLocaleString()} hab.
          </div>
        </div>
      </Tooltip>
    </Circle>
  );
}

export { haversineKm };
