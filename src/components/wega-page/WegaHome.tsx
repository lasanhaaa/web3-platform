'use client';
/* The Wega page as a chat (felipe, Oct 15). Empty, it is the Wega hub: a greeting, one input, six topics and the
   member's recent chats. Hovering a topic shows its ready questions; clicking one opens the chat with that question
   answered (client feedback, Oct 15, like Decade). Once the member asks anything, the page becomes the conversation:
   their messages on the right, Wega's answers under each one, follow-ups after the last answer, the input docked at
   the bottom, and "Your chats" to go back to any past conversation. */
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CHECKS, SNAP_DATE, cat as catOf, followFor, isCat, promptLabel, wp, wpToggleHide } from '@/lib/wega-page';
import { chat, chatAsk, chatDelete, chatFree, chatLoad, chatNew, chatOpen, chatPanel, chatTopic, groups, when, TOPIC, type Chat, type ChatMsg } from '@/lib/wega-chat';
import { useHydrated } from '@/lib/hydrated';
import { toast } from '@/lib/toast';
import { AnswerFor } from './Answer';
import { Topics } from './Topics';
import { FreeReply, freeFollow } from './Ask';
import { CHEV, CatIcon, EYE, EYE_OFF, Icon, Orb, Passage, PromptBox, useWegaPageChrome } from './parts';

const PLUS = 'M12 5v14M5 12h14';
const CHATS = 'M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.4A8.5 8.5 0 1 1 21 12Z';
const TRASH = 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3';
const X = 'M6 6l12 12M18 6 6 18';

export function WegaHome() {
  useWegaPageChrome();
  useSeed();
  const C = chat.use();
  const hydrated = useHydrated();
  if (!hydrated || !C.loaded) return <div className="page wp wp-home" />;
  return (
    <>
      {C.msgs.length ? <Conversation key={C.cur || 'new'} /> : <Start />}
      {C.panel && <ChatsPanel />}
    </>
  );
}

/* Arriving with a question (?c=topic from "Open in Wega", ?ask=… or ?q=… from an old link) starts a new chat with it. */
let lastSeed = '';
function useSeed() {
  const q = useSearchParams();
  const router = useRouter();
  const c = q.get('c'),
    ask = q.get('ask'),
    text = q.get('q'),
    p = q.get('p');
  useEffect(() => {
    const key = [c, ask, text, p].join('|');
    if (!c && !ask && !text) {
      lastSeed = '';
      return;
    }
    if (key === lastSeed) return;
    lastSeed = key;
    chatLoad();
    chatNew();
    if (isCat(c)) chatTopic(c);
    else if (ask?.startsWith('/wega/')) chatAsk(ask);
    else if (text) chatFree(text, p || undefined);
    router.replace('/wega', { scroll: false });
  }, [c, ask, text, p, router]);
}

