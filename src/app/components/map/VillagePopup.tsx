import { Popup } from 'react-leaflet';
import { MapPin, Wifi, WifiOff, Signal, Users, Baby, Clock, Truck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Village } from '../../types/village';
import type { Facility } from '../../types/facility';
import { getDtc3Color } from './MapLayer';

interface Props {
  village: Village;
  facility?: Facility;
}

function CoverageBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 text-stone-500 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-stone-100 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-right font-medium text-stone-700">{value}%</span>
    </div>
  );
}

function ConnectivityIcon({ facility }: { facility?: Facility }) {
  const q = facility?.mobileNetwork?.quality ?? 'poor';
  if (q === 'good') return <Wifi size={14} className="text-success" />;
  if (q === 'intermittent') return <Signal size={14} className="text-warning" />;
  return <WifiOff size={14} className="text-stone-400" />;
}

export function VillagePopup({ village, facility }: Props) {
  const dtc3Color = getDtc3Color(village.vaccinationCoverage.dtc3);
  const dtc3 = village.vaccinationCoverage.dtc3;
  const coverageBadge = dtc3 >= 85 ? 'Bonne couverture' : dtc3 >= 50 ? 'Couverture partielle' : 'Couverture critique';
  const coverageTone = dtc3 >= 85 ? '#16A34A' : dtc3 >= 50 ? '#D97706' : '#DC2626';
  const distanceLabel = facility
    ? `${village.facilityDistanceKm} km — ${village.facilityTravelTimeMin} min`
    : 'Aucune FOSA accessible (<30 km)';

  const lastVisitText = village.lastVaccinationVisit
    ? formatDistanceToNow(village.lastVaccinationVisit, { addSuffix: true, locale: fr })
    : 'Jamais';

  return (
    <Popup minWidth={320} maxWidth={340} className="village-popup">
      <div className="p-0 font-sans text-stone-800" style={{ width: 310 }}>
        {/* Header */}
        <div className="px-3 pt-3 pb-2 border-b border-stone-100">
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold text-sm text-stone-900 leading-tight">{village.name}</div>
            <div className="flex gap-1 flex-shrink-0">
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
                style={{ backgroundColor: coverageTone }}
              >
                {coverageBadge}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">{village.code}</div>
        </div>

        {/* Section 1: Démographie */}
        <div className="px-3 py-2 border-b border-stone-100">
          <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">Démographie</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Users size={12} className="text-stone-400" />
              <span>{village.population.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Baby size={12} className="text-primary" />
              <span>{village.estimatedChildrenUnder5}</span>
              <span className="text-stone-400">&lt;5 ans</span>
            </div>
            <div className="flex items-center gap-1 text-stone-500">
              <span>🏘️ Sédentaire</span>
            </div>
          </div>
        </div>

        {/* Section 2: Accès */}
        <div className="px-3 py-2 border-b border-stone-100">
          <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">Accès &amp; Connectivité</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-stone-400 flex-shrink-0" />
              <span className="text-stone-700">{facility?.name ?? 'FOSA inconnue'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-500">
              <Truck size={12} className="flex-shrink-0" />
              <span>{distanceLabel}</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-500">
              <ConnectivityIcon facility={facility} />
              <span>
                {facility?.mobileNetwork?.quality === 'good'
                  ? 'Bonne connectivité'
                  : facility?.mobileNetwork?.quality === 'intermittent'
                  ? 'Réseau intermittent'
                  : 'Pas de réseau'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Situation vaccinale */}
        <div className="px-3 py-2.5">
          <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">Situation vaccinale</div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
            <Clock size={12} />
            <span>Dernière visite : <span className="font-medium text-stone-700">{lastVisitText}</span></span>
          </div>
          <div className="space-y-1">
            <CoverageBar label="BCG" value={village.vaccinationCoverage.bcg} color="#1E5BA8" />
            <CoverageBar label="DTC1" value={village.vaccinationCoverage.dtc1} color="#7C3AED" />
            <CoverageBar label="DTC3" value={village.vaccinationCoverage.dtc3} color={dtc3Color} />
            <CoverageBar label="Rougeole" value={village.vaccinationCoverage.measles} color="#D97706" />
          </div>
        </div>
      </div>
    </Popup>
  );
}
