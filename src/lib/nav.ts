'use client';
import { useRouter } from 'next/navigation';

/* URL scheme. Zones and lessons are 1-based in the URL, 0-based in code (as in the prototype). */
export const hrefMap = () => '/academy';
export const hrefFork = () => '/academy/choose';
export const hrefRoute = (r: string, z = 0) => `/academy/${r}/${z + 1}`;
export const hrefLesson = (r: string, z: number, l: number) => `/academy/${r}/${z + 1}/${l + 1}`;
export const hrefQuiz = (r: string, z: number) => `/academy/${r}/${z + 1}/quiz`;
export const hrefBadges = () => '/badges';
export const hrefStrategies = (id?: string) => (id ? `/strategies?s=${encodeURIComponent(id)}` : '/strategies');

/** The prototype's nav objects, e.g. {screen:'lesson',r,z,l}. */
export type Nav = { screen: string; r?: string; z?: number; l?: number; id?: string };
export function hrefFor(n: Nav): string {
  switch (n.screen) {
    case 'route':
      return hrefRoute(n.r!, n.z ?? 0);
    case 'lesson':
      return hrefLesson(n.r!, n.z!, n.l!);
    case 'quiz':
      return hrefQuiz(n.r!, n.z!);
    case 'fork':
      return hrefFork();
    case 'badges':
      return hrefBadges();
    case 'strategies':
      return hrefStrategies(n.id);
    default:
      return hrefMap();
  }
}
/** go({screen:'route',r:'r1',z:1}) navigates like the prototype's go(). */
export function useGo() {
  const router = useRouter();
  return (n: Nav) => {
    router.push(hrefFor(n));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };
}
/** Parses /academy/[route]/[zone]/[lesson] params into 0-based numbers. */
export function parseZL(zone?: string | string[], lesson?: string | string[]) {
  const z = Math.max(0, parseInt(String(zone ?? '1'), 10) - 1 || 0);
  const l = lesson == null ? undefined : Math.max(0, parseInt(String(lesson), 10) - 1 || 0);
  return { z, l };
}
