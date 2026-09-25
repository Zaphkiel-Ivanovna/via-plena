'use client';

import { useId, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  countActiveEvFilters,
  selectEvFilters,
  useFilterStore,
  type EvBooleanFilter,
} from '@/stores/filter-store';
import { PLUG_FILTER_OPTIONS, POWER_FILTER_OPTIONS } from '@/lib/ev-filters';
import {
  Accessibility,
  CalendarCheck,
  Clock,
  CreditCard,
  Gift,
  Search,
  Unlock,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHIP_ITEM_CLASS, SEGMENTED_GROUP_CLASS, SEGMENTED_ITEM_CLASS } from './segmented';

const OPTIONS: { key: EvBooleanFilter; label: string; icon: LucideIcon }[] = [
  { key: 'freeOnly', label: 'Recharge gratuite', icon: Gift },
  { key: 'creditCard', label: 'Paiement par carte', icon: CreditCard },
  { key: 'publicAccess', label: 'Accès libre', icon: Unlock },
  { key: 'alwaysOpen', label: 'Ouvert 24h/24', icon: Clock },
  { key: 'pmrAccessible', label: 'Accessible PMR', icon: Accessibility },
  { key: 'reservable', label: 'Réservation possible', icon: CalendarCheck },
];

export function EvFilters() {
  const filters = useFilterStore(useShallow(selectEvFilters));
  const setEvFilter = useFilterStore((s) => s.setEvFilter);
  const setMinPower = useFilterStore((s) => s.setMinPower);
  const setPlugTypes = useFilterStore((s) => s.setPlugTypes);
  const setOperator = useFilterStore((s) => s.setOperator);
  const resetEvFilters = useFilterStore((s) => s.resetEvFilters);
  const active = countActiveEvFilters(filters);
  const powerHint = POWER_FILTER_OPTIONS.find((o) => o.value === filters.minPower)?.hint;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Bornes de recharge</h4>
        {active > 0 && (
          <button
            type="button"
            onClick={resetEvFilters}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Effacer ({active})
          </button>
        )}
      </div>

      <SwitchRow
        checked={filters.availableNow}
        onCheckedChange={(v) => setEvFilter('availableNow', v)}
        label={
          <span className="flex items-center gap-2">
            <LiveDot active={filters.availableNow} />
            Disponible maintenant
          </span>
        }
        description="Au moins un point libre, selon le temps réel des opérateurs"
      />

      <FilterGroup title="Puissance minimale" hint={powerHint}>
        <ToggleGroup
          type="single"
          spacing={1}
          value={String(filters.minPower ?? 'all')}
          onValueChange={(v) => v && setMinPower(v === 'all' ? undefined : Number(v))}
          className={SEGMENTED_GROUP_CLASS}
          aria-label="Puissance minimale"
        >
          {POWER_FILTER_OPTIONS.map((o) => (
            <ToggleGroupItem key={o.label} value={String(o.value ?? 'all')} aria-label={o.hint} className={SEGMENTED_ITEM_CLASS}>
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FilterGroup>

      <FilterGroup
        title="Type de prise"
        hint={filters.plugTypes.length > 1 ? 'Au moins une des prises sélectionnées' : undefined}
      >
        <ToggleGroup
          type="multiple"
          spacing={1.5}
          value={filters.plugTypes}
          onValueChange={setPlugTypes}
          className="w-full flex-wrap"
          aria-label="Type de prise"
        >
          {PLUG_FILTER_OPTIONS.map((o) => (
            <ToggleGroupItem
              key={o.value}
              value={o.value}
              className={cn(CHIP_ITEM_CLASS, 'h-8 rounded-full px-3 text-xs')}
            >
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FilterGroup>

      <FilterGroup title="Réseau ou opérateur">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={filters.operator}
            onChange={(e) => setOperator(e.target.value)}
            placeholder="Ionity, Tesla, Belib'…"
            aria-label="Réseau ou opérateur"
            className="h-9 rounded-xl pr-9 pl-8 text-sm"
          />
          {filters.operator && (
            <button
              type="button"
              onClick={() => setOperator('')}
              aria-label="Effacer le réseau"
              className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </FilterGroup>

      <FilterGroup title="Options">
        <div className="space-y-3">
          {OPTIONS.map(({ key, label, icon: Icon }) => (
            <SwitchRow
              key={key}
              checked={filters[key]}
              onCheckedChange={(v) => setEvFilter(key, v)}
              label={
                <span className="flex items-center gap-2">
                  <Icon className="size-3.5 text-muted-foreground" aria-hidden />
                  {label}
                </span>
              }
            />
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SwitchRow({
  checked,
  onCheckedChange,
  label,
  description,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: ReactNode;
  description?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-3">
      <label htmlFor={id} className="min-w-0 cursor-pointer text-sm">
        {label}
        {description && <span className="mt-0.5 block text-[11px] text-muted-foreground">{description}</span>}
      </label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-foreground/15"
      />
    </div>
  );
}

function LiveDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex size-2" aria-hidden>
      {active && (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
      )}
      <span className={active ? 'relative inline-flex size-2 rounded-full bg-emerald-500' : 'relative inline-flex size-2 rounded-full bg-muted-foreground/40'} />
    </span>
  );
}
