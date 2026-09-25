'use client'

import { DEFAULT_MAP_THEME } from '@/lib/constants'
import type { Coordinates } from '@/types/geo'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewMode = 'map' | 'list'

interface AppState {
  location: Coordinates | null
  viewMode: ViewMode
  selectedPoiId: string | null
  searchTerm: string
  mapTheme: string
  markerSize: number
  setLocation: (location: Coordinates | null) => void
  setViewMode: (mode: ViewMode) => void
  setSelectedPoi: (id: string | null) => void
  setSearchTerm: (term: string) => void
  setMapTheme: (theme: string) => void
  setMarkerSize: (size: number) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      location: null,
      viewMode: 'map',
      selectedPoiId: null,
      searchTerm: '',
      mapTheme: DEFAULT_MAP_THEME,
      markerSize: 1,
      setLocation: (location) => set({ location }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSelectedPoi: (selectedPoiId) => set({ selectedPoiId }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setMapTheme: (mapTheme) => set({ mapTheme }),
      setMarkerSize: (markerSize) => set({ markerSize }),
    }),
    {
      name: 'viaplena-settings',
      partialize: (state) => ({ mapTheme: state.mapTheme, markerSize: state.markerSize }),
    },
  ),
)
