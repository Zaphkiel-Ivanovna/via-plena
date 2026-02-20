'use client';

import {
  SiShell,
  SiAuchan,
  SiEdotleclerc,
  SiCarrefour,
  SiIntermarche,
  SiLidl,
  SiNetto,
} from '@icons-pack/react-simple-icons';
import { Fuel } from 'lucide-react';
import type { ComponentType } from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

const BRAND_ICONS: Record<string, { icon: ComponentType<IconProps>; color: string }> = {
  Shell: { icon: SiShell, color: '#FFD500' },
  Auchan: { icon: SiAuchan, color: '#D6180B' },
  'E.Leclerc': { icon: SiEdotleclerc, color: '#0066CC' },
  Carrefour: { icon: SiCarrefour, color: '#004E9F' },
  'Carrefour Market': { icon: SiCarrefour, color: '#004E9F' },
  'Carrefour Contact': { icon: SiCarrefour, color: '#004E9F' },
  'Carrefour Express': { icon: SiCarrefour, color: '#004E9F' },
  Intermarché: { icon: SiIntermarche, color: '#E2001A' },
  'Intermarché Contact': { icon: SiIntermarche, color: '#E2001A' },
  Lidl: { icon: SiLidl, color: '#0050AA' },
  Netto: { icon: SiNetto, color: '#FFD400' },
};

interface BrandIconProps {
  brand: string;
  size?: number;
  className?: string;
}

export function BrandIcon({ brand, size = 16, className }: BrandIconProps) {
  const entry = BRAND_ICONS[brand];

  if (entry) {
    const Icon = entry.icon;
    return <Icon size={size} color={entry.color} className={className} />;
  }

  return <Fuel size={size} className={className ?? 'text-muted-foreground'} />;
}

/**
 * Extra brand colors for brands without a Simple Icon.
 * Used by the map marker for coloring.
 */
const BRAND_COLORS: Record<string, string> = {
  TotalEnergies: '#FF0000',
  'TotalEnergies Access': '#FF0000',
  Total: '#FF0000',
  'Total Access': '#FF0000',
  BP: '#009900',
  Esso: '#003DA5',
  'Esso Express': '#003DA5',
  Avia: '#1E3A5F',
  'Système U': '#E2001A',
  'Super U': '#E2001A',
  Casino: '#E30613',
  Géant: '#E30613',
};

export function getBrandColor(brand: string): string {
  return BRAND_ICONS[brand]?.color ?? BRAND_COLORS[brand] ?? '#6B7280';
}
