'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { FilterForm } from '@/components/filters/filter-form';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MobileFilterDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="island-interactive flex items-center justify-center size-8 rounded-xl lg:hidden text-muted-foreground transition-all hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="size-3.5" />
        <span className="sr-only">Filtres</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Filtres</SheetTitle>
            <SheetDescription>Affinez votre recherche</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-full">
            <div className="p-4">
              <FilterForm />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
