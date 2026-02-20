'use client';

import { FilterForm } from '@/components/filters/filter-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';

export function FilterSidebar() {
  return (
    <aside className="relative hidden lg:block w-[280px] shrink-0 border-r border-border/50 overflow-hidden">
      <AnimatedGridPattern
        numSquares={15}
        maxOpacity={0.08}
        duration={5}
        className="inset-0 [mask-image:linear-gradient(to_bottom,white_20%,transparent_90%)]"
      />
      <ScrollArea className="relative h-full z-10">
        <div className="p-4">
          <FilterForm />
        </div>
      </ScrollArea>
    </aside>
  );
}
