'use client';

import { Map, List } from 'lucide-react';
import { useAppStore, type ViewMode } from '@/stores/app-store';
import { cn } from '@/lib/utils';

export function ViewToggle() {
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);

  return (
    <div className="island-interactive flex items-center rounded-xl p-0.5">
      <ToggleItem
        active={viewMode === 'map'}
        onClick={() => setViewMode('map')}
        icon={<Map className="size-3.5" />}
        label="Carte"
      />
      <ToggleItem
        active={viewMode === 'list'}
        onClick={() => setViewMode('list')}
        icon={<List className="size-3.5" />}
        label="Liste"
      />
    </div>
  );
}

function ToggleItem({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
