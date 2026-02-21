'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

// SVG path data from lucide icons (24x24 viewBox)
const ICON_PATHS: string[][] = [
  // Fuel (gas pump)
  [
    'M3 22V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v17',
    'M13 10h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 6',
    'M3 22h10',
    'M7 2v4',
    'M10.5 2v4',
  ],
  // Car
  [
    'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2',
    'M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
    'M17 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  ],
  // MapPin
  [
    'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0',
    'M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  ],
  // Gauge (speed)
  [
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
    'M12 6v2',
    'M16.24 7.76l-1.42 1.42',
    'M18 12h-2',
    'M12 18v-6.54',
  ],
  // Banknote (money)
  [
    'M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z',
    'M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    'M6 12h.01',
    'M18 12h.01',
  ],
  // Navigation
  [
    'M3 11l19-9-9 19-2-8-8-2z',
  ],
  // Droplets (fuel drop)
  [
    'M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z',
    'M12.56 14.44c1.47 0 2.67-1.21 2.67-2.71 0-.78-.38-1.51-1.14-2.13S12.75 8.22 12.56 7.5c-.19.72-.76 1.39-1.53 2.1s-1.14 1.35-1.14 2.13c0 1.5 1.2 2.71 2.67 2.71z',
    'M17 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S15.29 6.75 15 5.3c-.29 1.45-1.14 2.84-2.29 3.76S11 11.1 11 12.25c0 2.22 1.8 4.05 4 4.05z',
  ],
  // Wrench (service)
  [
    'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  ],
];

const CELL_SIZE = 80;
const ICON_SIZE = 20;

type FloatingIcon = {
  id: number;
  pos: [number, number];
  iconIndex: number;
  iteration: number;
};

export function StationBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [icons, setIcons] = useState<FloatingIcon[]>([]);

  const getPos = useCallback((): [number, number] => {
    return [
      Math.floor((Math.random() * dimensions.width) / CELL_SIZE),
      Math.floor((Math.random() * dimensions.height) / CELL_SIZE),
    ];
  }, [dimensions]);

  const generateIcons = useCallback(
    (count: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        pos: getPos(),
        iconIndex: Math.floor(Math.random() * ICON_PATHS.length),
        iteration: 0,
      })),
    [getPos]
  );

  const updateIconPosition = useCallback(
    (iconId: number) => {
      setIcons((current) => {
        const item = current[iconId];
        if (!item || item.id !== iconId) return current;
        const next = current.slice();
        next[iconId] = {
          ...item,
          pos: getPos(),
          iconIndex: Math.floor(Math.random() * ICON_PATHS.length),
          iteration: item.iteration + 1,
        };
        return next;
      });
    },
    [getPos]
  );

  useEffect(() => {
    if (dimensions.width && dimensions.height) {
      setIcons(generateIcons(30));
    }
  }, [dimensions.width, dimensions.height, generateIcons]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions((prev) => {
          const w = entry.contentRect.width;
          const h = entry.contentRect.height;
          if (prev.width === w && prev.height === h) return prev;
          return { width: w, height: h };
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full overflow-hidden',
        '[mask-image:radial-gradient(ellipse_at_center,white_20%,transparent_70%)]'
      )}
    >
      <svg className="absolute inset-0 h-full w-full">
        {/* Grid lines */}
        {Array.from({ length: Math.ceil(dimensions.width / CELL_SIZE) + 1 }, (_, i) => (
          <line
            key={`v-${i}`}
            x1={i * CELL_SIZE}
            y1={0}
            x2={i * CELL_SIZE}
            y2={dimensions.height}
            stroke="white"
            strokeOpacity={0.06}
            strokeWidth={0.5}
          />
        ))}
        {Array.from({ length: Math.ceil(dimensions.height / CELL_SIZE) + 1 }, (_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={i * CELL_SIZE}
            x2={dimensions.width}
            y2={i * CELL_SIZE}
            stroke="white"
            strokeOpacity={0.06}
            strokeWidth={0.5}
          />
        ))}
        {icons.map(({ id, pos: [x, y], iconIndex, iteration }, index) => {
          const paths = ICON_PATHS[iconIndex];
          const cx = x * CELL_SIZE + (CELL_SIZE - ICON_SIZE) / 2;
          const cy = y * CELL_SIZE + (CELL_SIZE - ICON_SIZE) / 2;

          return (
            <motion.g
              key={`${id}-${iteration}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{
                duration: 3,
                repeat: 1,
                delay: index * 0.15,
                repeatType: 'reverse',
                repeatDelay: 1,
              }}
              onAnimationComplete={() => updateIconPosition(id)}
              transform={`translate(${cx}, ${cy})`}
            >
              <svg
                width={ICON_SIZE}
                height={ICON_SIZE}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                {paths.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </svg>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
