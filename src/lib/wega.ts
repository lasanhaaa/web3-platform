'use client';
import { useEffect, type ReactNode } from 'react';
import { createStore } from './store';
import { answer, routeText, rulesPrompt, ctxLabel } from './wega-brain';

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
  kind?: 'div';
  text?: string;
  node?: ReactNode;
  pending?: boolean;
  live?: boolean;
  note?: string;
  follow?: Chip[];
};

export const wega = createStore({
  open: false,
  msgs: [] as Msg[],
  busy: false,
  /** answer arrived while the panel was closed */
  ready: false,
  page: { screen: 'map' } as WegaPage,
  ctxKey: '',
  /** null = no live model configured (scripted answers only) */
  live: undefined as boolean | undefined,
  prac: null as null | { list: any[]; i: number },
  /** practice question counter (Wega's "Give me a practice question") */
  lq: 0,
});
let seq = 0;
let ctl: AbortController | null = null;

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
  const W = wega.get();
  const prev = W.ctxKey;
  const label = ctxLabel(p).replace(/ · \d\d:\d\d$/, '');
  const k = label + '|' + p.screen;
  W.page = p;
  if (k !== prev) {
    W.ctxKey = k;
    if (prev && W.open && W.msgs.length && W.msgs.at(-1)?.kind !== 'div') W.msgs.push({ id: ++seq, kind: 'div', text: label });
  }
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

export function wgOpen() {
  const W = wega.get();
  W.open = true;
  W.ready = false;
  wega.commit();
}
export function wgClose() {
  wega.get().open = false;
  wega.commit();
}
export const wgToggle = () => (wega.get().open ? wgClose() : wgOpen());
export function wgNew() {
  wgStop();
  const W = wega.get();
  W.msgs = [];
  W.prac = null;
  wega.commit();
}
function push(m: Omit<Msg, 'id'>) {
  const msg = { ...m, id: ++seq } as Msg;
  wega.get().msgs.push(msg);
  wega.commit();
  return msg;
}
function fill(m: Msg, a: Partial<Answer>) {
  Object.assign(m, a, { pending: false });
  wega.commit();
}
function busy(on: boolean) {
  const W = wega.get();
  W.busy = on;
  if (!on && !W.open) W.ready = true;
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

/** Run a scripted intent (prompt chip or a button somewhere on the page). */
export function wgRun(intent: string, label?: string, extra?: unknown) {
  if (!wega.get().open) wgOpen();
  if (wega.get().busy) wgStop();
  if (label) push({ role: 'user', text: label });
  const m = push({ role: 'wega', pending: true });
  busy(true);
  setTimeout(() => {
    fill(m, answer(intent, extra));
    busy(false);
  }, 420 + Math.random() * 380);
}

/** Free text: live through /api/wega when a model key is configured, otherwise the keyword router. */
export async function wgAsk(text: string) {
  if (!wega.get().open) wgOpen();
  push({ role: 'user', text });
  const m = push({ role: 'wega', pending: true });
  busy(true);
  const W = wega.get();
  if (W.live === false) {
    setTimeout(() => {
      fill(m, routeText(text));
      busy(false);
    }, 500);
    return;
  }
  const hist = W.msgs
    .filter((x) => !x.kind && !x.pending && x.id < m.id && (x.text || '').trim())
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
      fill(m, { ...routeText(text) });
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
      m.text = out;
      m.pending = false;
      m.live = true;
      wega.commit();
    }
    fill(m, { text: out, live: true });
  } catch (e: any) {
    if (e?.name === 'AbortError') fill(m, { text: m.text || '', live: true, note: 'Stopped.' });
    else fill(m, { ...routeText(text), note: 'The live answer didn’t work. This is a sample answer.' });
  } finally {
    if (ctl === c) ctl = null;
    busy(false);
  }
}

/** Prompt chips marked "live" in the prototype: a live model answers the label as free text, otherwise the scripted intent runs. */
export function wgAskLive(intent: string, label: string) {
  return wega.get().live === true ? wgAsk(label) : wgRun(intent, label);
}
