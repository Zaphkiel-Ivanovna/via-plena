'use client';

import type { GasStation, FuelType } from '@/types/station';
import { getBrandColor } from '@/components/station/brand-icon';
import { formatPrice } from '@/lib/format';
import { Fuel } from 'lucide-react';

interface StationMarkerProps {
  station: GasStation;
  fuelType?: FuelType;
  scale?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function StationMarker({ station, fuelType, scale = 1, isSelected, onClick }: StationMarkerProps) {
  const color = getBrandColor(station.brand);
  const s = isSelected ? scale * 1.15 : scale;

  // No fuel selected → icon marker
  if (!fuelType) {
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-center"
        style={{ transform: `scale(${s})`, transition: 'transform 150ms' }}
      >
        <div
          className="flex items-center justify-center size-8 rounded-full text-white shadow-md"
          style={{ backgroundColor: color }}
        >
          <Fuel size={16} />
        </div>
      </button>
    );
  }

  // Fuel selected → show price
  const fuel = station.fuels.find((f) => f.type === fuelType);
  const hasPrice = fuel !== undefined;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center"
      style={{
        transform: `scale(${s})`,
        transition: 'transform 150ms',
        opacity: hasPrice ? 1 : 0.4,
      }}
    >
      <div
        className="rounded-full px-2 py-1 text-xs font-bold text-white shadow-md whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {hasPrice ? formatPrice(fuel.price) : <Fuel size={14} />}
      </div>
      <div
        className="h-2.5 w-2.5 rounded-full -mt-0.5 border-2 border-white shadow"
        style={{ backgroundColor: color }}
      />
    </button>
  );
}
