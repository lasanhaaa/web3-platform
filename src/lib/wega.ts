'use client';
import { useEffect, type ReactNode } from 'react';
import { createStore } from './store';
import { answer, routeText, rulesPrompt } from './wega-brain';
import { followFor, promptLabel } from './wega-page';
import { thinkSteps } from './wega-think';
import { lessonView } from './player';

/* Wega, the AI copilot: one panel that follows the user across the platform.
   Pages tell Wega where the user is with useWegaPage(); buttons anywhere call wgRun(intent, label). */
export type WegaPage = {
  screen: 'map' | 'route' | 'lesson' | 'quiz' | 'fork' | 'badges' | 'strategies';
  r?: string;
  z?: number;
  l?: number;
  /** strategy id when a strategy modal is open */
  sid?: string | null;
};
export type Chip = [label: string, intent: string];
export type Answer = { text: string; node?: ReactNode; follow?: Chip[]; note?: string; live?: boolean };
export type Msg = {
  id: number;
  role?: 'user' | 'wega';
  text?: string;
  node?: ReactNode;
  pending?: boolean;
  live?: boolean;
  note?: string;
  follow?: Chip[];
  /** where the lesson video was (0..1) when the message was sent, in the lesson's chat */
  at?: number;
  /** the answer to one of the Wega page's ready questions (/wega/risk-mix …), shown as it is on that page */
  href?: string;
  /** what Wega says it is doing while the answer is pending */
  think?: string[];
  /** just arrived: the text is still being written out word by word (cleared by wgSettle) */
  fresh?: boolean;
  /** a live answer whose words are still arriving */
  streaming?: boolean;
};

export const wega = createStore({
  open: false,
  msgs: [] as Msg[],
  busy: false,
  /** answer arrived while Wega was out of sight (the panel or the lesson's column closed) */
  ready: false,
  /** the small pop-up under "Ask wega" with the start of that answer */
  peek: false,
  page: { screen: 'map' } as WegaPage,
  /** null = no live model configured (scripted answers only) */
  live: undefined as boolean | undefined,
  prac: null as null | { list: any[]; i: number },
  /** practice question counter (Wega's "Give me a practice question") */
  lq: 0,
  /** a page shows the conversation inline (the lesson's "Ask Wega" card): the panel stays closed */
  inline: false,
  /** the inline conversation shows the messages after this id */
  inlineFrom: 0,
  /** the lesson's chat stamps each question with the video's position (null outside a lesson) */
  clock: null as null | (() => number),
  /** the conversation set aside when "Ask wega" opened the hub; the hub offers to go back to it */
  prev: null as null | Msg[],
  /** the question whose "last chat" message above the chat bar the member closed with × */
  lastX: 0,
});
let seq = 0;
let ctl: AbortController | null = null;
/** the question being answered: a stopped one that still finishes doesn't end the next one's thinking */
let run = 0;

export const pageKey = (p: WegaPage) => [p.screen, p.r, p.z, p.l, p.sid].join('|');

/** Pages call this so Wega knows the context (label, prompt chips, data in its rules). */
export function useWegaPage(p: WegaPage) {
  const k = pageKey(p);
  useEffect(() => {
    setWegaPage(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);
}
export function setWegaPage(p: WegaPage) {
  wega.get().page = p;
  wega.commit();
}

/** The Strategies modal tells Wega which strategy is open (null when it closes). */
export function setWegaSid(sid: string | null) {
  const W = wega.get();
  if (W.page.screen !== 'strategies' || (W.page.sid ?? null) === sid) return;
  setWegaPage({ ...W.page, sid });
}
/** Asks the server once whether live answers are configured, so the composer can show its mode. */
export async function wgProbe() {
  if (wega.get().live !== undefined) return;
  try {
    const res = await fetch('/api/wega', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ probe: true }) });
    wega.get().live = res.ok && (await res.json()).live === true;
  } catch {
    wega.get().live = false;
  }
  wega.commit();
}

/** The lesson page shows Wega's conversation in the page itself: a fresh conversation, and the panel stays closed. */
export function wgInline(on: boolean) {
  const W = wega.get();
  W.inline = on;
  if (on) {
    W.open = false;
    W.inlineFrom = seq;
  }
  wega.commit();
}

export function wgOpen() {
  const W = wega.get();
  W.open = true;
  W.ready = W.peek = false;
  wega.commit();
}
/** The member sees Wega's conversation again (the lesson's column opened): the "answer ready" signs go. */
export function wgSeen() {
  const W = wega.get();
  if (!W.ready && !W.peek) return;
  W.ready = W.peek = false;
  wega.commit();
}
/** The member closed the "last chat" message above the chat bar; it comes back with the next question. */
export function wgLastX(id: number) {
  wega.get().lastX = id;
  wega.commit();
}
export function wgPeek(on: boolean) {
  wega.get().peek = on;
  wega.commit();
}
/** Wega can't be seen: the panel is closed, or on a lesson the Wega column is. */
export const wgHidden = (W = wega.get()) => (W.inline ? !lessonView.get().chat : !W.open);
/** An answer has been written out in full. */
export function wgSettle(id: number) {
  const m = wega.get().msgs.find((x) => x.id === id);
  if (!m?.fresh) return;
  m.fresh = false;
  wega.commit();
}
export function wgClose() {
  wega.get().open = false;
  wega.commit();
}
export const wgToggle = () => (wega.get().open ? wgClose() : wgOpen());
/** A fresh start: the conversation so far is set aside for the hub's "Back to your last chat". */
export function wgNew() {
  wgStop();
  const W = wega.get();
  if (W.msgs.length) W.prev = W.msgs;
  W.msgs = [];
  W.prac = null;
  wega.commit();
}
/** "Ask wega" with no question opens the hub (felipe, Oct 16, like PostHog's AI panel). An answer that is still being
    written, or that arrived while the panel was closed, opens instead. */
