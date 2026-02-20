import type { FuelType, StationService } from '@/types/station';

export const FUEL_LABELS: Record<FuelType, string> = {
  gazole: 'Gazole',
  sp95: 'SP95',
  sp98: 'SP98',
  e10: 'E10',
  e85: 'E85',
  gplc: 'GPLc',
};

export const SERVICE_LABELS: Record<StationService, string> = {
  lavage: 'Lavage',
  boutique: 'Boutique',
  gonflage: 'Gonflage',
  toilettes: 'Toilettes',
  restauration: 'Restauration',
  wifi: 'Wi-Fi',
  automate_24_24: 'Automate 24/24',
  piste_poids_lourds: 'Piste poids lourds',
  relais_colis: 'Relais colis',
  aire_de_camping_car: 'Aire camping-car',
  gaz_domestique: 'Gaz domestique',
  bornes_electriques: 'Bornes electriques',
};

export interface MapTheme {
  id: string;
  label: string;
  url: string;
  preview: string;
}

export interface MapThemeCategory {
  label: string;
  dark: boolean;
  themes: MapTheme[];
}

export const MAP_THEME_CATEGORIES: MapThemeCategory[] = [
  {
    label: 'Sombre',
    dark: true,
    themes: [
      {
        id: 'dark-matter',
        label: 'Dark Matter',
        url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        preview: 'from-zinc-900 to-zinc-800',
      },
      {
        id: 'dark-matter-nolabels',
        label: 'Dark Minimal',
        url: 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json',
        preview: 'from-neutral-900 to-neutral-800',
      },
      {
        id: 'ofm-dark',
        label: 'Dark',
        url: 'https://tiles.openfreemap.org/styles/dark',
        preview: 'from-slate-900 to-slate-800',
      },
      {
        id: 'ofm-fiord',
        label: 'Fiord',
        url: 'https://tiles.openfreemap.org/styles/fiord',
        preview: 'from-slate-800 to-indigo-900',
      },
      {
        id: 'protomaps-dark',
        label: 'Proto Dark',
        url: 'https://maps.black/styles/openstreetmap-protomaps/protomaps/dark/style.json',
        preview: 'from-gray-900 to-gray-800',
      },
      {
        id: 'protomaps-black',
        label: 'Pitch Black',
        url: 'https://maps.black/styles/openstreetmap-protomaps/protomaps/black/style.json',
        preview: 'from-black to-zinc-950',
      },
    ],
  },
  {
    label: 'Clair',
    dark: false,
    themes: [
      {
        id: 'positron',
        label: 'Positron',
        url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        preview: 'from-gray-100 to-gray-200',
      },
      {
        id: 'positron-nolabels',
        label: 'Positron Minimal',
        url: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
        preview: 'from-gray-50 to-gray-100',
      },
      {
        id: 'ofm-positron',
        label: 'Positron OFM',
        url: 'https://tiles.openfreemap.org/styles/positron',
        preview: 'from-slate-50 to-slate-100',
      },
      {
        id: 'protomaps-white',
        label: 'White',
        url: 'https://maps.black/styles/openstreetmap-protomaps/protomaps/white/style.json',
        preview: 'from-white to-gray-50',
      },
      {
        id: 'protomaps-grayscale',
        label: 'Grayscale',
        url: 'https://maps.black/styles/openstreetmap-protomaps/protomaps/grayscale/style.json',
        preview: 'from-gray-200 to-gray-300',
      },
    ],
  },
  {
    label: 'Couleur',
    dark: false,
    themes: [
      {
        id: 'voyager',
        label: 'Voyager',
        url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        preview: 'from-amber-50 to-orange-100',
      },
      {
        id: 'voyager-nolabels',
        label: 'Voyager Minimal',
        url: 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json',
        preview: 'from-orange-50 to-amber-100',
      },
      {
        id: 'ofm-liberty',
        label: 'Liberty',
        url: 'https://tiles.openfreemap.org/styles/liberty',
        preview: 'from-emerald-100 to-cyan-100',
      },
      {
        id: 'ofm-bright',
        label: 'Bright',
        url: 'https://tiles.openfreemap.org/styles/bright',
        preview: 'from-sky-100 to-blue-200',
      },
      {
        id: 'protomaps-light',
        label: 'Proto Light',
        url: 'https://maps.black/styles/openstreetmap-protomaps/protomaps/light/style.json',
        preview: 'from-teal-50 to-emerald-100',
      },
    ],
  },
];

export const ALL_MAP_THEMES = MAP_THEME_CATEGORIES.flatMap((c) => c.themes);

export function isMapThemeDark(themeId: string): boolean {
  return MAP_THEME_CATEGORIES.some(
    (cat) => cat.dark && cat.themes.some((t) => t.id === themeId)
  );
}

export const DEFAULT_MAP_THEME = 'dark-matter';

export const TILE_STYLE_URL = ALL_MAP_THEMES[0].url;

export const DEFAULT_CENTER = {
  latitude: 48.8566,
  longitude: 2.3522,
};

export const DEFAULT_ZOOM = 12;

export const RADIUS_OPTIONS = [1, 2, 5, 10, 20, 50];
