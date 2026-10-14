'use client';
import { createStore } from './store';
import { S, commit } from './progress';

/* The open lesson's player state. OWNER: the lesson port (extend freely, keep seekLesson's signature).
   Wega calls seekLesson() for "Rewatch from mm:ss" buttons inside its answers. */
export const player = createStore({
  /** lesson key ('r1.1.3') of the lesson on screen, null when no lesson is open */
  k: null as string | null,
  playing: false,
  ended: false,
  /** quick check per lesson key: open while paused at 50%, done after answering or skipping */
  qc: {} as Record<string, 'open' | 'done'>,
  qcsel: {} as Record<string, number>,
});
/** Jumps the open lesson to fraction p (0..1). Returns false when no lesson is open. */
export function seekLesson(p: number, fromQc?: boolean) {
  const P = player.get();
  if (!P.k) return false;
  S.prog[P.k] = Math.min(0.98, Math.max(0, p));
  P.ended = false;
  if (fromQc) P.qc[P.k] = 'done';
  player.commit();
  commit();
  return true;
}
