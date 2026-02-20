'use client';

import { FuelTypeFilter } from './fuel-type-filter';
import { RadiusFilter } from './radius-filter';
import { BrandFilter } from './brand-filter';
import { useFilterStore } from '@/stores/filter-store';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';

export function FilterForm() {
  const resetFilters = useFilterStore((s) => s.resetFilters);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <SlidersHorizontal className="size-3.5 text-primary" />
          Filtres
        </h3>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="size-3" />
          Reset
        </button>
      </div>
      <div className="island-separator h-px" />
      <FuelTypeFilter />
      <div className="island-separator h-px" />
      <RadiusFilter />
      <div className="island-separator h-px" />
      <BrandFilter />
    </div>
  );
}
