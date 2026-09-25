'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { isMapThemeDark } from '@/lib/constants';

export function useMapThemeClass(): boolean {
  const mapTheme = useAppStore((s) => s.mapTheme);
  const dark = isMapThemeDark(mapTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return dark;
}
