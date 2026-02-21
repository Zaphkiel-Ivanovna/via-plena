'use client';

import { SearchInput } from '@/components/shared/search-input';
import { ViewToggle } from '@/components/shared/view-toggle';
import { MobileFilterDrawer } from './mobile-filter-drawer';
import { Logo } from '@/components/shared/logo';

export function Header() {
  return (
    <header className="relative flex h-14 items-center justify-between gap-4 border-b border-border/50 bg-background/80 backdrop-blur-md px-4">
      <Logo className="h-6 w-auto shrink-0" />
      <SearchInput />
      <div className="flex items-center gap-2 shrink-0">
        <MobileFilterDrawer />
        <ViewToggle />
      </div>
    </header>
  );
}
