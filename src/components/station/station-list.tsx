'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { StationCard } from './station-card';
import { EmptyState } from '@/components/shared/empty-state';
import { useStations } from '@/hooks/use-stations';
import { Fuel } from 'lucide-react';
import { BlurFade } from '@/components/magicui/blur-fade';
import { NumberTicker } from '@/components/magicui/number-ticker';

export function StationList() {
  const { data: stations, isLoading } = useStations();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative flex items-center justify-center size-12 rounded-full bg-primary/10 border border-primary/20">
            <Fuel className="size-5 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Recherche des stations...</p>
      </div>
    );
  }

  if (!stations || stations.length === 0) {
    return <EmptyState />;
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-1">
        <BlurFade delay={0}>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                <NumberTicker value={stations.length} />
              </span>{' '}
              stations trouvees
            </p>
          </div>
        </BlurFade>
        <div className="flex flex-col gap-2.5">
          {stations.map((station, index) => (
            <StationCard
              key={station.id}
              station={station}
              delay={index * 0.04}
            />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
