'use client';

import { FuelTypeFilter } from './fuel-type-filter';
import { RadiusFilter } from './radius-filter';
import { MarkerSizeFilter } from './marker-size-filter';
import { PoiTypeFilter } from './poi-type-filter';
import { EvFilters } from './ev-filters';
import { hasActiveFilters, useFilterStore } from '@/stores/filter-store';
import { ChevronRight, RotateCcw, SlidersHorizontal, Zap } from 'lucide-react';

export function FilterForm() {
  const resetFilters = useFilterStore((s) => s.resetFilters);
  const canReset = useFilterStore(hasActiveFilters);
  const poiType = useFilterStore((s) => s.poiType);
  const setPoiType = useFilterStore((s) => s.setPoiType);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <SlidersHorizontal className="size-3.5 text-primary" />
          Filtres
        </h3>
        <button
          type="button"
          onClick={resetFilters}
          disabled={!canReset}
          className="-mr-2 flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <RotateCcw className="size-3" aria-hidden />
          Réinitialiser
        </button>
      </div>
      <div className="island-separator h-px" />
      <PoiTypeFilter />
      {poiType === undefined && (
        <button
          type="button"
          onClick={() => setPoiType('ev_station')}
          className="island-interactive flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors active:scale-[0.99]"
        >
          <Zap className="size-3.5 text-emerald-500" aria-hidden />
          <span className="flex-1">Filtres des bornes</span>
          <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
        </button>
      )}
      <div className="island-separator h-px" />
      {poiType === 'ev_station' && <EvFilters />}
      {poiType === 'ev_station' && <div className="island-separator h-px" />}
      {poiType !== 'ev_station' && <FuelTypeFilter />}
      {poiType !== 'ev_station' && <div className="island-separator h-px" />}
      <RadiusFilter />
      <div className="island-separator h-px" />
      <MarkerSizeFilter />
    </div>
  );
}
