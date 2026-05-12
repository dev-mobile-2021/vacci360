/** Deterministic seeded PRNG (Mulberry32) — same seed = same sequence. */
export function createPrng(seed: number) {
  let state = seed >>> 0;
  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    next,
    range: (min: number, max: number) => min + next() * (max - min),
    int: (min: number, max: number) => Math.floor(min + next() * (max - min + 1)),
    pick: <T,>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    bool: (probability = 0.5) => next() < probability,
    /** Random point in a disk of radius `radiusKm` around (lat, lng). */
    pointAround: (lat: number, lng: number, radiusKm: number) => {
      const r = Math.sqrt(next()) * radiusKm;
      const theta = next() * 2 * Math.PI;
      // ~111 km per degree latitude
      const dLat = (r * Math.cos(theta)) / 111;
      const dLng = (r * Math.sin(theta)) / (111 * Math.cos((lat * Math.PI) / 180));
      return { lat: lat + dLat, lng: lng + dLng };
    },
  };
}

export type Prng = ReturnType<typeof createPrng>;
