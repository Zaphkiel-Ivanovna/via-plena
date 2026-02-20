import { mapApiStationToGasStation } from './station-mapper';
import type { ApiStation, ApiStationWithDistance } from '@/api/types';
import type { GasStation } from '@/types/station';
import type { Coordinates } from '@/types/geo';
import type { FilterState } from '@/types/filters';

const BASE_URL = 'https://api.prix-carburants.2aaz.fr';

/**
 * Fetches a single station by ID with full details (including fuel prices).
 */
async function fetchStationDetail(id: number): Promise<ApiStation | null> {
  try {
    const res = await fetch(`${BASE_URL}/station/${id}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetches stations around a location with full price details.
 *
 * 1. Calls `/stations/around/` for the list (brand, distance, coordinates)
 * 2. Calls `/station/{id}` in parallel for each station to get fuel prices
 */
export async function fetchStations(
  filters: FilterState,
  location: Coordinates | null
): Promise<GasStation[]> {
  if (!location) return [];

  const radiusMeters = Math.min(filters.radius * 1000, 10000);

  const res = await fetch(
    `${BASE_URL}/stations/around/${location.latitude},${location.longitude}`,
    {
      headers: {
        Accept: 'application/json',
        Range: `station=1-20,m=1-${radiusMeters}`,
      },
    }
  );

  if (!res.ok && res.status !== 206) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  const listData: ApiStationWithDistance[] = await res.json();

  // Fetch full details (with prices) for each station in parallel
  const details = await Promise.allSettled(
    listData.map((s) => fetchStationDetail(s.id))
  );

  // Merge: use detail data when available, fallback to list data
  let stations = listData.map((listStation, i) => {
    const detail = details[i];
    const detailData =
      detail.status === 'fulfilled' && detail.value ? detail.value : null;

    if (detailData) {
      // Use full detail but preserve distance from list endpoint
      const station = mapApiStationToGasStation({
        ...detailData,
        distance: listStation.distance,
        Distance: listStation.Distance,
      } as ApiStationWithDistance);
      return station;
    }

    return mapApiStationToGasStation(listStation);
  });

  // Client-side fuel type filter
  if (filters.fuelTypes.length > 0) {
    stations = stations.filter((s) =>
      filters.fuelTypes.some((ft) => s.fuels.some((f) => f.type === ft))
    );
  }

  // Client-side sort
  if (filters.sortBy === 'distance') {
    stations.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  } else if (filters.sortBy === 'price') {
    const targetFuel = filters.fuelTypes[0] ?? 'gazole';
    stations.sort((a, b) => {
      const priceA = a.fuels.find((f) => f.type === targetFuel)?.price ?? Infinity;
      const priceB = b.fuels.find((f) => f.type === targetFuel)?.price ?? Infinity;
      return priceA - priceB;
    });
  }

  return stations;
}

/**
 * Fetches a single station by ID with full details (including fuel prices).
 */
export async function fetchStationById(
  id: number
): Promise<GasStation | undefined> {
  const data = await fetchStationDetail(id);
  if (!data) return undefined;
  return mapApiStationToGasStation(data);
}
