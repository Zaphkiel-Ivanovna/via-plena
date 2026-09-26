'use client';

import Link from 'next/link';
import { ChevronRight, Navigation, Share2, Zap } from 'lucide-react';
import { SiApple, SiWaze } from '@icons-pack/react-simple-icons';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { useMapThemeClass } from '@/hooks/use-map-theme-class';
import { useFilterStore } from '@/stores/filter-store';
import { isEv, isGas, type Poi } from '@/lib/poi';
import { formatParisDateTime, formatPoiAddress, formatPriceValue, latestFuelUpdate } from '@/lib/poi-details';
import { formatDistanceMeters } from '@/lib/format';
import { fuelLabel } from '@/lib/constants';
import { getAppleMapsUrl, getGoogleMapsUrl, getWazeUrl } from '@/lib/station-utils';
import { cn } from '@/lib/utils';
import { BrandIcon } from './brand-icon';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { NearbySection } from '@/lib/nearby';

const StationMap = dynamic(() => import('./station-map').then((m) => m.StationMap), {
  ssr: false,
  loading: () => <Skeleton className="h-60 rounded-2xl md:h-72" />,
});
const PriceHistoryChart = dynamic(() => import('./price-history-chart').then((m) => m.PriceHistoryChart), {
  ssr: false,
  loading: () => <Skeleton className="h-72 rounded-2xl" />,
});
import {
  AddressBlock,
  EvSections,
  EvSummaryPills,
  GasSections,
  Pill,
  StatusPill,
  displayName,
  gasStatus,
  sharePoi,
  useLiveCharging,
  timeAgo,
  useNow,
} from './poi-sections';
import { CreditCard } from 'lucide-react';

interface StationPageViewProps {
  poi: Poi;
  nearby: NearbySection | null;
}

const PANEL = 'island-panel rounded-3xl';

