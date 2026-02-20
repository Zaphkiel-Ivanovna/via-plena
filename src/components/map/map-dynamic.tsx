import dynamic from 'next/dynamic';
import { Fuel } from 'lucide-react';

const MapDynamic = dynamic(() => import('./map-container'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black/90">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <div className="relative flex items-center justify-center size-12 rounded-full bg-primary/10 border border-primary/20">
          <Fuel className="size-5 text-primary animate-pulse" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
    </div>
  ),
});

export { MapDynamic };
