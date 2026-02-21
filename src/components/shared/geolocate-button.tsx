'use client';

import { useState, useCallback, useRef } from 'react';
import { LocateFixed, Loader2 } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

export function GeolocateButton() {
  const setLocation = useAppStore((s) => s.setLocation);
  const loadingRef = useRef(false);
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(() => {
    if (loadingRef.current || !navigator.geolocation) return;
    loadingRef.current = true;
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        loadingRef.current = false;
        setLoading(false);
      },
      () => {
        loadingRef.current = false;
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [setLocation]);

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="island-interactive flex items-center justify-center size-8 rounded-xl text-muted-foreground transition-all hover:text-foreground disabled:opacity-50"
      title="Me localiser"
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <LocateFixed className="size-3.5" />
      )}
    </button>
  );
}
