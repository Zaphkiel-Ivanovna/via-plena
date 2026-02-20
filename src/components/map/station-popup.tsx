'use client';

import type { GasStation } from '@/types/station';
import { formatPrice, formatDistance } from '@/lib/format';

interface StationPopupProps {
  station: GasStation;
}

export function StationPopup({ station }: StationPopupProps) {
  const cheapestFuel = station.fuels.length > 0
    ? station.fuels.reduce((min, f) => (f.price < min.price ? f : min), station.fuels[0])
    : null;

  return (
    <div className="min-w-[180px] p-2 text-sm">
      <p className="font-semibold text-foreground">{station.name}</p>
      <p className="text-xs text-muted-foreground">{station.brand}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {station.address}, {station.city}
      </p>
      {cheapestFuel && (
        <p className="mt-1 font-medium text-green-700 dark:text-green-400">
          {cheapestFuel.type.toUpperCase()} {formatPrice(cheapestFuel.price)}
        </p>
      )}
      {station.distance !== undefined && (
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDistance(station.distance)}
        </p>
      )}
    </div>
  );
}
