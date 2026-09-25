import type { Poi } from '@/lib/poi'
import { isEv, isGas } from '@/lib/poi'
import { latestFuelUpdate } from '@/lib/poi-details'

const DAY_MS = 86_400_000
export const GAS_PRICE_MAX_AGE_DAYS = 30

export interface IndexVerdict {
  index: boolean
  lastModified: Date | null
}

const toDate = (raw: string | null | undefined): Date | null => {
  if (!raw) return null
  const t = Date.parse(raw)
  return Number.isFinite(t) ? new Date(t) : null
}

export function poiIndexVerdict(poi: Poi, now: number): IndexVerdict {
  if (isGas(poi)) {
    const last = latestFuelUpdate(poi.data)
    return { index: last != null && now - last.getTime() <= GAS_PRICE_MAX_AGE_DAYS * DAY_MS, lastModified: last }
  }
  if (isEv(poi)) {
    const hasPoints = poi.data.chargingPointCount > 0 || poi.data.chargingPoints.length > 0
    return {
      index: hasPoints,
      lastModified: toDate(poi.data.lastModified) ?? toDate(poi.data.lastUpdateDate),
    }
  }
  return { index: false, lastModified: null }
}
