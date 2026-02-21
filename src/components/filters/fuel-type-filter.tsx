"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { FUEL_LABELS, FUEL_NAMES } from "@/lib/constants";
import { useFilterStore } from "@/stores/filter-store";
import { Info } from "lucide-react";
import type { FuelType } from "@/types/station";

const FUEL_TYPES = Object.keys(FUEL_LABELS) as FuelType[];

export function FuelTypeFilter() {
  const fuelTypes = useFilterStore((s) => s.fuelTypes);
  const toggleFuelType = useFilterStore((s) => s.toggleFuelType);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Type de carburant</h4>
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Info className="size-3 shrink-0 text-primary/70" />
        Sélectionnez un carburant pour afficher les prix sur la carte
      </p>
      <div className="space-y-2">
        {FUEL_TYPES.map((fuel) => (
          <label key={fuel} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={fuelTypes.includes(fuel)}
              onCheckedChange={() => toggleFuelType(fuel)}
            />
            <span className="text-sm">
              <span className="font-medium">{FUEL_LABELS[fuel]}</span>
              <span className="text-muted-foreground">
                {" "}
                — {FUEL_NAMES[fuel]}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
