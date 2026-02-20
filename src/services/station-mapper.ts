import type { ApiStation, ApiStationWithDistance } from '@/api/types';
import type { GasStation, FuelPrice, FuelType } from '@/types/station';

/**
 * Maps API fuel IDs to our internal FuelType.
 */
const FUEL_ID_MAP: Record<number, FuelType> = {
  1: 'gazole',
  2: 'sp95',
  3: 'e85',
  4: 'gplc',
  5: 'e10',
  6: 'sp98',
};

/**
 * Extracts the postal code from the city_line (e.g. "75013 Paris" → "75013").
 */
function parsePostalCode(cityLine: string): string {
  const match = cityLine.match(/^(\d{5})/);
  return match ? match[1] : '';
}

/**
 * Extracts the city name from the city_line (e.g. "75013 Paris" → "Paris").
 */
function parseCity(cityLine: string): string {
  return cityLine.replace(/^\d{5}\s*/, '');
}

export function mapApiStationToGasStation(
  station: ApiStation | ApiStationWithDistance
): GasStation {
  const fuels: FuelPrice[] = [];

  if (station.Fuels) {
    for (const fuel of station.Fuels) {
      const type = FUEL_ID_MAP[fuel.id];
      if (type && fuel.available && fuel.Price) {
        fuels.push({
          type,
          price: fuel.Price.value,
          updatedAt: fuel.Update?.value ?? '',
        });
      }
    }
  }

  const result: GasStation = {
    id: station.id,
    name: station.name,
    brand: station.Brand.name,
    address: station.Address.street_line,
    city: parseCity(station.Address.city_line),
    postalCode: parsePostalCode(station.Address.city_line),
    latitude: station.Coordinates.latitude,
    longitude: station.Coordinates.longitude,
    fuels,
    services: [],
  };

  if ('distance' in station) {
    result.distance = (station as ApiStationWithDistance).distance / 1000;
  }

  return result;
}
