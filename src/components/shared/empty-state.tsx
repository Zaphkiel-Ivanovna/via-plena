'use client';

import { SearchX } from 'lucide-react';
import { BlurFade } from '@/components/magicui/blur-fade';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({
  title = 'Aucune station trouvee',
  message = 'Essayez d\'elargir votre rayon de recherche ou de modifier vos filtres.',
}: EmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
      <BlurFade delay={0.1}>
        <div className="relative flex items-center justify-center size-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-2">
          <SearchX className="size-8 text-muted-foreground" />
        </div>
      </BlurFade>
      <BlurFade delay={0.2}>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">{message}</p>
        </div>
      </BlurFade>
    </div>
  );
}
