'use client';
import { createStore } from './store';

/* Page tours spoken by Wega (felipe, Oct 27). Wega offers the tour in a one-line message above the chat bar the first
   time a member opens the page; once it starts the chat bar hides and each step is Wega's bubble beside the part of the
   page it talks about, inside a blue ring. Texts are scripted (no AI call), from the vault note
   "2026-10 Guided onboarding on first visit". */
export type TourStep = { sel: string; text: string };
export type Tour = { key: string; invite: string; steps: TourStep[] };

const TOURS: { test: (path: string) => boolean; tour: Tour }[] = [
  {
    test: (p) => p === '/academy',
    tour: {
      key: 'academy',
      invite: 'Want a quick tour of the Academy?',
      steps: [
        { sel: '.ah-hero .ah-tt', text: 'This is your course. Short video lessons that teach DeFi step by step, at your own pace. I remember where you stopped.' },
        { sel: '.ah-hero .ah-track', text: 'Each block is a module. Finish its lessons and pass its short quiz to open the next one.' },
        { sel: '.ah-hero .ah-cta', text: 'Press this button to play your next lesson. Later, the same button takes you back to where you stopped.' },
      ],
    },
  },
  {
    test: (p) => /^\/academy\/(?!choose)[^/]+\/\d+$/.test(p),
    tour: {
      key: 'course',
      invite: 'Want a quick tour of this course?',
      steps: [
        { sel: '.cv-zone:not(.lock) .cv-rows', text: 'Each module is a short list of video lessons. Click a lesson to play it. A tick means you finished it.' },
        { sel: '.cv-zone:not(.lock) .cv-row.quiz', text: 'A short quiz ends each module. Pass it to open the next module and earn a badge.' },
        { sel: '.cv-card', text: 'This button always plays the next lesson you haven’t finished. The ring shows how much of the course is done.' },
      ],
    },
  },
  {
    test: (p) => p === '/strategies',
    tour: {
      key: 'strategies',
      invite: 'Want a quick tour of the strategies?',
      steps: [
        { sel: '.st-mp', text: 'This is our model portfolio: how our own money is split across the strategies right now. Click a row to see only the strategies in it.' },
        { sel: '.st-fbar > :nth-child(2)', text: 'New here? Open Difficulty and pick Beginner to see the simplest strategies first. Clear filters shows all of them again.' },
        { sel: '.st-grid > :first-child', text: 'Click any card to see what the strategy is, how to enter it step by step, and its risks.' },
      ],
    },
  },
];

/** The tour of the page at this path, if it has one. */
export const tourFor = (path: string) => TOURS.find((t) => t.test(path.replace(/\/$/, '') || '/'))?.tour ?? null;

const KEY = 'w3u-tours';
export const tours = createStore({
  /** the tour that is running */
  run: null as Tour | null,
  i: 0,
  /** tours the member has started or closed: Wega doesn't offer them again (they stay in the chat bar's suggestions) */
  seen: {} as Record<string, 1>,
  loaded: false,
});

function load() {
  const T = tours.get();
  if (T.loaded) return;
  T.loaded = true;
  try {
    T.seen = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch {}
}
function mark(key: string) {
  const T = tours.get();
  T.seen[key] = 1;
  try {
    localStorage.setItem(KEY, JSON.stringify(T.seen));
  } catch {}
}
/** Only call after the page has hydrated (it reads the browser's storage). */
export function tourSeen(key: string) {
  load();
  return !!tours.get().seen[key];
}
export function tourStart(t: Tour) {
  load();
  const T = tours.get();
  mark(t.key);
  T.run = t;
  T.i = 0;
  tours.commit();
}
export function tourNext() {
  const T = tours.get();
  if (!T.run) return;
  if (T.i >= T.run.steps.length - 1) return tourEnd();
  T.i++;
  tours.commit();
}
export function tourEnd() {
  const T = tours.get();
  if (!T.run) return;
  T.run = null;
  T.i = 0;
  tours.commit();
}
/** × on the invite: Wega doesn't offer this tour again. */
export function tourDismiss(key: string) {
  load();
  mark(key);
  tours.commit();
}
/** The prototype's "New: nothing done" state offers every tour again. */
export function toursReset() {
  const T = tours.get();
  T.seen = {};
  T.loaded = true;
  try {
    localStorage.removeItem(KEY);
  } catch {}
  tours.commit();
}
