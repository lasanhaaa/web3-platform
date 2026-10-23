'use client';
/* Content of the tabs under the lesson video (felipe, Oct 21, after Coursera: Transcript, Notes, and Strategies in place
   of Coursera's Downloads). */
import { createStore } from './store';
import { ANALOGY, ROUTES, chaptersFor, dur, zkey, R } from './curriculum';
import { STRATS, type Strat } from './strategies';

export type TLine = { sec: number; a: number; text: string };
export type TChapter = { t: string; sec: number; a: number; lines: TLine[] };

/** SAMPLE transcript, written from the lesson's chapters. The live calls have no transcripts yet; on the platform the
    video's own transcript would fill this in. Each chapter gets a few lines, spread over its part of the video. */
export function transcriptFor(rid: string, zi: number, li: number): TChapter[] {
  const s = R(rid).zones[zi].lessons[li],
    ch = chaptersFor(rid, zi, li),
    len = dur(ROUTES.indexOf(R(rid)), zi, li) * 60,
    pic = (ANALOGY as Record<string, string>)[zkey(rid, zi)]?.match(/[^.!?]+[.!?]+/g)?.map((x) => x.trim()) ?? [];
  const say = [
    [`Welcome back. Today’s lesson is “${s.t}”.`, ch[0].n, pic[0]],
    [ch[1].n, pic.slice(1).join(' '), 'Let me show you on screen what that looks like.'],
    ['Now a real example, step by step.', ch[2].n, 'Follow along on your own screen, and pause the video whenever you need to.'],
    ['Before you start, here is the mistake we see most often.', ch[3].n, `That’s it for “${s.t}”. Mark the lesson as done and continue with the next one.`],
  ];
  return ch.map((c, i) => {
    const end = (ch[i + 1]?.a ?? 1) - 0.02,
      lines = say[i].filter(Boolean) as string[];
    return {
      t: c.t,
      sec: c.sec,
      a: c.a,
      lines: lines.map((text, j) => {
        const a = c.a + ((end - c.a) * j) / lines.length;
        return { a, sec: Math.round(a * len), text };
      }),
    };
  });
}

/* ---- Notes: the member's own notes, each pinned to a moment of the video (kept in this browser) ---- */
export type Note = { id: number; at: number; text: string };
const KEY = 'w3u.notes';
export const notes = createStore({ loaded: false, by: {} as Record<string, Note[]> });
function load() {
  const N = notes.get();
  if (N.loaded) return N;
  N.loaded = true;
  try {
    N.by = JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    N.by = {};
  }
  return N;
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes.get().by));
  } catch {}
  notes.commit();
}
export const notesFor = (k: string) => load().by[k] ?? [];
export function addNote(k: string, at: number, text: string) {
  const N = load();
  N.by[k] = [...(N.by[k] ?? []), { id: Date.now(), at, text }].sort((a, b) => a.at - b.at);
  save();
}
export function removeNote(k: string, id: number) {
  const N = load();
  N.by[k] = (N.by[k] ?? []).filter((n) => n.id !== id);
  save();
}

/* ---- Strategies: the model portfolio's strategies that build on this lesson ---- */
export type Related = { s: Strat; why: string };
/** Strategies that need this lesson first, then ones that need another lesson of the same zone, then of the same
    course. Closed strategies stay out. At most three. */
export function strategiesFor(rid: string, zi: number, li: number): Related[] {
  const k = `${rid}.${zi}.${li}`,
    zone = `${rid}.${zi}.`,
    route = `${rid}.`,
    open = STRATS.filter((s) => s.status !== 'Closed');
  const rank = (s: Strat) => (s.needs.includes(k) ? 0 : s.needs.some((n) => n.startsWith(zone)) ? 1 : s.needs.some((n) => n.startsWith(route)) ? 2 : 3);
  const zName = R(rid).zones[zi].name,
    rName = rid === 'academy' ? 'the Academy' : R(rid).name;
  const why = ['Builds on this lesson', `Builds on ${zName}`, `Builds on ${rName}`];
  return open
    .map((s) => ({ s, r: rank(s) }))
    .filter((x) => x.r < 3)
    .sort((a, b) => a.r - b.r)
    .slice(0, 3)
    .map(({ s, r }) => ({ s, why: why[r] }));
}
