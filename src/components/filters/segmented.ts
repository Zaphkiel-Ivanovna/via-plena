export const SEGMENTED_GROUP_CLASS = 'island-subtle w-full rounded-xl p-1';

export const SUBTLE_SURFACE_CLASS = 'border border-[var(--island-subtle-border)] bg-[var(--island-subtle-bg)]';

export const CHIP_ITEM_CLASS =
  `${SUBTLE_SURFACE_CLASS} text-muted-foreground hover:bg-[var(--island-interactive-hover-bg)] hover:text-foreground data-[state=on]:border-emerald-500/40 data-[state=on]:bg-emerald-500/10 data-[state=on]:text-emerald-700 dark:data-[state=on]:text-emerald-400`;

export const SEGMENTED_ITEM_CLASS =
  'h-8 flex-auto shrink-0 gap-1.5 rounded-lg px-3 text-xs text-muted-foreground transition-[color,background-color,box-shadow] hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm dark:data-[state=on]:bg-[var(--island-interactive-hover-bg)] dark:data-[state=on]:shadow-none';
