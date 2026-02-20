'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { useFilterStore } from '@/stores/filter-store';
import { mockStations } from '@/mocks/stations';

const AVAILABLE_BRANDS = [...new Set(mockStations.map((s) => s.brand))].sort();

export function BrandFilter() {
  const brands = useFilterStore((s) => s.brands);
  const toggleBrand = useFilterStore((s) => s.toggleBrand);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Marques</h4>
      <div className="space-y-2">
        {AVAILABLE_BRANDS.map((brand) => (
          <label
            key={brand}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Checkbox
              checked={brands.includes(brand)}
              onCheckedChange={() => toggleBrand(brand)}
            />
            <span className="text-sm">{brand}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
