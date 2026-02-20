'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchStations } from '@/services/station-service';
import { useFilterStore } from '@/stores/filter-store';
import { useAppStore } from '@/stores/app-store';

export function useStations() {
  const location = useAppStore((s) => s.location);
  const fuelTypes = useFilterStore((s) => s.fuelTypes);
  const radius = useFilterStore((s) => s.radius);
  const sortBy = useFilterStore((s) => s.sortBy);

  return useQuery({
    queryKey: ['stations', { fuelTypes, radius, sortBy, location }],
    queryFn: () =>
      fetchStations({ fuelTypes, radius, brands: [], sortBy }, location),
    enabled: location !== null,
  });
}
