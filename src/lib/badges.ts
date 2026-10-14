// @ts-nocheck
'use client';
/* Badge catalogue around the original badgeweb3 engine (public/w3u-badges.js, global window.W3UBadges).
   Ported 1:1 from the prototype. Locked items use the normal render; CSS removes colour and fades them. */
import { ROUTES, R } from './curriculum';
import { S, isDone, zoneOpen, today } from './progress';

export const BID = { 'academy.0': 'academy-start', 'r1.0': 'defi-grundlagen-1', 'r1.1': 'defi-grundlagen-2', 'r1.2': 'defi-grundlagen-3', 'r2.0': 'defi-strategien-1', 'r2.1': 'defi-strategien-2', 'r2.2': 'defi-strategien-3', 'r3.0': 'perppilot-1', 'r3.1': 'perppilot-2' };
export const PATH = { academy: 'academy', r1: 'defi-grundlagen', r2: 'defi-strategien', r3: 'perppilot' };
export const PCOLOR = { academy: '#4ade80', r1: '#3d8bff', r2: '#ffc93c', r3: '#2ee6c8' };
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ');
export const still = (id) => `/renders/${id}.png`;
/** one entry per badge, as in badgeweb3's catalogue: the levels of each path, then its gold coin and platinum card */
export const CAT = ROUTES.map((r) => {
  const c = PCOLOR[r.id],
    p = PATH[r.id];
  const levels = r.zones.map((z, i) => ({ id: BID[r.id + '.' + i], k: r.id + '.' + i, rid: r.id, index: i, level: i + 1, title: z.name, intro: r.id === 'academy', glow: hex2rgb(c) }));
  const extra = r.id === 'academy' ? [] : [{ id: p + '-coin', rid: r.id, coin: true, glow: '255 190 85' }, { id: p + '-card', rid: r.id, card: true, glow: hex2rgb(c) }];
  return { r, id: r.id, color: c, name: r.name, levels, extra, items: [...levels, ...extra] };
});
export const catItem = (id) => {
  for (const c of CAT) for (const it of c.items) if (it.id === id) return [it, c];
  return [null, null];
};
export const nameOf = (it, c) => (it.card ? c.name : it.coin ? 'Completion coin' : it.title);
export const stepOf = (it) => (it.coin ? 'Completion' : it.intro ? 'Intro' : `Level ${it.level}`);
export function bState(it) {
  const r = R(it.rid);
  if (!it.coin && !it.card) {
    const z = r.zones[it.index],
      total = z.lessons.length,
      done = z.lessons.filter((_, l) => isDone(it.rid, it.index, l)).length;
    if (S.passed.has(it.k)) return { state: 'earned', done: total, total, hint: 'Completed' };
    if (!zoneOpen(it.rid, it.index)) return { state: 'locked', done: 0, total, hint: it.index > 0 ? `Unlocks after Level ${it.index}` : 'Unlocks after the Academy quiz' };
    if (done === total) return { state: 'progress', done, total, hint: 'Quiz is open' };
    return { state: 'progress', done, total, hint: done > 0 ? `${total - done} ${total - done === 1 ? 'lesson' : 'lessons'} to go` : `Complete ${total} lessons` };
  }
  const n = r.zones.length,
    d = r.zones.filter((_, i) => S.passed.has(it.rid + '.' + i)).length;
  if (d === n) return { state: 'earned', done: d, total: n, hint: it.card ? `Issued ${S.earned[it.rid + '.' + (n - 1)] || today()}` : 'All levels completed' };
  return { state: 'locked', done: d, total: n, hint: n === 2 ? 'Complete both levels' : `Complete all ${n} levels` };
}
/** badgeweb3's own English copy, carried on each badge in the bundle */
export const deCopy = (b) => ({ ...b.copy });
/** The engine, once public/w3u-badges.js has loaded. */
export const WB = () => (typeof window !== 'undefined' ? window.W3UBadges || null : null);
