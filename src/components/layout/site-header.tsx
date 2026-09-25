import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--island-separator-bg)] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Button asChild variant="ghost" className="-ml-2 rounded-xl text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="size-4" aria-hidden />
            Carte
          </Link>
        </Button>
        <Link href="/" aria-label="ViaPlena, retour à l'accueil">
          <Logo className="h-5 w-auto text-foreground" />
        </Link>
      </div>
    </header>
  );
}