export function StationPageView({ poi, nearby }: StationPageViewProps) {
  useMapThemeClass();
  const now = useNow();
  const charging = useLiveCharging(poi);
  const preferredFuel = useFilterStore((s) => s.fuelTypes[0]);

  const ev = isEv(poi);
  const brand = isEv(poi) ? poi.data.brandName || poi.data.operatorName : isGas(poi) ? poi.data.brand : '';
  const status = isGas(poi) ? gasStatus(poi.data, now) : null;
  const commune = poi.commune?.slug ? poi.commune : null;

  return (
    <div className="min-h-[100dvh] bg-background">
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
            <li>
              {commune ? (
                <Link href={`/prix-carburant/${commune.slug}`} className="hover:text-foreground">
                  {commune.name}
                </Link>
              ) : (
                poi.city
              )}
            </li>
            <ChevronRight className="size-3" aria-hidden />
            <li aria-current="page" className="max-w-[40ch] truncate text-foreground/80">
              {displayName(poi)}
            </li>
          </ol>
        </nav>

        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--island-subtle-border)] bg-[var(--island-subtle-bg)]',
              ev && 'text-emerald-500',
            )}
          >
            {ev ? <Zap className="size-6" aria-hidden /> : <BrandIcon brand={brand} size={26} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">
              {ev ? 'Borne de recharge' : 'Station-service'}
              {brand && !displayName(poi).toLowerCase().includes(brand.toLowerCase()) && (
                <span className="text-foreground/80"> {brand}</span>
              )}
            </p>
            <h1 className="mt-0.5 text-2xl leading-tight font-semibold tracking-tight text-balance md:text-4xl">
              {displayName(poi)}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{formatPoiAddress(poi)}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {status && <StatusPill status={status} />}
              {isGas(poi) && poi.data.isAutomated2424 && status?.kind !== 'always' && (
                <Pill icon={CreditCard}>Automate 24h/24</Pill>
              )}
              {isEv(poi) && charging && <EvSummaryPills data={poi.data} charging={charging} now={now} />}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <aside className="order-first space-y-3 lg:sticky lg:top-20 lg:order-last">
            <div className={cn(PANEL, 'p-2')}>
              <StationMap latitude={poi.lat} longitude={poi.lng} name={displayName(poi)} className="h-60 md:h-72" />
              <div className="space-y-3 p-2 pt-3">
                <RouteActions poi={poi} />
                <AddressBlock poi={poi} />
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            <div className={cn(PANEL, 'space-y-8 p-5 md:p-7')}>
              {isGas(poi) && <GasSections data={poi.data} now={now} />}
              {isEv(poi) && charging && <EvSections data={poi.data} charging={charging} now={now} />}
            </div>

            {isGas(poi) && (
              <div className={cn(PANEL, 'p-5 md:p-7')}>
                <PriceHistoryChart poiId={poi.id} preferredFuel={preferredFuel} />
              </div>
            )}

            {nearby && <Nearby section={nearby} />}

            <SourceNote poi={poi} now={now} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Nearby({ section }: { section: NearbySection }) {
  return (
    <section aria-labelledby="nearby-title" className={cn(PANEL, 'p-5 md:p-7')}>
      <h2 id="nearby-title" className="text-base font-semibold">
        {section.kind === 'ev' ? 'Autres bornes à proximité' : 'Stations-service à proximité'}
      </h2>
      {section.summary && (
        <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">{section.summary}</p>
      )}
      <ul className="mt-4 divide-y divide-[var(--island-separator-bg)]">
        {section.rows.map((row) => (
          <li key={row.id}>
            <Link href={`/station/${row.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-foreground">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{row.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{row.address}</span>
              </span>
              {section.fuel && row.price != null && (
                <span className="shrink-0 text-xs tabular-nums">
                  <span className="text-muted-foreground">{fuelLabel(section.fuel)}</span> {formatPriceValue(row.price)} €
                </span>
              )}
              {row.distance != null && (
                <span className="w-14 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                  {formatDistanceMeters(row.distance)}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RouteActions({ poi }: { poi: Poi }) {
  const secondary =
    'h-10 flex-1 rounded-xl border border-[var(--island-interactive-border)] bg-[var(--island-interactive-bg)] text-foreground hover:bg-[var(--island-interactive-hover-bg)] active:scale-[0.98]';
  return (
    <div className="space-y-2">
      <Button asChild className="h-11 w-full rounded-2xl text-sm active:scale-[0.98]">
        <a href={getGoogleMapsUrl(poi)} target="_blank" rel="noopener noreferrer">
          <Navigation className="size-4" aria-hidden />
          Itinéraire
        </a>
      </Button>
      <div className="flex gap-2">
        <Button asChild variant="ghost" className={secondary}>
          <a href={getWazeUrl(poi)} target="_blank" rel="noopener noreferrer">
            <SiWaze size={15} aria-hidden />
            Waze
          </a>
        </Button>
        <Button asChild variant="ghost" className={secondary}>
          <a href={getAppleMapsUrl(poi)} target="_blank" rel="noopener noreferrer">
            <SiApple size={15} aria-hidden />
            Plans
          </a>
        </Button>
        <Button variant="ghost" className={secondary} onClick={() => sharePoi(poi)}>
          <Share2 className="size-4" aria-hidden />
          Partager
        </Button>
      </div>
    </div>
  );
}

function SourceNote({ poi, now }: { poi: Poi; now: Date | null }) {
  const updated = isGas(poi)
    ? latestFuelUpdate(poi.data)
    : isEv(poi)
      ? new Date(poi.data.lastModified ?? poi.data.lastUpdateDate)
      : null;
  const valid = updated && Number.isFinite(updated.getTime());

  return (
    <p className="px-1 text-xs leading-relaxed text-muted-foreground">
      {isGas(poi) ? (
        <>
          Prix issus du flux officiel{' '}
          <a
            href="https://www.prix-carburants.gouv.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            prix-carburants.gouv.fr
          </a>
          , déclarés par la station.
        </>
      ) : (
        <>
          Données issues du fichier national{' '}
          <a
            href="https://www.data.gouv.fr/fr/datasets/fichier-consolide-des-bornes-de-recharge-pour-vehicules-electriques/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            IRVE sur data.gouv.fr
          </a>
          , disponibilité en temps réel transmise par les opérateurs.
        </>
      )}
      {valid && (
        <>
          {' '}
          {isEv(poi) ? 'Fiche de la borne mise à jour' : 'Dernière mise à jour'}{' '}
          <time dateTime={updated.toISOString()} title={formatParisDateTime(updated)}>
            {timeAgo(updated, now)}
          </time>
          .
        </>
      )}
    </p>
  );
}
