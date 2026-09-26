import type { Metadata } from 'next';
import Link from 'next/link';
import { getCoverageStats } from '@/api/generated/stats/stats';
import { HomeView } from '@/components/home/home-view';
import { SiteFooter } from '@/components/layout/site-footer';
import { FUEL_NAMES_ORDER, fuelFullName, fuelLabel } from '@/lib/constants';
import { formatPriceValue } from '@/lib/poi-details';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: `${SITE_TAGLINE} | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
};

async function loadStats() {
  try {
    const res = await getCoverageStats({ next: { revalidate } });
    return res.status === 200 ? res.data : null;
  } catch {
    return null;
  }
}

const count = new Intl.NumberFormat('fr-FR');

export default async function HomePage() {
  const stats = await loadStats();
  const fuels = stats
    ? FUEL_NAMES_ORDER.map((name) => stats.topGasFuels.find((f) => f.fuel === name)).filter(
        (f): f is NonNullable<typeof f> & { avgPrice: number } => f?.avgPrice != null,
      )
    : [];

  return (
    <>
      <HomeView />

      <section aria-labelledby="home-title" className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <h1 id="home-title" className="max-w-3xl text-3xl leading-tight font-semibold tracking-tight text-balance md:text-4xl">
            Prix des carburants et bornes de recharge, en temps réel
          </h1>
          <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
            {SITE_NAME} compare les prix déclarés par{' '}
            {stats ? `${count.format(stats.totals.gasStations)} stations-service` : 'les stations-service'} et affiche la
            disponibilité de {stats ? `${count.format(stats.totals.evStations)} bornes de recharge` : 'milliers de bornes de recharge'}{' '}
            en France : libre, occupée ou hors service. Les données viennent des sources officielles et sont mises à jour en
            continu.
          </p>

          {fuels.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold">Prix moyens en France</h2>
              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {fuels.map((f) => (
                  <div key={f.fuel} className="rounded-2xl border border-[var(--island-subtle-border)] bg-[var(--island-subtle-bg)] p-4">
                    <dt className="text-sm text-muted-foreground" title={fuelFullName(f.fuel)}>
                      {fuelLabel(f.fuel)} <span className="sr-only">({fuelFullName(f.fuel)})</span>
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums">
                      {formatPriceValue(f.avgPrice)}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">€/L</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-sm text-muted-foreground">
                Moyenne des prix relevés dans les stations qui vendent chaque carburant.{' '}
                <Link href="/stats" className="font-medium text-foreground underline underline-offset-4">
                  Voir toutes les statistiques
                </Link>
              </p>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
