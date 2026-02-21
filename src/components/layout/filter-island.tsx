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
      <div className="border-t border-border/50 px-5 py-3 text-center text-[11px] text-muted-foreground/60">
        Made with ❤️ by{' '}
        <a
          href="https://github.com/Zaphkiel-Ivanovna"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 transition-colors hover:text-muted-foreground"
        >
          Zaphkiel
        </a>
      </div>
    </aside>
  );
}