export function wgHub() {
  const W = wega.get();
  if (!W.busy && !W.ready) wgNew();
  wgOpen();
}
export function wgResume() {
  const W = wega.get();
  if (!W.prev) return;
  W.msgs = W.prev;
  W.prev = null;
  wega.commit();
}
function push(m: Omit<Msg, 'id'>) {
  const W = wega.get();
  const msg = { ...m, id: ++seq } as Msg;
  if (W.inline && W.clock && m.role === 'user') msg.at = W.clock();
  W.msgs.push(msg);
  wega.commit();
  return msg;
}
function fill(m: Msg, a: Partial<Answer> & Pick<Msg, 'href' | 'fresh' | 'streaming'>) {
  Object.assign(m, a, { pending: false });
  wega.commit();
}
function busy(on: boolean) {
  const W = wega.get();
  const was = W.busy;
  W.busy = on;
  /* an answer that arrives while Wega is out of sight: "Ask wega" says so and shows its start in a small pop-up */
  if (was && !on && wgHidden(W) && W.msgs.at(-1)?.role === 'wega') W.ready = W.peek = true;
  wega.commit();
}
export function wgStop() {
  ctl?.abort();
  ctl = null;
  busy(false);
}
export function wgPushUser(text: string) {
  push({ role: 'user', text });
}

/** A question asked from outside the chat (the chat bar, a button on the page) while the chat is closed starts a new chat,
    never one inside the last (felipe, Oct 27). The last one stays behind the hub's "Back to your last chat". */
function start() {
  const W = wega.get();
  if (W.open || W.inline) return;
  if (W.msgs.length) wgNew();
  wgOpen();
}

/** Run a scripted intent (prompt chip or a button somewhere on the page), or one of the Wega page's ready questions
    (an intent that is its href, from the hub's topics). */
export function wgRun(intent: string, label?: string, extra?: unknown) {
  start();
  if (wega.get().busy) wgStop();
  if (label) push({ role: 'user', text: label });
  const m = push({ role: 'wega', pending: true, think: thinkSteps(intent, wega.get().page.screen) });
  busy(true);
  const my = ++run;
  /* long enough to see Wega think, as with a live model */
  setTimeout(() => {
    fill(m, intent.startsWith('/wega/') ? { href: intent, fresh: true, follow: followFor(intent).map((h): Chip => [promptLabel(h) || h, h]) } : { ...answer(intent, extra), fresh: true });
    if (my === run) busy(false);
  }, 1800 + Math.random() * 700);
}

/** Free text: live through /api/wega when a model key is configured, otherwise the keyword router. */
export async function wgAsk(text: string) {
  start();
  if (wega.get().busy) wgStop();
  push({ role: 'user', text });
  const m = push({ role: 'wega', pending: true, think: thinkSteps(text, wega.get().page.screen) });
  busy(true);
  const my = ++run;
  const W = wega.get();
  if (W.live === false) {
    /* long enough to close the chat and see the "last chat" message above the chat bar still thinking */
    setTimeout(() => {
      fill(m, { ...routeText(text), fresh: true });
      if (my === run) busy(false);
    }, 2600);
    return;
  }
  const hist = W.msgs
    .filter((x) => !x.pending && x.id < m.id && (x.text || '').trim())
    .slice(-10)
    .map((x) => ({ role: x.role === 'user' ? 'user' : 'assistant', content: x.text as string }));
  while (hist.length && hist[0].role !== 'user') hist.shift();
  const c = new AbortController();
  ctl = c;
  try {
    const res = await fetch('/api/wega', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ system: rulesPrompt(), messages: hist }),
      signal: c.signal,
    });
    if (res.status === 501) {
      W.live = false;
      fill(m, { ...routeText(text), fresh: true });
      return;
    }
    if (!res.ok || !res.body) throw new Error('bad');
    W.live = true;
    const rd = res.body.getReader();
    const dec = new TextDecoder();
    let out = '';
    for (;;) {
      const { done, value } = await rd.read();
      if (done) break;
      out += dec.decode(value, { stream: true });
      Object.assign(m, { text: out, pending: false, live: true, fresh: true, streaming: true });
      wega.commit();
    }
    fill(m, { text: out, live: true, fresh: true, streaming: false });
  } catch (e: any) {
    if (e?.name === 'AbortError') fill(m, { text: m.text || '', live: true, note: 'Stopped.', streaming: false });
    else fill(m, { ...routeText(text), note: 'The live answer didn’t work. This is a sample answer.', fresh: true, streaming: false });
  } finally {
    if (ctl === c) ctl = null;
    if (my === run) busy(false);
  }
}

/** Prompt chips marked "live" in the prototype: a live model answers the label as free text, otherwise the scripted intent runs. */
export function wgAskLive(intent: string, label: string) {
  return wega.get().live === true ? wgAsk(label) : wgRun(intent, label);
}
