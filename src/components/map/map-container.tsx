'use client';

import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createRoot } from 'react-dom/client';
import { ALL_MAP_THEMES, DEFAULT_CENTER, DEFAULT_ZOOM } from '@/lib/constants';
import { useAppStore } from '@/stores/app-store';
import { useFilterStore } from '@/stores/filter-store';
import { useStations } from '@/hooks/use-stations';
import { StationMarker } from './station-marker';
import { UserLocationMarker } from './user-location-marker';
import type { GasStation } from '@/types/station';

function getThemeUrl(themeId: string) {
  return ALL_MAP_THEMES.find((t) => t.id === themeId)?.url ?? ALL_MAP_THEMES[0].url;
}

export default function MapContainer() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  const location = useAppStore((s) => s.location);
  const selectedStationId = useAppStore((s) => s.selectedStationId);
  const setSelectedStation = useAppStore((s) => s.setSelectedStation);
  const mapTheme = useAppStore((s) => s.mapTheme);
  const fuelTypes = useFilterStore((s) => s.fuelTypes);
  const { data: stations } = useStations();

  const activeFuelType = fuelTypes.length === 1 ? fuelTypes[0] : undefined;

  const handleMarkerClick = useCallback(
    (station: GasStation) => {
      setSelectedStation(station.id);
    },
    [setSelectedStation]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const center = location
      ? { lng: location.longitude, lat: location.latitude }
      : { lng: DEFAULT_CENTER.longitude, lat: DEFAULT_CENTER.latitude };

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getThemeUrl(mapTheme),
      center: [center.lng, center.lat],
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setStyle(getThemeUrl(mapTheme));
  }, [mapTheme]);

  useEffect(() => {
    if (!mapRef.current || !location) return;
    mapRef.current.flyTo({
      center: [location.longitude, location.latitude],
      zoom: DEFAULT_ZOOM,
    });
  }, [location]);

  useEffect(() => {
    if (!mapRef.current || !location) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([location.longitude, location.latitude]);
      return;
    }

    const el = document.createElement('div');
    const root = createRoot(el);
    root.render(<UserLocationMarker />);

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([location.longitude, location.latitude])
      .addTo(mapRef.current);

    userMarkerRef.current = marker;
  }, [location]);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!stations) return;

    stations.forEach((station) => {
      const el = document.createElement('div');
      const root = createRoot(el);
      root.render(
        <StationMarker
          station={station}
          fuelType={activeFuelType}
          isSelected={station.id === selectedStationId}
        />
      );

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([station.longitude, station.latitude])
        .addTo(mapRef.current!);

      el.addEventListener('click', () => handleMarkerClick(station));

      markersRef.current.push(marker);
    });
  }, [stations, selectedStationId, activeFuelType, handleMarkerClick]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}
