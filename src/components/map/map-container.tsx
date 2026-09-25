'use client';

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { maplibregl } from '@/lib/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createRoot, type Root } from 'react-dom/client';
import Supercluster, {
  type AnyProps,
  type ClusterFeature as SuperclusterClusterFeature,
  type PointFeature as SuperclusterPointFeature,
} from 'supercluster';
import { DEFAULT_CENTER, DEFAULT_ZOOM, getThemeUrl } from '@/lib/constants';
import { createCircleGeoJSON } from '@/lib/geo-utils';
import { useAppStore } from '@/stores/app-store';
import { useFilterStore } from '@/stores/filter-store';
import { StationMarker } from './station-marker';
import { ClusterMarker } from './cluster-marker';
import { UserLocationMarker } from './user-location-marker';
import type { Poi } from '@/lib/poi';
import type { Feature, Polygon, Point } from 'geojson';
import { MapPinOff } from 'lucide-react';

type PoiClusterProps = { poiId: string };
type ClusterFeature = SuperclusterClusterFeature<AnyProps>;
type PointFeature = SuperclusterPointFeature<PoiClusterProps>;

const RADIUS_SOURCE_ID = 'radius-circle';
const RADIUS_FILL_LAYER = 'radius-circle-fill';
const RADIUS_LINE_LAYER = 'radius-circle-line';

interface MapContainerProps {
  pois: Poi[];
}

