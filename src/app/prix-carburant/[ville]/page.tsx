import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Zap } from 'lucide-react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { ThemeSync } from '@/components/shared/theme-sync';
import { BrandIcon } from '@/components/station/brand-icon';
import { communePath, inCity, loadCommuneBySlug, ofCity, type CommuneData } from '@/lib/commune-data';
import { fuelFullName, fuelLabel, fuelSearchName } from '@/lib/constants';
import { isEv, isGas, type Poi } from '@/lib/poi';
import { chargingPoints, formatPoiAddress, formatPower, formatPriceValue } from '@/lib/poi-details';
import { SITE_URL } from '@/lib/site';

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

interface CommunePageProps {
  params: Promise<{ ville: string }>;
}

const VISIBLE_ROWS = 30;
const count = new Intl.NumberFormat('fr-FR');
const plural = (n: number, one: string, many: string) => `${count.format(n)} ${n > 1 ? many : one}`;

const poiName = (p: Poi) => p.name.split(' | ').slice(-1)[0];

function evExtras(fast: number, free: number): string {
  const parts = [
    fast ? `${plural(fast, 'station rapide', 'stations rapides')} (50 kW et plus)` : null,
    free ? `${plural(free, 'station gratuite', 'stations gratuites')}` : null,
  ].filter(Boolean);
  return parts.length ? `, dont ${parts.join(' et ')}` : '';
}

export async function generateMetadata({ params }: CommunePageProps): Promise<Metadata> {
  const { ville } = await params;
  const data = await loadCommuneBySlug(ville);
  if (!data) return { title: 'Commune introuvable', robots: { index: false } };

  const { commune, gas, ev, fuels, availability } = data;
  const gazole = fuels.find((f) => f.fuel === 'Gazole');
  const lead = gazole ?? fuels[0];
  const title = lead
    ? `Carburant et bornes ${commune.name} : ${fuelSearchName(lead.fuel).toLowerCase()} dès ${formatPriceValue(lead.min)} €`
    : `Bornes de recharge ${inCity(commune.name)} (${commune.departmentCode})`;
  const parts = [
    gas.length ? plural(gas.length, 'station-service', 'stations-service') : null,
    ev.length ? plural(ev.length, 'borne de recharge', 'bornes de recharge') : null,
  ].filter(Boolean);
  const prices = fuels
    .slice(0, 3)
    .map((f) => `${fuelSearchName(f.fuel)} dès ${formatPriceValue(f.min)} €`)
    .join(', ');
  const live = availability.available > 0 ? ` ${plural(availability.available, 'point de charge libre', 'points de charge libres')} en ce moment.` : '';
  const description = `${parts.join(' et ')} ${inCity(commune.name)} (${commune.postalCode}).${prices ? ` ${prices}.` : ''}${live} Prix officiels mis à jour en continu.`;
  const url = `${SITE_URL}${communePath(commune.slug)}`;

  return {
    title: { absolute: `${title} | ViaPlena`.length <= 60 ? `${title} | ViaPlena` : title },
    description,
    alternates: { canonical: url },
    robots: data.indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { type: 'website', url, title, description, siteName: 'ViaPlena', locale: 'fr_FR' },
  };
}

