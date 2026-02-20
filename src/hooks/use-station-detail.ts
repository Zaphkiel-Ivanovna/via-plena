'use client';

import { useQuery } from '@tanstack/react-query';
import { getStationById } from '@/services/station-service';

export function useStationDetail(id: number | null) {
  return useQuery({
    queryKey: ['station', id],
    queryFn: () => getStationById(id!),
    enabled: id !== null,
  });
}
