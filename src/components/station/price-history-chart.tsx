'use client';

import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetPriceHistory } from '@/api/generated/prices/prices';
import { FUEL_NAMES_ORDER, fuelFullName, fuelLabel } from '@/lib/constants';
import { formatPriceValue } from '@/lib/poi-details';
import { cn } from '@/lib/utils';
import { SEGMENTED_GROUP_CLASS, SEGMENTED_ITEM_CLASS } from '@/components/filters/segmented';

interface PriceHistoryChartProps {
  poiId: string;
  preferredFuel?: string;
}

const PERIODS = [
  { days: 30, label: '30 j' },
  { days: 90, label: '90 j' },
] as const;

const DAY_MS = 86_400_000;
const chartConfig = { price: { label: 'Prix', color: '#10b981' } } satisfies ChartConfig;

const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });
const longDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' });
const axisPrice = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Point = { t: number; price: number };

export function PriceHistoryChart({ poiId, preferredFuel }: PriceHistoryChartProps) {
  const [from] = useState(() => new Date(Date.now() - 90 * DAY_MS).toISOString().slice(0, 10));
  const [period, setPeriod] = useState<number>(90);
  const { data: response, isLoading, isError } = useGetPriceHistory(poiId, {
    granularity: 'daily',
    poiType: 'gas_station',
    from,
    limit: 2000,
  });

  const series = useMemo(() => {
    const map = new Map<string, Point[]>();
    for (const p of response?.status === 200 ? response.data.points : []) {
      const value = p.avgPrice ?? p.price;
      if (value == null) continue;
      const list = map.get(p.item) ?? [];
      list.push({ t: Date.parse(p.observedAt), price: Number(value) });
      map.set(p.item, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.t - b.t);
    return map;
  }, [response]);

  const fuels = FUEL_NAMES_ORDER.filter((f) => series.has(f));
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const fuel = picked && series.has(picked) ? picked : preferredFuel && series.has(preferredFuel) ? preferredFuel : fuels[0];

  const all = (fuel && series.get(fuel)) || [];
  const lastT = all.length ? all[all.length - 1].t : 0;
  const points = all.filter((p) => p.t >= lastT - period * DAY_MS);

  return (
    <section aria-labelledby="price-history-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="price-history-title" className="text-base font-semibold">
            Évolution des prix
          </h2>
          <p className="text-xs text-muted-foreground">Prix moyen relevé chaque jour</p>
        </div>
        <ToggleGroup
          type="single"
          spacing={1}
          value={String(period)}
          onValueChange={(v) => v && setPeriod(Number(v))}
          className={cn(SEGMENTED_GROUP_CLASS, 'w-auto')}
          aria-label="Période"
        >
          {PERIODS.map((p) => (
            <ToggleGroupItem key={p.days} value={String(p.days)} className={SEGMENTED_ITEM_CLASS}>
              {p.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3 rounded-xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <p className="rounded-2xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
          L&apos;historique n&apos;a pas pu être chargé. Réessayez dans quelques instants.
        </p>
      ) : fuels.length === 0 ? (
        <p className="rounded-2xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
          Aucun historique de prix pour cette station pour le moment.
        </p>
      ) : (
        <>
          {fuels.length > 1 && (
            <ToggleGroup
              type="single"
              spacing={1.5}
              value={fuel}
              onValueChange={(v) => v && setPicked(v)}
              className="w-full flex-wrap justify-start"
              aria-label="Carburant"
            >
              {fuels.map((f) => (
                <ToggleGroupItem
                  key={f}
                  value={f}
                  title={fuelFullName(f)}
                  className="h-8 rounded-full border border-[var(--island-subtle-border)] bg-[var(--island-subtle-bg)] px-3 text-xs text-muted-foreground hover:text-foreground data-[state=on]:border-emerald-500/40 data-[state=on]:bg-emerald-500/10 data-[state=on]:text-emerald-700 dark:data-[state=on]:text-emerald-400"
                >
                  {fuelLabel(f)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}

          {points.length < 2 ? (
            <div className="rounded-2xl bg-muted/50 px-4 py-6 text-center">
              {points[0] && (
                <p className="text-2xl font-semibold tabular-nums">
                  {formatPriceValue(points[0].price)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">€/L</span>
                </p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                Pas encore assez de relevés pour tracer une courbe. Revenez dans quelques jours.
              </p>
            </div>
          ) : (
            <>
              <HistoryStats points={points} period={period} />
              <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
                <AreaChart data={points} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-price)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--color-price)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeOpacity={0.12} />
                  <XAxis
                    dataKey="t"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(t: number) => shortDate.format(t)}
                    fontSize={11}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    domain={['dataMin - 0.02', 'dataMax + 0.02']}
                    tickFormatter={(v: number) => `${axisPrice.format(v)} €`}
                    fontSize={11}
                  />
                  <ChartTooltip
                    cursor={{ strokeOpacity: 0.2 }}
                    content={({ active, payload }) => {
                      const p = active ? (payload?.[0]?.payload as Point | undefined) : undefined;
                      if (!p) return null;
                      return (
                        <div className="rounded-xl border border-border/50 bg-background px-3 py-2 text-xs shadow-lg">
                          <p className="text-muted-foreground">{longDate.format(p.t)}</p>
                          <p className="mt-0.5 font-semibold tabular-nums">{formatPriceValue(p.price)} €/L</p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="var(--color-price)"
                    fill="url(#price-fill)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ChartContainer>
            </>
          )}
        </>
      )}
    </section>
  );
}

function HistoryStats({ points, period }: { points: Point[]; period: number }) {
  const prices = points.map((p) => p.price);
  const current = prices[prices.length - 1];
  const delta = current - prices[0];
  const cents = Math.round(Math.abs(delta) * 1000) / 10;
  const Trend = delta < 0 ? TrendingDown : TrendingUp;

  return (
    <dl className="grid grid-cols-3 gap-2">
      <Stat label="Actuel" value={formatPriceValue(current)} />
      <Stat label={`Min. ${period} j`} value={formatPriceValue(Math.min(...prices))} />
      <Stat label={`Max. ${period} j`} value={formatPriceValue(Math.max(...prices))} />
      <p className="col-span-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        {cents === 0 ? (
          <>Prix stable sur la période</>
        ) : (
          <>
            <Trend
              className={cn('size-3.5', delta < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}
              aria-hidden
            />
            <span className={cn('font-medium', delta < 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}>
              {delta < 0 ? 'Baisse' : 'Hausse'} de {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(cents)} centimes
            </span>
            depuis le premier relevé de la période
          </>
        )}
      </p>
    </dl>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--island-subtle-border)] bg-[var(--island-subtle-bg)] px-3 py-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-base font-semibold tabular-nums">
        {value}
        <span className="ml-0.5 text-[11px] font-normal text-muted-foreground">€</span>
      </dd>
    </div>
  );
}
