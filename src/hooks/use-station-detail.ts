'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchStationById } from '@/services/station-service';

export function useStationDetail(id: number | null) {
  return useQuery({
    queryKey: ['station', id],
    queryFn: () => fetchStationById(id!),
    enabled: id !== null,
  });
}
