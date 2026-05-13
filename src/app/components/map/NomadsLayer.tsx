import { Polyline, Polygon, Tooltip } from 'react-leaflet';

// Hardcoded nomad migration routes and displaced zones for Province du Lac
// Based on known seasonal patterns near Lac Tchad

const NOMAD_ROUTES: { id: string; label: string; positions: [number, number][] }[] = [
  {
    id: 'route-lac-nord',
    label: 'Migration saisonnière — Axe Nord-Lac',
    positions: [
      [13.80, 14.55],
      [13.65, 14.62],
      [13.48, 14.71],
      [13.30, 14.80],
      [13.10, 14.90],
    ],
  },
  {
    id: 'route-lac-ouest',
    label: 'Migration saisonnière — Axe Ouest',
    positions: [
      [13.50, 14.20],
      [13.45, 14.45],
      [13.42, 14.70],
    ],
  },
  {
    id: 'route-kanem-lac',
    label: 'Transhumance Kanem → Lac',
    positions: [
      [13.85, 14.30],
      [13.72, 14.42],
      [13.58, 14.55],
      [13.46, 14.68],
    ],
  },
];

// Displaced/refugee zones — anonymised approximate density areas
const DISPLACED_ZONES: { id: string; label: string; positions: [number, number][]; approxPop: number }[] = [
  {
    id: 'disp-zone-northwest',
    label: 'Zone de déplacés — Nord-Ouest Bol',
    approxPop: 3200,
    positions: [
      [13.62, 14.52],
      [13.68, 14.60],
      [13.65, 14.72],
      [13.55, 14.75],
      [13.50, 14.62],
      [13.55, 14.52],
    ],
  },
  {
    id: 'disp-zone-south',
    label: 'Zone de déplacés — Sud Lac',
    approxPop: 1800,
    positions: [
      [13.28, 14.65],
      [13.32, 14.78],
      [13.22, 14.82],
      [13.18, 14.70],
    ],
  },
];

interface Props {
  type: 'nomads' | 'displaced';
}

export function NomadsLayer({ type }: Props) {
  if (type === 'nomads') {
    return (
      <>
        {NOMAD_ROUTES.map((route) => (
          <Polyline
            key={route.id}
            positions={route.positions}
            pathOptions={{
              color: '#92400E',
              weight: 3,
              dashArray: '8 5',
              opacity: 0.8,
            }}
          >
            <Tooltip sticky>
              <div className="text-xs font-medium text-stone-700">{route.label}</div>
            </Tooltip>
          </Polyline>
        ))}
      </>
    );
  }

  return (
    <>
      {DISPLACED_ZONES.map((zone) => (
        <Polygon
          key={zone.id}
          positions={zone.positions}
          pathOptions={{
            color: '#78716C',
            fillColor: '#A8A29E',
            fillOpacity: 0.25,
            weight: 2,
            dashArray: '4 3',
          }}
        >
          <Tooltip>
            <div className="text-xs">
              <div className="font-semibold text-stone-700">{zone.label}</div>
              <div className="text-stone-500">
                ~{zone.approxPop.toLocaleString()} personnes (données anonymisées)
              </div>
            </div>
          </Tooltip>
        </Polygon>
      ))}
    </>
  );
}
