'use client';

import { SearchInput } from '@/components/shared/search-input';
import { ViewToggle } from '@/components/shared/view-toggle';
import { MobileFilterDrawer } from './mobile-filter-drawer';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { Fuel } from 'lucide-react';

export function Header() {
  return (
    <header className="relative flex h-14 items-center justify-between gap-4 border-b border-border/50 bg-background/80 backdrop-blur-md px-4">
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
          <Fuel className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-bold tracking-tight shrink-0">
          <AnimatedShinyText shimmerWidth={150} className="text-foreground text-lg font-bold">
            ViaPlena
          </AnimatedShinyText>
        </h1>
      </div>
      <SearchInput />
      <div className="flex items-center gap-2 shrink-0">
        <MobileFilterDrawer />
        <ViewToggle />
      </div>
    </header>
  );
}
