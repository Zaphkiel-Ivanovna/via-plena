import { mapApiStationToGasStation } from './station-mapper';
import type { ApiStationWithDistance } from '@/api/types';
import type { GasStation } from '@/types/station';
import type { Coordinates } from '@/types/geo';

const BASE_URL = 'https://api.prix-carburants.2aaz.fr';
const PAGE_SIZE = 20;
const RESPONSE_FIELDS = 'Brand,Address,Coordinates,Fuels,Price,distance,Distance';

/**
 * Fetches a page of stations around a location (with fuel prices).
 */
async function fetchStationPage(
  location: Coordinates,
  radiusMeters: number,
  start: number,
  end: number
): Promise<ApiStationWithDistance[]> {
  const res = await fetch(
    `${BASE_URL}/stations/around/${location.latitude},${location.longitude}?responseFields=${RESPONSE_FIELDS}`,
    {
      headers: {
        Accept: 'application/json',
        Range: `station=${start}-${end},m=1-${radiusMeters}`,
      },
    }
  );

  if (res.status === 416) return []; // Out of range
  if (!res.ok && res.status !== 206) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Fetches all stations around a location within the given radius, with prices.
 * Pages are fetched sequentially and stops as soon as stations exceed the radius.
 * Since results are sorted by distance, no further pages are needed.
 */
export async function fetchStations(
  location: Coordinates,
  radiusKm: number
): Promise<GasStation[]> {
  const radiusMeters = radiusKm * 1000;

  const listData: ApiStationWithDistance[] = [];
  let page = 0;

  while (true) {
    const start = page * PAGE_SIZE + 1;
    const end = (page + 1) * PAGE_SIZE;
    const results = await fetchStationPage(location, radiusMeters, start, end);
    if (results.length === 0) break;

    // Results are sorted by distance — keep only those within radius
    for (const station of results) {
      if (station.distance > radiusMeters) return listData.map((s) => mapApiStationToGasStation(s));
      listData.push(station);
    }

    if (results.length < PAGE_SIZE) break;
    page++;
  }

  return listData.map((s) => mapApiStationToGasStation(s));
}

/**
 * Fetches a single station by ID with full details.
 */
export async function fetchStationById(
  id: number
): Promise<GasStation | undefined> {
  try {
    const res = await fetch(`${BASE_URL}/station/${id}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    return mapApiStationToGasStation(data);
  } catch {
    return undefined;
  }
}
