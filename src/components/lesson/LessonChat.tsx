'use client';
/* Wega's chat beside the lesson video, like the chat next to a live stream (felipe, Oct 16: one place to ask Wega, a
   known pattern that stays on screen without getting in the way). Questions carry the moment of the video they were
   asked at, as in a stream's chat replay; tapping the time jumps back there. The terms, simpler explanations and
   "what it means for my money" are questions in this chat, not boxes of their own. */
import { useEffect, useRef } from 'react';
import { ROUTES, R, chaptersFor, chIdx, dur } from '@/lib/curriculum';
import { S, useProgress } from '@/lib/progress';
import { player, seekLesson, showLessonChat } from '@/lib/player';
import { wega, wgClose, wgInline, type Chip, type Msg } from '@/lib/wega';
import { tt } from '@/lib/format';
import { WI } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { ChipBtn, Composer, MdText, Orb } from '@/components/wega/Wega';

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
  const jump = () => {
    if (m.at != null && seekLesson(m.at) && window.innerWidth <= 1000) window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <div className={`lc-l${you ? ' you' : ''}`} data-lc={m.id}>
      {you ? <span className="lc-av">D</span> : <Orb />}
      <div className="lc-c">
        <div className="lc-who">
          <b>{you ? 'You' : 'Wega'}</b>
          {you && m.at != null && m.at > 0 && (
            <button className="lc-at tnum" onClick={jump} title="Watch this moment again">
              {tt(Math.round(m.at * len))}
            </button>
          )}
        </div>
        {you ? (
          <p className="lc-q">{m.text}</p>
        ) : (
          <div className="wg-txt">
            {m.pending ? (
              <span className="wg-dots">
                <i />
                <i />
                <i />
              </span>
            ) : (
              <>
                <MdText text={m.text || ''} />
                {m.note && <p className="err">{m.note}</p>}
              </>
            )}
          </div>
        )}
        {!you && !m.pending && m.node}
        {!you && !m.pending && m.follow && m.follow.length > 0 && (
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
  const box = useRef<HTMLElement>(null);
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
  const msgs = W.msgs.filter((m) => m.id > W.inlineFrom && !m.kind);
  const lastQ = msgs.filter((m) => m.role === 'user').at(-1)?.id;
  /* a new question goes to the top of the chat so its answer reads from the start; when it was asked from elsewhere
     on the page (the quick check) and the chat is off screen, the chat comes into view */
  useEffect(() => {
    if (lastQ == null) return;
    const b = body.current,
      el = b?.querySelector<HTMLElement>(`[data-lc="${lastQ}"]`);
    if (b && el) b.scrollTo({ top: el.offsetTop - b.offsetTop - 12, behavior: 'smooth' });
    const rc = box.current?.getBoundingClientRect();
    if (rc && (rc.top > window.innerHeight - 120 || rc.bottom < 80)) box.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [lastQ]);

  const ch = chaptersFor(rid, zi, li),
    pr = S.prog[k] || 0,
    c = ch[chIdx(ch, pr)],
    len = dur(ROUTES.indexOf(R(rid)), zi, li) * 60;
  return (
    <section className="lc" id="lc" ref={box} aria-label="Chat with Wega about this lesson">
      <header className="lc-h">
        <Orb thinking={W.busy} />
        <div>
          <b>Ask Wega</b>
          <small>{pr > 0 ? `Watching with you · ${c.t}` : 'Watching with you'}</small>
        </div>
        {msgs.length > 0 && (
          <button className="lc-ib" onClick={() => wgInline(true)} aria-label="New chat" title="New chat">
            <Svg src={WI.plus} />
          </button>
        )}
        <button className="lc-ib lc-hide" onClick={() => showLessonChat(false)} aria-label="Hide chat" title="Hide chat">
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
