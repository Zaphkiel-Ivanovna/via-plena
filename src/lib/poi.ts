import type { PoiResponse } from '@/api/generated/models'

export type Poi = PoiResponse

type PoiDataUnion = PoiResponse['data']
export type EvStationData = Extract<PoiDataUnion, { chargingPointCount: unknown }>
export type GasStationData = Extract<PoiDataUnion, { fuels: unknown }>
export type GasFuel = GasStationData['fuels'][number]

export const isGas = (p: Poi): p is Poi & { type: 'gas_station'; data: GasStationData } =>
  p.type === 'gas_station'

export const isEv = (p: Poi): p is Poi & { type: 'ev_station'; data: EvStationData } =>
  p.type === 'ev_station'

export const distanceMeters = (p: Poi): number | null => {
  if (p.distance == null) return null
  const n = typeof p.distance === 'string' ? Number(p.distance) : p.distance
  return Number.isFinite(n) ? n : null
}

export const cheapestGasPrice = (p: Poi): number | null => {
  if (!isGas(p)) return null
  const prices = p.data.fuels.map((f) => f.price).filter((x): x is number => x != null)
  return prices.length ? Math.min(...prices) : null
}

export const fuelByName = (p: Poi, fuelName: string): GasFuel | undefined => {
  if (!isGas(p)) return undefined
  return p.data.fuels.find((f) => f.name === fuelName)
}

export const gasFuels = (p: Poi): GasFuel[] => (isGas(p) ? p.data.fuels : [])

export const evChargingPointCount = (p: Poi): number => (isEv(p) ? p.data.chargingPointCount : 0)
