'use client';

import type { Poi } from '@/lib/poi';
import { cheapestGasPrice, distanceMeters, isEv, isGas } from '@/lib/poi';
import { formatPrice, formatDistanceMeters } from '@/lib/format';
import { fuelLabel } from '@/lib/constants';

interface StationPopupProps {
  poi: Poi;
}

export function StationPopup({ poi }: StationPopupProps) {
  const distance = distanceMeters(poi);

  if (isEv(poi)) {
    return (
      <div className="min-w-[180px] p-2 text-sm">
        <p className="font-semibold text-foreground">{poi.name}</p>
        <p className="text-xs text-muted-foreground">{poi.data.operatorName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {poi.address}, {poi.city}
        </p>
        <p className="mt-1 font-medium text-emerald-600 dark:text-emerald-400">
          {poi.data.chargingPointCount} bornes
        </p>
        {distance != null && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceMeters(distance)}
          </p>
        )}
      </div>
    );
  }

  const cheapest = cheapestGasPrice(poi);
  const cheapestFuel =
    cheapest != null && isGas(poi)
      ? poi.data.fuels.find((f) => f.price === cheapest)
      : null;

  return (
    <div className="min-w-[180px] p-2 text-sm">
      <p className="font-semibold text-foreground">{poi.name}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {poi.address}, {poi.city}
      </p>
      {cheapestFuel && (
        <p className="mt-1 font-medium text-green-700 dark:text-green-400">
          {fuelLabel(cheapestFuel.name)} {formatPrice(cheapestFuel.price as number)}
        </p>
      )}
      {distance != null && (
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceMeters(distance)}
        </p>
      )}
    </div>
  );
}
