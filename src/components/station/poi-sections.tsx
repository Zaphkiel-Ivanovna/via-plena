'use client';

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useFilterStore } from '@/stores/filter-store';
import { useGetPoiStatus } from '@/api/generated/poi/poi';
import { FUEL_NAMES_ORDER, fuelFullName, fuelLabel } from '@/lib/constants';
import { isEv, type Poi, type EvStationData, type GasStationData } from '@/lib/poi';
import {
  PLUG_LABELS,
  chargeSpeed,
  chargingPoints,
  evPayment,
  evPricing,
  formatDayHours,
  formatPoiAddress,
  formatPower,
  formatPriceValue,
  formatParisDateTime,
  formatRelativeTime,
  getOpenStatus,
  groupChargingPoints,
  isAlwaysOpenEv,
  latestFuelUpdate,
  mondayIndex,
  operatorPhone,
  parseGasSchedule,
  temporaryOutages,
  type OpenStatus,
  hasRealtime,
  isRealtimeStale,
  summarizeAvailability,
  withLiveRealtime,
  type Availability,
  type ChargingPointRealtime,
  type EvChargingPoint,
  type PointState,
} from '@/lib/poi-details';
import { getGoogleMapsUrl, getWazeUrl, getAppleMapsUrl } from '@/lib/station-utils';
import { describeService } from './service-icon';
import {
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  Share2,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import { SiWaze, SiApple } from '@icons-pack/react-simple-icons';

const STALE_PRICE_DAYS = 7;
const SERVICES_PREVIEW = 6;
export const REALTIME_POLL_MS = 60_000;

export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const first = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return now;
}

export function timeAgo(date: Date, now: Date | null): string {
  return now ? formatRelativeTime(date, now) : `le ${formatParisDateTime(date)}`;
}

export const displayName = (p: Poi): string => {
  const parts = p.name.split(' | ');
  return parts.length > 1 ? parts.slice(1).join(' | ') : p.name;
};

export interface LiveCharging {
  points: EvChargingPoint[];
  availability: Availability;
  pending: boolean;
}

export function useLiveCharging(poi: Poi): LiveCharging | null {
  const ev = isEv(poi);
  const { data: response, isPending } = useGetPoiStatus(poi.id, {
    query: { enabled: ev, refetchInterval: REALTIME_POLL_MS, refetchIntervalInBackground: false },
  });

  return useMemo(() => {
    if (!isEv(poi)) return null;
    const live =
      response?.status === 200
        ? new Map<string, ChargingPointRealtime | null>(
            response.data.chargingPoints.map((cp) => [cp.chargingPointItineranceId, cp.realtime]),
          )
        : null;
    const points = withLiveRealtime(chargingPoints(poi.data), live);
    const pending = isPending && !points.some((cp) => cp.realtime);
    return { points, availability: summarizeAvailability(points), pending };
  }, [poi, response, isPending]);
}

export function gasStatus(data: GasStationData, now: Date | null): OpenStatus | null {
  if (!now) return null;
  const week = parseGasSchedule(data);
  return week ? getOpenStatus(week, now) : null;
}

export function StatusPill({ status }: { status: OpenStatus }) {
  if (status.kind === 'always') {
    return <Pill tone="positive" icon={Clock}>Ouvert 24h/24</Pill>;
  }
  if (status.kind === 'open') {
    return <Pill tone="positive" icon={Clock}>Ouvert · ferme à {status.closesAt}</Pill>;
  }
  const reopen = status.opensAt
    ? ` · ouvre ${status.opensDay ? `${status.opensDay} ` : ''}à ${status.opensAt}`
    : '';
  return <Pill icon={Clock}>Fermé{reopen}</Pill>;
}

