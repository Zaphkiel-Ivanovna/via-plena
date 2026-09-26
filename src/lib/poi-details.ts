import type { EvStationData, GasStationData, Poi } from '@/lib/poi'

export function formatPoiAddress(p: Poi): string {
  const address = p.address
    .split(',')
    .map((s) => s.trim().replace(/^(.*\d{5}.*?)\s+France$/i, '$1'))
    .filter((s) => s && !/^france$/i.test(s))
    .join(', ')
  if (address.includes(p.postalCode)) return address
  return [address, `${p.postalCode} ${p.city}`.trim()].filter(Boolean).join(', ')
}

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const

export type TimeRange = { start: number; end: number }

export interface DaySchedule {
  index: number
  name: (typeof DAY_NAMES)[number]
  allDay: boolean
  closed: boolean
  ranges: TimeRange[]
}

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split('.').map(Number)
  return h * 60 + m
}

const mergeRanges = (ranges: TimeRange[]): TimeRange[] => {
  const sorted = [...ranges].sort((a, b) => a.start - b.start)
  const out: TimeRange[] = []
  for (const r of sorted) {
    const last = out[out.length - 1]
    if (last && r.start <= last.end) last.end = Math.max(last.end, r.end)
    else out.push({ ...r })
  }
  return out
}

