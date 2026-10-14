'use client';
import { useSyncExternalStore } from 'react';
import { ROUTES, R, key, dur } from './curriculum';

/* Learning progress for the prototype. One in-memory store (seeded from the demo state picker),
   read by components through useProgress(). In the product this comes from the API. */
export type DemoKind = 'fresh' | 'academyQuiz' | 'mid' | 'almost' | 'r1done';
export type Step = { r: string; z: number; l?: number; quiz?: boolean };

export const S = {
  done: new Set<string>(),
  passed: new Set<string>(),
  prog: {} as Record<string, number>,
  chosen: null as string | null,
  earned: {} as Record<string, string>,
  demo: 'mid' as DemoKind,
  /** prototype helper: highlight the right quiz answer */
  hint: false,
  v: 0,
};

const subs = new Set<() => void>();
export function commit() {
  S.v++;
  subs.forEach((f) => f());
}
function subscribe(f: () => void) {
  subs.add(f);
  return () => subs.delete(f);
}
/** Re-renders the caller whenever progress changes. Returns the store version. */
export function useProgress() {
  return useSyncExternalStore(subscribe, () => S.v, () => 0);
}

export const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function seed(kind: DemoKind) {
  S.done = new Set();
  S.passed = new Set();
  S.prog = {};
  S.chosen = null;
  S.earned = {};
  S.demo = kind;
  const pass = (id: string, d: string) => {
    S.passed.add(id);
    S.earned[id] = d;
  };
  const all = (rid: string, upTo: number, dates: string[]) => {
    R(rid).zones.forEach((z: any, zi: number) => {
      if (zi < upTo) {
        z.lessons.forEach((_: any, li: number) => S.done.add(key(rid, zi, li)));
        pass(rid + '.' + zi, dates[zi]);
      }
    });
  };
  if (kind === 'fresh') S.prog[key('academy', 0, 0)] = 0.15;
  if (kind === 'academyQuiz') R('academy').zones[0].lessons.forEach((_: any, li: number) => S.done.add(key('academy', 0, li)));
  if (kind === 'mid') {
    all('academy', 1, ['Sep 28, 2026']);
    all('r1', 1, ['Oct 6, 2026']);
    [0, 1, 2].forEach((li) => S.done.add(key('r1', 1, li)));
    S.prog[key('r1', 1, 3)] = 1 - 7 / dur(1, 1, 3);
    S.chosen = 'r1';
  }
  if (kind === 'almost') {
    all('academy', 1, ['Sep 28, 2026']);
    all('r1', 2, ['Oct 6, 2026', 'Oct 10, 2026']);
    R('r1').zones[2].lessons.forEach((_: any, li: number) => S.done.add(key('r1', 2, li)));
    S.chosen = 'r1';
  }
  if (kind === 'r1done') {
    all('academy', 1, ['Sep 28, 2026']);
    all('r1', 3, ['Oct 6, 2026', 'Oct 10, 2026', 'Oct 13, 2026']);
    [0, 1].forEach((li) => S.done.add(key('r2', 0, li)));
    S.chosen = 'r2';
  }
}
seed('mid');

const DEMO_KEY = 'w3u-demo';
export function setDemo(kind: DemoKind) {
  seed(kind);
  try {
    localStorage.setItem(DEMO_KEY, kind);
  } catch {}
  commit();
}
/** Called once on the client: restores the demo state the viewer picked last time. */
export function restoreDemo() {
  let k: string | null = null;
  try {
    k = localStorage.getItem(DEMO_KEY);
  } catch {}
  if (k && ['fresh', 'academyQuiz', 'mid', 'almost', 'r1done'].includes(k) && k !== S.demo) {
    seed(k as DemoKind);
    commit();
  }
}

/* ---- actions ---- */
export function setProg(k: string, v: number) {
  S.prog[k] = v;
  commit();
}
export function markDone(k: string) {
  S.done.add(k);
  S.prog[k] = 1;
  commit();
}
export function passZone(id: string) {
  if (!S.passed.has(id)) {
    S.passed.add(id);
    S.earned[id] = today();
  }
  commit();
}
export function setHint(on: boolean) {
  S.hint = on;
  commit();
}
export function chooseRoute(r: string) {
  S.chosen = r;
  commit();
}

/* ---- selectors (same rules as the prototype) ---- */
export const isDone = (r: string, z: number, l: number) => S.done.has(key(r, z, l));
export const zoneDone = (r: string, z: number) => R(r).zones[z].lessons.every((_: any, l: number) => isDone(r, z, l));
export const routeOpen = (r: string) => r === 'academy' || S.passed.has('academy.0');
export const zoneOpen = (r: string, z: number) => routeOpen(r) && (z === 0 || S.passed.has(r + '.' + (z - 1)));
export const lessonOpen = (r: string, z: number, l: number) => zoneOpen(r, z) && (l === 0 || isDone(r, z, l - 1) || isDone(r, z, l));
export const quizOpen = (r: string, z: number) => zoneOpen(r, z) && zoneDone(r, z);
export const routeDone = (r: string) => R(r).zones.every((_: any, z: number) => S.passed.has(r + '.' + z));
export function routeCount(rid: string) {
  let d = 0,
    t = 0;
  R(rid).zones.forEach((z: any, zi: number) =>
    z.lessons.forEach((_: any, li: number) => {
      t++;
      if (isDone(rid, zi, li)) d++;
    }),
  );
  return { d, t };
}
export function nextStep(rid: string): Step | null {
  const r = R(rid);
  for (let z = 0; z < r.zones.length; z++) {
    if (!zoneOpen(rid, z)) return null;
    for (let l = 0; l < r.zones[z].lessons.length; l++) if (!isDone(rid, z, l)) return { r: rid, z, l };
    if (!S.passed.has(rid + '.' + z)) return { r: rid, z, quiz: true };
  }
  return null;
}
/** The user's next step across the Academy and routes. */
export function focus(): Step | null {
  if (!S.passed.has('academy.0')) return nextStep('academy') || { r: 'academy', z: 0, quiz: true };
  for (const rid of [S.chosen, 'r1', 'r2', 'r3'].filter(Boolean) as string[]) {
    const n = nextStep(rid);
    if (n && (rid === S.chosen || routeCount(rid).d > 0)) return n;
  }
  return null;
}
export const allCount = () =>
  ROUTES.reduce(
    (a: { d: number; t: number }, r: any) => {
      const c = routeCount(r.id);
      return { d: a.d + c.d, t: a.t + c.t };
    },
    { d: 0, t: 0 },
  );
export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
export const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`);
export const zoneKeys = () => ROUTES.flatMap((r: any) => r.zones.map((_: any, zi: number) => r.id + '.' + zi));
export function lessonState(r: string, z: number, l: number) {
  if (isDone(r, z, l)) return 'done';
  if (!lessonOpen(r, z, l)) return 'lock';
  const f = nextStep(r);
  const started = r === 'academy' || r === S.chosen || routeCount(r).d > 0;
  return started && f && f.z === z && f.l === l ? 'now' : 'todo';
}
export function firstOpenZone(id: string) {
  const r = R(id);
  for (let z = r.zones.length - 1; z >= 0; z--) if (zoneOpen(id, z)) return z;
  return 0;
}
