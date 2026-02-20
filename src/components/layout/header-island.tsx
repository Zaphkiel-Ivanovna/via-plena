'use client';

import { SearchInput } from '@/components/shared/search-input';
import { ViewToggle } from '@/components/shared/view-toggle';
import { MobileFilterDrawer } from './mobile-filter-drawer';
import { MapThemePicker } from '@/components/map/map-theme-picker';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { Fuel } from 'lucide-react';

export function HeaderIsland() {
  return (
    <header className="island-panel pointer-events-auto flex w-full max-w-3xl items-center gap-3 rounded-2xl px-4 py-2.5 backdrop-blur-2xl backdrop-saturate-[180%]">
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center justify-center size-9 rounded-xl bg-primary/10 border border-primary/20">
          <Fuel className="size-4 text-primary" />
        </div>
        <h1 className="hidden sm:block text-base font-bold tracking-tight shrink-0">
          <AnimatedShinyText shimmerWidth={150} className="text-foreground text-base font-bold">
            ViaPlena
          </AnimatedShinyText>
        </h1>
      </div>

      <div className="flex-1 min-w-0">
        <SearchInput />
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <MapThemePicker />
        <MobileFilterDrawer />
        <ViewToggle />
      </div>
    </header>
  );
}
