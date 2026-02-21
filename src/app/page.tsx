'use client';

import { useEffect } from 'react';
import { MapDynamic } from '@/components/map/map-dynamic';
import { StationList } from '@/components/station/station-list';
import { StationDetail } from '@/components/station/station-detail';
import { HeaderIsland } from '@/components/layout/header-island';
import { FilterIsland } from '@/components/layout/filter-island';
import { useAppStore } from '@/stores/app-store';
import { useGeolocation } from '@/hooks/use-geolocation';
import { isMapThemeDark, DEFAULT_CENTER } from '@/lib/constants';

export default function Home() {
  const viewMode = useAppStore((s) => s.viewMode);
  const setLocation = useAppStore((s) => s.setLocation);
  const mapTheme = useAppStore((s) => s.mapTheme);
  const { location, error, loading, requestLocation } = useGeolocation();

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (location) {
      setLocation(location);
    } else if (error && !loading) {
      setLocation(DEFAULT_CENTER);
    }
  }, [location, error, loading, setLocation]);

  useEffect(() => {
    const html = document.documentElement;
    if (isMapThemeDark(mapTheme)) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [mapTheme]);

  const isDark = isMapThemeDark(mapTheme);

  return (
    <div className={`relative h-dvh w-full overflow-hidden ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      <div className="absolute inset-0">
        <MapDynamic />
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
            <StationList />
          </div>
        </div>
      )}

      <StationDetail />
    </div>
  );
}
