'use client';

import { useEffect, useRef, useState } from 'react';
import { maplibregl } from '@/lib/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPinOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getThemeUrl } from '@/lib/constants';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';

interface StationMapProps {
  latitude: number;
  longitude: number;
  name: string;
  className?: string;
}

const ROUTE_SOURCE = 'station-route';
const EMERALD = '#10b981';

function dotElement(kind: 'station' | 'user'): HTMLDivElement {
  const el = document.createElement('div');
  el.className =
    kind === 'station'
      ? 'size-4 rounded-full border-[3px] border-white bg-emerald-500 shadow-[0_0_0_6px_rgb(16_185_129/0.25)]'
      : 'size-3.5 rounded-full border-2 border-white bg-foreground/80 shadow-[0_0_0_5px_rgb(113_113_122/0.25)]';
  return el;
}

export function StationMap({ latitude, longitude, name, className }: StationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapTheme = useAppStore((s) => s.mapTheme);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300_000 },
    );
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: getThemeUrl(useAppStore.getState().mapTheme),
        center: [longitude, latitude],
        zoom: 14.5,
        attributionControl: { compact: true },
        cooperativeGestures: true,
      });
    } catch {
      queueMicrotask(() => setStatus('error'));
      return;
    }

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.once('load', () => setStatus('ready'));
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    new maplibregl.Marker({ element: dotElement('station') })
      .setLngLat([longitude, latitude])
      .setPopup(new maplibregl.Popup({ offset: 14, closeButton: false }).setText(name))
      .addTo(map);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, name]);

  useEffect(() => {
    mapRef.current?.setStyle(getThemeUrl(mapTheme));
  }, [mapTheme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPos) return;
    const controller = new AbortController();
    const userMarker = new maplibregl.Marker({ element: dotElement('user') })
      .setLngLat([userPos.lng, userPos.lat])
      .setPopup(new maplibregl.Popup({ offset: 12, closeButton: false }).setText('Ma position'))
      .addTo(map);

    const bounds = new maplibregl.LngLatBounds([longitude, latitude], [longitude, latitude]).extend([
      userPos.lng,
      userPos.lat,
    ]);
    map.fitBounds(bounds, { padding: 56, maxZoom: 14.5, duration: 0 });

    const drawRoute = (geometry: GeoJSON.LineString) => {
      if (map.getSource(ROUTE_SOURCE)) return;
      map.addSource(ROUTE_SOURCE, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry } });
      map.addLayer({
        id: `${ROUTE_SOURCE}-casing`,
        type: 'line',
        source: ROUTE_SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': EMERALD, 'line-width': 9, 'line-opacity': 0.18 },
      });
      map.addLayer({
        id: `${ROUTE_SOURCE}-line`,
        type: 'line',
        source: ROUTE_SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': EMERALD, 'line-width': 4 },
      });
    };

    let route: GeoJSON.LineString | null = null;
    const onStyle = () => route && drawRoute(route);
    map.on('style.load', onStyle);

    fetch(
      `https://router.project-osrm.org/route/v1/driving/${userPos.lng},${userPos.lat};${longitude},${latitude}?overview=full&geometries=geojson`,
      { signal: controller.signal },
    )
      .then((res) => res.json())
      .then((data) => {
        route = data.routes?.[0]?.geometry ?? null;
        if (!route) return;
        if (map.isStyleLoaded()) drawRoute(route);
      })
      .catch(() => {});

    return () => {
      controller.abort();
      map.off('style.load', onStyle);
      userMarker.remove();
    };
  }, [userPos, latitude, longitude]);

  return (
    <div className={cn('relative overflow-hidden rounded-2xl', className)}>
      <div ref={containerRef} className="h-full w-full" aria-label={`Carte de ${name}`} role="region" />
      {status === 'loading' && <Skeleton className="absolute inset-0 rounded-none" />}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/60 px-6 text-center">
          <MapPinOff className="size-5 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">La carte ne peut pas s&apos;afficher sur cet appareil.</p>
        </div>
      )}
    </div>
  );
}
