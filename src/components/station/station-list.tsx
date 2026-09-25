'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { StationCard } from './station-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Fuel } from 'lucide-react';
import { BlurFade } from '@/components/magicui/blur-fade';
import { NumberTicker } from '@/components/magicui/number-ticker';
import type { Poi } from '@/lib/poi';

interface StationListProps {
  pois: Poi[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function StationList({ pois, isLoading, onLoadMore, hasMore }: StationListProps) {
  if (isLoading && pois.length === 0) {
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

  if (pois.length === 0) {
    return <EmptyState />;
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-1">
        <BlurFade delay={0}>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                <NumberTicker value={pois.length} />
              </span>{' '}
              stations trouvées
            </p>
          </div>
        </BlurFade>
        <div className="flex flex-col gap-2.5">
          {pois.map((poi, index) => (
            <StationCard key={poi.id} poi={poi} delay={Math.min(index * 0.04, 0.5)} />
          ))}
        </div>
        {hasMore && (
          <button
            onClick={onLoadMore}
            className="mt-3 w-full rounded-2xl border border-border/50 bg-muted/30 px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            Charger plus
          </button>
        )}
      </div>
    </ScrollArea>
  );
}