/* ---------- the hub: greeting, input, topics, recent chats ---------- */
function Start() {
  const C = chat.use();
  const recent = C.list.slice(0, 3);
  return (
    <div className="page wp wp-home fade">
      <div className="wp-top">
        <button className="wp-pill" onClick={() => chatAsk('/wega/portfolio-check')} title={CHECKS.map((x) => x.t).join(' · ')}>
          <i className="dot" aria-hidden />
          {CHECKS.length} things to check
          <Icon d={CHEV} size={16} />
        </button>
      </div>
      <div className="wp-mid">
        <div className="wp-hello">
          <Orb size={40} />
          <h1>
            <span>Hi, Daniel.</span> What do you want to understand today?
          </h1>
        </div>
        <PromptBox variant="hero" autoFocus />
        <Topics ask={(href) => chatAsk(href)} />
        {recent.length > 0 && (
          <section className="wp-recent" aria-label="Recent chats">
            <div className="wp-recent-h">
              <h2>Recent chats</h2>
              {C.list.length > 0 && (
                <button className="wp-link" onClick={() => chatPanel(true)}>
                  See all ({C.list.length})
                </button>
              )}
            </div>
            <ul>
              {recent.map((c) => (
                <li key={c.id}>
                  <button onClick={() => chatOpen(c.id)}>
                    <Icon d={CHATS} size={18} />
                    <span className="t">{c.title || 'Chat with Wega'}</span>
                    <span className="w">{when(c.at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

/* ---------- "Your chats": every past conversation ---------- */
function ChatsPanel() {
  const C = chat.use();
  const [ask, setAsk] = useState<string | null>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && chatPanel(false);
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  return (
    <>
      <div className="wp-scrim" onClick={() => chatPanel(false)} aria-hidden />
      <aside className="wp-chats" aria-label="Your chats">
        <div className="wp-chats-h">
          <h2>Your chats</h2>
          <button className="wp-ib" onClick={() => chatPanel(false)} aria-label="Close">
            <Icon d={X} />
          </button>
        </div>
        <button className="wp-new wide" onClick={chatNew}>
          <Icon d={PLUS} size={16} />
          New chat
        </button>
        {C.list.length === 0 && <p className="wp-chats-empty">No chats yet. Ask Wega anything and it will appear here.</p>}
        {groups(C.list).map((g) => (
          <section key={g.label}>
            <h3>{g.label}</h3>
            <ul>
              {g.items.map((c: Chat) => (
                <li key={c.id} className={c.id === C.cur ? 'on' : undefined}>
                  {ask === c.id ? (
                    <div className="wp-del">
                      <span>Delete this chat?</span>
                      <button className="yes" onClick={() => chatDelete(c.id)}>
                        Delete
                      </button>
                      <button onClick={() => setAsk(null)}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <button className="open" onClick={() => chatOpen(c.id)} aria-current={c.id === C.cur || undefined}>
                        <span className="t">{c.title || 'Chat with Wega'}</span>
                        <span className="w">
                          {when(c.at)} · {Math.ceil(c.msgs.length / 2)} {c.msgs.length > 2 ? 'questions' : 'question'}
                        </span>
                      </button>
                      <button className="wp-ib del" onClick={() => setAsk(c.id)} aria-label={`Delete “${c.title}”`}>
                        <Icon d={TRASH} size={18} />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </aside>
    </>
  );
}

/* ---------- the conversation ---------- */
function Conversation() {
  const C = chat.use();
  const W = wp.use();
  const lastMe = C.msgs.findLast((m) => m.who === 'me')?.id;
  const lastId = C.msgs[C.msgs.length - 1]?.id;
  /* each new question scrolls to the top of the screen, so Wega's answer appears right under it */
  const first = useRef(true);
  useEffect(() => {
    document.querySelector(`[data-mid="${lastMe}"]`)?.scrollIntoView({ block: 'start', behavior: first.current ? 'instant' : 'smooth' });
    first.current = false;
  }, [lastMe]);
  return (
    <div className="page wp wp-chat fade">
      <div className="wp-chat-bar">
        <span className="wp-chat-t">
          <Orb size={28} />
          Wega
        </span>
        <button className="wp-src" onClick={() => toast('This opens your snapshot in My Portfolio. It isn’t part of the prototype.')}>
          Snapshot of {SNAP_DATE}
        </button>
        <button className="wp-ib" onClick={wpToggleHide} aria-pressed={W.hide} aria-label={W.hide ? 'Show values' : 'Hide values'} title={W.hide ? 'Show values' : 'Hide values'}>
          <Icon d={W.hide ? EYE_OFF : EYE} />
        </button>
        <button className="wp-chats-btn" onClick={() => chatPanel(true)}>
          <Icon d={CHATS} size={18} />
          Chats
        </button>
        <button className="wp-new" onClick={chatNew}>
          <Icon d={PLUS} size={16} />
          New chat
        </button>
      </div>

      <div className="wp-thread" aria-live="polite">
        {C.msgs.map((m) => (m.who === 'me' ? <MeMsg key={m.id} m={m} /> : <WegaMsg key={m.id} m={m} last={m.id === lastId} />))}
        {C.typing > 0 && C.typingIn === C.cur && (
          <div className="wp-msg wega">
            <div className="wp-who">
              <Orb size={24} thinking />
              Wega
            </div>
            <span className="wg-dots" aria-label="Wega is writing">
              <i />
              <i />
              <i />
            </span>
          </div>
        )}
      </div>

      <div className="wp-dock">
        <PromptBox variant="dock" placeholder="Reply to Wega…" autoFocus />
        <p className="wp-note">Wega can make mistakes · Sample data · Not financial advice</p>
      </div>
      <Passage />
    </div>
  );
}

function MeMsg({ m }: { m: Extract<ChatMsg, { who: 'me' }> }) {
  return (
    <div className="wp-msg me" data-mid={m.id}>
      <div className="wp-bub">
        {m.passage && <blockquote className="wp-quote">“{m.passage}”</blockquote>}
        {m.text}
      </div>
    </div>
  );
}

type WegaM = Extract<ChatMsg, { who: 'wega' }>;
function followOf(m: WegaM): string[] {
  if (m.kind === 'answer') return followFor(m.href);
  return m.kind === 'free' ? freeFollow(m) : [];
}

function WegaMsg({ m, last }: { m: WegaM; last: boolean }) {
  const follow = last ? followOf(m) : [];
  return (
    <div className="wp-msg wega" data-mid={m.id}>
      <div className="wp-who">
        <Orb size={24} />
        Wega
      </div>
      {m.kind === 'topic' ? <TopicReply m={m} /> : m.kind === 'answer' ? <AnswerFor href={m.href} /> : <FreeReply m={m} />}
      {follow.length > 0 && (
        <div className="wp-sugg" role="group" aria-label="Suggested questions">
          {follow.map((h) => (
            <button key={h} onClick={() => chatAsk(h)}>
              {promptLabel(h)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Wega opens a topic and offers its ready questions as replies. */
function TopicReply({ m }: { m: Extract<WegaM, { kind: 'topic' }> }) {
  return (
    <section className="wp-ans">
      <div className="wp-text">
        <p>{TOPIC[m.cat].reply}</p>
      </div>
      <ul className="wp-quick" aria-label={`${catOf(m.cat).label} questions`}>
        {catOf(m.cat).prompts.map((p) => (
          <li key={p.href}>
            <button onClick={() => chatAsk(p.href)}>
              <span>{p.label}</span>
              <Icon d={CHEV} size={18} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
