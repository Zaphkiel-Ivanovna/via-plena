'use client';

import type { GasStation } from '@/types/station';
import { formatPrice } from '@/lib/format';

const BRAND_COLORS: Record<string, string> = {
  TotalEnergies: '#FF0000',
  Shell: '#FFB800',
  BP: '#009900',
  Carrefour: '#004B93',
  Leclerc: '#0066CC',
  Intermarche: '#FF3333',
  Auchan: '#E30613',
  Esso: '#003DA5',
};

function getCheapestPrice(station: GasStation): number | null {
  if (station.fuels.length === 0) return null;
  return Math.min(...station.fuels.map((f) => f.price));
}

interface StationMarkerProps {
  station: GasStation;
  isSelected?: boolean;
  onClick?: () => void;
}

export function StationMarker({ station, isSelected, onClick }: StationMarkerProps) {
  const cheapest = getCheapestPrice(station);
  const color = BRAND_COLORS[station.brand] ?? '#6B7280';

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center"
      style={{ transform: isSelected ? 'scale(1.2)' : 'scale(1)', transition: 'transform 150ms' }}
    >
      <div
        className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {cheapest !== null ? formatPrice(cheapest) : '---'}
      </div>
      <div
        className="h-2 w-2 rounded-full -mt-0.5 border border-white shadow"
        style={{ backgroundColor: color }}
      />
    </button>
  );
}