export default function MapContainer({ pois }: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; root: Root; el: HTMLDivElement; clickHandler: () => void }>>(new Map());
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  const location = useAppStore((s) => s.location);
  const selectedPoiId = useAppStore((s) => s.selectedPoiId);
  const setSelectedPoi = useAppStore((s) => s.setSelectedPoi);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const mapTheme = useAppStore((s) => s.mapTheme);
  const markerSize = useAppStore((s) => s.markerSize);
  const fuelTypes = useFilterStore((s) => s.fuelTypes);
  const radius = useFilterStore((s) => s.radius);

  const activeFuelName = fuelTypes.length === 1 ? fuelTypes[0] : undefined;

  const handleMarkerClick = useCallback(
    (poi: Poi) => {
      setSelectedPoi(poi.id);
    },
    [setSelectedPoi],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const center = location
      ? { lng: location.longitude, lat: location.latitude }
      : { lng: DEFAULT_CENTER.longitude, lat: DEFAULT_CENTER.latitude };

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: getThemeUrl(mapTheme),
        center: [center.lng, center.lat],
        zoom: DEFAULT_ZOOM,
      });
    } catch {
      queueMicrotask(() => setMapUnavailable(true));
      return;
    }

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
    setSelectedPoi(null);
    mapRef.current.flyTo({
      center: [location.longitude, location.latitude],
      zoom: DEFAULT_ZOOM,
    });
  }, [location, setSelectedPoi]);

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

  const addRadiusCircle = useCallback(
    (map: maplibregl.Map, lat: number, lng: number, radiusKm: number) => {
      const geojson = createCircleGeoJSON(lat, lng, radiusKm);

      if (map.getSource(RADIUS_SOURCE_ID)) {
        (map.getSource(RADIUS_SOURCE_ID) as maplibregl.GeoJSONSource).setData(
          geojson as Feature<Polygon>,
        );
      } else {
        map.addSource(RADIUS_SOURCE_ID, {
          type: 'geojson',
          data: geojson as Feature<Polygon>,
        });
        map.addLayer({
          id: RADIUS_FILL_LAYER,
          type: 'fill',
          source: RADIUS_SOURCE_ID,
          paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.08 },
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
    },
    [],
  );

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onStyleData = () => {
      if (location && !map.getSource(RADIUS_SOURCE_ID)) {
        addRadiusCircle(map, location.latitude, location.longitude, radius);
      }
    };

    map.on('styledata', onStyleData);
    return () => {
      map.off('styledata', onStyleData);
    };
  }, [location, radius, addRadiusCircle]);

  const routeAnimRef = useRef<number | null>(null);
  const routeAbortedRef = useRef(false);
  const selectedPoi = useMemo(
    () => (selectedPoiId ? pois.find((p) => p.id === selectedPoiId) ?? null : null),
    [pois, selectedPoiId],
  );
  const selectedLng = selectedPoi?.lng;
  const selectedLat = selectedPoi?.lat;
  const hadSelectionRef = useRef(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const ROUTE_SOURCE = 'route-to-station';
    const ROUTE_GLOW = 'route-to-station-glow';
    const ROUTE_BG = 'route-to-station-bg';
    const ROUTE_LINE = 'route-to-station-line';

    routeAbortedRef.current = false;

    const cleanup = () => {
      routeAbortedRef.current = true;
      if (routeAnimRef.current) cancelAnimationFrame(routeAnimRef.current);
      routeAnimRef.current = null;
      try {
        for (const id of [ROUTE_LINE, ROUTE_BG, ROUTE_GLOW]) {
          if (map.getLayer(id)) map.removeLayer(id);
        }
        if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE);
      } catch {
      }
    };

    const hadSelection = hadSelectionRef.current;
    hadSelectionRef.current = selectedPoiId !== null;

    if (!selectedPoiId || !location || selectedLng === undefined || selectedLat === undefined) {
      cleanup();
      if (hadSelection && !selectedPoiId && location && map.getContainer()?.clientHeight) {
        try {
          map.flyTo({
            center: [location.longitude, location.latitude],
            zoom: DEFAULT_ZOOM,
          });
        } catch {}
      }
      return;
    }

    const poi = { lng: selectedLng, lat: selectedLat };

    const drawRoute = () => {
      if (routeAbortedRef.current || !map.getContainer()?.clientHeight) return;
      try {
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([location.longitude, location.latitude]);
        bounds.extend([poi.lng, poi.lat]);
        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 80, right: 420 },
          maxZoom: 14,
        });
      } catch {
      }

      const url = `https://router.project-osrm.org/route/v1/driving/${location.longitude},${location.latitude};${poi.lng},${poi.lat}?overview=full&geometries=geojson`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (routeAbortedRef.current || !data.routes?.[0] || !mapRef.current) return;
          cleanup();
          routeAbortedRef.current = false;

          const geojson = {
            type: 'Feature' as const,
            properties: {},
            geometry: data.routes[0].geometry,
          };

          map.addSource(ROUTE_SOURCE, { type: 'geojson', data: geojson });

          map.addLayer({
            id: ROUTE_GLOW,
            type: 'line',
            source: ROUTE_SOURCE,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#6366f1',
              'line-width': 14,
              'line-opacity': 0,
              'line-blur': 12,
            },
          });

          map.addLayer({
            id: ROUTE_BG,
            type: 'line',
            source: ROUTE_SOURCE,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#312e81',
              'line-width': 6,
              'line-opacity': 0,
            },
          });

          map.addLayer({
            id: ROUTE_LINE,
            type: 'line',
            source: ROUTE_SOURCE,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#818cf8',
              'line-width': 4,
              'line-opacity': 0,
            },
          });

          const coords = geojson.geometry.coordinates as [number, number][];
          const totalPoints = coords.length;
          const duration = 1500;
          const startTime = performance.now();

          const animate = (now: number) => {
            if (routeAbortedRef.current || !mapRef.current || !map.getLayer(ROUTE_LINE)) return;
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const pointCount = Math.max(2, Math.floor(eased * totalPoints));

            const partialCoords = coords.slice(0, pointCount);
            const partialGeojson = {
              type: 'Feature' as const,
              properties: {},
              geometry: {
                type: 'LineString' as const,
                coordinates: partialCoords,
              },
            };

            try {
              (map.getSource(ROUTE_SOURCE) as maplibregl.GeoJSONSource)?.setData(partialGeojson);

              const opacity = Math.max(0, Math.min(progress * 2, 1));
              map.setPaintProperty(ROUTE_GLOW, 'line-opacity', opacity * 0.15);
              map.setPaintProperty(ROUTE_BG, 'line-opacity', opacity * 0.6);
              map.setPaintProperty(ROUTE_LINE, 'line-opacity', opacity * 0.9);
            } catch {
              return;
            }

            if (progress < 1) {
              routeAnimRef.current = requestAnimationFrame(animate);
            } else {
              routeAnimRef.current = null;
            }
          };

          routeAnimRef.current = requestAnimationFrame(animate);
        })
        .catch(() => {});
    };

    if (map.isStyleLoaded()) {
      drawRoute();
    } else {
      map.once('style.load', drawRoute);
    }

    return cleanup;
  }, [selectedPoiId, selectedLng, selectedLat, location]);

  useEffect(() => {
    if (!selectedPoiId || !pois.length) return;
    if (!pois.some((p) => p.id === selectedPoiId)) {
      setSelectedPoi(null);
    }
  }, [pois, selectedPoiId, setSelectedPoi]);

  const [viewport, setViewport] = useState<{ bbox: [number, number, number, number]; zoom: number } | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const update = () => {
      const b = map.getBounds();
      setViewport({
        bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
        zoom: Math.round(map.getZoom()),
      });
    };
    update();
    map.on('moveend', update);
    return () => {
      map.off('moveend', update);
    };
  }, []);

  const poisById = useMemo(() => new Map(pois.map((p) => [p.id, p])), [pois]);

  const clusterIndex = useMemo(() => {
    const index = new Supercluster<PoiClusterProps>({ radius: 60, maxZoom: 16 });
    index.load(
      pois.map<PointFeature>((p) => ({
        type: 'Feature',
        properties: { poiId: p.id },
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      })),
    );
    return index;
  }, [pois]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !viewport) return;

    const clusters = clusterIndex.getClusters(viewport.bbox, viewport.zoom);
    const seen = new Set<string>();

    clusters.forEach((feature) => {
      const [lng, lat] = (feature.geometry as Point).coordinates;
      const isCluster = (feature.properties as { cluster?: boolean }).cluster === true;
      const key = isCluster
        ? `c:${(feature as ClusterFeature).properties.cluster_id}`
        : `p:${(feature as PointFeature).properties.poiId}`;
      seen.add(key);

      const existing = markersRef.current.get(key);

      if (isCluster) {
        const cluster = feature as ClusterFeature;
        const count = cluster.properties.point_count as number;
        const node = <ClusterMarker count={count} scale={markerSize} />;

        if (existing) {
          existing.marker.setLngLat([lng, lat]);
          existing.el.removeEventListener('click', existing.clickHandler);
          existing.clickHandler = () => {
            const expansionZoom = clusterIndex.getClusterExpansionZoom(cluster.properties.cluster_id as number);
            map.flyTo({ center: [lng, lat], zoom: Math.min(expansionZoom, 18) });
          };
          existing.el.addEventListener('click', existing.clickHandler);
          existing.root.render(node);
          return;
        }

        const el = document.createElement('div');
        const root = createRoot(el);
        root.render(node);
        const clickHandler = () => {
          const expansionZoom = clusterIndex.getClusterExpansionZoom(cluster.properties.cluster_id as number);
          map.flyTo({ center: [lng, lat], zoom: Math.min(expansionZoom, 18) });
        };
        el.addEventListener('click', clickHandler);
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map);
        markersRef.current.set(key, { marker, root, el, clickHandler });
        return;
      }

      const point = feature as PointFeature;
      const poi = poisById.get(point.properties.poiId);
      if (!poi) return;
      const node = (
        <StationMarker
          poi={poi}
          fuelName={activeFuelName}
          scale={markerSize}
          isSelected={poi.id === selectedPoiId}
        />
      );

      if (existing) {
        existing.marker.setLngLat([lng, lat]);
        existing.el.removeEventListener('click', existing.clickHandler);
        existing.clickHandler = () => handleMarkerClick(poi);
        existing.el.addEventListener('click', existing.clickHandler);
        existing.root.render(node);
        return;
      }

      const el = document.createElement('div');
      const root = createRoot(el);
      root.render(node);
      const clickHandler = () => handleMarkerClick(poi);
      el.addEventListener('click', clickHandler);
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map);
      markersRef.current.set(key, { marker, root, el, clickHandler });
    });

    for (const [key, entry] of markersRef.current) {
      if (seen.has(key)) continue;
      entry.marker.remove();
      queueMicrotask(() => entry.root.unmount());
      markersRef.current.delete(key);
    }
  }, [clusterIndex, poisById, viewport, selectedPoiId, activeFuelName, markerSize, handleMarkerClick]);

  if (mapUnavailable) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
        <MapPinOff className="size-6 text-muted-foreground" aria-hidden />
        <p className="max-w-sm text-sm text-muted-foreground">
          La carte ne peut pas s&apos;afficher sur cet appareil. Les stations restent accessibles en liste.
        </p>
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className="island-interactive rounded-xl px-4 py-2 text-sm font-medium"
        >
          Voir la liste des stations
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
      {pois.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <div className="island-panel flex items-center gap-2.5 rounded-2xl px-4 py-2.5 backdrop-blur-2xl backdrop-saturate-[180%]">
            <span className="text-xs font-medium text-muted-foreground">
              {pois.length} station{pois.length > 1 ? 's' : ''} trouvée
              {pois.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
