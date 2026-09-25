import type { FindPoisNearbyParams } from '@/api/generated/models'
import { FindPoisNearbyPlug } from '@/api/generated/models'
import { isEv, type Poi } from '@/lib/poi'
import { chargingPoints, isAlwaysOpenEv, type EvChargingPoint } from '@/lib/poi-details'
import type { EvFilters } from '@/stores/filter-store'

export type PlugFilter = (typeof FindPoisNearbyPlug)[keyof typeof FindPoisNearbyPlug]

export const PLUG_FILTER_OPTIONS: { value: PlugFilter; label: string }[] = [
  { value: 'T2', label: 'Type 2' },
  { value: 'CCS', label: 'Combo CCS' },
  { value: 'CHAdeMO', label: 'CHAdeMO' },
  { value: 'EF', label: 'Prise E/F' },
]

export const POWER_FILTER_OPTIONS: { value: number | undefined; label: string; hint: string }[] = [
  { value: undefined, label: 'Toutes', hint: 'Toutes les puissances' },
  { value: 22, label: '22+', hint: 'Recharge accélérée et plus (22 kW)' },
  { value: 50, label: '50+', hint: 'Recharge rapide et plus (50 kW)' },
  { value: 150, label: '150+', hint: 'Recharge ultra-rapide (150 kW)' },
]

const PLUG_FLAGS: Record<PlugFilter, keyof EvChargingPoint> = {
  T2: 'hasPlugType2',
  CCS: 'hasPlugTypeComboCcs',
  CHAdeMO: 'hasPlugTypeChademo',
  EF: 'hasPlugTypeEf',
  Other: 'hasPlugTypeOther',
}

export function evServerParams(f: EvFilters): Pick<FindPoisNearbyParams, 'plug' | 'minPower' | 'free' | 'available' | 'operator'> {
  return {
    plug: f.plugTypes.length === 1 ? (f.plugTypes[0] as PlugFilter) : undefined,
    minPower: f.minPower,
    free: f.freeOnly || undefined,
    available: f.availableNow || undefined,
    operator: f.operator.trim() || undefined,
  }
}

export const hasEvClientFilters = (f: EvFilters): boolean =>
  f.plugTypes.length > 1 || f.creditCard || f.publicAccess || f.alwaysOpen || f.pmrAccessible || f.reservable

export function matchesEvClientFilters(p: Poi, f: EvFilters): boolean {
  if (!isEv(p)) return true
  const points = chargingPoints(p.data)
  if (f.plugTypes.length > 1) {
    const flags = f.plugTypes.map((plug) => PLUG_FLAGS[plug as PlugFilter]).filter(Boolean)
    if (!points.some((cp) => flags.some((flag) => cp[flag] === true))) return false
  }
  if (f.creditCard && !points.some((cp) => cp.hasCreditCardPayment)) return false
  if (f.publicAccess && !/libre/i.test(p.data.accessCondition)) return false
  if (f.alwaysOpen && !isAlwaysOpenEv(p.data)) return false
  if (f.pmrAccessible && !/^(accessible|réservé)/i.test(p.data.pmrAccessibility.trim())) return false
  if (f.reservable && !p.data.hasReservation) return false
  return true
}
