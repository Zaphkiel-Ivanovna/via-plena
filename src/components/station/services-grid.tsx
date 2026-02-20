'use client';

import { SERVICE_LABELS } from '@/lib/constants';
import { BlurFade } from '@/components/magicui/blur-fade';
import type { StationService } from '@/types/station';

const SERVICE_ICONS: Record<StationService, string> = {
  lavage: '\u{1F6BF}',
  boutique: '\u{1F6CD}\uFE0F',
  gonflage: '\u{1F6DE}',
  toilettes: '\u{1F6BB}',
  restauration: '\u{1F354}',
  wifi: '\u{1F4F6}',
  automate_24_24: '\u{1F552}',
  piste_poids_lourds: '\u{1F69A}',
  relais_colis: '\u{1F4E6}',
  aire_de_camping_car: '\u{1F6D0}',
  gaz_domestique: '\u{1F525}',
  bornes_electriques: '\u26A1',
};

interface ServicesGridProps {
  services: StationService[];
}

export function ServicesGrid({ services }: ServicesGridProps) {
  if (services.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {services.map((service, index) => (
        <BlurFade key={service} delay={index * 0.03}>
          <div className="island-subtle flex items-center gap-2 rounded-xl p-2.5 text-sm transition-colors hover:opacity-80">
            <span className="text-base">{SERVICE_ICONS[service]}</span>
            <span className="text-xs text-muted-foreground">{SERVICE_LABELS[service]}</span>
          </div>
        </BlurFade>
      ))}
    </div>
  );
}
