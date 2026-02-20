'use client';

import type { GasStation, FuelType } from '@/types/station';
import { getBrandColor } from '@/components/station/brand-icon';
import { formatPrice } from '@/lib/format';
import { FUEL_LABELS } from '@/lib/constants';

function getDisplayPrice(station: GasStation, fuelType?: FuelType): { price: number; label: string } | null {
  if (station.fuels.length === 0) return null;

  if (fuelType) {
    const fuel = station.fuels.find((f) => f.type === fuelType);
    if (fuel) return { price: fuel.price, label: FUEL_LABELS[fuel.type] };
    return null;
  }

  const cheapest = station.fuels.reduce((min, f) => (f.price < min.price ? f : min), station.fuels[0]);
  return { price: cheapest.price, label: FUEL_LABELS[cheapest.type] };
}

interface StationMarkerProps {
  station: GasStation;
  fuelType?: FuelType;
  isSelected?: boolean;
  onClick?: () => void;
}

export function StationMarker({ station, fuelType, isSelected, onClick }: StationMarkerProps) {
  const display = getDisplayPrice(station, fuelType);
  const color = getBrandColor(station.brand);
  const hasPrice = display !== null;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center"
      style={{
        transform: isSelected ? 'scale(1.2)' : 'scale(1)',
        transition: 'transform 150ms',
        opacity: fuelType && !hasPrice ? 0.4 : 1,
      }}
    >
      <div
        className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {hasPrice ? formatPrice(display.price) : station.brand}
      </div>
      <div
        className="h-2 w-2 rounded-full -mt-0.5 border border-white shadow"
        style={{ backgroundColor: color }}
      />
    </button>
  );
}
