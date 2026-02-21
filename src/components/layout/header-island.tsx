'use client';

import { SearchInput } from '@/components/shared/search-input';
import { ViewToggle } from '@/components/shared/view-toggle';
import { MobileFilterDrawer } from './mobile-filter-drawer';
import { MapThemePicker } from '@/components/map/map-theme-picker';
import { Logo } from '@/components/shared/logo';

export function HeaderIsland() {
  return (
    <header className="island-panel pointer-events-auto flex w-full max-w-3xl items-center gap-3 rounded-2xl px-4 py-2.5 backdrop-blur-2xl backdrop-saturate-[180%]">
      <Logo className="hidden sm:block h-5 w-auto shrink-0" />

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
