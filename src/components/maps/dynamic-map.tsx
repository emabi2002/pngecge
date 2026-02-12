'use client';

import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues with Leaflet
export const CoverageMapDynamic = dynamic(
  () => import('./coverage-map').then((mod) => mod.CoverageMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center rounded-lg bg-slate-100">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="mt-2 text-sm text-slate-500">Loading map...</p>
        </div>
      </div>
    ),
  }
);
