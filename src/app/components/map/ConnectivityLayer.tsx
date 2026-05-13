import { Circle, Tooltip } from 'react-leaflet';
import { mockConnectivityZones, CONNECTIVITY_COLORS } from '../../data/mockConnectivity';
import type { ConnectivityZoneType } from '../../data/mockConnectivity';

const FILL_OPACITY: Record<ConnectivityZoneType, number> = {
  good: 0.18,
  intermittent: 0.18,
  none: 0.12,
};

const TYPE_LABEL: Record<ConnectivityZoneType, string> = {
  good: 'Bonne connectivité',
  intermittent: 'Réseau intermittent',
  none: 'Sans réseau',
};

export function ConnectivityLayer() {
  return (
    <>
      {mockConnectivityZones.map((zone) => (
        <Circle
          key={zone.id}
          center={[zone.centerLat, zone.centerLng]}
          radius={zone.radiusKm * 1000}
          pathOptions={{
            color: CONNECTIVITY_COLORS[zone.type],
            fillColor: CONNECTIVITY_COLORS[zone.type],
            fillOpacity: FILL_OPACITY[zone.type],
            weight: 1,
            dashArray: zone.type === 'none' ? '4 6' : undefined,
          }}
        >
          <Tooltip>
            <div className="text-xs">
              <div className="font-semibold">{TYPE_LABEL[zone.type]}</div>
              {zone.operators && (
                <div className="text-stone-500">{zone.operators.join(' · ')}</div>
              )}
            </div>
          </Tooltip>
        </Circle>
      ))}
    </>
  );
}
