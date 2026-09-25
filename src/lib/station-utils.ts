import type { Poi } from '@/lib/poi'

export { cheapestGasPrice as getCheapestPrice } from '@/lib/poi'

export function getGoogleMapsUrl(p: Poi): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`
}

export function getWazeUrl(p: Poi): string {
  return `https://www.waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes`
}

export function getAppleMapsUrl(p: Poi): string {
  return `https://maps.apple.com/?daddr=${p.lat},${p.lng}`
}
