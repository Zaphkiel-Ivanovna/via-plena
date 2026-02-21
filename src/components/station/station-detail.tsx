'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useStationDetail } from '@/hooks/use-station-detail';
import { useIsMobile } from '@/hooks/use-media-query';
import { formatDistance, formatPrice, formatDate } from '@/lib/format';
import { getCheapestPrice, getGoogleMapsUrl, getWazeUrl, getAppleMapsUrl } from '@/lib/station-utils';
import { FUEL_LABELS, SERVICE_LABELS, SERVICE_ICONS } from '@/lib/constants';
import { BrandIcon } from './brand-icon';
import { MapPin, Navigation, Clock, Share2 } from 'lucide-react';
import { SiGooglemaps, SiWaze, SiApple } from '@icons-pack/react-simple-icons';

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
      modal={false}
    >
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        overlayClassName="bg-transparent pointer-events-none"
        onInteractOutside={(e) => e.preventDefault()}
        className={cn(
          'border-0 overflow-hidden p-0',
          isMobile
            ? 'max-h-[85vh] rounded-3xl mx-2 mb-2 inset-x-2 bottom-2'
            : 'sm:max-w-md h-auto top-3 bottom-3 right-3 rounded-3xl'
        )}
      >
        {station ? (
          <div className="flex flex-col overflow-hidden h-full rounded-3xl border border-border/50 bg-background/70 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/30 dark:border-white/[0.08]">
                        <div className="p-6 pb-4 space-y-3">
              <SheetHeader className="p-0 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-xl font-bold">{station.name}</SheetTitle>
                    <SheetDescription asChild>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary border border-primary/20">
                          <BrandIcon brand={station.brand} size={12} />
                          {station.brand}
                        </span>
                        {station.distance !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistance(station.distance)}
                          </span>
                        )}
                      </div>
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="flex items-start gap-2 rounded-xl bg-muted/50 border border-border/50 p-3 shadow-sm dark:shadow-none dark:bg-white/[0.04] dark:border-white/[0.06]">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary/70" />
                <p className="text-sm">{station.address}, {station.postalCode} {station.city}</p>
              </div>
            </div>

            <div className="h-px bg-border/50 dark:bg-white/[0.06]" />

                        <div className="overflow-y-auto flex-1">
                            <div className="p-6 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <span className="inline-block size-2 rounded-full bg-emerald-500" />
                  Prix des carburants
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {station.fuels.map((fuel) => (
                    <div
                      key={fuel.type}
                      className={cn(
                        'flex items-center justify-between rounded-xl border p-3.5 transition-colors',
                        cheapestPrice !== null && fuel.price === cheapestPrice
                          ? 'border-emerald-500/30 bg-emerald-500/10 shadow-sm shadow-emerald-500/10'
                          : 'border-border/50 bg-muted/30 shadow-sm dark:shadow-none dark:border-white/[0.06] dark:bg-white/[0.03]'
                      )}
                    >
                      <span className="text-sm font-medium">{FUEL_LABELS[fuel.type]}</span>
                      <span className="font-semibold tabular-nums">{formatPrice(fuel.price)}</span>
                    </div>
                  ))}
                </div>
                {station.fuels[0] && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    Mis à jour le {formatDate(station.fuels[0].updatedAt)}
                  </p>
                )}
              </div>

              <div className="h-px bg-border/50 dark:bg-white/[0.06]" />

                            <div className="p-6 space-y-3">
                <h4 className="text-sm font-semibold">Services</h4>
                {station.services.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {station.services.map((service) => (
                      <div
                        key={service}
                        className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 p-2.5 text-sm shadow-sm dark:shadow-none dark:border-white/[0.06] dark:bg-white/[0.03]"
                      >
                        <span className="text-base">{SERVICE_ICONS[service]}</span>
                        <span className="text-xs text-muted-foreground">{SERVICE_LABELS[service]}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun service disponible</p>
                )}
              </div>

              <div className="h-px bg-border/50 dark:bg-white/[0.06]" />

                            <div className="p-6 space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Navigation className="size-3.5" />
                  Itinéraire
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={getGoogleMapsUrl(station)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-primary px-3 py-3 text-xs font-medium text-primary-foreground shadow-md shadow-primary/25 transition-all hover:opacity-90"
                  >
                    <SiGooglemaps size={14} />
                    Maps
                  </a>
                  <a
                    href={getWazeUrl(station)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-2xl border border-border/50 bg-muted/30 px-3 py-3 text-xs font-medium shadow-sm transition-all hover:bg-muted/50 dark:shadow-none dark:border-white/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
                  >
                    <SiWaze size={14} />
                    Waze
                  </a>
                  <a
                    href={getAppleMapsUrl(station)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-2xl border border-border/50 bg-muted/30 px-3 py-3 text-xs font-medium shadow-sm transition-all hover:bg-muted/50 dark:shadow-none dark:border-white/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
                  >
                    <SiApple size={14} />
                    Plans
                  </a>
                </div>
              </div>

              <div className="h-px bg-border/50 dark:bg-white/[0.06]" />

                            <div className="p-6">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/station/${station.id}`;
                    if (navigator.share) {
                      navigator.share({ title: station.name, url });
                    } else {
                      navigator.clipboard.writeText(url);
                    }
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/50 bg-muted/30 px-4 py-3 text-sm font-medium shadow-sm transition-all hover:bg-muted/50 dark:shadow-none dark:border-white/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
                >
                  <Share2 className="size-4" />
                  Partager cette station
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-border/50 bg-background/70 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/30 dark:border-white/[0.08] p-6">
            <SheetHeader>
              <SheetTitle>Chargement...</SheetTitle>
              <SheetDescription />
            </SheetHeader>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
