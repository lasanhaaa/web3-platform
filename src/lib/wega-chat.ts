'use client';
/* The Wega page as conversations (felipe, Oct 15: "it has to feel like a chat"): every ready question, follow-up
   or typed question is a message from the member, and Wega answers in the thread below it.
   Client feedback (Oct 15): a hub with past chats. Every conversation is kept in this browser (localStorage) with
   a title (its first question), so the member can reopen it; "New chat" starts another one. A few sample chats
   are added on the first visit so the hub isn't empty in the prototype. */
import { createStore } from './store';
import { promptLabel, routeQuestion, type CatId } from './wega-page';

export type ChatMsg =
  | { id: number; who: 'me'; text: string; passage?: string }
  /** Wega offers the ready questions of a topic (from "Open in Wega" on other pages) */
  | { id: number; who: 'wega'; kind: 'topic'; cat: CatId }
  /** a result (/wega/risk-mix …) or a scripted text answer (/wega/ask?k=…) */
  | { id: number; who: 'wega'; kind: 'answer'; href: string }
  /** a typed question: live when a model key is set, otherwise a sample answer */
  | { id: number; who: 'wega'; kind: 'free'; q: string; passage?: string; text?: string; mode?: 'live' | 'sample'; failed?: boolean };
type NewMsg = ChatMsg extends infer M ? (M extends ChatMsg ? Omit<M, 'id'> : never) : never;
export type Chat = { id: string; title: string; at: number; msgs: ChatMsg[] };

/** What the member "says" when a topic opens from another page, and how Wega opens it. */
export const TOPIC: Record<CatId, { ask: string; reply: string }> = {
  portfolio: { ask: 'Let’s look at my portfolio', reply: 'Sure. I’m using your snapshot of Oct 9. What do you want to know?' },
  coins: { ask: 'Tell me about the coins', reply: 'Sure. Which coin do you want to look at?' },
  strategies: { ask: 'Help me with the strategies', reply: 'Happy to. These are the questions members ask most about the strategies:' },
  simulations: { ask: 'I want to try a scenario', reply: 'Let’s do it. I’ll run it on your own portfolio. Which one?' },
  learn: { ask: 'Help me learn', reply: 'Of course. Where do you want to start?' },
  w3u: { ask: 'How does Web3 Universe work?', reply: 'Here’s what I can explain about the platform:' },
};

export const chat = createStore({
  /** the open conversation's messages (a copy of list[cur].msgs) */
  msgs: [] as ChatMsg[],
  cur: null as string | null,
  /** every conversation, most recent first */
  list: [] as Chat[],
  typing: 0,
  typingIn: null as string | null,
  /** the "Your chats" panel */
  panel: false,
  loaded: false,
});
const LS = 'w3u-wega-chats',
  SS = 'w3u-wega-cur';

function save() {
  const C = chat.get();
  try {
    localStorage.setItem(LS, JSON.stringify(C.list));
    sessionStorage.setItem(SS, C.cur || '');
  } catch {}
}
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const titleOf = (t: string) => (t.length > 64 ? t.slice(0, 62).trimEnd() + '…' : t);

/** Sample past chats for the first visit (the answers are drawn live from the member's sample data). */
function seeds(): Chat[] {
  const now = Date.now(),
    H = 36e5;
  const qa = (hrefs: string[]) =>
    hrefs.flatMap((h, i): ChatMsg[] => [
      { id: i * 2 + 1, who: 'me', text: promptLabel(h) || '' },
      { id: i * 2 + 2, who: 'wega', kind: 'answer', href: h },
    ]);
  return [
    { id: 'sample-eth', title: 'What if ETH drops 30%?', at: now - 26 * H, msgs: qa(['/wega/scenario?s=eth30', '/wega/asset?a=eth']) },
    { id: 'sample-carry', title: 'Explain Carry Trades simply', at: now - 3 * 24 * H, msgs: qa(['/wega/ask?k=carry', '/wega/ask?k=fit']) },
    { id: 'sample-check', title: 'Check my portfolio', at: now - 6 * 24 * H, msgs: qa(['/wega/portfolio-check']) },
  ];
}

export function chatLoad() {
  const C = chat.get();
  if (C.loaded) return;
  C.loaded = true;
  try {
    const raw = localStorage.getItem(LS);
    C.list = raw ? JSON.parse(raw) : seeds();
    if (!raw) localStorage.setItem(LS, JSON.stringify(C.list));
    const cur = sessionStorage.getItem(SS);
    const c = cur ? C.list.find((x) => x.id === cur) : undefined;
    C.cur = c ? c.id : null;
    C.msgs = c ? c.msgs : [];
  } catch {
    C.list = seeds();
  }
  chat.commit();
}

