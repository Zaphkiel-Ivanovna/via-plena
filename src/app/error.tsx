'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Un problème est survenu</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        La page n&apos;a pas pu se charger. Réessayez dans un instant ; si le problème continue, revenez à l&apos;accueil.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset} className="rounded-xl">
          <RotateCcw className="size-4" aria-hidden />
          Réessayer
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/">Accueil</Link>
        </Button>
      </div>
    </main>
  );
}
