'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { TILE_STYLE_URL } from '@/lib/constants';

interface StationMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

export function StationMap({ latitude, longitude, name }: StationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  // Try to get user position
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: TILE_STYLE_URL,
      center: [longitude, latitude],
      zoom: 14,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      new maplibregl.Marker({ color: '#6366f1' })
        .setLngLat([longitude, latitude])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText(name))
        .addTo(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, name]);

  // Add user marker + route when user position is available
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPos) return;

    const onReady = () => {
      new maplibregl.Marker({ color: '#22c55e' })
        .setLngLat([userPos.lng, userPos.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText('Ma position'))
        .addTo(map);

      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([longitude, latitude]);
      bounds.extend([userPos.lng, userPos.lat]);
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 });

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userPos.lng},${userPos.lat};${longitude},${latitude}?overview=full&geometries=geojson`;

      fetch(osrmUrl)
        .then((res) => res.json())
        .then((data) => {
          if (!data.routes?.[0]) return;
          const route = data.routes[0].geometry;

          if (map.getSource('route')) return;

          map.addSource('route', {
            type: 'geojson',
            data: { type: 'Feature', properties: {}, geometry: route },
          });

          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#6366f1',
              'line-width': 4,
              'line-opacity': 0.7,
            },
          });
        })
        .catch(() => {});
    };

    if (map.isStyleLoaded()) {
      onReady();
    } else {
      map.on('load', onReady);
    }
  }, [userPos, latitude, longitude]);

  return (
    <div
      ref={containerRef}
      className="h-64 w-full rounded-2xl overflow-hidden border border-white/[0.08]"
    />
  );
}
