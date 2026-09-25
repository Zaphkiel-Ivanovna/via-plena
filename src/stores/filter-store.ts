'use client'

import type { PoiTypeFilter, SortBy } from '@/types/filters'
import { create } from 'zustand'

interface FilterState {
  poiType: PoiTypeFilter
  fuelTypes: string[]
  plugTypes: string[]
  minPower: number | undefined
  freeOnly: boolean
  availableNow: boolean
  operator: string
  creditCard: boolean
  publicAccess: boolean
  alwaysOpen: boolean
  pmrAccessible: boolean
  reservable: boolean
  radius: number
  brands: string[]
  sortBy: SortBy
  setPoiType: (t: PoiTypeFilter) => void
  setFuelTypes: (fuelTypes: string[]) => void
  setPlugTypes: (plugTypes: string[]) => void
  setMinPower: (kw: number | undefined) => void
  setFreeOnly: (v: boolean) => void
  setEvFilter: (key: EvBooleanFilter, value: boolean) => void
  setOperator: (operator: string) => void
  resetEvFilters: () => void
  setRadius: (radius: number) => void
  setBrands: (brands: string[]) => void
  setSortBy: (sortBy: SortBy) => void
  toggleFuelType: (fuel: string) => void
  togglePlugType: (plug: string) => void
  toggleBrand: (brand: string) => void
  resetFilters: () => void
}

export type EvBooleanFilter =
  | 'freeOnly'
  | 'availableNow'
  | 'creditCard'
  | 'publicAccess'
  | 'alwaysOpen'
  | 'pmrAccessible'
  | 'reservable'

const initialEvFilters = {
  plugTypes: [] as string[],
  minPower: undefined as number | undefined,
  freeOnly: false,
  availableNow: false,
  operator: '',
  creditCard: false,
  publicAccess: false,
  alwaysOpen: false,
  pmrAccessible: false,
  reservable: false,
}

export type EvFilters = typeof initialEvFilters

const initialState = {
  poiType: undefined as PoiTypeFilter,
  fuelTypes: [] as string[],
  ...initialEvFilters,
  radius: 5,
  brands: [] as string[],
  sortBy: 'distance' as SortBy,
}

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,
  setPoiType: (poiType) => set({ poiType }),
  setFuelTypes: (fuelTypes) => set({ fuelTypes }),
  setPlugTypes: (plugTypes) => set({ plugTypes }),
  setMinPower: (minPower) => set({ minPower }),
  setFreeOnly: (freeOnly) => set({ freeOnly }),
  setEvFilter: (key, value) => set({ [key]: value }),
  setOperator: (operator) => set({ operator }),
  resetEvFilters: () => set(initialEvFilters),
  setRadius: (radius) => set({ radius }),
  setBrands: (brands) => set({ brands }),
  setSortBy: (sortBy) => set({ sortBy }),
  toggleFuelType: (fuel) =>
    set((state) => ({
      fuelTypes: state.fuelTypes.includes(fuel)
        ? state.fuelTypes.filter((f) => f !== fuel)
        : [...state.fuelTypes, fuel],
    })),
  togglePlugType: (plug) =>
    set((state) => ({
      plugTypes: state.plugTypes.includes(plug)
        ? state.plugTypes.filter((p) => p !== plug)
        : [...state.plugTypes, plug],
    })),
  toggleBrand: (brand) =>
    set((state) => ({
      brands: state.brands.includes(brand)
        ? state.brands.filter((b) => b !== brand)
        : [...state.brands, brand],
    })),
  resetFilters: () => set(initialState),
}))

export const selectEvFilters = (s: FilterState): EvFilters => ({
  plugTypes: s.plugTypes,
  minPower: s.minPower,
  freeOnly: s.freeOnly,
  availableNow: s.availableNow,
  operator: s.operator,
  creditCard: s.creditCard,
  publicAccess: s.publicAccess,
  alwaysOpen: s.alwaysOpen,
  pmrAccessible: s.pmrAccessible,
  reservable: s.reservable,
})

export function countActiveEvFilters(f: EvFilters): number {
  return (
    f.plugTypes.length +
    (f.minPower !== undefined ? 1 : 0) +
    (f.operator.trim() ? 1 : 0) +
    [f.freeOnly, f.availableNow, f.creditCard, f.publicAccess, f.alwaysOpen, f.pmrAccessible, f.reservable].filter(Boolean)
      .length
  )
}

export const hasActiveFilters = (s: FilterState): boolean =>
  s.poiType !== initialState.poiType ||
  s.fuelTypes.length > 0 ||
  s.radius !== initialState.radius ||
  countActiveEvFilters(selectEvFilters(s)) > 0
