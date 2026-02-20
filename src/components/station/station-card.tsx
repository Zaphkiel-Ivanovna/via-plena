'use client';

import { Badge } from '@/components/ui/badge';
import { FuelPriceBadge } from './fuel-price-badge';
import { useAppStore } from '@/stores/app-store';
import { formatDistance } from '@/lib/format';
import { BlurFade } from '@/components/magicui/blur-fade';
import { MagicCard } from '@/components/ui/magic-card';
import { MapPin, ChevronRight } from 'lucide-react';
import type { GasStation } from '@/types/station';

interface StationCardProps {
  station: GasStation;
  delay?: number;
}

export function StationCard({ station, delay = 0 }: StationCardProps) {
  const setSelectedStation = useAppStore((s) => s.setSelectedStation);

  const cheapestPrice = station.fuels.length > 0
    ? Math.min(...station.fuels.map((f) => f.price))
    : null;

  return (
    <BlurFade delay={delay}>
      <MagicCard
        className="cursor-pointer rounded-2xl"
        gradientColor="#1a1a2e"
        gradientFrom="#6366f1"
        gradientTo="#8b5cf6"
        gradientOpacity={0.12}
      >
        <div
          className="p-4 space-y-3"
          onClick={() => setSelectedStation(station.id)}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold truncate">{station.brand}</h3>
                <ChevronRight className="size-3.5 text-muted-foreground/50 shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground truncate">{station.name}</p>
            </div>
            {station.distance !== undefined && (
              <Badge variant="outline" className="shrink-0 ml-2 rounded-lg border-primary/20 bg-primary/5 text-primary text-[10px]">
                {formatDistance(station.distance)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{station.address}, {station.postalCode} {station.city}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {station.fuels.map((fuel) => (
              <FuelPriceBadge
                key={fuel.type}
                fuelType={fuel.type}
                price={fuel.price}
                isCheapest={cheapestPrice !== null && fuel.price === cheapestPrice}
              />
            ))}
          </div>
        </div>
      </MagicCard>
    </BlurFade>
  );
}
