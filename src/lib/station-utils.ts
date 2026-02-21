import type { GasStation } from '@/types/station';

export function getCheapestPrice(station: GasStation): number | null {
  if (station.fuels.length === 0) return null;
  return Math.min(...station.fuels.map((f) => f.price));
}

export function getDirectionsUrl(station: GasStation): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;
}
