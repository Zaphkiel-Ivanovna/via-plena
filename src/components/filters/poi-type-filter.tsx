'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useFilterStore } from '@/stores/filter-store';
import { Fuel, LayoutGrid, Zap } from 'lucide-react';
import { SEGMENTED_GROUP_CLASS, SEGMENTED_ITEM_CLASS } from './segmented';

const ITEMS = [
  { value: 'all', label: 'Tous', Icon: LayoutGrid },
  { value: 'gas_station', label: 'Essence', Icon: Fuel },
  { value: 'ev_station', label: 'EV', Icon: Zap },
] as const;

export function PoiTypeFilter() {
  const poiType = useFilterStore((s) => s.poiType);
  const setPoiType = useFilterStore((s) => s.setPoiType);

  return (
    <ToggleGroup
      type="single"
      value={poiType ?? 'all'}
      onValueChange={(v) => {
        if (!v) return;
        setPoiType(v === 'all' ? undefined : (v as 'gas_station' | 'ev_station'));
      }}
      spacing={1}
      className={SEGMENTED_GROUP_CLASS}
    >
      {ITEMS.map(({ value, label, Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label}
          className={SEGMENTED_ITEM_CLASS}
        >
          <Icon className="size-3.5" />
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
