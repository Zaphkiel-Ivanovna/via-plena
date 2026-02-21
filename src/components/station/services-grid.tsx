'use client';

import { SERVICE_LABELS, SERVICE_ICONS } from '@/lib/constants';
import { BlurFade } from '@/components/magicui/blur-fade';
import type { StationService } from '@/types/station';

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
