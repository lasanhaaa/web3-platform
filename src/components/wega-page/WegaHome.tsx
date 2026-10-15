'use client';
/* The Wega page as a chat (felipe, Oct 15). Empty, it shows a greeting, one input and five topics. Once the member
   asks anything, the page becomes the conversation: their messages on the right, Wega's answers under each one,
   suggested follow-ups after the last answer and the input docked at the bottom. */
import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CATS, CHECKS, RESULT_FOLLOW, SNAP_DATE, cat as catOf, isCat, isScen, promptLabel, textAnswer, wp, wpToggleHide } from '@/lib/wega-page';
import { chat, chatAsk, chatFree, chatLoad, chatNew, chatTopic, TOPIC, type ChatMsg } from '@/lib/wega-chat';
import { useHydrated } from '@/lib/hydrated';
import { toast } from '@/lib/toast';
import { Allocation, IdleCost, LearningPath, PortfolioCheck, RiskMix, Scenario } from './Results';
import { FreeReply, TextReply, freeFollow } from './Ask';
import { CHEV, CatIcon, EYE, EYE_OFF, Icon, Orb, Passage, PromptBox, useWegaPageChrome } from './parts';

const PLUS = 'M12 5v14M5 12h14';

export function WegaHome() {
  useWegaPageChrome();
  useSeed();
  const C = chat.use();
  const hydrated = useHydrated();
  if (!hydrated || !C.loaded) return <div className="page wp wp-home" />;
  return C.msgs.length || C.typing ? <Conversation /> : <Start />;
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

/* ---------- empty page: greeting, input, topics ---------- */
function Start() {
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
        <div className="wp-chips" role="group" aria-label="Topics">
          {CATS.map((x) => (
            <button key={x.id} onClick={() => chatTopic(x.id)}>
              <CatIcon id={x.id} />
              {x.label}
            </button>
          ))}
        </div>
      </div>
    </div>
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
        <button className="wp-new" onClick={chatNew}>
          <Icon d={PLUS} size={16} />
          New chat
        </button>
      </div>

      <div className="wp-thread" aria-live="polite">
        {C.msgs.map((m) => (m.who === 'me' ? <MeMsg key={m.id} m={m} /> : <WegaMsg key={m.id} m={m} last={m.id === lastId} />))}
        {C.typing > 0 && (
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
function followFor(m: WegaM): string[] {
  if (m.kind === 'answer') {
    const k = /[?&]k=([^&]+)/.exec(m.href)?.[1];
    return k ? textAnswer(k)?.follow || [] : RESULT_FOLLOW[m.href] || [];
  }
  return m.kind === 'free' ? freeFollow(m) : [];
}

function WegaMsg({ m, last }: { m: WegaM; last: boolean }) {
  const follow = last ? followFor(m) : [];
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

function AnswerFor({ href }: { href: string }) {
  const [path, qs] = href.split('?');
  const sp = new URLSearchParams(qs);
  switch (path) {
    case '/wega/portfolio-check':
      return <PortfolioCheck />;
    case '/wega/risk-mix':
      return <RiskMix />;
    case '/wega/allocation':
      return <Allocation />;
    case '/wega/idle-cost':
      return <IdleCost />;
    case '/wega/learning-path':
      return <LearningPath />;
    case '/wega/scenario': {
      const s = sp.get('s');
      return <Scenario s={isScen(s) ? s : 'eth30'} />;
    }
    case '/wega/ask':
      return <TextReply k={sp.get('k') || ''} />;
  }
  return null;
}
