'use client';

import { useEffect, useMemo } from 'react';
import { MapDynamic } from '@/components/map/map-dynamic';
import { StationList } from '@/components/station/station-list';
import { StationDetail } from '@/components/station/station-detail';
import { HeaderIsland } from '@/components/layout/header-island';
import { FilterIsland } from '@/components/layout/filter-island';
import { useAppStore } from '@/stores/app-store';
import { useShallow } from 'zustand/react/shallow';
import { selectEvFilters, useFilterStore } from '@/stores/filter-store';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useMapThemeClass } from '@/hooks/use-map-theme-class';
import { evServerParams, hasEvClientFilters, matchesEvClientFilters } from '@/lib/ev-filters';
import { useGeolocation } from '@/hooks/use-geolocation';
import { DEFAULT_CENTER } from '@/lib/constants';
import { useFindPoisNearbyInfinite } from '@/api/generated/poi/poi';
import { nextCursor } from '@/api/fetcher';
import type { Poi } from '@/lib/poi';

export function HomeView() {
  const viewMode = useAppStore((s) => s.viewMode);
  const setLocation = useAppStore((s) => s.setLocation);
  const setSelectedPoi = useAppStore((s) => s.setSelectedPoi);
  const selectedPoiId = useAppStore((s) => s.selectedPoiId);
  const location = useAppStore((s) => s.location);
  const { location: geo, error, loading, requestLocation } = useGeolocation();

  const radius = useFilterStore((s) => s.radius);
  const poiType = useFilterStore((s) => s.poiType);
  const fuelTypes = useFilterStore((s) => s.fuelTypes);
  const evFilters = useFilterStore(useShallow(selectEvFilters));
  const operator = useDebouncedValue(evFilters.operator, 350);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('station');
    if (id) setSelectedPoi(id);
  }, [setSelectedPoi]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedPoiId) {
      url.searchParams.set('station', selectedPoiId);
    } else {
      url.searchParams.delete('station');
    }
    window.history.replaceState(null, '', url.toString());
  }, [selectedPoiId]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (geo) {
      setLocation(geo);
    } else if (error && !loading) {
      setLocation(DEFAULT_CENTER);
    }
  }, [geo, error, loading, setLocation]);

  const isDark = useMapThemeClass();

  const query = useFindPoisNearbyInfinite(
    {
      lat: location?.latitude ?? 0,
      lng: location?.longitude ?? 0,
      radius: radius * 1000,
      type: poiType,
      limit: 200,
      fuel: poiType !== 'ev_station' ? fuelTypes[0] : undefined,
      ...(poiType === 'ev_station' ? evServerParams({ ...evFilters, operator }) : {}),
    },
    {
      query: {
        enabled: location !== null,
        getNextPageParam: (last) => nextCursor(last),
        initialPageParam: undefined,
      },
    },
  );

  const pois = useMemo<Poi[]>(
    () =>
      (query.data?.pages.flatMap((p) => p.data as unknown as Poi[]) ?? []).filter(
        (p) =>
          Number.isFinite(p.lng) &&
          Number.isFinite(p.lat) &&
          (poiType !== 'ev_station' || !hasEvClientFilters(evFilters) || matchesEvClientFilters(p, evFilters)),
      ),
    [query.data, poiType, evFilters],
  );

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div
      className={`relative h-dvh w-full overflow-hidden ${isDark ? 'bg-black' : 'bg-gray-100'}`}
    >
      <div className="absolute inset-0">
        <MapDynamic pois={pois} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center p-3 md:p-4 lg:left-[296px]">
        <HeaderIsland />
      </div>

      <div className="pointer-events-none absolute left-0 top-0 z-10 hidden h-full pt-3 pb-3 pl-3 md:pt-4 md:pb-4 md:pl-4 lg:flex">
        <FilterIsland />
      </div>

      {viewMode === 'list' && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-3 pb-3 md:px-4 md:pb-4 lg:left-[300px]">
          <div className="island-panel w-full max-w-2xl rounded-3xl overflow-hidden max-h-[calc(100dvh-5rem)] backdrop-blur-2xl backdrop-saturate-[180%]">
            <StationList
              pois={pois}
              isLoading={query.isLoading}
              hasMore={query.hasNextPage}
              onLoadMore={() => query.fetchNextPage()}
            />
          </div>
        </div>
      )}

      <StationDetail />
    </div>
  );
}
