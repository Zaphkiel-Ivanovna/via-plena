'use client';

import { useRef, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

export function SearchInput() {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setSearchTerm = useAppStore((s) => s.setSearchTerm);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSearchTerm(value.trim());
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, setSearchTerm]);

  return (
    <div className="relative w-full group">
      <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
      <input
        type="search"
        placeholder="Rechercher une station..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="island-interactive w-full rounded-xl px-3 py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 focus:ring-primary/20 focus:border-primary/40"
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
