'use client';

import { Slider } from '@/components/ui/slider';
import { useAppStore } from '@/stores/app-store';
import { MapPin } from 'lucide-react';

const SIZE_LABELS: Record<number, string> = {
  0.75: 'S',
  1: 'M',
  1.25: 'L',
  1.5: 'XL',
};

export function MarkerSizeFilter() {
  const markerSize = useAppStore((s) => s.markerSize);
  const setMarkerSize = useAppStore((s) => s.setMarkerSize);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <MapPin className="size-3.5 text-primary/70" />
          Taille des marqueurs
        </h4>
        <span className="text-xs text-muted-foreground">
          {SIZE_LABELS[markerSize] ?? `${Math.round(markerSize * 100)}%`}
        </span>
      </div>
      <Slider
        value={[markerSize]}
        onValueChange={([v]) => setMarkerSize(v)}
        min={0.75}
        max={1.5}
        step={0.25}
      />
    </div>
  );
}
