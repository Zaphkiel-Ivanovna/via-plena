'use client';

import { type ComponentType, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useGetPoiById } from '@/api/generated/poi/poi';
import { useIsMobile } from '@/hooks/use-media-query';
import { formatDistanceMeters } from '@/lib/format';
import { distanceMeters, isEv, isGas, type Poi } from '@/lib/poi';
import { BrandIcon } from './brand-icon';
import {
  ActionBar,
  AddressBlock,
  EvSections,
  EvSummaryPills,
  GasSections,
  IconAction,
  Pill,
  StatusPill,
  displayName,
  gasStatus,
  useLiveCharging,
  useNow,
  type LiveCharging,
} from './poi-sections';
import {
  CreditCard,
  Maximize2,
  SearchX,
  X,
  Zap,
} from 'lucide-react';

type TitleComponents = {
  Title: ComponentType<{ className?: string; children: ReactNode }>;
  Description: ComponentType<{ className?: string; children: ReactNode }>;
};

const SHEET_TITLES: TitleComponents = { Title: SheetTitle, Description: SheetDescription };
const DRAWER_TITLES: TitleComponents = { Title: DrawerTitle, Description: DrawerDescription };

export function StationDetail() {
  const selectedPoiId = useAppStore((s) => s.selectedPoiId);
  const setSelectedPoi = useAppStore((s) => s.setSelectedPoi);
  const isMobile = useIsMobile();
  const { data: response, isError } = useGetPoiById(selectedPoiId ?? '', {
    query: { enabled: selectedPoiId !== null },
  });
  const poi = response?.status === 200 ? (response.data as Poi) : undefined;
  const notFound = isError || (response != null && response.status !== 200);

  const open = selectedPoiId !== null;
  const close = () => setSelectedPoi(null);

  const body = (titles: TitleComponents) => (
    <PanelSurface>
      {poi ? (
        <PoiBody key={poi.id} poi={poi} titles={titles} onClose={close} />
      ) : notFound ? (
        <NotFound titles={titles} onClose={close} />
      ) : (
        <LoadingBody titles={titles} />
      )}
    </PanelSurface>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && close()} modal={false}>
        <DrawerContent className="border-0 bg-transparent p-0 outline-none data-[vaul-drawer-direction=bottom]:inset-x-2 data-[vaul-drawer-direction=bottom]:bottom-2 data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[85dvh] data-[vaul-drawer-direction=bottom]:rounded-3xl data-[vaul-drawer-direction=bottom]:border-0 [&>div:first-child]:hidden">
          {body(DRAWER_TITLES)}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()} modal={false}>
      <SheetContent
        side="right"
        showCloseButton={false}
        overlayClassName="bg-transparent pointer-events-none"
        onInteractOutside={(e) => e.preventDefault()}
        className="top-3 right-3 bottom-3 h-auto gap-0 overflow-hidden rounded-3xl border-0 bg-transparent p-0 outline-none sm:max-w-md"
      >
        {body(SHEET_TITLES)}
      </SheetContent>
    </Sheet>
  );
}

function PanelSurface({ children }: { children: ReactNode }) {
  return (
    <div className="island-panel flex h-full max-h-[inherit] flex-col overflow-hidden rounded-3xl backdrop-blur-2xl backdrop-saturate-[180%]">
      {children}
    </div>
  );
}

function LoadingBody({ titles: { Title, Description } }: { titles: TitleComponents }) {
  return (
    <div className="flex flex-col" aria-busy>
      <Title className="sr-only">Chargement de la station</Title>
      <Description className="sr-only">Les informations de la station sont en cours de chargement.</Description>
      <DragHandle />
      <div className="flex items-start gap-3 p-5 pb-4">
        <Skeleton className="size-11 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-2 pt-0.5">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="flex gap-2 px-5">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 p-5">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-2xl" />
        ))}
      </div>
      <div className="flex gap-2 border-t border-[var(--island-separator-bg)] p-4">
        <Skeleton className="h-11 flex-1 rounded-2xl" />
        <Skeleton className="size-11 rounded-2xl" />
        <Skeleton className="size-11 rounded-2xl" />
      </div>
    </div>
  );
}

function NotFound({ titles: { Title, Description }, onClose }: { titles: TitleComponents; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6 text-center">
      <DragHandle />
      <div className="island-subtle flex size-12 items-center justify-center rounded-2xl">
        <SearchX className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <Title className="text-base font-semibold">Station introuvable</Title>
      <Description className="max-w-[32ch] text-sm text-muted-foreground">
        Elle n&apos;est plus référencée dans les données publiques, ou le lien est incorrect.
      </Description>
      <Button variant="outline" className="mt-2 rounded-2xl" onClick={onClose}>
        Fermer
      </Button>
    </div>
  );
}

function DragHandle() {
  return <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/25 md:hidden" aria-hidden />;
}

function PoiBody({ poi, titles, onClose }: { poi: Poi; titles: TitleComponents; onClose: () => void }) {
  const now = useNow();
  const charging = useLiveCharging(poi);

  return (
    <div className="flex min-h-0 flex-1 flex-col animate-in fade-in-0 slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
      <DragHandle />
      <PoiHeader poi={poi} titles={titles} onClose={onClose} now={now} charging={charging} />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5" data-vaul-no-drag>
        <div className="space-y-6">
          {isGas(poi) && <GasSections data={poi.data} now={now} />}
          {isEv(poi) && charging && <EvSections data={poi.data} charging={charging} now={now} />}
          <AddressBlock poi={poi} />
        </div>
      </div>

      <ActionBar poi={poi} />
    </div>
  );
}

function PoiHeader({
  poi,
  titles: { Title, Description },
  onClose,
  now,
  charging,
}: {
  poi: Poi;
  titles: TitleComponents;
  onClose: () => void;
  now: Date | null;
  charging: LiveCharging | null;
}) {
  const distance = distanceMeters(poi);
  const brand = isEv(poi) ? poi.data.brandName || poi.data.operatorName : isGas(poi) ? poi.data.brand : '';
  const status = isGas(poi) ? gasStatus(poi.data, now) : null;

  return (
    <header className="px-5 pt-4 pb-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'island-subtle flex size-11 shrink-0 items-center justify-center rounded-2xl',
            isEv(poi) && 'text-emerald-500',
          )}
        >
          {isEv(poi) ? <Zap className="size-5" aria-hidden /> : <BrandIcon brand={brand} size={20} />}
        </div>

        <div className="min-w-0 flex-1">
          <Title className="text-lg leading-snug font-semibold text-balance">{displayName(poi)}</Title>
          <Description className="mt-0.5 truncate text-sm text-muted-foreground">
            {[brand || (isEv(poi) ? 'Borne de recharge' : 'Station-service'), formatDistanceMeters(distance)]
              .filter(Boolean)
              .join(' · ')}
          </Description>
        </div>

        <div className="-mr-1.5 -mt-1 flex shrink-0 items-center">
          <IconAction label="Ouvrir la fiche complète" asChild>
            <Link href={`/station/${poi.id}`}>
              <Maximize2 className="size-4" />
            </Link>
          </IconAction>
          <IconAction label="Fermer" onClick={onClose}>
            <X className="size-4" />
          </IconAction>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {status && <StatusPill status={status} />}
        {isGas(poi) && poi.data.isAutomated2424 && status?.kind !== 'always' && (
          <Pill icon={CreditCard}>Automate 24h/24</Pill>
        )}
        {isEv(poi) && charging && <EvSummaryPills data={poi.data} charging={charging} now={now} />}
      </div>
    </header>
  );
}