function communeJsonLd({ commune, gas, ev }: CommuneData) {
  const url = `${SITE_URL}${communePath(commune.slug)}`;
  const stations = [...gas, ...ev];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        url,
        name: `Stations-service et bornes de recharge ${inCity(commune.name)}`,
        inLanguage: 'fr-FR',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: {
          '@type': 'City',
          name: commune.name,
          address: {
            '@type': 'PostalAddress',
            addressLocality: commune.name,
            postalCode: commune.postalCode,
            addressRegion: commune.regionName,
            addressCountry: 'FR',
          },
        },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: stations.length,
          itemListElement: stations.slice(0, 100).map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_URL}/station/${p.id}`,
            name: poiName(p),
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: commune.name, item: url },
        ],
      },
    ],
  };
}

const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });

export default async function CommunePage({ params }: CommunePageProps) {
  const { ville } = await params;
  const data = await loadCommuneBySlug(ville);
  if (!data) notFound();

  const { commune, gas, ev, fuels, evPoints, evFast, evFree, availability } = data;
  const gazole = fuels.find((f) => f.fuel === 'Gazole');
  const sortedGas = [...gas].sort((a, b) => leadPrice(a) - leadPrice(b));

  return (
    <div className="min-h-[100dvh] bg-background">
      <ThemeSync />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(communeJsonLd(data))} />
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-16 md:px-6 md:pt-10">
        <nav aria-label="Fil d'Ariane" className="mb-5 text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-foreground">
                Accueil
              </Link>
            </li>
            <ChevronRight className="size-3" aria-hidden />
            <li aria-current="page" className="text-foreground/80">
              {commune.name}
            </li>
          </ol>
        </nav>

        <h1 className="text-2xl leading-tight font-semibold tracking-tight text-balance md:text-4xl">
          Carburant et bornes de recharge {inCity(commune.name)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {commune.postalCode}, {commune.departmentName} ({commune.departmentCode}), {commune.regionName}
        </p>

        <p className="mt-5 max-w-[70ch] text-base leading-relaxed">
          {gas.length > 0
            ? `${commune.name} compte ${plural(gas.length, 'station-service', 'stations-service')} avec des prix publiés${gazole ? `. Le gazole y est le moins cher à ${formatPriceValue(gazole.min)} €/L chez ${poiName(gazole.cheapest)}, pour une moyenne de ${formatPriceValue(gazole.avg)} €/L` : ''}.`
            : `Aucune station-service ${ofCity(commune.name)} ne publie de prix pour le moment.`}{' '}
          {ev.length > 0
            ? `On y trouve aussi ${plural(ev.length, 'station de recharge', 'stations de recharge')} (${plural(evPoints, 'point de charge', 'points de charge')})${evExtras(evFast, evFree)}.`
            : ''}
          {availability.available > 0 &&
            ` ${plural(availability.available, 'point de charge est libre', 'points de charge sont libres')} selon les dernières données des opérateurs.`}
        </p>

        {fuels.length > 0 && (
          <section aria-labelledby="fuel-prices" className="mt-10">
            <h2 id="fuel-prices" className="text-lg font-semibold">
              Prix des carburants {inCity(commune.name)}
            </h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--island-subtle-border)]">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-[var(--island-subtle-bg)] text-left text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Carburant</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Le moins cher</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Moyenne</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Station</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--island-separator-bg)]">
                  {fuels.map((f) => (
                    <tr key={f.fuel}>
                      <th scope="row" className="px-4 py-2.5 text-left font-medium">
                        {fuelLabel(f.fuel)} <span className="font-normal text-muted-foreground">{fuelFullName(f.fuel)}</span>
                      </th>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {formatPriceValue(f.min)} €
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{formatPriceValue(f.avg)} €</td>
                      <td className="px-4 py-2.5">
                        <Link href={`/station/${f.cheapest.id}`} className="underline-offset-4 hover:underline">
                          {poiName(f.cheapest)}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Prix au litre relevés sur {plural(gas.length, 'station', 'stations')}.
            </p>
          </section>
        )}

        {sortedGas.length > 0 && (
          <PoiListSection
            id="gas-stations"
            title={`Stations-service ${inCity(commune.name)}`}
            pois={sortedGas}
            renderRow={(p) => <GasRow poi={p} />}
          />
        )}

        {ev.length > 0 && (
          <PoiListSection
            id="ev-stations"
            title={`Bornes de recharge ${inCity(commune.name)}`}
            pois={ev}
            renderRow={(p) => <EvRow poi={p} />}
          />
        )}

        {gas.length === 0 && ev.length === 0 && (
          <p className="mt-10 rounded-2xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
            Aucune station-service ni borne de recharge référencée dans cette commune.{' '}
            <Link href="/" className="font-medium text-foreground underline underline-offset-4">
              Chercher autour sur la carte
            </Link>
          </p>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function leadPrice(p: Poi): number {
  if (!isGas(p)) return Infinity;
  const gazole = p.data.fuels.find((f) => f.name === 'Gazole')?.price;
  return gazole ?? Math.min(...p.data.fuels.map((f) => f.price ?? Infinity));
}

function PoiListSection({
  id,
  title,
  pois,
  renderRow,
}: {
  id: string;
  title: string;
  pois: Poi[];
  renderRow: (p: Poi) => ReactNode;
}) {
  const visible = pois.slice(0, VISIBLE_ROWS);
  const rest = pois.slice(VISIBLE_ROWS);
  const list = (items: Poi[]) => (
    <ul className="divide-y divide-[var(--island-separator-bg)]">
      {items.map((p) => (
        <li key={p.id}>{renderRow(p)}</li>
      ))}
    </ul>
  );

  return (
    <section aria-labelledby={id} className="mt-10">
      <h2 id={id} className="text-lg font-semibold">
        {title} <span className="text-sm font-normal text-muted-foreground">({count.format(pois.length)})</span>
      </h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--island-subtle-border)]">
        {list(visible)}
        {rest.length > 0 && (
          <details className="group border-t border-[var(--island-separator-bg)]">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium hover:bg-[var(--island-subtle-bg)]">
              <span className="group-open:hidden">Afficher les {count.format(rest.length)} autres</span>
              <span className="hidden group-open:inline">Masquer</span>
            </summary>
            <div className="border-t border-[var(--island-separator-bg)]">{list(rest)}</div>
          </details>
        )}
      </div>
    </section>
  );
}

function GasRow({ poi }: { poi: Poi }) {
  if (!isGas(poi)) return null;
  const fuels = poi.data.fuels.filter((f): f is typeof f & { price: number } => f.price != null);
  return (
    <Link href={`/station/${poi.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--island-subtle-bg)]">
      <BrandIcon brand={poi.data.brand} size={18} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{poiName(poi)}</p>
        <p className="truncate text-xs text-muted-foreground">{formatPoiAddress(poi)}</p>
      </div>
      <p className="hidden shrink-0 gap-3 text-xs tabular-nums sm:flex">
        {fuels.slice(0, 4).map((f) => (
          <span key={f.name}>
            <span className="text-muted-foreground">{fuelLabel(f.name)}</span> {formatPriceValue(f.price)}
          </span>
        ))}
      </p>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

function EvRow({ poi }: { poi: Poi }) {
  if (!isEv(poi)) return null;
  const points = chargingPoints(poi.data);
  const maxPower = points.reduce((m, cp) => Math.max(m, cp.nominalPower), 0);
  return (
    <Link href={`/station/${poi.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--island-subtle-bg)]">
      <Zap className="size-[18px] shrink-0 text-emerald-500" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{poiName(poi)}</p>
        <p className="truncate text-xs text-muted-foreground">
          {poi.data.brandName || poi.data.operatorName} · {formatPoiAddress(poi)}
        </p>
      </div>
      <p className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {plural(points.length || poi.data.chargingPointCount, 'point', 'points')}
        {maxPower > 0 && <span className="block">{formatPower(maxPower)}</span>}
      </p>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}
