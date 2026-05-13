import { CircleMarker, Tooltip } from 'react-leaflet';
import type { Village } from '../../types/village';
import { getDtc3Color } from './MapLayer';

interface Props {
  village: Village;
  onClick?: (village: Village) => void;
  isSelected?: boolean;
  highlightMode?: 'none' | 'in-zone' | 'out-zone';
}

function getMarkerRadius(population: number): number {
  return Math.max(4, Math.min(14, 4 + (population / 2400) * 10));
}

function hasNoFosa(village: Village): boolean {
  return !village.facilityId || village.facilityDistanceKm > 30;
}

export function VillageMarker({ village, onClick, isSelected, highlightMode = 'none' }: Props) {
  const dtc3 = village.vaccinationCoverage.dtc3;
  const radius = getMarkerRadius(village.population);
  const noFosa = hasNoFosa(village);

  let fillColor = getDtc3Color(dtc3);
  let strokeColor = getDtc3Color(dtc3);
  let strokeWidth = 1;
  let fillOpacity = 0.85;

  if (highlightMode === 'in-zone') {
    fillColor = '#16A34A';
    strokeColor = '#15803D';
    fillOpacity = 0.9;
  } else if (highlightMode === 'out-zone') {
    fillColor = '#DC2626';
    strokeColor = '#B91C1C';
    fillOpacity = 0.9;
  }

  if (isSelected) {
    strokeColor = '#1E3A8A';
    strokeWidth = 3;
  }

  if (noFosa && highlightMode === 'none') {
    strokeColor = '#DC2626';
    strokeWidth = 3;
  }

  return (
    <>
      {/* Outer pulsing ring for villages without FOSA */}
      {noFosa && highlightMode === 'none' && (
        <CircleMarker
          center={[village.centroidLat, village.centroidLng]}
          radius={radius + 5}
          pathOptions={{
            color: '#DC2626',
            fillColor: 'transparent',
            fillOpacity: 0,
            weight: 2,
            opacity: 0.5,
            className: 'pulse-ring',
          }}
          interactive={false}
        />
      )}
      <CircleMarker
        center={[village.centroidLat, village.centroidLng]}
        radius={radius}
        pathOptions={{
          color: strokeColor,
          fillColor,
          fillOpacity,
          weight: strokeWidth,
        }}
        eventHandlers={{
          click: () => onClick?.(village),
        }}
      >
        <Tooltip direction="top" offset={[0, -radius]} opacity={0.95}>
          <div className="text-xs">
            <div className="font-semibold">{village.name}</div>
            <div className="text-stone-500">{village.population} hab. · DTC3 {dtc3}%</div>
          </div>
        </Tooltip>
      </CircleMarker>
    </>
  );
}
