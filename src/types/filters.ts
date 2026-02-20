import type { FuelType } from './station';

export type SortBy = 'distance' | 'price';

export interface FilterState {
  fuelTypes: FuelType[];
  radius: number;
  brands: string[];
  sortBy: SortBy;
}
