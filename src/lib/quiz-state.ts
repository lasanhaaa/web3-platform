'use client';
import { createStore } from './store';

/* The running quiz (one at a time, like the prototype's QZ). Wega reads it for hints. */
export type QuizState = {
  r: string;
  z: number;
  /** -1 = intro, 0..n-1 = question index */
  i: number;
  sel: number | null;
  locked: boolean;
  answers: ({ ok: boolean } | undefined)[];
  lives: number;
  lost: boolean;
  stage: string | null;
  order: number[] | null;
  skipped?: boolean;
  sim: { lev: number; rng: number };
};
export const quiz = createStore<{ QZ: QuizState | null }>({ QZ: null });
export const getQZ = () => quiz.get().QZ;
export function startQuizState(r: string, z: number) {
  quiz.set({ QZ: { r, z, i: -1, sel: null, locked: false, answers: [], lives: 3, lost: false, stage: null, order: null, sim: { lev: 8, rng: 4 } } });
}