/** Adds a message to a chat (the open one by default); the first message starts a new chat. */
function push(m: NewMsg, cid: string | null = chat.get().cur) {
  const C = chat.get();
  let c = cid ? C.list.find((x) => x.id === cid) : undefined;
  if (!c) {
    if (cid) return cid; // a reply to a chat deleted while Wega was typing
    c = { id: newId(), title: '', at: Date.now(), msgs: [] };
    if (cid === C.cur) C.cur = c.id;
  }
  const id = c.msgs.reduce((n, x) => Math.max(n, x.id), 0) + 1;
  const next: Chat = { ...c, at: Date.now(), title: c.title || (m.who === 'me' ? titleOf(m.text) : ''), msgs: [...c.msgs, { ...m, id } as ChatMsg] };
  C.list = [next, ...C.list.filter((x) => x.id !== next.id)];
  if (C.cur === next.id) C.msgs = next.msgs;
  save();
  chat.commit();
  return next.id;
}
/** Wega "types" for a moment before a ready answer appears, as in a chat. */
function reply(m: NewMsg, cid: string) {
  const C = chat.get();
  C.typing++;
  C.typingIn = cid;
  chat.commit();
  setTimeout(
    () => {
      C.typing--;
      if (!C.typing) C.typingIn = null;
      push(m, cid);
    },
    700 + Math.random() * 400,
  );
}

/** A topic opened from another page ("Open in Wega"): Wega offers its ready questions. */
export function chatTopic(c: CatId) {
  const cid = push({ who: 'me', text: TOPIC[c].ask });
  reply({ who: 'wega', kind: 'topic', cat: c }, cid);
}
/** The member taps a ready question or a follow-up. */
export function chatAsk(href: string) {
  const cid = push({ who: 'me', text: promptLabel(href) || 'Tell me more' });
  reply({ who: 'wega', kind: 'answer', href }, cid);
}
/** The member types a question, or asks about a passage of an answer. */
export function chatFree(text: string, passage?: string) {
  const t = text.trim();
  if (!t) return;
  const q = t.charAt(0).toUpperCase() + t.slice(1);
  const href = !passage && routeQuestion(t);
  const cid = push({ who: 'me', text: q, passage });
  if (href) reply({ who: 'wega', kind: 'answer', href }, cid);
  else push({ who: 'wega', kind: 'free', q, passage }, cid);
}
/** Saves a typed question's answer once it is written. */
export function chatFill(id: number, patch: { text: string; mode: 'live' | 'sample'; failed?: boolean }) {
  const C = chat.get();
  C.list = C.list.map((c) => (c.id === C.cur ? { ...c, msgs: c.msgs.map((m) => (m.id === id && m.who === 'wega' && m.kind === 'free' ? { ...m, ...patch } : m)) } : c));
  C.msgs = C.list.find((c) => c.id === C.cur)?.msgs || C.msgs;
  save();
  chat.commit();
}
/** Back to the start page; the conversation stays in "Your chats". */
export function chatNew() {
  const C = chat.get();
  C.cur = null;
  C.msgs = [];
  C.panel = false;
  save();
  chat.commit();
}
export function chatOpen(id: string) {
  const C = chat.get();
  const c = C.list.find((x) => x.id === id);
  if (!c) return;
  C.cur = c.id;
  C.msgs = c.msgs;
  C.panel = false;
  save();
  chat.commit();
}
export function chatDelete(id: string) {
  const C = chat.get();
  C.list = C.list.filter((x) => x.id !== id);
  if (C.cur === id) {
    C.cur = null;
    C.msgs = [];
  }
  save();
  chat.commit();
}
export function chatPanel(open: boolean) {
  chat.get().panel = open;
  chat.commit();
}

/** "Today", "Yesterday", "3 days ago", or a date. */
export function when(at: number) {
  const d0 = new Date();
  d0.setHours(0, 0, 0, 0);
  const days = Math.ceil((d0.getTime() - at) / 864e5);
  if (days <= 0) return new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
/** Chats grouped for the panel: Today, Yesterday, This week, Earlier. */
export function groups(list: Chat[]) {
  const d0 = new Date();
  d0.setHours(0, 0, 0, 0);
  const t = d0.getTime(),
    out: { label: string; items: Chat[] }[] = [];
  const add = (label: string, c: Chat) => {
    const g = out.find((x) => x.label === label);
    if (g) g.items.push(c);
    else out.push({ label, items: [c] });
  };
  for (const c of list) add(c.at >= t ? 'Today' : c.at >= t - 864e5 ? 'Yesterday' : c.at >= t - 6 * 864e5 ? 'This week' : 'Earlier', c);
  return out;
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
