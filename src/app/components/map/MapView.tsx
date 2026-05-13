import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icon paths (broken under bundlers).
// We use CircleMarker below so the icon fix is just a precaution.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  radius?: number;
}

const TONE_COLORS: Record<NonNullable<MapMarker['tone']>, string> = {
  primary: '#1E5BA8',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  neutral: '#78716C',
};

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

interface Props {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  selectedId?: string | null;
  onMarkerClick?: (id: string) => void;
  className?: string;
}

export function MapView({
  center,
  zoom = 8,
  markers = [],
  selectedId,
  onMarkerClick,
  className,
}: Props) {
  return (
    <div className={className} style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', background: '#F5F5F4' }}
        scrollWheelZoom
      >
        <Recenter center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        />
        {markers.map((m) => {
          const color = TONE_COLORS[m.tone ?? 'primary'];
          const isSelected = m.id === selectedId;
          return (
            <CircleMarker
              key={m.id}
              center={[m.lat, m.lng]}
              radius={m.radius ?? (isSelected ? 9 : 6)}
              pathOptions={{
                color: isSelected ? '#1E5BA8' : color,
                weight: isSelected ? 3 : 1.5,
                fillColor: color,
                fillOpacity: isSelected ? 0.9 : 0.65,
              }}
              eventHandlers={{
                click: () => onMarkerClick?.(m.id),
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                {m.label}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
