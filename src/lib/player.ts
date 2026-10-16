'use client';
import { createStore } from './store';
import { S, commit } from './progress';
import { chaptersFor, chIdx } from './curriculum';

/* The open lesson's player state. OWNER: the lesson port (extend freely, keep seekLesson's signature).
   Wega calls seekLesson() for "Rewatch from mm:ss" buttons inside its answers.
   Mirrors the prototype's module state: `timer`, `nav.ended`, `QC`, `QCSEL`, `LTERM`. */
export const player = createStore({
  /** lesson key ('r1.1.3') of the lesson on screen, null when no lesson is open */
  k: null as string | null,
  /** route id, zone and lesson (0-based) of the open lesson */
  r: '',
  z: 0,
  l: 0,
  playing: false,
  ended: false,
  /** quick check per lesson key: open while paused at 50%, done after answering or skipping */
  qc: {} as Record<string, 'open' | 'done'>,
  qcsel: {} as Record<string, number>,
  /** The prototype removes the big play button when play is pressed and only brings it back on the
      next full render(). bigK/bigV remember the lesson and the progress version at that moment. */
  bigK: null as string | null,
  bigV: -1,
  /** playback speed (the "1x" button cycles through RATES) */
  rate: 1,
});

/** How the lesson screen is laid out, remembered on this device: cinema mode (YouTube's theatre mode: the video spans
    the page, it is not fullscreen) and whether Wega's chat shows beside the video (felipe, Oct 16). */
export const lessonView = createStore({ cinema: false, chat: true });
const VIEW_KEY = 'w3u-lesson-view';
let viewLoaded = false;
/** The saved layout. Read during the lesson's first client render, so the page doesn't jump after it shows. */
export function lessonViewPrefs() {
  const V = lessonView.get();
  if (!viewLoaded) {
    viewLoaded = true;
    try {
      const saved = JSON.parse(localStorage.getItem(VIEW_KEY) || '{}');
      V.cinema = saved.cinema === true;
      V.chat = saved.chat !== false;
    } catch {}
  }
  return V;
}
function saveView() {
  try {
    localStorage.setItem(VIEW_KEY, JSON.stringify(lessonView.get()));
  } catch {}
  lessonView.commit();
}
export function toggleCinema() {
  const V = lessonViewPrefs();
  V.cinema = !V.cinema;
  saveView();
}
export function showLessonChat(on: boolean) {
  lessonViewPrefs().chat = on;
  saveView();
}

const RATES = [1, 1.25, 1.5, 2, 0.75];
/** The speed button: 1x, 1.25x, 1.5x, 2x, 0.75x, back to 1x. */
export function cycleRate() {
  const P = player.get();
  P.rate = RATES[(RATES.indexOf(P.rate) + 1) % RATES.length];
  player.commit();
}

let timer: ReturnType<typeof setInterval> | null = null;

/** The prototype's render(): re-render the lesson (player store) and everything that reads progress. */
function render() {
  player.commit();
  commit();
}
/** The quick check card on screen. Next keeps recently visited pages mounted but hidden, so ids can repeat. */
const qcEl = () => Array.from(document.querySelectorAll<HTMLElement>('#qc')).find((e) => e.getClientRects().length > 0);
function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
  player.get().playing = false;
}
function startTimer() {
  if (timer) clearInterval(timer);
  timer = setInterval(tick, 120);
  player.get().playing = true;
}

/** Called by the lesson view when a lesson URL is on screen (the prototype's go({screen:'lesson'})). */
export function openLesson(r: string, z: number, l: number, k: string) {
  const P = player.get();
  stopTimer();
  Object.assign(P, { k, r, z, l, ended: false, bigK: null, bigV: -1 });
  player.commit();
}
/** Called when the lesson view unmounts or its URL changes: nothing keeps running. */
export function closeLesson(k: string) {
  const P = player.get();
  if (P.k !== k) return;
  stopTimer();
  P.k = null;
  P.ended = false;
  player.commit();
}

/** Same as the prototype's paintScrub(): repaint the scrubber, full render only when the chapter changes. */
function paintScrub(before: number) {
  const P = player.get();
  if (!P.k) return;
  const ch = chaptersFor(P.r, P.z, P.l);
  if (chIdx(ch, before) !== chIdx(ch, S.prog[P.k] || 0)) render();
  else player.commit();
}
function tick() {
  const P = player.get(),
    k = P.k;
  if (!k) return stopTimer();
  const before = S.prog[k] || 0;
  S.prog[k] = Math.min(1, before + 0.02 * P.rate);
  if (S.prog[k] >= 1) {
    stopTimer();
    S.done.add(k);
    P.ended = true;
    render();
    return;
  }
  if (!P.qc[k] && S.prog[k] >= 0.5) {
    P.qc[k] = 'open';
    stopTimer();
    render();
    setTimeout(() => qcEl()?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    return;
  }
  paintScrub(before);
}

/** data-act="play". Returns a message to toast, if any. */
export function playToggle(): string | void {
  const P = player.get(),
    k = P.k;
  if (!k || P.ended) return;
  if (P.qc[k] === 'open') {
    qcEl()?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return 'Answer the quick check or skip it to keep watching.';
  }
  if (timer) stopTimer();
  else startTimer();
  P.bigK = k;
  P.bigV = S.v;
  player.commit();
}
/** data-act="seek": ±fraction, without leaving the end card (as in the prototype). */
export function seekBy(d: number) {
  const k = player.get().k;
  if (!k) return;
  const before = S.prog[k] || 0;
  S.prog[k] = Math.max(0, Math.min(0.98, before + d));
  paintScrub(before);
}
/** data-act="scrub": jump to a fraction of the bar. */
export function scrubTo(p: number) {
  const k = player.get().k;
  if (!k) return;
  const before = S.prog[k] || 0;
  S.prog[k] = Math.max(0, Math.min(0.98, p));
  paintScrub(before);
}
/** data-act="done" */
export function markLessonDone() {
  const P = player.get(),
    k = P.k;
  if (!k) return;
  S.done.add(k);
  S.prog[k] = 1;
  /* a quick check still waiting for an answer goes away with the end card */
  if (P.qc[k] === 'open') P.qc[k] = 'done';
  stopTimer();
  P.ended = true;
  render();
}
/** data-act="qcans" */
export function qcAnswer(i: number) {
  const P = player.get();
  if (!P.k) return;
  P.qcsel[P.k] = i;
  render();
}
/** data-act="qccont": "Keep watching" and "Skip" */
export function qcContinue() {
  const P = player.get();
  if (!P.k) return;
  P.qc[P.k] = 'done';
  if (!timer && !P.ended) startTimer();
  render();
}
/** Clicking the lesson that is already open: the prototype's go() stops the video and leaves the end card. */
export function reopenLesson() {
  const P = player.get();
  stopTimer();
  P.ended = false;
  render();
}

/** Jumps the open lesson to fraction p (0..1): the state half of the prototype's data-act="lseek".
    Returns false when no lesson is open. Callers then toast 'Open the lesson to jump to this part.',
    or close Wega on narrow screens and scroll to the top, as the prototype does. */
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