export function EvSummaryPills({
  data,
  charging: { points, availability },
  now,
}: {
  data: EvStationData;
  charging: LiveCharging;
  now: Date | null;
}) {
  const maxPower = points.reduce((max, p) => Math.max(max, p.nominalPower), 0);
  return (
    <>
      {hasRealtime(availability) && (
        <AvailabilityPill availability={availability} stale={now ? isRealtimeStale(availability, now) : false} />
      )}
      {maxPower > 0 && (
        <Pill tone="positive" icon={Zap}>
          Jusqu&apos;à {formatPower(maxPower)}
        </Pill>
      )}
      {isAlwaysOpenEv(data) && <Pill icon={Clock}>24h/24</Pill>}
      {evPayment(points).free && <Pill>Gratuit</Pill>}
    </>
  );
}

export function GasSections({ data, now }: { data: GasStationData; now: Date | null }) {
  return (
    <>
      <FuelPrices data={data} now={now} />
      <Schedule data={data} now={now} />
      <Services services={data.services} />
    </>
  );
}

function FuelPrices({ data, now }: { data: GasStationData; now: Date | null }) {
  const selectedFuel = useFilterStore((s) => s.fuelTypes[0]);
  const order = (name: string) => {
    const i = (FUEL_NAMES_ORDER as readonly string[]).indexOf(name);
    return i === -1 ? FUEL_NAMES_ORDER.length : i;
  };
  const fuels = data.fuels
    .filter((f): f is typeof f & { price: number } => f.price != null)
    .sort((a, b) => order(a.name) - order(b.name));
  const outages = temporaryOutages(data);
  const latest = latestFuelUpdate(data);
  const staleDays = latest && now ? (now.getTime() - latest.getTime()) / 86_400_000 : 0;

  if (fuels.length === 0 && outages.length === 0) {
    return (
      <Section title="Prix des carburants">
        <p className="text-sm text-muted-foreground">Cette station ne publie aucun prix pour le moment.</p>
      </Section>
    );
  }

  return (
    <Section
      title="Prix des carburants"
      aside={latest && <span title={formatParisDateTime(latest)}>Mis à jour {timeAgo(latest, now)}</span>}
    >
      {staleDays > STALE_PRICE_DAYS && (
        <p className="mb-3 flex items-start gap-2 rounded-2xl bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          Prix non actualisés depuis {Math.floor(staleDays)} jours, ils peuvent avoir changé.
        </p>
      )}
      <ul className="grid grid-cols-2 gap-2">
        {fuels.map((fuel) => {
          const selected = fuel.name === selectedFuel;
          return (
            <li
              key={fuel.name}
              className={cn(
                'rounded-2xl p-3',
                selected ? 'bg-emerald-500/10 ring-1 ring-emerald-500/40 ring-inset' : 'island-subtle',
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-xs font-medium text-muted-foreground" title={fuelFullName(fuel.name)}>
                  {fuelLabel(fuel.name)}
                </span>
                {selected && <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Votre choix</span>}
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
                {formatPriceValue(fuel.price)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">€/L</span>
              </p>
            </li>
          );
        })}
        {outages.map((o) => (
          <li key={o.name} className="rounded-2xl border border-dashed border-[var(--island-border)] p-3">
            <span className="text-xs font-medium text-muted-foreground">{fuelLabel(o.name)}</span>
            <p className="mt-1 text-sm font-medium">Rupture</p>
            {o.since && (
              <p className="text-[11px] text-muted-foreground">Signalée {timeAgo(new Date(o.since), now)}</p>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Schedule({ data, now }: { data: GasStationData; now: Date | null }) {
  const week = parseGasSchedule(data);
  if (!week || week.every((d) => d.allDay)) return null;
  const today = now ? mondayIndex(now) : -1;

  return (
    <Collapsible asChild>
      <section>
        <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div>
            <h3 className="text-sm font-semibold">Horaires</h3>
            <p className="text-xs text-muted-foreground">
              {today >= 0 ? `Aujourd'hui : ${formatDayHours(week[today])}` : 'Horaires de la semaine'}
            </p>
          </div>
          <span className="island-interactive flex size-8 items-center justify-center rounded-full">
            <ChevronDown className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none" aria-hidden />
            <span className="sr-only">Afficher la semaine</span>
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none">
          <dl className="island-subtle mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 rounded-2xl p-3 text-sm">
            {week.map((day) => (
              <div key={day.name} className={cn('contents', day.index === today ? 'font-semibold' : 'text-muted-foreground')}>
                <dt>{day.name}</dt>
                <dd className="text-right tabular-nums">{formatDayHours(day)}</dd>
              </div>
            ))}
          </dl>
          {data.isAutomated2424 && (
            <p className="mt-2 text-xs text-muted-foreground">
              En dehors de ces horaires, le carburant reste disponible par carte bancaire.
            </p>
          )}
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

function Services({ services }: { services: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const items = [
    ...new Map(
      services
        .filter((s) => !/automate|24\/24|24_24/i.test(s))
        .map(describeService)
        .map((item) => [item.label, item] as const),
    ).values(),
  ];
  if (items.length === 0) return null;
  const visible = expanded ? items : items.slice(0, SERVICES_PREVIEW);
  const hidden = items.length - visible.length;

  return (
    <Section title="Services">
      <ul className="flex flex-wrap gap-1.5">
        {visible.map(({ icon: Icon, label }) => (
          <li key={label} className="island-subtle inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs">
            <Icon className="size-3.5 text-muted-foreground" aria-hidden />
            {label}
          </li>
        ))}
        {hidden > 0 && (
          <li>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="island-interactive inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors active:scale-[0.98]"
            >
              +{hidden} autre{hidden > 1 ? 's' : ''}
            </button>
          </li>
        )}
      </ul>
    </Section>
  );
}

export function EvSections({
  data,
  charging: { points, availability, pending },
  now,
}: {
  data: EvStationData;
  charging: LiveCharging;
  now: Date | null;
}) {
  const live = !pending && hasRealtime(availability);
  const groups = groupChargingPoints(points);
  const payment = evPayment(points);
  const pricing = evPricing(points);
  const phone = operatorPhone(data);
  const count = data.chargingPointCount || points.length;
  const updated = data.lastModified ?? data.lastUpdateDate;

  const infos: [string, string][] = [
    ['Accès', data.accessCondition],
    ['Horaires', isAlwaysOpenEv(data) ? '24h/24, 7j/7' : data.openingHours],
    ['Emplacement', data.stationType],
    ['Réservation', data.hasReservation ? 'Possible' : 'Non'],
    ['Accessibilité PMR', /inconnue/i.test(data.pmrAccessibility) ? '' : data.pmrAccessibility],
    ['Gabarit', /non précisée|inconnu/i.test(data.sizeRestriction) ? '' : data.sizeRestriction],
  ];

  return (
    <>
      <Section
        title={`${count} point${count > 1 ? 's' : ''} de charge`}
        aside={data.isTwoWheelerStation ? 'Deux-roues' : undefined}
      >
        {pending ? (
          <Skeleton className="mb-3 h-8 w-full rounded-xl" />
        ) : live ? (
          <AvailabilityBreakdown availability={availability} now={now} />
        ) : (
          <p className="mb-3 text-xs text-muted-foreground">
            L&apos;opérateur ne publie pas la disponibilité en temps réel de ces bornes.
          </p>
        )}
        {groups.length > 0 ? (
          <ul className="island-subtle divide-y divide-[var(--island-separator-bg)] rounded-2xl">
            {groups.map((g) => (
              <li key={`${g.power}-${g.plugs.join()}`} className="flex items-center gap-3 px-3 py-2.5">
                <div className="w-[76px] shrink-0">
                  <p className="text-sm font-semibold tabular-nums">{formatPower(g.power)}</p>
                  <p className="text-[11px] text-muted-foreground">{chargeSpeed(g.power)}</p>
                </div>
                <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                  {g.plugs.map((plug) => (
                    <span key={plug} className="rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[11px] font-medium">
                      {PLUG_LABELS[plug]}
                    </span>
                  ))}
                  {g.cableAttached && <span className="px-1 py-0.5 text-[11px] text-muted-foreground">câble attaché</span>}
                </div>
                {live ? (
                  <GroupAvailability states={g.states} count={g.count} />
                ) : (
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">×{g.count}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Le détail des prises n&apos;est pas renseigné.</p>
        )}
      </Section>

      <Section title="Paiement">
        <div className="flex flex-wrap gap-1.5">
          {payment.free && <Pill tone="positive">Recharge gratuite</Pill>}
          {payment.creditCard && <Pill icon={CreditCard}>Carte bancaire</Pill>}
          {payment.payPerUse && <Pill>Paiement à l&apos;acte</Pill>}
          {payment.other && <Pill>Badge ou application</Pill>}
          {!payment.free && !payment.creditCard && !payment.payPerUse && !payment.other && (
            <p className="text-sm text-muted-foreground">Moyens de paiement non renseignés.</p>
          )}
        </div>
        {pricing?.kind === 'link' && (
          <a
            href={pricing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
          >
            Voir la grille tarifaire
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
        {pricing?.kind === 'text' && <p className="mt-3 text-sm">{pricing.text}</p>}
      </Section>

      <Section title="Informations">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {infos
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 break-words">{value}</dd>
              </div>
            ))}
        </dl>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          {data.operatorName && <span className="min-w-0 truncate">Opéré par {data.operatorName}</span>}
          {phone && (
            <a href={phone.href} className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline">
              <Phone className="size-3.5" aria-hidden />
              {phone.label}
            </a>
          )}
        </div>
        {updated && (
          <p className="mt-2 text-xs text-muted-foreground">
            Données mises à jour {timeAgo(new Date(updated), now)}
          </p>
        )}
      </Section>
    </>
  );
}

const STATE_STYLES: Record<PointState, { label: (n: number) => string; bar: string; text: string }> = {
  available: {
    label: (n) => `${n} libre${n > 1 ? 's' : ''}`,
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  occupied: {
    label: (n) => `${n} occupé${n > 1 ? 's' : ''}`,
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  outOfService: {
    label: (n) => `${n} hors service`,
    bar: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
  },
  unknown: {
    label: (n) => `${n} sans info`,
    bar: 'bg-muted-foreground/25',
    text: 'text-muted-foreground',
  },
};

const STATE_ORDER: PointState[] = ['available', 'occupied', 'outOfService', 'unknown'];

export function LiveDot() {
  return (
    <span className="relative flex size-2" aria-hidden>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
    </span>
  );
}

export function AvailabilityPill({ availability: a, stale }: { availability: Availability; stale: boolean }) {
  if (stale) {
    return (
      <Pill tone="warning" icon={TriangleAlert}>
        {a.available}/{a.total} libres, info ancienne
      </Pill>
    );
  }
  if (a.available === 0) {
    const reason = a.occupied > 0 && a.outOfService === 0 ? 'Tout est occupé' : 'Aucun point libre';
    return <Pill tone="warning">{reason}</Pill>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
      <LiveDot />
      {a.available}/{a.total} disponible{a.available > 1 ? 's' : ''}
    </span>
  );
}

function AvailabilityBreakdown({ availability: a, now }: { availability: Availability; now: Date | null }) {
  const states = STATE_ORDER.filter((s) => a[s] > 0);
  const stale = now ? isRealtimeStale(a, now) : false;
  return (
    <div className="mb-3 space-y-2">
      {stale && a.lastObservedAt && (
        <div role="note" className="mb-3 flex items-start gap-2 rounded-2xl bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          <div className="space-y-0.5">
            <p className="font-semibold">
              Donnée ancienne : dernier signal {timeAgo(a.lastObservedAt, now)}
            </p>
            <p>
              Cette disponibilité n&apos;est pas vérifiée. La borne n&apos;est peut-être plus à jour, voire
              fermée. Vérifiez auprès de l&apos;opérateur avant de vous déplacer.
            </p>
          </div>
        </div>
      )}
      <div className={cn('flex h-1.5 gap-0.5 overflow-hidden rounded-full', stale && 'opacity-50')} role="img" aria-label={states.map((s) => STATE_STYLES[s].label(a[s])).join(', ')}>
        {states.map((s) => (
          <span
            key={s}
            className={cn('h-full transition-[flex-grow] duration-500 motion-reduce:transition-none', STATE_STYLES[s].bar)}
            style={{ flexGrow: a[s] }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
        <p className="flex flex-wrap gap-x-3 gap-y-1">
          {states.map((s) => (
            <span key={s} className={cn('font-medium tabular-nums', STATE_STYLES[s].text)}>
              {STATE_STYLES[s].label(a[s])}
            </span>
          ))}
        </p>
        {a.lastObservedAt && !stale && (
          <span className="text-muted-foreground" title={formatParisDateTime(a.lastObservedAt)}>
            Dernier signal {timeAgo(a.lastObservedAt, now)}
          </span>
        )}
      </div>
    </div>
  );
}

function GroupAvailability({ states, count }: { states: Record<PointState, number>; count: number }) {
  return (
    <div className="shrink-0 text-right">
      <p className={cn('text-sm font-semibold tabular-nums', states.available > 0 ? STATE_STYLES.available.text : 'text-muted-foreground')}>
        {states.available}/{count}
      </p>
      <p className="text-[11px] text-muted-foreground">
        {states.outOfService > 0 ? `${states.outOfService} HS` : states.available > 0 ? 'libres' : states.occupied > 0 ? 'occupés' : 'sans info'}
      </p>
    </div>
  );
}

export function AddressBlock({ poi }: { poi: Poi }) {
  const address = formatPoiAddress(poi);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Adresse copiée');
    } catch {
      toast.error("Impossible de copier l'adresse");
    }
  };

  return (
    <div className="island-subtle flex items-center gap-3 rounded-2xl py-2 pr-2 pl-3">
      <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <p className="min-w-0 flex-1 text-sm">{address}</p>
      <IconAction label="Copier l'adresse" onClick={copy}>
        <Copy className="size-4" />
      </IconAction>
    </div>
  );
}

export async function sharePoi(poi: Poi): Promise<void> {
  const url = `${window.location.origin}/station/${poi.id}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: displayName(poi), url });
    } catch {
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Lien copié dans le presse-papiers');
  } catch {
    toast.error('Impossible de copier le lien');
  }
}

export function ActionBar({ poi }: { poi: Poi }) {
  const share = () => sharePoi(poi);

  return (
    <div className="flex items-center gap-2 border-t border-[var(--island-separator-bg)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Button asChild className="h-11 flex-1 rounded-2xl text-sm active:scale-[0.98]">
        <a href={getGoogleMapsUrl(poi)} target="_blank" rel="noopener noreferrer">
          <Navigation className="size-4" aria-hidden />
          Itinéraire
        </a>
      </Button>
      <IconAction label="Ouvrir dans Waze" size="lg" asChild>
        <a href={getWazeUrl(poi)} target="_blank" rel="noopener noreferrer">
          <SiWaze size={16} />
        </a>
      </IconAction>
      <IconAction label="Ouvrir dans Plans" size="lg" asChild>
        <a href={getAppleMapsUrl(poi)} target="_blank" rel="noopener noreferrer">
          <SiApple size={16} />
        </a>
      </IconAction>
      <IconAction label="Partager" size="lg" onClick={share}>
        <Share2 className="size-4" />
      </IconAction>
    </div>
  );
}

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

export function Pill({
  children,
  icon: Icon,
  tone = 'neutral',
}: {
  children: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  tone?: 'neutral' | 'positive' | 'warning';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        tone === 'positive' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        tone === 'warning' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
        tone === 'neutral' && 'island-subtle text-foreground/80',
      )}
    >
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}

export function IconAction({
  label,
  children,
  onClick,
  asChild,
  size = 'default',
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  asChild?: boolean;
  size?: 'default' | 'lg';
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          onClick={onClick}
          asChild={asChild}
          className={cn(
            'shrink-0 rounded-full text-muted-foreground hover:text-foreground active:scale-[0.96]',
            size === 'lg' && 'island-interactive size-11 rounded-2xl text-foreground',
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
