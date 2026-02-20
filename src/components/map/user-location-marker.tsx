'use client';

export function UserLocationMarker() {
  return (
    <div className="relative flex items-center justify-center">
      <span className="absolute h-6 w-6 animate-ping rounded-full bg-blue-400 opacity-40" />
      <span className="relative h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-md" />
    </div>
  );
}
