'use client';

import { create } from 'zustand';
import type { FuelType } from '@/types/station';
import type { SortBy } from '@/types/filters';

interface FilterState {
  fuelTypes: FuelType[];
  radius: number;
  brands: string[];
  sortBy: SortBy;
  setFuelTypes: (fuelTypes: FuelType[]) => void;
  setRadius: (radius: number) => void;
  setBrands: (brands: string[]) => void;
  setSortBy: (sortBy: SortBy) => void;
  toggleFuelType: (fuel: FuelType) => void;
  toggleBrand: (brand: string) => void;
  resetFilters: () => void;
}

const initialState = {
  fuelTypes: [] as FuelType[],
  radius: 5,
  brands: [] as string[],
  sortBy: 'distance' as SortBy,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,
  setFuelTypes: (fuelTypes) => set({ fuelTypes }),
  setRadius: (radius) => set({ radius }),
  setBrands: (brands) => set({ brands }),
  setSortBy: (sortBy) => set({ sortBy }),
  toggleFuelType: (fuel) =>
    set((state) => ({
      fuelTypes: state.fuelTypes.includes(fuel)
        ? state.fuelTypes.filter((f) => f !== fuel)
        : [...state.fuelTypes, fuel],
    })),
  toggleBrand: (brand) =>
    set((state) => ({
      brands: state.brands.includes(brand)
        ? state.brands.filter((b) => b !== brand)
        : [...state.brands, brand],
    })),
  resetFilters: () => set(initialState),
}));
