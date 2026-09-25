import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { findPoisNearby, getPoiById } from '@/api/generated/poi/poi';
import { ApiError } from '@/api/fetcher';
import { StationPageView } from '@/components/station/station-page-view';
import { FUEL_NAMES_ORDER, fuelFullName, fuelSearchName } from '@/lib/constants';
import { distanceMeters, isEv, isGas, type Poi } from '@/lib/poi';
import {
  PLUG_LABELS,
  chargingPoints,
  formatPoiAddress,
  formatPower,
  formatPriceValue,
  isAlwaysOpenEv,
  parseGasSchedule,
  streetLabel,
  type PlugKind,
} from '@/lib/poi-details';
import { poiIndexVerdict } from '@/lib/seo/indexability';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { describeService } from '@/components/station/service-icon';

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

const NEARBY_RADIUS_M = 3000;
const NEARBY_LIMIT = 8;
const TITLE_MAX = 60;

interface StationPageProps {
  params: Promise<{ id: string }>;
}

const loadPoi = cache(async (id: string) => {
  try {
    const res = await getPoiById(id, { next: { revalidate } });
    return { poi: res.data as Poi, renderedAt: Date.now() };
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429) return null;
    throw error;
  }
});

const loadNearby = cache(async (poi: Poi): Promise<Poi[]> => {
  try {
    const res = await findPoisNearby(
      { lat: poi.lat, lng: poi.lng, radius: NEARBY_RADIUS_M, type: poi.type, limit: NEARBY_LIMIT + 1 },
      { next: { revalidate } },
    );
    return (res.data as unknown as Poi[]).filter((p) => p.id !== poi.id).slice(0, NEARBY_LIMIT);
  } catch {
    return [];
  }
});

const cleanName = (p: Poi) => p.name.split(' | ').slice(-1)[0];

const pricedFuels = (p: Poi) =>
  isGas(p)
    ? [...p.data.fuels]
        .filter((f): f is typeof f & { price: number } => f.price != null)
        .sort((a, b) => FUEL_NAMES_ORDER.indexOf(a.name as never) - FUEL_NAMES_ORDER.indexOf(b.name as never))
    : [];

function evSummary(p: Poi) {
  if (!isEv(p)) return null;
  const points = chargingPoints(p.data);
  const maxPower = points.reduce((m, cp) => Math.max(m, cp.nominalPower), 0);
  const plugs = new Set<PlugKind>();
  for (const cp of points) {
    if (cp.hasPlugType2) plugs.add('type2');
    if (cp.hasPlugTypeComboCcs) plugs.add('ccs');
    if (cp.hasPlugTypeChademo) plugs.add('chademo');
    if (cp.hasPlugTypeEf) plugs.add('ef');
  }
  return { count: p.data.chargingPointCount || points.length, maxPower, plugs: [...plugs].map((k) => PLUG_LABELS[k]) };
}

function fitTitle(candidates: string[]): { absolute: string } {
  const fitting = candidates.find((t) => t.length <= TITLE_MAX) ?? candidates[candidates.length - 1];
  const branded = `${fitting} | ${SITE_NAME}`;
  return { absolute: branded.length <= TITLE_MAX ? branded : fitting };
}

function stationTitle(poi: Poi): { absolute: string } {
  const street = streetLabel(poi);
  if (isGas(poi)) {
    const label = poi.data.brand || cleanName(poi);
    const [first, second] = pricedFuels(poi);
    const price = (f: { name: string; price: number }) => `${fuelSearchName(f.name)} ${formatPriceValue(f.price)} €`;
    return fitTitle([
      ...(first && second ? [`${label} ${street}, ${poi.city} : ${price(first)}, ${price(second)}`] : []),
      ...(first ? [`${label} ${street}, ${poi.city} : ${price(first)}`] : []),
      `${label} ${street}, ${poi.city}`,
      `${label} ${poi.city} : prix des carburants`,
    ]);
  }
  const ev = evSummary(poi)!;
  const power = ev.maxPower ? `, ${formatPower(ev.maxPower)}` : '';
  const name = cleanName(poi);
  const where = name.toLowerCase().includes(poi.city.toLowerCase()) ? name : `${name}, ${poi.city}`;
  return fitTitle([
    `${where} : borne de recharge${power}`,
    `Borne ${where}${power}`,
    `Borne de recharge ${street}, ${poi.city}`,
  ]);
}

