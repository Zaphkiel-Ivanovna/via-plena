import { cache } from 'react'
import { getCommuneByInsee, getCommuneBySlug } from '@/api/generated/communes/communes'
import { findPoisByCommune } from '@/api/generated/poi/poi'
import { ApiError, nextCursor } from '@/api/fetcher'
import type { CommuneSingle } from '@/api/generated/models'
import { FUEL_NAMES_ORDER } from '@/lib/constants'
import { isEv, isGas, type Poi } from '@/lib/poi'
import { chargingPoints, summarizeAvailability, type Availability } from '@/lib/poi-details'
import { GAS_PRICE_MAX_AGE_DAYS } from '@/lib/seo/indexability'

export const COMMUNE_REVALIDATE = 300

const PAGE_SIZE = 200
const MAX_PAGES = 15

export interface FuelSummary {
  fuel: string
  stations: number
  min: number
  avg: number
  cheapest: Poi
}

export interface CommuneData {
  commune: CommuneSingle
  gas: Poi[]
  ev: Poi[]
  fuels: FuelSummary[]
  evPoints: number
  evFast: number
  evFree: number
  availability: Availability
  indexable: boolean
}

export function isCommuneIndexable(gasWithPrice: number, evStations: number): boolean {
  return gasWithPrice >= 2 || evStations >= 3 || gasWithPrice + evStations >= 3
}

async function loadAllPois(insee: string): Promise<Poi[]> {
  const pois: Poi[] = []
  let cursor: string | undefined
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await findPoisByCommune(
      insee,
      { limit: PAGE_SIZE, cursor },
      { next: { revalidate: COMMUNE_REVALIDATE } },
    )
    pois.push(...(res.data as unknown as Poi[]))
    cursor = nextCursor(res)
    if (!cursor) break
  }
  return pois
}

const isFresh = (lastUpdate: string | null, now: number) =>
  lastUpdate != null && now - Date.parse(lastUpdate) <= GAS_PRICE_MAX_AGE_DAYS * 86_400_000

function withFreshPrices(gas: Poi[], now: number): Poi[] {
  return gas.flatMap((p) => {
    if (!isGas(p)) return []
    const fuels = p.data.fuels.filter((f) => f.price != null && isFresh(f.lastUpdate, now))
    return fuels.length ? [{ ...p, data: { ...p.data, fuels } }] : []
  })
}

function summarizeFuels(gas: Poi[]): FuelSummary[] {
  const byFuel = new Map<string, { prices: number[]; cheapest: Poi; min: number }>()
  for (const p of gas) {
    if (!isGas(p)) continue
    for (const f of p.data.fuels) {
      if (f.price == null) continue
      const entry = byFuel.get(f.name)
      if (!entry) byFuel.set(f.name, { prices: [f.price], cheapest: p, min: f.price })
      else {
        entry.prices.push(f.price)
        if (f.price < entry.min) {
          entry.min = f.price
          entry.cheapest = p
        }
      }
    }
  }
  const order = (name: string) => {
    const i = (FUEL_NAMES_ORDER as readonly string[]).indexOf(name)
    return i === -1 ? 99 : i
  }
  return [...byFuel.entries()]
    .map(([fuel, e]) => ({
      fuel,
      stations: e.prices.length,
      min: e.min,
      avg: e.prices.reduce((a, b) => a + b, 0) / e.prices.length,
      cheapest: e.cheapest,
    }))
    .sort((a, b) => order(a.fuel) - order(b.fuel))
}

async function fetchCommune(load: () => Promise<{ data: unknown }>): Promise<CommuneSingle | null> {
  try {
    return (await load()).data as CommuneSingle
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429) return null
    throw error
  }
}

export const findCommuneByInsee = cache((insee: string) =>
  fetchCommune(() => getCommuneByInsee(insee, { next: { revalidate: COMMUNE_REVALIDATE } })),
)

export const loadCommuneBySlug = cache(async (slug: string): Promise<CommuneData | null> => {
  const commune = await fetchCommune(() => getCommuneBySlug(slug, { next: { revalidate: COMMUNE_REVALIDATE } }))
  return commune ? loadCommuneData(commune) : null
})

async function loadCommuneData(commune: CommuneSingle): Promise<CommuneData> {
  const pois = await loadAllPois(commune.insee)
  const gas = withFreshPrices(pois.filter(isGas), Date.now())
  const ev = pois.filter(isEv)
  const points = ev.flatMap((p) => (isEv(p) ? chargingPoints(p.data) : []))

  return {
    commune,
    gas,
    ev,
    fuels: summarizeFuels(gas),
    evPoints: points.length,
    evFast: ev.filter((p) => isEv(p) && chargingPoints(p.data).some((cp) => cp.nominalPower >= 50)).length,
    evFree: ev.filter((p) => isEv(p) && chargingPoints(p.data).some((cp) => cp.isFree)).length,
    availability: summarizeAvailability(points),
    indexable: isCommuneIndexable(gas.length, ev.length),
  }
}

export const communePath = (slug: string) => `/prix-carburant/${slug}`

export function inCity(name: string): string {
  if (/^Le /.test(name)) return `au ${name.slice(3)}`
  if (/^Les /.test(name)) return `aux ${name.slice(4)}`
  return `à ${name}`
}

export function ofCity(name: string): string {
  if (/^Le /.test(name)) return `du ${name.slice(3)}`
  if (/^Les /.test(name)) return `des ${name.slice(4)}`
  return /^[aeiouyhàâéèêëîïôöûü]/i.test(name) ? `d'${name}` : `de ${name}`
}
