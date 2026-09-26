import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getCoverageStats } from '@/api/generated/stats/stats';
import type { GetCoverageStats200 } from '@/api/generated/models';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { ThemeSync } from '@/components/shared/theme-sync';
import { FUEL_NAMES_ORDER, fuelFullName, fuelLabel } from '@/lib/constants';
import { formatPriceValue } from '@/lib/poi-details';
import { DATA_SOURCES, SITE_URL } from '@/lib/site';

export const revalidate = 3600;

const PAGE_URL = `${SITE_URL}/stats`;
const count = new Intl.NumberFormat('fr-FR');

async function loadStats(): Promise<GetCoverageStats200 | null> {
  try {
    const res = await getCoverageStats({ next: { revalidate } });
    return res.status === 200 ? res.data : null;
  } catch {
    return null;
  }
}

const orderedFuels = (stats: GetCoverageStats200) =>
  FUEL_NAMES_ORDER.map((name) => stats.topGasFuels.find((f) => f.fuel === name)).filter(
    (f): f is NonNullable<typeof f> & { avgPrice: number } => f?.avgPrice != null,
  );

export async function generateMetadata(): Promise<Metadata> {
  const stats = await loadStats();
  const gazole = stats?.topGasFuels.find((f) => f.fuel === 'Gazole')?.avgPrice;
  const title = gazole
    ? `Prix moyen du gazole aujourd'hui en France : ${formatPriceValue(gazole)} €/L`
    : 'Prix moyens des carburants et bornes de recharge en France';
  return {
    title: { absolute: title },
    description:
      "Prix moyens nationaux du gazole, du SP95-E10, du SP98, de l'E85 et du GPLc, nombre de stations-service et de bornes de recharge par région, principaux opérateurs.",
    alternates: { canonical: PAGE_URL },
  };
}

function datasetJsonLd(stats: GetCoverageStats200) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${PAGE_URL}#dataset`,
    name: 'Prix moyens des carburants et couverture des bornes de recharge en France',
    description:
      'Prix moyens nationaux par carburant et nombre de stations-service et de bornes de recharge par région, calculés à partir des données officielles.',
    url: PAGE_URL,
    inLanguage: 'fr-FR',
    isAccessibleForFree: true,
    creator: { '@id': `${SITE_URL}/#organization` },
    spatialCoverage: { '@type': 'Country', name: 'France' },
    isBasedOn: [DATA_SOURCES.fuel.url, DATA_SOURCES.irve.url],
    variableMeasured: orderedFuels(stats).map((f) => ({
      '@type': 'PropertyValue',
      name: `Prix moyen ${fuelFullName(f.fuel)}`,
      unitText: 'EUR/L',
      value: Number(f.avgPrice.toFixed(3)),
    })),
  };
}

const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });

export default async function StatsPage() {
  const stats = await loadStats();
  const fuels = stats ? orderedFuels(stats) : [];
  const regions = stats ? [...stats.byRegion].sort((a, b) => b.gasStations + b.evStations - (a.gasStations + a.evStations)) : [];

  return (
    <div className="min-h-[100dvh] bg-background">
      <ThemeSync />
      {stats && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(datasetJsonLd(stats))} />}
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-16 md:px-6 md:pt-10">
        <nav aria-label="Fil d'Ariane" className="mb-5 text-xs text-muted-foreground">
          <ol className="flex items-center gap-1">
            <li>
              <Link href="/" className="hover:text-foreground">
                Accueil
              </Link>
            </li>
            <ChevronRight className="size-3" aria-hidden />
            <li aria-current="page" className="text-foreground/80">
              Statistiques
            </li>
          </ol>
        </nav>

        <h1 className="text-2xl leading-tight font-semibold tracking-tight text-balance md:text-4xl">
          Prix moyens des carburants et bornes de recharge en France
        </h1>

        {!stats ? (
          <p className="mt-6 rounded-2xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
            Les statistiques ne sont pas disponibles pour le moment. Réessayez dans quelques minutes.
          </p>
        ) : (
          <>
            <p className="mt-5 max-w-[70ch] text-base leading-relaxed">
              ViaPlena suit {count.format(stats.totals.gasStations)} stations-service et{' '}
              {count.format(stats.totals.evStations)} stations de recharge dans {count.format(stats.totals.communes)} communes.
              {fuels[0] &&
                ` En moyenne, le ${fuelFullName(fuels[0].fuel).toLowerCase()} coûte ${formatPriceValue(fuels[0].avgPrice)} €/L dans les ${count.format(fuels[0].stations)} stations qui le vendent.`}
            </p>

            <section aria-labelledby="avg-prices" className="mt-10">
              <h2 id="avg-prices" className="text-lg font-semibold">
                Prix moyen par carburant
              </h2>
              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {fuels.map((f) => (
                  <div key={f.fuel} className="rounded-2xl border border-[var(--island-subtle-border)] bg-[var(--island-subtle-bg)] p-4">
                    <dt className="text-sm text-muted-foreground">
                      {fuelLabel(f.fuel)} <span className="block text-xs">{fuelFullName(f.fuel)}</span>
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums">
                      {formatPriceValue(f.avgPrice)}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">€/L</span>
                    </dd>
                    <dd className="text-xs text-muted-foreground">{count.format(f.stations)} stations</dd>
                  </div>
                ))}
              </dl>
            </section>

            <div className="mt-10 grid gap-8 lg:grid-cols-[3fr_2fr]">
              <section aria-labelledby="by-region">
                <h2 id="by-region" className="text-lg font-semibold">
                  Stations et bornes par région
                </h2>
                <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--island-subtle-border)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--island-subtle-bg)] text-left text-xs text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 font-medium">Région</th>
                        <th scope="col" className="px-4 py-2.5 text-right font-medium">Stations-service</th>
                        <th scope="col" className="px-4 py-2.5 text-right font-medium">Bornes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--island-separator-bg)]">
                      {regions.map((r) => (
                        <tr key={r.region}>
                          <th scope="row" className="px-4 py-2.5 text-left font-normal">{r.region}</th>
                          <td className="px-4 py-2.5 text-right tabular-nums">{count.format(r.gasStations)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{count.format(r.evStations)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section aria-labelledby="operators">
                <h2 id="operators" className="text-lg font-semibold">
                  Principaux opérateurs de recharge
                </h2>
                <ol className="mt-4 divide-y divide-[var(--island-separator-bg)] rounded-2xl border border-[var(--island-subtle-border)]">
                  {stats.topEvOperators.map((op) => (
                    <li key={op.operator} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                      <span className="truncate">{op.operator}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{count.format(op.stations)}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
              Sources :{' '}
              <a href={DATA_SOURCES.fuel.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {DATA_SOURCES.fuel.name}
              </a>{' '}
              et{' '}
              <a href={DATA_SOURCES.irve.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                fichier national IRVE
              </a>
              . Moyennes calculées sur les derniers prix publiés par chaque station.{' '}
              <Link href="/methodologie" className="underline underline-offset-2">
                Méthodologie
              </Link>
            </p>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
