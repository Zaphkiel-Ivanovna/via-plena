'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Coordinates } from '@/types/geo';
import { DEFAULT_MAP_THEME } from '@/lib/constants';

export type ViewMode = 'map' | 'list';

interface AppState {
  location: Coordinates | null;
  viewMode: ViewMode;
  selectedStationId: number | null;
  searchTerm: string;
  mapTheme: string;
  setLocation: (location: Coordinates | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedStation: (id: number | null) => void;
  setSearchTerm: (term: string) => void;
  setMapTheme: (theme: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      location: null,
      viewMode: 'map',
      selectedStationId: null,
      searchTerm: '',
      mapTheme: DEFAULT_MAP_THEME,
      setLocation: (location) => set({ location }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSelectedStation: (selectedStationId) => set({ selectedStationId }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setMapTheme: (mapTheme) => set({ mapTheme }),
    }),
    {
      name: 'viaplena-settings',
      partialize: (state) => ({ mapTheme: state.mapTheme }),
    }
  )
);
