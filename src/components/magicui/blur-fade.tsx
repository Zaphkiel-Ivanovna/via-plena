'use client';

import { useRef, type ReactNode } from 'react';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';

interface BlurFadeProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  inView?: boolean;
}

export function BlurFade({
  children,
  className,
  delay = 0,
  duration = 0.4,
  inView: inViewProp,
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inViewHook = useInView(ref, { once: true });
  const isInView = inViewProp !== undefined ? inViewProp : inViewHook;

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all',
        isInView ? 'opacity-100 blur-0 translate-y-0' : 'opacity-0 blur-sm translate-y-2',
        className
      )}
      style={{
        transitionDelay: `${delay}s`,
        transitionDuration: `${duration}s`,
      }}
    >
      {children}
    </div>
  );
}
