import { fuelSearchName } from '@/lib/constants'
import { distanceMeters, isEv, isGas, type Poi } from '@/lib/poi'
import { chargingPoints, formatPoiAddress, formatPriceValue } from '@/lib/poi-details'
import { GAS_PRICE_MAX_AGE_DAYS } from '@/lib/seo/indexability'

export interface NearbyRow {
  id: string
  name: string
  address: string
  distance: number | null
  price: number | null
}

export interface NearbySection {
  kind: 'gas' | 'ev'
  fuel: string | null
  summary: string | null
  rows: NearbyRow[]
}

const COMPARED_FUELS = ['Gazole', 'E10', 'SP95', 'SP98']
const MAX_AGE_MS = GAS_PRICE_MAX_AGE_DAYS * 86_400_000

const shortName = (p: Poi) => p.name.split(' | ').slice(-1)[0]

export function latestPriceTime(pois: Poi[]): number {
  let max = 0
  for (const p of pois) {
    if (!isGas(p)) continue
    for (const f of p.data.fuels) {
      const t = f.price != null && f.lastUpdate ? Date.parse(f.lastUpdate) : NaN
      if (Number.isFinite(t) && t > max) max = t
    }
  }
  return max
}

function priceOf(p: Poi, fuel: string, reference: number): number | null {
  if (!isGas(p)) return null
  const f = p.data.fuels.find((x) => x.name === fuel)
  if (f?.price == null || !f.lastUpdate) return null
  return reference - Date.parse(f.lastUpdate) <= MAX_AGE_MS ? f.price : null
}

export function buildNearby(poi: Poi, nearby: Poi[]): NearbySection | null {
  if (nearby.length === 0) return null

  if (isEv(poi)) {
    const fast = nearby.filter((n) => isEv(n) && chargingPoints(n.data).some((cp) => cp.nominalPower >= 50)).length
    const plural = nearby.length > 1 ? 's' : ''
    return {
      kind: 'ev',
      fuel: null,
      summary: `${nearby.length} autre${plural} station${plural} de recharge à moins de 3 km${fast ? `, dont ${fast} rapide${fast > 1 ? 's' : ''} (50 kW et plus)` : ''}.`,
      rows: nearby.map((n) => ({
        id: n.id,
        name: shortName(n),
        address: formatPoiAddress(n),
        distance: distanceMeters(n),
        price: null,
      })),
    }
  }

  const reference = latestPriceTime([poi, ...nearby])
  const fuel = COMPARED_FUELS.find((f) => priceOf(poi, f, reference) != null) ?? null
  const own = fuel ? priceOf(poi, fuel, reference) : null
  const others = fuel ? nearby.map((n) => priceOf(n, fuel, reference)).filter((x): x is number => x != null) : []

  let summary: string | null = null
  if (fuel && own != null && others.length >= 2) {
    const avg = others.reduce((a, b) => a + b, 0) / others.length
    const cents = Math.round((own - avg) * 1000) / 10
    const gap =
      Math.abs(cents) < 0.5
        ? 'au même niveau que'
        : `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(Math.abs(cents))} centimes ${cents < 0 ? 'de moins que' : 'de plus que'}`
    const label = fuel === 'Gazole' ? 'gazole' : fuelSearchName(fuel)
    summary = `Ici, le ${label} est à ${formatPriceValue(own)} €/L, ${gap} la moyenne des ${others.length} stations voisines (${formatPriceValue(avg)} €/L) dans un rayon de 3 km.`
  }

  return {
    kind: 'gas',
    fuel,
    summary,
    rows: nearby.map((n) => ({
      id: n.id,
      name: shortName(n),
      address: formatPoiAddress(n),
      distance: distanceMeters(n),
      price: fuel ? priceOf(n, fuel, reference) : null,
    })),
  }
}
