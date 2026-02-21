import type { GasStation } from '@/types/station';

export function getCheapestPrice(station: GasStation): number | null {
  if (station.fuels.length === 0) return null;
  return Math.min(...station.fuels.map((f) => f.price));
}

export function getGoogleMapsUrl(station: GasStation): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;
}

export function getWazeUrl(station: GasStation): string {
  return `https://www.waze.com/ul?ll=${station.latitude},${station.longitude}&navigate=yes`;
}

export function getAppleMapsUrl(station: GasStation): string {
  return `https://maps.apple.com/?daddr=${station.latitude},${station.longitude}`;
}
