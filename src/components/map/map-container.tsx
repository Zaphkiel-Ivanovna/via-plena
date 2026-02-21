'use client';

import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createRoot } from 'react-dom/client';
import { DEFAULT_CENTER, DEFAULT_ZOOM, getThemeUrl } from '@/lib/constants';
import { createCircleGeoJSON } from '@/lib/geo-utils';
import { useAppStore } from '@/stores/app-store';
import { useFilterStore } from '@/stores/filter-store';
import { useStations } from '@/hooks/use-stations';
import { StationMarker } from './station-marker';
import { UserLocationMarker } from './user-location-marker';
import type { GasStation } from '@/types/station';
import type { Feature, Polygon } from 'geojson';

const RADIUS_SOURCE_ID = 'radius-circle';
const RADIUS_FILL_LAYER = 'radius-circle-fill';
const RADIUS_LINE_LAYER = 'radius-circle-line';

export default function MapContainer() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  const location = useAppStore((s) => s.location);
  const selectedStationId = useAppStore((s) => s.selectedStationId);
  const setSelectedStation = useAppStore((s) => s.setSelectedStation);
  const mapTheme = useAppStore((s) => s.mapTheme);
  const markerSize = useAppStore((s) => s.markerSize);
  const fuelTypes = useFilterStore((s) => s.fuelTypes);
  const radius = useFilterStore((s) => s.radius);
  const { data: stations, isLoading } = useStations();

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

  // Radius circle layer
  const addRadiusCircle = useCallback((map: maplibregl.Map, lat: number, lng: number, radiusKm: number) => {
    const geojson = createCircleGeoJSON(lat, lng, radiusKm);

    if (map.getSource(RADIUS_SOURCE_ID)) {
      (map.getSource(RADIUS_SOURCE_ID) as maplibregl.GeoJSONSource).setData(geojson as Feature<Polygon>);
    } else {
      map.addSource(RADIUS_SOURCE_ID, {
        type: 'geojson',
        data: geojson as Feature<Polygon>,
      });
      map.addLayer({
        id: RADIUS_FILL_LAYER,
        type: 'fill',
        source: RADIUS_SOURCE_ID,
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.08,
        },
      });
      map.addLayer({
        id: RADIUS_LINE_LAYER,
        type: 'line',
        source: RADIUS_SOURCE_ID,
        paint: {
          'line-color': '#3b82f6',
          'line-width': 1.5,
          'line-opacity': 0.4,
          'line-dasharray': [4, 4],
        },
      });
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !location) return;

    const update = () => addRadiusCircle(map, location.latitude, location.longitude, radius);

    if (map.isStyleLoaded()) {
      update();
    } else {
      map.once('style.load', update);
    }
  }, [location, radius, addRadiusCircle]);

  // Re-add radius circle after style change (theme switch removes all layers)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onStyleData = () => {
      if (location && !map.getSource(RADIUS_SOURCE_ID)) {
        addRadiusCircle(map, location.latitude, location.longitude, radius);
      }
    };

    map.on('styledata', onStyleData);
    return () => { map.off('styledata', onStyleData); };
  }, [location, radius, addRadiusCircle]);

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
          scale={markerSize}
          isSelected={station.id === selectedStationId}
        />
      );

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([station.longitude, station.latitude])
        .addTo(mapRef.current!);

      el.addEventListener('click', () => handleMarkerClick(station));

      markersRef.current.push(marker);
    });
  }, [stations, selectedStationId, activeFuelType, markerSize, handleMarkerClick]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
      {(isLoading || stations) && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <div className="island-panel flex items-center gap-2.5 rounded-2xl px-4 py-2.5 backdrop-blur-2xl backdrop-saturate-[180%]">
            {isLoading ? (
              <>
                <div className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  Chargement des stations...
                </span>
              </>
            ) : (
              <span className="text-xs font-medium text-muted-foreground">
                {stations!.length} station{stations!.length > 1 ? 's' : ''} trouvée{stations!.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
