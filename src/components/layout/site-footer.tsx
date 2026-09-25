import Link from 'next/link';
import { TOP_CITIES } from '@/lib/cities';
import { DATA_SOURCES, SITE_NAME } from '@/lib/site';
import { cn } from '@/lib/utils';

const INFO_LINKS = [
  { href: '/stats', label: 'Prix moyens et statistiques' },
  { href: '/methodologie', label: 'Méthodologie et sources' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/confidentialite', label: 'Confidentialité' },
];

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('border-t border-[var(--island-separator-bg)] bg-background', className)}>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[2fr_1fr] md:px-6">
        <nav aria-labelledby="footer-cities">
          <h2 id="footer-cities" className="text-sm font-semibold">
            Carburant et bornes par ville
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
            {TOP_CITIES.map((c) => (
              <li key={c.insee}>
                <Link href={`/prix-carburant/${c.slug}`} className="text-muted-foreground hover:text-foreground">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-labelledby="footer-info">
          <h2 id="footer-info" className="text-sm font-semibold">
            {SITE_NAME}
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {INFO_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted-foreground hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-8 text-xs leading-relaxed text-muted-foreground md:px-6">
        Prix issus de{' '}
        <a href={DATA_SOURCES.fuel.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {DATA_SOURCES.fuel.name}
        </a>{' '}
        et bornes du{' '}
        <a href={DATA_SOURCES.irve.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          fichier national IRVE
        </a>
        . {SITE_NAME} est un service gratuit et indépendant, sans lien avec les enseignes ni les opérateurs.
      </p>
    </footer>
  );
}
