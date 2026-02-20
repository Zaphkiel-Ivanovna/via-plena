'use client';

import { useQuery } from '@tanstack/react-query';
import { getStations } from '@/services/station-service';
import { useFilterStore } from '@/stores/filter-store';
import { useAppStore } from '@/stores/app-store';

export function useStations() {
  const location = useAppStore((s) => s.location);
  const fuelTypes = useFilterStore((s) => s.fuelTypes);
  const radius = useFilterStore((s) => s.radius);
  const brands = useFilterStore((s) => s.brands);
  const sortBy = useFilterStore((s) => s.sortBy);

  return useQuery({
    queryKey: ['stations', { fuelTypes, radius, brands, sortBy, location }],
    queryFn: () =>
      getStations({ fuelTypes, radius, brands, sortBy }, location),
  });
}
