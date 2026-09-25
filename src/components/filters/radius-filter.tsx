'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { RADIUS_OPTIONS } from '@/lib/constants';
import { useFilterStore } from '@/stores/filter-store';
import { SEGMENTED_GROUP_CLASS, SEGMENTED_ITEM_CLASS } from './segmented';

export function RadiusFilter() {
  const radius = useFilterStore((s) => s.radius);
  const setRadius = useFilterStore((s) => s.setRadius);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Rayon de recherche</h4>
      <ToggleGroup
        type="single"
        spacing={1}
        value={String(radius)}
        onValueChange={(v) => v && setRadius(Number(v))}
        className={SEGMENTED_GROUP_CLASS}
        aria-label="Rayon de recherche"
      >
        {RADIUS_OPTIONS.map((r) => (
          <ToggleGroupItem key={r} value={String(r)} aria-label={`${r} kilomètres`} className={SEGMENTED_ITEM_CLASS}>
            {r} km
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
