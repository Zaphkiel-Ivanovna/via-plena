'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { FUEL_LABELS, FUEL_NAMES, FUEL_NAMES_ORDER } from '@/lib/constants';
import { useFilterStore } from '@/stores/filter-store';
import { cn } from '@/lib/utils';
import { CHIP_ITEM_CLASS } from './segmented';

export function FuelTypeFilter() {
  const fuel = useFilterStore((s) => s.fuelTypes[0] ?? '');
  const setFuelTypes = useFilterStore((s) => s.setFuelTypes);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">Carburant</h4>
        <p className="text-xs text-muted-foreground">Choisissez-en un pour afficher son prix sur la carte.</p>
      </div>
      <ToggleGroup
        type="single"
        spacing={1.5}
        value={fuel}
        onValueChange={(v) => setFuelTypes(v ? [v] : [])}
        className="grid w-full grid-cols-2"
        aria-label="Carburant"
      >
        {FUEL_NAMES_ORDER.map((name) => (
          <ToggleGroupItem
            key={name}
            value={name}
            className={cn(CHIP_ITEM_CLASS, 'h-auto flex-col items-start justify-start gap-0 rounded-xl px-3 py-2 text-left text-foreground')}
          >
            <span className="text-sm font-semibold">{FUEL_LABELS[name]}</span>
            <span className="w-full text-[11px] leading-tight font-normal whitespace-normal text-muted-foreground">
              {FUEL_NAMES[name].replace('-', '\u2011')}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
