'use client';

import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { MAP_THEME_CATEGORIES } from '@/lib/constants';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';

export function MapThemePicker() {
  const [open, setOpen] = useState(false);
  const mapTheme = useAppStore((s) => s.mapTheme);
  const setMapTheme = useAppStore((s) => s.setMapTheme);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'island-interactive flex items-center justify-center size-8 rounded-xl text-muted-foreground transition-all hover:text-foreground',
          open && 'text-foreground'
        )}
      >
        <Palette className="size-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="island-panel absolute right-0 top-full mt-2 z-50 w-64 max-h-[70vh] overflow-y-auto overscroll-contain rounded-2xl backdrop-blur-2xl backdrop-saturate-[180%]">
            <div className="p-2">
              {MAP_THEME_CATEGORIES.map((category, catIdx) => (
                <div key={category.label}>
                  {catIdx > 0 && <div className="island-separator mx-2 my-1.5 h-px" />}
                  <p className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    {category.label}
                  </p>
                  <div className="space-y-0.5">
                    {category.themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          setMapTheme(theme.id);
                          setOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors',
                          theme.id === mapTheme
                            ? 'island-subtle'
                            : 'hover:island-subtle'
                        )}
                      >
                        <div
                          className={cn(
                            'size-7 shrink-0 rounded-lg bg-gradient-to-br border',
                            theme.id === mapTheme ? 'border-primary/50 ring-1 ring-primary/30' : 'border-foreground/10',
                            theme.preview
                          )}
                        />
                        <span className="flex-1 text-xs font-medium">{theme.label}</span>
                        {theme.id === mapTheme && (
                          <Check className="size-3.5 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
