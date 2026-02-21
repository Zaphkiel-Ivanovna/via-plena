import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BrandIcon } from '@/components/station/brand-icon';
import { ArrowLeft, MapPin, Navigation, Clock } from 'lucide-react';
import { SiGooglemaps, SiWaze, SiApple } from '@icons-pack/react-simple-icons';
import { StationMap } from '@/components/station/station-map';
import { StationBackground } from '@/components/station/station-background';
import { Logo } from '@/components/shared/logo';
import { fetchStationById } from '@/services/station-service';
import { FUEL_LABELS, SERVICE_LABELS } from '@/lib/constants';
import { formatPrice, formatDate } from '@/lib/format';
import type { Metadata } from 'next';
import type { GasStation } from '@/types/station';

const SITE_URL = 'https://via-plena.zaphkiel.dev';

interface StationPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: StationPageProps): Promise<Metadata> {
  const { id } = await params;
  const station = await fetchStationById(Number(id));
  if (!station) {
    return { title: 'Station non trouvée' };
  }

  const title = `${station.name} (${station.brand}) - Prix carburants à ${station.city}`;
  const description = `Prix des carburants à ${station.name} (${station.brand}), ${station.address}, ${station.postalCode} ${station.city}. ${station.fuels.map((f) => `${FUEL_LABELS[f.type]} : ${formatPrice(f.price)}`).join(', ')}.`;
  const url = `${SITE_URL}/station/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: 'ViaPlena',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

function buildStationJsonLd(station: GasStation) {
  return {
    '@context': 'https://schema.org',
    '@type': 'GasStation',
    name: station.name,
    brand: { '@type': 'Brand', name: station.brand },
    address: {
      '@type': 'PostalAddress',
      streetAddress: station.address,
      addressLocality: station.city,
      postalCode: station.postalCode,
      addressCountry: 'FR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: station.latitude,
      longitude: station.longitude,
    },
    url: `${SITE_URL}/station/${station.id}`,
    currenciesAccepted: 'EUR',
    ...(station.fuels.length > 0 && {
      priceRange: `${formatPrice(Math.min(...station.fuels.map((f) => f.price)))} - ${formatPrice(Math.max(...station.fuels.map((f) => f.price)))}`,
    }),
  };
}

export default async function StationPage({ params }: StationPageProps) {
  const { id } = await params;
  const station = await fetchStationById(Number(id));

  if (!station) {
    notFound();
  }

  const cheapestPrice = station.fuels.length > 0
    ? Math.min(...station.fuels.map((f) => f.price))
    : null;

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;
  const wazeUrl = `https://www.waze.com/ul?ll=${station.latitude},${station.longitude}&navigate=yes`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${station.latitude},${station.longitude}`;

  return (
    <div className="relative min-h-dvh bg-black overflow-hidden p-4 md:p-8">
      <StationBackground />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildStationJsonLd(station)) }}
      />
      <main className="relative z-10 mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.1] transition-all"
          >
            <ArrowLeft className="size-4" />
            Retour
          </Link>
          <Link href="/">
            <Logo className="h-5 w-auto text-foreground" />
          </Link>
        </div>

        <div className="rounded-3xl border border-white/[0.08] bg-background/70 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden">
          <div className="p-6 pb-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold">{station.name}</h1>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 mt-2 text-xs font-medium text-primary border border-primary/20">
                  <BrandIcon brand={station.brand} size={14} />
                  {station.brand}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary/70" />
              <p className="text-sm">{station.address}, {station.postalCode} {station.city}</p>
            </div>
            <StationMap
              latitude={station.latitude}
              longitude={station.longitude}
              name={station.name}
            />
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className="p-6 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-emerald-500" />
              Prix des carburants
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {station.fuels.map((fuel) => (
                <div
                  key={fuel.type}
                  className={`flex items-center justify-between rounded-xl border p-3.5 transition-colors ${
                    cheapestPrice !== null && fuel.price === cheapestPrice
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-white/[0.06] bg-white/[0.03]'
                  }`}
                >
                  <span className="text-sm font-medium">{FUEL_LABELS[fuel.type]}</span>
                  <span className="font-semibold tabular-nums">{formatPrice(fuel.price)}</span>
                </div>
              ))}
            </div>
            {station.fuels[0] && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" />
                Mis a jour le {formatDate(station.fuels[0].updatedAt)}
              </p>
            )}
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className="p-6 space-y-3">
            <h3 className="text-sm font-semibold">Services</h3>
            {station.services.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {station.services.map((service) => (
                  <div
                    key={service}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5 text-sm text-muted-foreground"
                  >
                    {SERVICE_LABELS[service]}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun service disponible</p>
            )}
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className="p-6 space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Navigation className="size-3.5" />
              Itinéraire
            </h3>
            <div className="grid gap-2 sm:grid-cols-3">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
              >
                <SiGooglemaps size={16} />
                Google Maps
              </a>
              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-sm font-medium transition-all hover:bg-white/[0.1]"
              >
                <SiWaze size={16} />
                Waze
              </a>
              <a
                href={appleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-sm font-medium transition-all hover:bg-white/[0.1]"
              >
                <SiApple size={16} />
                Apple Plans
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
