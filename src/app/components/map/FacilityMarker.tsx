import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Facility } from '../../types/facility';
import { FACILITY_TYPE_LABEL, FACILITY_TYPE_SHORT, FACILITY_STATUS_LABEL } from '../../types/facility';

interface Props {
  facility: Facility;
  onClick?: (facility: Facility) => void;
  isSelected?: boolean;
}

const STATUS_COLORS: Record<Facility['status'], { bg: string; border: string }> = {
  operational: { bg: '#DCFCE7', border: '#16A34A' },
  degraded: { bg: '#FFFBEB', border: '#D97706' },
  closed: { bg: '#FEF2F2', border: '#DC2626' },
  under_construction: { bg: '#F1F5F9', border: '#64748B' },
};

function createFacilityIcon(facility: Facility, isSelected: boolean): L.DivIcon {
  const { bg, border } = STATUS_COLORS[facility.status];
  const short = FACILITY_TYPE_SHORT[facility.type];
  const size = facility.type === 'hospital' ? 22 : 18;
  const borderWidth = isSelected ? 3 : 2;
  const shadow = isSelected ? `box-shadow:0 0 0 3px #1E3A8A40;` : '';

  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};
      border:${borderWidth}px solid ${border};
      border-radius:3px;
      display:flex;align-items:center;justify-content:center;
      font-size:9px;font-weight:700;color:${border};
      cursor:pointer;${shadow}
      transform:translate(-50%,-50%);
    ">${short}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function FacilityMarker({ facility, onClick, isSelected = false }: Props) {
  const icon = createFacilityIcon(facility, isSelected);

  return (
    <Marker
      position={[facility.lat, facility.lng]}
      icon={icon}
      eventHandlers={{ click: () => onClick?.(facility) }}
    >
      <Popup minWidth={240}>
        <div className="p-0 font-sans text-stone-800" style={{ width: 230 }}>
          <div className="px-3 pt-2.5 pb-2 border-b border-stone-100">
            <div className="font-semibold text-sm">{facility.name}</div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              {FACILITY_TYPE_LABEL[facility.type]} · {FACILITY_STATUS_LABEL[facility.status]}
            </div>
          </div>
          <div className="px-3 py-2 space-y-1 text-xs text-stone-600">
            <div className="flex justify-between">
              <span className="text-stone-400">Chaîne du froid</span>
              <span className={facility.coldChainOperational ? 'text-success font-medium' : 'text-danger font-medium'}>
                {facility.coldChainOperational ? '✓ Opérationnelle' : '✗ Hors service'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Villages desservis</span>
              <span className="font-medium">{facility.villagesServed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Personnel</span>
              <span className="font-medium">{facility.staffCount}</span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
