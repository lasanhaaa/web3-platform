'use client';
import { createStore } from './store';
import { rng, SIM } from './quiz-bank';

/* The running quiz (one at a time, like the prototype's QZ). Wega reads it for hints:
   getQZ() and Q[QZ.r+'.'+QZ.z][QZ.i]. Mutate a field, then call quiz.commit(). */
export type QuizState = {
  r: string;
  z: number;
  /** -1 = intro, 0..n-1 = question index */
  i: number;
  sel: number | null;
  locked: boolean;
  answers: ({ ok: boolean } | undefined)[];
  lives: number;
  /** true only for the render right after a life was lost (plays the "lost" animation) */
  lost: boolean;
  /** null while answering; 'badge' | 'unlock' | 'routes' | 'fail' on the result screens */
  stage: string | null;
  /** order questions: item indexes in their current positions */
  order: number[] | null;
  skipped?: boolean;
  sim: { lev: number; rng: number };
};
export const quiz = createStore<{ QZ: QuizState | null }>({ QZ: null });
export const getQZ = () => quiz.get().QZ;
export const freshQuiz = (r: string, z: number): QuizState => ({
  r,
  z,
  i: -1,
  sel: null,
  locked: false,
  answers: [],
  lives: 3,
  lost: false,
  stage: null,
  order: null,
  sim: { lev: 8, rng: 4 },
});
/** The prototype's startQuiz() minus the navigation: a fresh quiz for zone z of route r (notifies subscribers). */
export function startQuizState(r: string, z: number) {
  quiz.set({ QZ: freshQuiz(r, z) });
}
/** The prototype's `qstage` action: jump to a result stage. */
export function setQuizStage(s: string) {
  const QZ = getQZ();
  if (!QZ) return;
  QZ.stage = s;
  quiz.commit();
}

/* ---- quiz logic, same rules as the prototype ---- */
/** A seeded shuffle of item indexes that is never the solved order. */
export function shuffled(items: unknown[], seedN: number) {
  const a = items.map((_, i) => i);
  const r = rng(seedN);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (a.every((v, i) => v === i)) a.reverse();
  return a;
}
export function simState(QZ: QuizState) {
  const e = SIM[0],
    lev = QZ.sim.lev,
    w = QZ.sim.rng,
    liq = e * (1 - 0.9 / lev),
    mn = Math.min(...SIM),
    end = SIM.at(-1) as number;
  return { e, lev, w, liq, mn, end, safe: mn > liq, inr: (Math.abs(end - e) / e) * 100 <= w };
}
/** The smallest range (in %) that keeps the sim's closing price in range. */
export const simMinRange = () => Math.ceil((Math.abs((SIM.at(-1) as number) - SIM[0]) / SIM[0]) * 100);
export function answered(QZ: QuizState, q: any) {
  if (q.t === 'order') return true;
  if (q.t === 'sim') return true;
  return QZ.sel != null;
}
export function isRight(QZ: QuizState, q: any) {
  if (q.t === 'order') return !!QZ.order && QZ.order.every((v, i) => v === i);
  if (q.t === 'sim') {
    const s = simState(QZ);
    return s.safe && s.inr;
  }
  return QZ.sel === q.a;
}
