'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { FUEL_LABELS } from '@/lib/constants';
import { useFilterStore } from '@/stores/filter-store';
import type { FuelType } from '@/types/station';

const FUEL_TYPES = Object.keys(FUEL_LABELS) as FuelType[];

export function FuelTypeFilter() {
  const fuelTypes = useFilterStore((s) => s.fuelTypes);
  const toggleFuelType = useFilterStore((s) => s.toggleFuelType);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Type de carburant</h4>
      <div className="space-y-2">
        {FUEL_TYPES.map((fuel) => (
          <label
            key={fuel}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Checkbox
              checked={fuelTypes.includes(fuel)}
              onCheckedChange={() => toggleFuelType(fuel)}
            />
            <span className="text-sm">{FUEL_LABELS[fuel]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
