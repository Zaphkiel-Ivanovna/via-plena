'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStations } from '@/services/station-service';
import { useFilterStore } from '@/stores/filter-store';
import { useAppStore } from '@/stores/app-store';

export function useStations() {
  const location = useAppStore((s) => s.location);
  const fuelTypes = useFilterStore((s) => s.fuelTypes);
  const radius = useFilterStore((s) => s.radius);
  const sortBy = useFilterStore((s) => s.sortBy);

  const query = useQuery({
    queryKey: ['stations', { radius, location }],
    queryFn: () => fetchStations(location!, radius),
    enabled: location !== null,
    staleTime: 5 * 60 * 1000,
  });

  // Client-side filtering & sorting (instant, no refetch)
  const data = useMemo(() => {
    if (!query.data) return undefined;

    let stations = query.data;

    if (fuelTypes.length > 0) {
      stations = stations.filter((s) =>
        fuelTypes.some((ft) => s.fuels.some((f) => f.type === ft))
      );
    }

    if (sortBy === 'distance') {
      stations = [...stations].sort(
        (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)
      );
    } else if (sortBy === 'price') {
      const targetFuel = fuelTypes[0] ?? 'gazole';
      stations = [...stations].sort((a, b) => {
        const priceA = a.fuels.find((f) => f.type === targetFuel)?.price ?? Infinity;
        const priceB = b.fuels.find((f) => f.type === targetFuel)?.price ?? Infinity;
        return priceA - priceB;
      });
    }

    return stations;
  }, [query.data, fuelTypes, sortBy]);

  return { ...query, data };
}
