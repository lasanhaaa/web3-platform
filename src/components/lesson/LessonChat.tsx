'use client';
/* "Ask Wega" under the lesson video (felipe, Oct 15: the lesson screen showed too much at once). As with YouTube's
   Ask button and LinkedIn Learning's coach, there is one place to talk to Wega about the lesson: it follows the video,
   and the terms, simpler explanations and "with my numbers" are questions in this chat instead of boxes of their own. */
import { useEffect } from 'react';
import { chaptersFor, chIdx } from '@/lib/curriculum';
import { S, useProgress } from '@/lib/progress';
import { player } from '@/lib/player';
import { wega, wgClose, wgInline, type Chip } from '@/lib/wega';
import { ChipBtn, Composer, Message, Orb } from '@/components/wega/Wega';

const SUGG: Chip[] = [
  ['What is this part about?', 'l_moment'],
  ['Explain it more simply', 'l_simple'],
  ['What do the key terms mean?', 'l_terms'],
  ['What does this mean for my money?', 'l_port'],
];

/** Scrolls to the chat and puts the cursor in it (the "Ask wega" button at the top). */
export function focusLessonChat() {
  const box = document.getElementById('lc');
  box?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  box?.querySelector('textarea')?.focus({ preventScroll: true });
}

export function LessonChat({ rid, zi, li, k }: { rid: string; zi: number; li: number; k: string }) {
  useProgress();
  player.use();
  const W = wega.use();
  /* a fresh conversation for each lesson; the floating panel stays closed while the lesson shows Wega itself */
  useEffect(() => {
    wgClose();
    wgInline(true);
    document.body.classList.add('lc-on');
    return () => {
      wgInline(false);
      document.body.classList.remove('lc-on');
    };
  }, [k]);
  const msgs = W.msgs.filter((m) => m.id > W.inlineFrom && !m.kind);
  const last = msgs[msgs.length - 1];
  /* a new question or answer comes into view, also when it was asked from the button on the video */
  useEffect(() => {
    if (last) document.querySelector(`[data-lc="${last.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [last?.id, last?.pending]); // eslint-disable-line react-hooks/exhaustive-deps

  const ch = chaptersFor(rid, zi, li),
    started = (S.prog[k] || 0) > 0,
    c = ch[chIdx(ch, S.prog[k] || 0)];
  return (
    <section className="card lc" id="lc" aria-label="Ask Wega about this lesson">
      <header className="lc-h">
        <Orb thinking={W.busy} />
        <div>
          <b>Ask Wega</b>
          <small>{started ? `Now: ${c.t}` : 'Watching along with you'}</small>
        </div>
        {msgs.length > 0 && (
          <button className="btn ghost sm" onClick={() => wgInline(true)}>
            New chat
          </button>
        )}
      </header>
      <div className="lc-body" aria-live="polite">
        {msgs.length === 0 ? (
          <>
            <div className="wg-m a">
              <div className="wg-txt">
                {started ? (
                  <p>
                    <b>{c.t}:</b> {c.n}
                  </p>
                ) : (
                  <p>Hi Daniel. I’m watching along with you. Ask me anything about this lesson, or tap a question.</p>
                )}
              </div>
            </div>
            <div className="lc-sugg">
              {SUGG.map((s) => (
                <ChipBtn key={s[1]} c={s} />
              ))}
            </div>
          </>
        ) : (
          msgs.map((m) => (
            <div key={m.id} data-lc={m.id}>
              <Message m={m} />
            </div>
          ))
        )}
      </div>
      <Composer inline placeholder="Ask Wega about this lesson…" />
      <p className="wg-note">Wega can make mistakes · Not financial advice</p>
    </section>
  );
}
