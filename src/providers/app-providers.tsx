'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { SearchCommand } from '@/components/shared/search-command';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <TooltipProvider>
        {children}
        <SearchCommand />
        <Toaster />
      </TooltipProvider>
    </QueryProvider>
  );
}
