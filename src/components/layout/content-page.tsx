import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';
import { ThemeSync } from '@/components/shared/theme-sync';

export function ContentPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated: string;
  children: ReactNode;
}) {
  const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date(updated));
  return (
    <div className="min-h-[100dvh] bg-background">
      <ThemeSync />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pt-6 pb-16 md:px-6 md:pt-10">
        <nav aria-label="Fil d'Ariane" className="mb-5 text-xs text-muted-foreground">
          <ol className="flex items-center gap-1">
            <li>
              <Link href="/" className="hover:text-foreground">
                Accueil
              </Link>
            </li>
            <ChevronRight className="size-3" aria-hidden />
            <li aria-current="page" className="text-foreground/80">
              {title}
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl leading-tight font-semibold tracking-tight text-balance md:text-4xl">{title}</h1>
        {intro && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{intro}</p>}
        <p className="mt-2 text-xs text-muted-foreground">
          Mis à jour le <time dateTime={updated}>{date}</time>
        </p>
        <div className="mt-8 space-y-8 text-[15px] leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_section>*+*]:mt-3">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
