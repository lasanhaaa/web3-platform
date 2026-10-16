'use client';
/* The engine's live showcase (prototype `let SHOW`): one WebGL renderer shared by every live badge canvas.
   Created once, on first use; undefined = not tried yet, null = unavailable (no WebGL / no engine). */
import { WB } from '@/lib/badges';

type Showcase = { add: (o: { canvas: HTMLCanvasElement; hit: HTMLElement; badge: unknown; onReady: () => void }) => void };
let SHOW: Showcase | null | undefined;

export function showcase(): Showcase | null {
  if (SHOW !== undefined) return SHOW;
  const wb = WB() as { createShowcase: (o: object) => Showcase | null } | null;
  if (!wb) return null; // engine not loaded (yet): try again next time
  try {
    SHOW = wb.createShowcase({ reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches });
  } catch (e) {
    console.warn(e);
    SHOW = null;
  }
  return SHOW;
}
