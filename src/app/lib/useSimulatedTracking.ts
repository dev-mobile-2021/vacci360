import { useState, useEffect, useRef } from 'react';
import { getMissionById, type TeamPosition } from '../data/mockMissions';

export function useSimulatedTracking(missionId: string): TeamPosition | null {
  const mission = getMissionById(missionId);
  const [currentPosition, setCurrentPosition] = useState<TeamPosition | null>(
    mission?.routePositions[mission.currentPositionIndex] ?? null,
  );
  const [positionIndex, setPositionIndex] = useState(mission?.currentPositionIndex ?? 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const m = getMissionById(missionId);
    if (!m || m.status !== 'in_progress' || m.routePositions.length === 0) return;

    setCurrentPosition(m.routePositions[m.currentPositionIndex]);
    setPositionIndex(m.currentPositionIndex);

    intervalRef.current = setInterval(() => {
      setPositionIndex((prev) => {
        const positions = m.routePositions;
        const next = prev + 1;
        const index =
          next >= positions.length
            ? positions.length - 5 + (next % 5)
            : next;
        const safeIndex = Math.max(0, Math.min(index, positions.length - 1));
        setCurrentPosition(positions[safeIndex]);
        return safeIndex;
      });
    }, 30_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [missionId]);

  return currentPosition;
}
