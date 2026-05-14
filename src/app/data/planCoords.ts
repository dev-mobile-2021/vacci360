// Deterministic lat/lng for all village and facility IDs used in mockMicroPlans.
// Base area: Lake Chad province, Chad (~13°N, 14°E)

export const VILLAGE_COORDS: Record<string, [number, number]> = {
  // Bol area
  'v-bol-01': [13.471, 14.718],
  'v-bol-02': [13.433, 14.671],
  'v-bol-03': [13.391, 14.598],
  'v-bol-04': [13.512, 14.783],
  'v-bol-05': [13.548, 14.831],
  // Nomad zone
  'v-nomad-1': [13.621, 14.405],
  // Baga Sola area
  'v-baga-01': [13.771, 14.253],
  'v-baga-02': [13.718, 14.312],
  'v-baga-03': [13.663, 14.281],
  'v-baga-04': [13.740, 14.204],
  'v-baga-05': [13.803, 14.221],
  // Mao / Kanem
  'v-mao-01': [14.118, 15.318],
  'v-mao-02': [14.082, 15.278],
  'v-mao-03': [14.171, 15.352],
};

export const FACILITY_COORDS: Record<string, [number, number]> = {
  'CS Bol': [13.470, 14.723],
  'CS Baga Sola': [13.777, 14.248],
  'CS Ngouri': [14.350, 14.415],
  'CS Mao': [14.118, 15.310],
};

/** Deterministic fallback for unknown village IDs. */
function hashCoords(id: string): [number, number] {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  return [13.0 + (h % 200) / 100, 14.0 + ((h >> 8) % 160) / 100];
}

export function getVillageCoords(villageId: string): [number, number] {
  return VILLAGE_COORDS[villageId] ?? hashCoords(villageId);
}

export function getFacilityCoords(facilityName: string): [number, number] {
  return FACILITY_COORDS[facilityName] ?? [13.47, 14.72];
}
