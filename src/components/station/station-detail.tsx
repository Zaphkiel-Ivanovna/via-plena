'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { ShineBorder } from '@/components/ui/shine-border';
import { FuelPriceBadge } from './fuel-price-badge';
import { ServicesGrid } from './services-grid';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useStationDetail } from '@/hooks/use-station-detail';
import { useIsMobile } from '@/hooks/use-media-query';
import { formatDistance, formatDate } from '@/lib/format';
import { getCheapestPrice, getGoogleMapsUrl, getWazeUrl, getAppleMapsUrl } from '@/lib/station-utils';
import { BrandIcon } from './brand-icon';
import { MapPin, Navigation, Clock } from 'lucide-react';

export function StationDetail() {
  const selectedStationId = useAppStore((s) => s.selectedStationId);
  const setSelectedStation = useAppStore((s) => s.setSelectedStation);
  const isMobile = useIsMobile();
  const { data: station } = useStationDetail(selectedStationId);

  const cheapestPrice = station ? getCheapestPrice(station) : null;

  return (
    <Sheet
      open={selectedStationId !== null}
      onOpenChange={(open) => {
        if (!open) setSelectedStation(null);
      }}
    >
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        overlayClassName="bg-transparent"
        className={cn(
          'island-panel border-0 overflow-hidden backdrop-blur-2xl backdrop-saturate-[180%]',
          isMobile
            ? 'max-h-[85vh] rounded-3xl mx-2 mb-2 inset-x-2 bottom-2'
            : 'sm:max-w-md h-auto top-3 bottom-3 right-3 rounded-3xl'
        )}
      >
        {station ? (
          <div className="flex flex-col overflow-hidden h-full">
            <SheetHeader>
              <SheetTitle className="text-xl">{station.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary border border-primary/20">
                  <BrandIcon brand={station.brand} size={12} />
                  {station.brand}
                </span>
                {station.distance !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistance(station.distance)}
                  </span>
                )}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 p-4 pt-0 overflow-y-auto flex-1">
              <div className="island-subtle flex items-start gap-2 rounded-xl p-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary/70" />
                <p className="text-sm">
                  {station.address}, {station.postalCode} {station.city}
                </p>
              </div>

              <div className="island-subtle relative space-y-3 rounded-2xl p-4 overflow-hidden">
                <ShineBorder shineColor={['#6366f1', '#8b5cf6', '#a855f7']} borderWidth={1} duration={10} />
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Prix des carburants
                </h4>
                <div className="flex flex-wrap gap-2">
                  {station.fuels.map((fuel) => (
                    <FuelPriceBadge
                      key={fuel.type}
                      fuelType={fuel.type}
                      price={fuel.price}
                      isCheapest={cheapestPrice !== null && fuel.price === cheapestPrice}
                    />
                  ))}
                </div>
                {station.fuels[0] && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    Mis a jour le {formatDate(station.fuels[0].updatedAt)}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Services</h4>
                <ServicesGrid services={station.services} />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Navigation className="size-3.5" />
                  Itinéraire
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <a href={getGoogleMapsUrl(station)} target="_blank" rel="noopener noreferrer">
                    <ShimmerButton
                      className="w-full rounded-2xl"
                      shimmerColor="#6366f1"
                      background="rgba(99, 102, 241, 0.9)"
                      borderRadius="1rem"
                    >
                      <span className="text-xs">Google Maps</span>
                    </ShimmerButton>
                  </a>
                  <a
                    href={getWazeUrl(station)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="island-interactive flex items-center justify-center rounded-2xl px-3 py-2.5 text-xs font-medium transition-all hover:bg-[var(--island-interactive-hover-bg)]"
                  >
                    Waze
                  </a>
                  <a
                    href={getAppleMapsUrl(station)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="island-interactive flex items-center justify-center rounded-2xl px-3 py-2.5 text-xs font-medium transition-all hover:bg-[var(--island-interactive-hover-bg)]"
                  >
                    Apple Plans
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <SheetHeader>
            <SheetTitle>Chargement...</SheetTitle>
            <SheetDescription />
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}
