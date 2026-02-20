'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RADIUS_OPTIONS } from '@/lib/constants';
import { useFilterStore } from '@/stores/filter-store';

export function RadiusFilter() {
  const radius = useFilterStore((s) => s.radius);
  const setRadius = useFilterStore((s) => s.setRadius);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Rayon de recherche</h4>
      <Select
        value={String(radius)}
        onValueChange={(val) => setRadius(Number(val))}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RADIUS_OPTIONS.map((r) => (
            <SelectItem key={r} value={String(r)}>
              {r} km
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
