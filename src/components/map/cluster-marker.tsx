interface ClusterMarkerProps {
  count: number;
  scale?: number;
}

export function ClusterMarker({ count, scale = 1 }: ClusterMarkerProps) {
  const size = (count < 10 ? 36 : count < 100 ? 44 : 56) * scale;
  return (
    <div
      className="flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-lg ring-2 ring-white/80 backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {count}
    </div>
  );
}
