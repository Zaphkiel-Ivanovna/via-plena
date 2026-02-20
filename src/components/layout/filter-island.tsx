'use client';

import { FilterForm } from '@/components/filters/filter-form';
import { ScrollArea } from '@/components/ui/scroll-area';

export function FilterIsland() {
  return (
    <aside className="island-panel pointer-events-auto flex w-[272px] flex-col rounded-3xl overflow-hidden backdrop-blur-2xl backdrop-saturate-[180%]">
      <ScrollArea className="flex-1">
        <div className="p-5">
          <FilterForm />
        </div>
      </ScrollArea>
    </aside>
  );
}
