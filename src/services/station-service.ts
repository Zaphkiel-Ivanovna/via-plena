import { mockStations } from '@/mocks/stations';
import { haversineDistance } from '@/lib/geo-utils';
import type { GasStation } from '@/types/station';
import type { Coordinates } from '@/types/geo';
import type { FilterState } from '@/types/filters';

export function getStations(
  filters: FilterState,
  location: Coordinates | null
): GasStation[] {
  let stations = mockStations.map((station) => {
    if (location) {
      const distance = haversineDistance(location, {
        latitude: station.latitude,
        longitude: station.longitude,
      });
      return { ...station, distance };
    }
    return station;
  });

  if (location && filters.radius) {
    stations = stations.filter(
      (s) => s.distance !== undefined && s.distance <= filters.radius
    );
  }

  if (filters.fuelTypes.length > 0) {
    stations = stations.filter((s) =>
      filters.fuelTypes.some((ft) => s.fuels.some((f) => f.type === ft))
    );
  }

  if (filters.brands.length > 0) {
    stations = stations.filter((s) => filters.brands.includes(s.brand));
  }

  if (filters.sortBy === 'distance' && location) {
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

export function getStationById(id: number): GasStation | undefined {
  return mockStations.find((s) => s.id === id);
}
