'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { FuelPriceBadge } from './fuel-price-badge';
import { useAppStore } from '@/stores/app-store';
import { formatDistanceMeters } from '@/lib/format';
import {
  cheapestGasPrice,
  distanceMeters,
  evChargingPointCount,
  gasFuels,
  isEv,
  isGas,
  type Poi,
} from '@/lib/poi';
import { BlurFade } from '@/components/magicui/blur-fade';
import { MagicCard } from '@/components/ui/magic-card';
import { BrandIcon } from './brand-icon';
import { REALTIME_STALE_HOURS, formatPoiAddress } from '@/lib/poi-details';
import { MapPin, ChevronRight, Zap } from 'lucide-react';

interface StationCardProps {
  poi: Poi;
  delay?: number;
}

export function StationCard({ poi, delay = 0 }: StationCardProps) {
  const setSelectedPoi = useAppStore((s) => s.setSelectedPoi);
  const distance = distanceMeters(poi);
  const cheapest = cheapestGasPrice(poi);

  const ev = isEv(poi);
  const brand = isEv(poi)
    ? poi.data.brandName || poi.data.operatorName
    : isGas(poi)
      ? poi.data.brand
      : '';

  return (
    <BlurFade delay={delay}>
      <MagicCard
        className="cursor-pointer rounded-2xl"
        gradientColor="#1a1a2e"
        gradientFrom={ev ? '#10b981' : '#6366f1'}
        gradientTo={ev ? '#34d399' : '#8b5cf6'}
        gradientOpacity={0.12}
      >
        <Link
          href={`/station/${poi.id}`}
          className="block space-y-3 rounded-2xl p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            setSelectedPoi(poi.id);
          }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {ev ? (
                  <Zap className="size-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <BrandIcon brand={brand} size={14} className="shrink-0" />
                )}
                <h3 className="text-sm font-semibold truncate">{brand || poi.name}</h3>
                <ChevronRight className="size-3.5 text-muted-foreground/50 shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {isEv(poi) ? poi.data.stationName : poi.name}
              </p>
            </div>
            {distance != null && (
              <Badge
                variant="outline"
                className="shrink-0 ml-2 rounded-lg border-primary/20 bg-primary/5 text-primary text-[10px]"
              >
                {formatDistanceMeters(distance)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">
              {formatPoiAddress(poi)}
            </span>
          </div>
          {ev ? (
            <EvAvailabilityLine poi={poi} />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {gasFuels(poi)
                .filter((f) => f.price != null)
                .map((f) => (
                  <FuelPriceBadge
                    key={f.name}
                    fuelName={f.name}
                    price={f.price as number}
                    isCheapest={cheapest != null && f.price === cheapest}
                  />
                ))}
            </div>
          )}
        </Link>
      </MagicCard>
    </BlurFade>
  );
}

function EvAvailabilityLine({ poi }: { poi: Poi }) {
  const count = evChargingPointCount(poi);
  const availability = isEv(poi) ? poi.data.availability : null;
  const total = Number(availability?.total ?? 0);
  const available = Number(availability?.available ?? 0);
  const known = total - Number(availability?.unknown ?? total);
  const lastObservedAt = availability?.lastObservedAt ? Date.parse(availability.lastObservedAt) : NaN;
  // eslint-disable-next-line react-hooks/purity
  const stale = Number.isFinite(lastObservedAt) && Date.now() - lastObservedAt > REALTIME_STALE_HOURS * 3_600_000;

  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>
        {count} borne{count > 1 ? 's' : ''}
      </span>
      {known > 0 && stale && (
        <span className="font-medium text-amber-600 dark:text-amber-400">Disponibilité non vérifiée</span>
      )}
      {known > 0 && !stale && (
        <span
          className={
            available > 0
              ? 'font-medium text-emerald-600 dark:text-emerald-400'
              : 'font-medium text-amber-600 dark:text-amber-400'
          }
        >
          {available > 0 ? `${available} disponible${available > 1 ? 's' : ''}` : 'Aucune disponible'}
        </span>
      )}
    </p>
  );
}
