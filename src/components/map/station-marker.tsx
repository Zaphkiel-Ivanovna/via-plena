'use client';

import { Fuel, Zap } from 'lucide-react';
import type { Poi } from '@/lib/poi';
import { fuelByName, isEv, isGas } from '@/lib/poi';
import { getBrandColor } from '@/components/station/brand-icon';
import { formatPrice } from '@/lib/format';

interface StationMarkerProps {
  poi: Poi;
  fuelName?: string;
  scale?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function StationMarker({ poi, fuelName, scale = 1, isSelected, onClick }: StationMarkerProps) {
  const s = isSelected ? scale * 1.15 : scale;

  if (isEv(poi)) {
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-center"
        style={{ transform: `scale(${s})`, transition: 'transform 150ms' }}
      >
        <div className="flex items-center justify-center size-8 rounded-full bg-emerald-500 text-white shadow-md">
          <Zap size={16} />
        </div>
      </button>
    );
  }

  const brand = isGas(poi) ? poi.data.brand : '';
  const color = getBrandColor(brand);

  if (!fuelName) {
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

  const fuel = fuelByName(poi, fuelName);
  const hasPrice = fuel?.price != null;

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
        {hasPrice ? formatPrice(fuel.price as number) : <Fuel size={14} />}
      </div>
      <div
        className="h-2.5 w-2.5 rounded-full -mt-0.5 border-2 border-white shadow"
        style={{ backgroundColor: color }}
      />
    </button>
  );
}