export function parseGasSchedule(data: GasStationData): DaySchedule[] | null {
  const summary = data.scheduleSummary?.trim() ?? ''
  if (summary === '24/7') {
    return DAY_NAMES.map((name, index) => ({ index, name, allDay: true, closed: false, ranges: [] }))
  }

  const byDay = new Map<string, string>()
  for (const token of summary.split(',')) {
    const match = token.trim().match(/^(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\s*(.*)$/)
    if (match) byDay.set(match[1], match[2])
  }
  if (byDay.size === 0) return null

  const closedDays = new Set(data.scheduleDays.filter((d) => d.isClosed).map((d) => d.name))

  return DAY_NAMES.map((name, index) => {
    const raw = byDay.get(name) ?? ''
    const ranges = (raw.match(/\d{2}\.\d{2}-\d{2}\.\d{2}/g) ?? []).map((r) => {
      const [start, end] = r.split('-').map(toMinutes)
      return { start, end: end <= start && end !== start ? end + 1440 : end }
    })
    const allDay = ranges.some((r) => r.start === r.end)
    const closed = !allDay && (ranges.length === 0 || closedDays.has(name))
    return {
      index,
      name,
      allDay,
      closed,
      ranges: allDay || closed ? [] : mergeRanges(ranges),
    }
  })
}

export const formatMinutes = (minutes: number): string => {
  const m = minutes % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export const formatDayHours = (day: DaySchedule): string => {
  if (day.allDay) return '24h/24'
  if (day.closed) return 'Fermé'
  return day.ranges.map((r) => `${formatMinutes(r.start)} - ${formatMinutes(r.end)}`).join(', ')
}

const PARIS_CLOCK = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Paris',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function parisClock(date: Date): { dayIndex: number; minutes: number } {
  const parts = Object.fromEntries(PARIS_CLOCK.formatToParts(date).map((p) => [p.type, p.value]))
  return {
    dayIndex: WEEKDAYS.indexOf(parts.weekday),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

export const mondayIndex = (date: Date): number => parisClock(date).dayIndex

const PARIS_DATE_TIME = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  dateStyle: 'long',
  timeStyle: 'short',
})

export const formatParisDateTime = (date: Date): string => PARIS_DATE_TIME.format(date)

export type OpenStatus =
  | { kind: 'always' }
  | { kind: 'open'; closesAt: string }
  | { kind: 'closed'; opensAt: string | null; opensDay: string | null }

export function getOpenStatus(week: DaySchedule[], now: Date): OpenStatus {
  if (week.every((d) => d.allDay)) return { kind: 'always' }

  const { dayIndex: today, minutes } = parisClock(now)

  const yesterday = week[(today + 6) % 7]
  for (const r of yesterday.ranges) {
    if (r.end > 1440 && minutes < r.end - 1440) return { kind: 'open', closesAt: formatMinutes(r.end) }
  }

  const current = week[today]
  if (current.allDay) return { kind: 'open', closesAt: '23:59' }
  for (const r of current.ranges) {
    if (minutes >= r.start && minutes < r.end) return { kind: 'open', closesAt: formatMinutes(r.end) }
  }

  const laterToday = current.ranges.find((r) => r.start > minutes)
  if (laterToday) return { kind: 'closed', opensAt: formatMinutes(laterToday.start), opensDay: null }

  for (let offset = 1; offset <= 7; offset++) {
    const day = week[(today + offset) % 7]
    if (day.allDay) return { kind: 'closed', opensAt: '00:00', opensDay: offset === 1 ? 'demain' : day.name.toLowerCase() }
    if (day.ranges.length) {
      return {
        kind: 'closed',
        opensAt: formatMinutes(day.ranges[0].start),
        opensDay: offset === 1 ? 'demain' : day.name.toLowerCase(),
      }
    }
  }
  return { kind: 'closed', opensAt: null, opensDay: null }
}

export interface TemporaryOutage {
  name: string
  since: string | null
}

export function temporaryOutages(data: GasStationData): TemporaryOutage[] {
  const priced = new Set(data.fuels.filter((f) => f.price != null).map((f) => f.name))
  return data.fuelOutages
    .filter((o) => o.type === 'temporaire' && !priced.has(o.name))
    .map((o) => ({ name: o.name, since: o.startDate }))
}

export const latestFuelUpdate = (data: GasStationData): Date | null => {
  const times = data.fuels
    .map((f) => (f.lastUpdate ? Date.parse(f.lastUpdate) : NaN))
    .filter(Number.isFinite)
  return times.length ? new Date(Math.max(...times)) : null
}

const priceFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

export const formatPriceValue = (price: number): string => priceFormatter.format(price)

const relativeFormatter = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' })

export function formatRelativeTime(date: Date, now: Date): string {
  const diffMinutes = Math.round((date.getTime() - now.getTime()) / 60_000)
  const abs = Math.abs(diffMinutes)
  if (abs < 60) return relativeFormatter.format(diffMinutes, 'minute')
  if (abs < 60 * 24) return relativeFormatter.format(Math.round(diffMinutes / 60), 'hour')
  if (abs < 60 * 24 * 30) return relativeFormatter.format(Math.round(diffMinutes / 1440), 'day')
  return relativeFormatter.format(Math.round(diffMinutes / (1440 * 30)), 'month')
}

export type EvChargingPoint = EvStationData['chargingPoints'][number]
export type ChargingPointRealtime = NonNullable<EvChargingPoint['realtime']>

export const chargingPoints = (data: EvStationData): EvChargingPoint[] => data.chargingPoints ?? []

export function withLiveRealtime(
  points: EvChargingPoint[],
  live: ReadonlyMap<string, ChargingPointRealtime | null> | null,
): EvChargingPoint[] {
  if (!live) return points
  return points.map((cp) =>
    live.has(cp.chargingPointItineranceId)
      ? { ...cp, realtime: live.get(cp.chargingPointItineranceId) ?? null }
      : cp,
  )
}

export type PointState = 'available' | 'occupied' | 'outOfService' | 'unknown'

export function pointState(cp: EvChargingPoint): PointState {
  const rt = cp.realtime
  if (!rt) return 'unknown'
  if (rt.status === 'hors_service') return 'outOfService'
  if (rt.occupation === 'occupe' || rt.occupation === 'reserve') return 'occupied'
  if (rt.status === 'en_service' && rt.occupation === 'libre') return 'available'
  return 'unknown'
}

export interface Availability {
  total: number
  available: number
  occupied: number
  outOfService: number
  unknown: number
  lastObservedAt: Date | null
}

export function summarizeAvailability(points: EvChargingPoint[]): Availability {
  const out: Availability = { total: points.length, available: 0, occupied: 0, outOfService: 0, unknown: 0, lastObservedAt: null }
  for (const cp of points) {
    out[pointState(cp)]++
    const observed = cp.realtime ? new Date(cp.realtime.observedAt) : null
    if (observed && (!out.lastObservedAt || observed > out.lastObservedAt)) out.lastObservedAt = observed
  }
  return out
}

export const hasRealtime = (a: Availability): boolean => a.unknown < a.total

export const REALTIME_STALE_HOURS = 24

export const isRealtimeStale = (a: Availability, now: Date): boolean =>
  a.lastObservedAt != null && now.getTime() - a.lastObservedAt.getTime() > REALTIME_STALE_HOURS * 3_600_000

export type PlugKind = 'ccs' | 'chademo' | 'type2' | 'ef' | 'other'

export const PLUG_LABELS: Record<PlugKind, string> = {
  ccs: 'Combo CCS',
  chademo: 'CHAdeMO',
  type2: 'Type 2',
  ef: 'Prise E/F',
  other: 'Autre',
}

const plugsOf = (cp: EvChargingPoint): PlugKind[] => {
  const plugs: PlugKind[] = []
  if (cp.hasPlugTypeComboCcs) plugs.push('ccs')
  if (cp.hasPlugTypeChademo) plugs.push('chademo')
  if (cp.hasPlugType2) plugs.push('type2')
  if (cp.hasPlugTypeEf) plugs.push('ef')
  if (cp.hasPlugTypeOther) plugs.push('other')
  return plugs
}

export type ChargeSpeed = 'Lente' | 'Accélérée' | 'Rapide' | 'Ultra-rapide'

export const chargeSpeed = (kw: number): ChargeSpeed => {
  if (kw >= 150) return 'Ultra-rapide'
  if (kw >= 50) return 'Rapide'
  if (kw > 7.4) return 'Accélérée'
  return 'Lente'
}

export interface ChargingGroup {
  power: number
  plugs: PlugKind[]
  count: number
  cableAttached: boolean
  states: Record<PointState, number>
}

export function groupChargingPoints(points: EvChargingPoint[]): ChargingGroup[] {
  const groups = new Map<string, ChargingGroup>()
  for (const cp of points) {
    const power = Math.round(cp.nominalPower * 10) / 10
    const plugs = plugsOf(cp)
    const key = `${power}|${plugs.join(',')}`
    const group = groups.get(key) ?? {
      power,
      plugs,
      count: 0,
      cableAttached: false,
      states: { available: 0, occupied: 0, outOfService: 0, unknown: 0 },
    }
    group.count++
    group.cableAttached ||= cp.hasCableT2Attached
    group.states[pointState(cp)]++
    groups.set(key, group)
  }
  return [...groups.values()].sort((a, b) => b.power - a.power || b.count - a.count)
}

export const formatPower = (kw: number): string =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(kw)} kW`

export interface EvPayment {
  free: boolean
  creditCard: boolean
  payPerUse: boolean
  other: boolean
}

export function evPayment(points: EvChargingPoint[]): EvPayment {
  return {
    free: points.length > 0 && points.every((p) => p.isFree),
    creditCard: points.some((p) => p.hasCreditCardPayment),
    payPerUse: points.some((p) => p.hasPayPerUse),
    other: points.some((p) => p.hasOtherPayment),
  }
}

export type EvPricing = { kind: 'link'; url: string } | { kind: 'text'; text: string }

export function usefulPricing(raw: string | null): string | null {
  const value = raw?.trim()
  if (!value || /^inconnu$/i.test(value)) return null
  return /^https?:\/\//i.test(value) || value.length <= 80 ? value : null
}

export function evPricing(points: EvChargingPoint[]): EvPricing | null {
  for (const p of points) {
    const value = usefulPricing(p.pricing)
    if (!value) continue
    return /^https?:\/\//i.test(value) ? { kind: 'link', url: value } : { kind: 'text', text: value }
  }
  return null
}

export function stripLiveData(p: Poi): Poi {
  if (!('chargingPoints' in p.data)) return p
  const points = p.data.chargingPoints.map((cp) => ({ ...cp, realtime: null, pricing: usefulPricing(cp.pricing) }))
  return {
    ...p,
    data: {
      ...p.data,
      chargingPoints: points,
      availability: { total: points.length, available: 0, occupied: 0, outOfService: 0, unknown: points.length, lastObservedAt: null },
    },
  }
}

export const isAlwaysOpenEv = (data: EvStationData): boolean =>
  /^(24\/7|Mo-Su 00:00-2[34]:\d{2})$/.test(data.openingHours.trim())

export function operatorPhone(data: EvStationData): { href: string; label: string } | null {
  const raw = data.operatorPhone.replace(/^tel:/i, '').trim()
  if (!raw) return null
  const digits = raw.replace(/[^\d+]/g, '')
  const national = digits.startsWith('+33') ? `0${digits.slice(3)}` : digits
  const label = /^0\d{9}$/.test(national) ? national.replace(/(\d{2})(?=\d)/g, '$1 ') : raw
  return { href: `tel:${digits}`, label }
}

export function streetLabel(p: Poi): string {
  const street = p.address.split(',')[0].trim()
  if (street !== street.toUpperCase()) return street
  const small = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'et', 'à', 'au', 'aux', 'sur', 'en'])
  return street
    .toLowerCase()
    .split(' ')
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
    .replace(/\b([ld]) (?=\p{L})/gu, "$1'")
}
