'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { BorderBeam } from '@/components/ui/border-beam';
import { ShineBorder } from '@/components/ui/shine-border';
import { FuelPriceBadge } from './fuel-price-badge';
import { ServicesGrid } from './services-grid';
import { useAppStore } from '@/stores/app-store';
import { useStationDetail } from '@/hooks/use-station-detail';
import { useIsMobile } from '@/hooks/use-media-query';
import { formatDistance, formatDate } from '@/lib/format';
import { MapPin, Navigation, Clock } from 'lucide-react';

export function StationDetail() {
  const selectedStationId = useAppStore((s) => s.selectedStationId);
  const setSelectedStation = useAppStore((s) => s.setSelectedStation);
  const isMobile = useIsMobile();
  const { data: station } = useStationDetail(selectedStationId);

  const cheapestPrice = station?.fuels.length
    ? Math.min(...station.fuels.map((f) => f.price))
    : null;

  const mapUrl = station
    ? `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`
    : '';

  return (
    <Sheet
      open={selectedStationId !== null}
      onOpenChange={(open) => {
        if (!open) setSelectedStation(null);
      }}
    >
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={
          isMobile
            ? 'max-h-[85vh] rounded-t-3xl bg-background/90 backdrop-blur-xl'
            : 'sm:max-w-md overflow-y-auto rounded-l-3xl bg-background/90 backdrop-blur-xl'
        }
      >
        {station ? (
          <>
            <SheetHeader>
              <SheetTitle className="text-xl">{station.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary border border-primary/20">
                  {station.brand}
                </span>
                {station.distance !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistance(station.distance)}
                  </span>
                )}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 p-4 pt-0 overflow-y-auto">
              <div className="island-subtle flex items-start gap-2 rounded-xl p-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary/70" />
                <p className="text-sm">
                  {station.address}, {station.postalCode} {station.city}
                </p>
              </div>

              <div className="island-subtle relative space-y-3 rounded-2xl p-4">
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

              <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                <ShimmerButton
                  className="w-full rounded-2xl"
                  shimmerColor="#6366f1"
                  background="rgba(99, 102, 241, 0.9)"
                  borderRadius="1rem"
                >
                  <Navigation className="size-4 mr-2" />
                  Itineraire
                </ShimmerButton>
              </a>
            </div>
          </>
        ) : (
          <SheetHeader>
            <SheetTitle>Chargement...</SheetTitle>
            <SheetDescription />
          </SheetHeader>
        )}

        <BorderBeam
          size={120}
          duration={8}
          colorFrom="#6366f1"
          colorTo="#a855f7"
          borderWidth={1.5}
        />
      </SheetContent>
    </Sheet>
  );
}
