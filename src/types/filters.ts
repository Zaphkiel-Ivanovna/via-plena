export type SortBy = 'distance' | 'price'
export type PoiTypeFilter = 'gas_station' | 'ev_station' | undefined

export interface FilterState {
  poiType: PoiTypeFilter
  fuelTypes: string[]
  plugTypes: string[]
  minPower: number | undefined
  freeOnly: boolean
  radius: number
  brands: string[]
  sortBy: SortBy
}
