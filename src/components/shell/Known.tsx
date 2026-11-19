import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { zoneExists, lessonExists } from '@/lib/params';

/* 404 for links to zones or lessons that aren't in the course. Pages wrap this in <Suspense>:
   reading params outside it would tie the shared app shell to one URL (Partial Prefetching). */
type P = { route: string; zone: string; lesson?: string };
export async function Known({ params, children }: { params: Promise<P>; children: ReactNode }) {
  const { route, zone, lesson } = await params;
  if (lesson === undefined ? !zoneExists(route, zone) : !lessonExists(route, zone, lesson)) notFound();
  return children;
}
