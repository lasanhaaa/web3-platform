'use client';
/* Wega's chat on the lesson page, like the chat next to a live stream (felipe, Oct 16). Since Oct 21 it is a column on
   the right, as wide as the lessons menu, opened from "Ask wega"; on phones it is a sheet over the page. Questions carry
   the moment of the video they were asked at, as in a stream's chat replay; tapping the time jumps back there. The
   terms, simpler explanations and "what it means for my money" are questions in this chat, not boxes of their own. */
import { useEffect, useRef } from 'react';
import { ROUTES, R, chaptersFor, chIdx, dur } from '@/lib/curriculum';
import { S, useProgress } from '@/lib/progress';
import { lessonView, player, seekLesson, showLessonChat } from '@/lib/player';
import { wega, wgClose, wgInline, wgSeen, type Chip, type Msg } from '@/lib/wega';
import { tt } from '@/lib/format';
import { WI } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { ChipBtn, Composer, Orb, WegaText } from '@/components/wega/Wega';

const SUGG: Chip[] = [
  ['What is this part about?', 'l_moment'],
  ['Explain it more simply', 'l_simple'],
  ['What do the key terms mean?', 'l_terms'],
  ['What does this mean for my money?', 'l_port'],
];
const HIDE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13 6 6 6-6 6M5 6l6 6-6 6"/></svg>';

/** One line of the chat: who wrote it, when in the video, then the text (and, for Wega, any card and follow-ups). */
function Line({ m, len }: { m: Msg; len: number }) {
  const you = m.role === 'user';
  /* a card and the follow-ups come in once Wega's text is written */
  const shown = !m.pending && !m.fresh;
  /* on a phone the sheet covers the video, so it closes to show that moment */
  const jump = () => {
    if (m.at == null || !seekLesson(m.at) || window.innerWidth > 1000) return;
    showLessonChat(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <div className={`lc-l${you ? ' you' : ''}`} data-lc={m.id}>
      {you ? <span className="lc-av">D</span> : <Orb thinking={m.pending} />}
      <div className="lc-c">
        <div className="lc-who">
          <b>{you ? 'You' : 'Wega'}</b>
          {you && m.at != null && m.at > 0 && (
            <button className="lc-at tnum" onClick={jump} title="Watch this moment again">
              {tt(Math.round(m.at * len))}
            </button>
          )}
        </div>
        {you ? <p className="lc-q">{m.text}</p> : <WegaText m={m} />}
        {!you && shown && m.node && <div className="wg-in">{m.node}</div>}
        {!you && shown && m.follow && m.follow.length > 0 && (
          <div className="wg-follow">
            {m.follow.map((c) => (
              <ChipBtn key={c[1] + c[0]} c={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function LessonChat({ rid, zi, li, k }: { rid: string; zi: number; li: number; k: string }) {
  useProgress();
  player.use();
  const W = wega.use();
  const body = useRef<HTMLDivElement>(null);
  /* a fresh conversation for each lesson; the floating panel stays closed while the lesson shows Wega itself */
  useEffect(() => {
    wgClose();
    wgInline(true);
    wega.get().clock = () => S.prog[k] || 0;
    document.body.classList.add('lc-on');
    return () => {
      wgInline(false);
      wega.get().clock = null;
      document.body.classList.remove('lc-on');
    };
  }, [k]);
  const V = lessonView.use();
  /* opening the column shows the answer: "Ask wega" stops saying it is ready */
  useEffect(() => {
    if (V.chat) wgSeen();
  }, [V.chat]);
  const msgs = W.msgs.filter((m) => m.id > W.inlineFrom);
  const lastQ = msgs.filter((m) => m.role === 'user').at(-1)?.id;
  /* a new question goes to the top of the chat so its answer reads from the start; when it was asked from elsewhere
     on the page (the quick check) while the chat was closed, the chat opens */
  const first = useRef(true);
  useEffect(() => {
    /* the first render can still list the conversation from before this lesson: only new questions count */
    if (first.current) {
      first.current = false;
      return;
    }
    if (lastQ == null) return;
    if (!lessonView.get().chat) showLessonChat(true);
    requestAnimationFrame(() => {
      const b = body.current,
        el = b?.querySelector<HTMLElement>(`[data-lc="${lastQ}"]`);
      if (b && el) b.scrollTo({ top: el.offsetTop - b.offsetTop - 12, behavior: 'smooth' });
    });
  }, [lastQ]);

  const ch = chaptersFor(rid, zi, li),
    pr = S.prog[k] || 0,
    c = ch[chIdx(ch, pr)],
    len = dur(ROUTES.indexOf(R(rid)), zi, li) * 60;
  return (
    <section className="lc" id="lc" aria-label="Chat with Wega about this lesson">
      <header className="lc-h">
        <Orb thinking={W.busy} />
        <div>
          <b>Wega</b>
          <small>{pr > 0 ? `Watching with you · ${c.t}` : 'Watching with you'}</small>
        </div>
        {msgs.length > 0 && (
          <button className="lc-ib" onClick={() => wgInline(true)} aria-label="New chat" title="New chat">
            <Svg src={WI.plus} />
          </button>
        )}
        <button className="lc-hide" onClick={() => showLessonChat(false)} title="Close Wega and show the lessons again">
          Hide
          <Svg src={HIDE} />
        </button>
      </header>
      <div className="lc-body" ref={body} aria-live="polite">
        <div className="lc-l">
          <Orb />
          <div className="lc-c">
            <div className="lc-who">
              <b>Wega</b>
            </div>
            <div className="wg-txt">
              <p>Hi Daniel, I’m watching with you. Ask me anything about this lesson, or tap a question.</p>
            </div>
            {msgs.length === 0 && (
              <div className="lc-sugg">
                {SUGG.map((s) => (
                  <ChipBtn key={s[1]} c={s} />
                ))}
              </div>
            )}
          </div>
        </div>
        {msgs.map((m) => (
          <Line key={m.id} m={m} len={len} />
        ))}
      </div>
      <footer className="lc-f">
        <Composer inline placeholder="Ask Wega about this lesson…" />
        <p className="wg-note">Wega can make mistakes · Not financial advice</p>
      </footer>
    </section>
  );
}
