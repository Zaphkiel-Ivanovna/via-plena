'use client';

import { Badge } from '@/components/ui/badge';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { FUEL_LABELS } from '@/lib/constants';
import type { FuelType } from '@/types/station';

interface FuelPriceBadgeProps {
  fuelType: FuelType;
  price: number;
  isCheapest?: boolean;
}

export function FuelPriceBadge({ fuelType, price, isCheapest = false }: FuelPriceBadgeProps) {
  return (
    <Badge
      variant={isCheapest ? 'default' : 'secondary'}
      className={
        isCheapest
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
          : 'border border-border/50'
      }
    >
      <span className="text-[10px] uppercase tracking-wider opacity-70 mr-1">
        {FUEL_LABELS[fuelType]}
      </span>
      <span className="font-semibold">
        <NumberTicker value={price} decimalPlaces={3} />
        &euro;
      </span>
    </Badge>
  );
}
