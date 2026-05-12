import type { GeoNode } from './geography';

export type AccessibilityRating = 'easy' | 'moderate' | 'difficult' | 'very_difficult';

export interface SeasonAccessibility {
  drySeasonAccess: AccessibilityRating;
  wetSeasonAccess: AccessibilityRating;
}

export type ValidationStatus = 'pending' | 'validated' | 'needs_review';

export interface Village extends GeoNode {
  level: 'village';
  facilityId: string;
  facilityDistanceKm: number;
  facilityTravelTimeMin: number;
  estimatedChildrenUnder5: number;
  accessibility: SeasonAccessibility;
  infrastructure: {
    hasSchool: boolean;
    hasWaterPoint: boolean;
    hasMarket: boolean;
    hasMosque: boolean;
  };
  lastVaccinationVisit: Date | null;
  daysSinceLastVisit: number | null;
  vaccinationCoverage: {
    bcg: number;
    dtc1: number;
    dtc3: number;
    measles: number;
    overall: number;
  };
  dataQualityScore: number;
  validationStatus: ValidationStatus;
  validatedBy: string | null;
  validatedAt: Date | null;
  photos: string[];
}

export const ACCESSIBILITY_LABEL: Record<AccessibilityRating, string> = {
  easy: 'Facile',
  moderate: 'Modéré',
  difficult: 'Difficile',
  very_difficult: 'Très difficile',
};

export const VALIDATION_LABEL: Record<ValidationStatus, string> = {
  pending: 'En attente',
  validated: 'Validé',
  needs_review: 'À réviser',
};
