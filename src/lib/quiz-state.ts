'use client';
import { createStore } from './store';
import { Q, rng, SIM } from './quiz-bank';

/* The running quiz (one at a time, like the prototype's QZ). Wega reads it for hints:
   getQZ() and quizQs(QZ)[QZ.i]. Mutate a field, then call quiz.commit(). */
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
  /** order questions: item indexes placed in slots 1..n, in slot order */
  order: number[] | null;
  skipped?: boolean;
  sim: { lev: number; rng: number };
  /** question indexes of this run; a practice run only has the questions that were missed */
  pick: number[] | null;
  /** practice run: no lives, nothing to pass */
  practice: boolean;
  /** when question 1 started, and the seconds the whole quiz took */
  t0: number;
  secs: number;
  /** right answers in a row, and the best run */
  streak: number;
  best: number;
  /** true while the 7 days (sim) or the trade (predict) are playing after Check */
  anim: boolean;
  /** match: pairs found, the word and meaning tapped, a wrong pair that is shaking, wrong tries */
  mt: { done: number[]; l: number | null; r: number | null; bad: [number, number] | null; miss: number };
  /** fill: the bank tile in each blank (null while empty) */
  fl: (number | null)[];
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
  pick: null,
  practice: false,
  t0: 0,
  secs: 0,
  streak: 0,
  best: 0,
  anim: false,
  mt: freshMatch(),
  fl: [],
});
export const freshMatch = (): QuizState['mt'] => ({ done: [], l: null, r: null, bad: null, miss: 0 });
/** The questions of this run (all five, or the missed ones in a practice run). */
export const quizQs = (QZ: QuizState): any[] => {
  const all = Q[QZ.r + '.' + QZ.z] || [];
  return QZ.pick ? QZ.pick.map((i) => all[i]) : all;
};
/** A practice run of the questions missed in the run that just ended. */
export function startPractice(r: string, z: number, pick: number[]) {
  quiz.set({ QZ: { ...freshQuiz(r, z), pick, practice: true, i: 0, t0: Date.now() } });
}
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
  if (q.t === 'order') return !!QZ.order && QZ.order.length === q.items.length;
  if (q.t === 'sim') return true;
  if (q.t === 'fill') return QZ.fl.length === q.a.length && QZ.fl.every((x) => x != null);
  if (q.t === 'match') return QZ.mt.done.length === q.pairs.length;
  return QZ.sel != null;
}
export function isRight(QZ: QuizState, q: any) {
  if (q.t === 'order') return !!QZ.order && QZ.order.length === q.items.length && QZ.order.every((v, i) => v === i);
  if (q.t === 'fill') return q.a.every((w: string, i: number) => QZ.fl[i] != null && q.bank[QZ.fl[i] as number] === w);
  if (q.t === 'match') return QZ.mt.done.length === q.pairs.length;
  if (q.t === 'sim') {
    const s = simState(QZ);
    return s.safe && s.inr;
  }
  return QZ.sel === q.a;
}
