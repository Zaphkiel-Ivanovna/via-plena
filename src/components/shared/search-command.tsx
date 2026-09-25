'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useSearchCommunes } from '@/api/generated/communes/communes';
import { useSearchPoisInfinite } from '@/api/generated/poi/poi';
import { Fuel, MapPin, Zap } from 'lucide-react';
import { nextCursor } from '@/api/fetcher';

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const enabled = q.length >= 2;
  const communes = useSearchCommunes(
    { q, limit: 5 },
    { query: { enabled } },
  );
  const pois = useSearchPoisInfinite(
    { q, limit: 5 },
    {
      query: {
        enabled,
        getNextPageParam: (last) => nextCursor(last),
        initialPageParam: undefined,
      },
    },
  );

  const communeList =
    communes.data?.status === 200 ? communes.data.data : [];
  const firstPage = pois.data?.pages[0];
  const poiList = firstPage?.status === 200 ? firstPage.data : [];

  const go = (path: string) => {
    router.push(path);
    setOpen(false);
    setQ('');
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      <CommandInput
        placeholder="Rechercher une commune ou une station..."
        value={q}
        onValueChange={setQ}
      />
      <CommandList>
        {enabled && communeList.length === 0 && poiList.length === 0 && (
          <CommandEmpty>Aucun résultat</CommandEmpty>
        )}
        {communeList.length > 0 && (
          <CommandGroup heading="Communes">
            {communeList.map((c) => (
              <CommandItem key={c.insee} onSelect={() => go(`/prix-carburant/${c.slug}`)}>
                <MapPin className="mr-2 size-3.5 text-muted-foreground" />
                <span>{c.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {c.postalCode} · {c.departmentName}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {poiList.length > 0 && (
          <CommandGroup heading="Stations">
            {poiList.map((p) => (
              <CommandItem key={p.id} onSelect={() => go(`/station/${p.id}`)}>
                {p.type === 'ev_station' ? (
                  <Zap className="mr-2 size-3.5 text-emerald-500" />
                ) : (
                  <Fuel className="mr-2 size-3.5 text-primary" />
                )}
                <span className="truncate">{p.name}</span>
                <span className="ml-2 text-xs text-muted-foreground truncate">{p.city}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
