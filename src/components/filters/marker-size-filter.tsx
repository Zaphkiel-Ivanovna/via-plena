'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAppStore } from '@/stores/app-store';
import { SEGMENTED_GROUP_CLASS, SEGMENTED_ITEM_CLASS } from './segmented';

const SIZES = [
  { value: 0.75, label: 'S', name: 'Petits' },
  { value: 1, label: 'M', name: 'Moyens' },
  { value: 1.25, label: 'L', name: 'Grands' },
  { value: 1.5, label: 'XL', name: 'Très grands' },
];

export function MarkerSizeFilter() {
  const markerSize = useAppStore((s) => s.markerSize);
  const setMarkerSize = useAppStore((s) => s.setMarkerSize);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Taille des marqueurs</h4>
      <ToggleGroup
        type="single"
        spacing={1}
        value={String(markerSize)}
        onValueChange={(v) => v && setMarkerSize(Number(v))}
        className={SEGMENTED_GROUP_CLASS}
        aria-label="Taille des marqueurs"
      >
        {SIZES.map((s) => (
          <ToggleGroupItem key={s.value} value={String(s.value)} aria-label={`Marqueurs ${s.name.toLowerCase()}`} className={SEGMENTED_ITEM_CLASS}>
            {s.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