export async function generateMetadata({ params }: StationPageProps): Promise<Metadata> {
  const { id } = await params;
  const loaded = await loadPoi(id);
  if (!loaded) return { title: 'Station introuvable', robots: { index: false } };

  const { poi, renderedAt } = loaded;
  const name = cleanName(poi);
  const url = `${SITE_URL}/station/${poi.id}`;
  const title = stationTitle(poi);
  let description: string;

  if (isGas(poi)) {
    const brand = poi.data.brand && !name.toLowerCase().includes(poi.data.brand.toLowerCase()) ? ` (${poi.data.brand})` : '';
    const prices = pricedFuels(poi)
      .map((f) => `${fuelSearchName(f.name)} ${formatPriceValue(f.price)} €`)
      .join(', ');
    description = `Prix du jour chez ${name}${brand}, ${formatPoiAddress(poi)}.${prices ? ` ${prices}.` : ''} Historique des prix, horaires, services et itinéraire.`;
  } else {
    const ev = evSummary(poi)!;
    description = `Borne de recharge ${name}, ${formatPoiAddress(poi)}. ${ev.count} point${ev.count > 1 ? 's' : ''} de charge${ev.maxPower ? ` jusqu'à ${formatPower(ev.maxPower)}` : ''}${ev.plugs.length ? ` (${ev.plugs.join(', ')})` : ''}. Disponibilité en temps réel et itinéraire.`;
  }

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: poiIndexVerdict(poi, renderedAt).index, follow: true },
    openGraph: { type: 'website', url, title: title.absolute, description, siteName: SITE_NAME, locale: 'fr_FR' },
    twitter: { card: 'summary', title: title.absolute, description },
  };
}

const SCHEMA_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hhmm = (minutes: number) =>
  `${String(Math.floor((minutes % 1440) / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

function openingHoursSpecification(p: Poi) {
  if (isEv(p)) {
    return isAlwaysOpenEv(p.data)
      ? [{ '@type': 'OpeningHoursSpecification', dayOfWeek: SCHEMA_DAYS, opens: '00:00', closes: '23:59' }]
      : undefined;
  }
  if (!isGas(p)) return undefined;
  const week = parseGasSchedule(p.data);
  if (!week) return undefined;
  return week.flatMap((day) =>
    day.allDay
      ? [{ '@type': 'OpeningHoursSpecification', dayOfWeek: SCHEMA_DAYS[day.index], opens: '00:00', closes: '23:59' }]
      : day.ranges.map((r) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: SCHEMA_DAYS[day.index],
          opens: hhmm(r.start),
          closes: hhmm(Math.min(r.end, 1439)),
        })),
  );
}

function amenityFeature(p: Poi) {
  const feature = (name: string, value: string | number | boolean = true) => ({
    '@type': 'LocationFeatureSpecification',
    name,
    value,
  });
  if (isGas(p)) {
    const services = p.data.services.map((s) => feature(describeService(s).label));
    return p.data.isAutomated2424 ? [feature('Automate carte bancaire 24h/24'), ...services] : services;
  }
  const ev = evSummary(p);
  if (!ev) return [];
  return [
    feature('Points de charge', ev.count),
    ...(ev.maxPower ? [feature('Puissance maximale (kW)', ev.maxPower)] : []),
    ...ev.plugs.map((plug) => feature(`Prise ${plug}`)),
  ];
}

function buildJsonLd(p: Poi) {
  const url = `${SITE_URL}/station/${p.id}`;
  const brand = isGas(p) ? p.data.brand : isEv(p) ? p.data.brandName || p.data.operatorName : '';
  const ev = evSummary(p);
  const fuels = pricedFuels(p);
  const commune = p.commune?.slug ? p.commune : null;
  const hours = openingHoursSpecification(p);
  const amenities = amenityFeature(p);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': isGas(p) ? 'GasStation' : 'AutomotiveBusiness',
        '@id': `${url}#station`,
        name: cleanName(p),
        url,
        image: `${SITE_URL}/logo_dark.png`,
        ...(brand && { brand: { '@type': 'Brand', name: brand } }),
        address: {
          '@type': 'PostalAddress',
          streetAddress: p.address.split(',')[0].trim(),
          addressLocality: p.city,
          postalCode: p.postalCode,
          addressRegion: p.region,
          addressCountry: 'FR',
        },
        geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng },
        ...(hours?.length && { openingHoursSpecification: hours }),
        ...(amenities.length && { amenityFeature: amenities }),
        ...(ev && {
          description: `${ev.count} point${ev.count > 1 ? 's' : ''} de charge${ev.maxPower ? `, jusqu'à ${formatPower(ev.maxPower)}` : ''}`,
        }),
        ...(fuels.length > 0 && {
          currenciesAccepted: 'EUR',
          makesOffer: fuels.map((f) => ({
            '@type': 'Offer',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: f.price,
              priceCurrency: 'EUR',
              unitCode: 'LTR',
              unitText: 'litre',
            },
            ...(f.lastUpdate && { validFrom: f.lastUpdate }),
            itemOffered: { '@type': 'Product', name: f.name === 'Gazole' ? 'Gazole' : fuelFullName(f.name) },
          })),
        }),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { name: 'Accueil', item: SITE_URL },
          ...(commune ? [{ name: commune.name, item: `${SITE_URL}/prix-carburant/${commune.slug}` }] : []),
          { name: cleanName(p), item: url },
        ].map((it, i) => ({ '@type': 'ListItem', position: i + 1, ...it })),
      },
    ],
  };
}

const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });

export default async function StationPage({ params }: StationPageProps) {
  const { id } = await params;
  const loaded = await loadPoi(id);
  if (!loaded) notFound();
  const nearby = await loadNearby(loaded.poi);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(buildJsonLd(loaded.poi))} />
      <StationPageView
        poi={loaded.poi}
        renderedAt={loaded.renderedAt}
        nearby={nearby.map((p) => ({ poi: p, distance: distanceMeters(p) }))}
      />
    </>
  );
}
