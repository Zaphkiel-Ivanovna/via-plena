'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { searchAddress } from '@/services/geocoding-service';
import type { AddressSuggestion } from '@/services/geocoding-service';

export function SearchInput() {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const setLocation = useAppStore((s) => s.setLocation);

  const fetchSuggestions = useCallback((query: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (query.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    timerRef.current = setTimeout(async () => {
      const results = await searchAddress(query.trim());
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setIsSearching(false);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(suggestion: AddressSuggestion) {
    setValue(suggestion.label);
    setIsOpen(false);
    setSuggestions([]);
    setLocation({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
  }

  function handleClear() {
    setValue('');
    setSuggestions([]);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full group">
      <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
      <input
        type="text"
        placeholder="Rechercher une adresse..."
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          fetchSuggestions(e.target.value);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        className="island-interactive w-full rounded-xl px-3 py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 focus:ring-primary/20 focus:border-primary/40"
      />
      {isSearching && (
        <Loader2 className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground animate-spin" />
      )}
      {!isSearching && value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 island-panel rounded-xl backdrop-blur-2xl backdrop-saturate-[180%] overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSelect(s)}
              className="flex items-start gap-2.5 w-full px-3 py-2.5 text-left transition-colors hover:bg-[var(--island-interactive-hover-bg)]"
            >
              <MapPin className="size-3.5 mt-0.5 shrink-0 text-primary/70" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{s.context}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
