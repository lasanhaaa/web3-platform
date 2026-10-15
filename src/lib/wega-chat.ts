'use client';
/* The Wega page as one conversation (felipe, Oct 15: "it has to feel like a chat"): every topic, ready question,
   follow-up or typed question is a message from the member, and Wega answers in the thread below it.
   The thread is kept for the browser tab, so leaving for a lesson and coming back keeps the conversation. */
import { createStore } from './store';
import { promptLabel, routeQuestion, type CatId } from './wega-page';

export type ChatMsg =
  | { id: number; who: 'me'; text: string; passage?: string }
  /** Wega offers the ready questions of a topic */
  | { id: number; who: 'wega'; kind: 'topic'; cat: CatId }
  /** a result (/wega/risk-mix …) or a scripted text answer (/wega/ask?k=…) */
  | { id: number; who: 'wega'; kind: 'answer'; href: string }
  /** a typed question: live when a model key is set, otherwise a sample answer */
  | { id: number; who: 'wega'; kind: 'free'; q: string; passage?: string; text?: string; mode?: 'live' | 'sample'; failed?: boolean };
type NewMsg = ChatMsg extends infer M ? (M extends ChatMsg ? Omit<M, 'id'> : never) : never;

/** What the member "says" when they tap a topic, and how Wega opens it. */
export const TOPIC: Record<CatId, { ask: string; reply: string }> = {
  portfolio: { ask: 'Let’s look at my portfolio', reply: 'Sure. I’m using your snapshot of Oct 9. What do you want to know?' },
  strategies: { ask: 'Help me with the strategies', reply: 'Happy to. These are the questions members ask most about the strategies:' },
  simulations: { ask: 'I want to try a scenario', reply: 'Let’s do it. I’ll run it on your own portfolio. Which one?' },
  learn: { ask: 'Help me learn', reply: 'Of course. Where do you want to start?' },
  w3u: { ask: 'How does Web3 Universe work?', reply: 'Here’s what I can explain about the platform:' },
};

export const chat = createStore({ msgs: [] as ChatMsg[], typing: 0, loaded: false });
const SS = 'w3u-wega-chat';
let seq = 0;

function save() {
  try {
    sessionStorage.setItem(SS, JSON.stringify(chat.get().msgs));
  } catch {}
}
export function chatLoad() {
  const C = chat.get();
  if (C.loaded) return;
  C.loaded = true;
  try {
    C.msgs = JSON.parse(sessionStorage.getItem(SS) || '[]');
  } catch {}
  seq = C.msgs.reduce((n, m) => Math.max(n, m.id), 0);
  chat.commit();
}
function push(m: NewMsg) {
  const C = chat.get();
  C.msgs = [...C.msgs, { ...m, id: ++seq } as ChatMsg];
  save();
  chat.commit();
}
/** Wega "types" for a moment before a ready answer appears, as in a chat. */
function reply(m: NewMsg) {
  const C = chat.get();
  C.typing++;
  chat.commit();
  setTimeout(
    () => {
      C.typing--;
      push(m);
    },
    700 + Math.random() * 400,
  );
}

/** The member taps a topic chip. */
export function chatTopic(c: CatId) {
  push({ who: 'me', text: TOPIC[c].ask });
  reply({ who: 'wega', kind: 'topic', cat: c });
}
/** The member taps a ready question or a follow-up. */
export function chatAsk(href: string) {
  push({ who: 'me', text: promptLabel(href) || 'Tell me more' });
  reply({ who: 'wega', kind: 'answer', href });
}
/** The member types a question, or asks about a passage of an answer. */
export function chatFree(text: string, passage?: string) {
  const t = text.trim();
  if (!t) return;
  const q = t.charAt(0).toUpperCase() + t.slice(1);
  const href = !passage && routeQuestion(t);
  push({ who: 'me', text: q, passage });
  if (href) reply({ who: 'wega', kind: 'answer', href });
  else push({ who: 'wega', kind: 'free', q, passage });
}
/** Saves a typed question's answer once it is written. */
export function chatFill(id: number, patch: { text: string; mode: 'live' | 'sample'; failed?: boolean }) {
  const C = chat.get();
  C.msgs = C.msgs.map((m) => (m.id === id && m.who === 'wega' && m.kind === 'free' ? { ...m, ...patch } : m));
  save();
  chat.commit();
}
export function chatNew() {
  const C = chat.get();
  C.msgs = [];
  save();
  chat.commit();
}

/** The conversation so far, for a live answer: the member's messages and a line for each of Wega's. */
export function chatHistory(beforeId: number) {
  const out: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const m of chat.get().msgs.filter((x) => x.id < beforeId).slice(-12)) {
    const role = m.who === 'me' ? 'user' : 'assistant';
    const content =
      m.who === 'me'
        ? (m.passage ? `About this passage: “${m.passage}”\n\n` : '') + m.text
        : m.kind === 'free'
          ? m.text || ''
          : m.kind === 'topic'
            ? TOPIC[m.cat].reply
            : `(Wega showed the answer “${promptLabel(m.href) || m.href}” as a card with the member’s numbers.)`;
    if (!content) continue;
    const last = out[out.length - 1];
    if (last?.role === role) last.content += '\n\n' + content;
    else out.push({ role, content });
  }
  while (out[0]?.role === 'assistant') out.shift();
  return out;
}
