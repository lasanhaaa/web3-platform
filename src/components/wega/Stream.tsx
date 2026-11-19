'use client';
/* How Wega thinks and writes (felipe, Oct 23, after the AI chats: ChatGPT, Claude, Gemini). While it thinks, a line
   says what it is doing ("Reading your snapshot…") with a soft light running through the words; then the answer is
   written word by word, each new word fading in. Ready answers are written at an even pace; a live answer as it
   arrives, smoothed so it doesn't jump. With reduced motion the answer simply appears. */
import { createContext, useEffect, useRef, useState } from 'react';
import { MdText } from './MdText';

/** A ready answer that has just arrived is written out (Fresh.fresh); `done` tells its message the writing is over,
    so the follow-up questions can appear. */
export const Fresh = createContext<{ fresh: boolean; done: () => void }>({ fresh: false, done: () => {} });

const still = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The thinking line: its steps follow each other, and it stays on the last one ("Writing the answer"). */
export function Thinking({ steps = ['Thinking'] }: { steps?: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= steps.length - 1) return;
    const t = setTimeout(() => setI(i + 1), 1300);
    return () => clearTimeout(t);
  }, [i, steps.length]);
  return (
    <span className="wg-think" role="status">
      <span className="wg-shim" key={i}>
        {steps[Math.min(i, steps.length - 1)]}…
      </span>
    </span>
  );
}

/* a word with the space before it; a list marker travels with its first word, so a line never shows a lone "-" */
const TOK = /(?:^|\n)[ \t]*(?:[-•*]|\d+[.)])[ \t]+\S+|\s*\S+/g;

/** Writes `text` out word by word. `done` = the text is complete (a live answer may still be arriving); `onDone` runs
    once every word is shown. */
export function StreamText({ text, done = true, onDone }: { text: string; done?: boolean; onDone?: () => void }) {
  const toks = text.match(TOK) || [];
  const total = toks.length;
  const [n, setN] = useState(() => (still() ? Infinity : 0));
  const end = useRef(onDone);
  end.current = onDone;
  useEffect(() => {
    if (n >= total) {
      if (done) end.current?.();
      return;
    }
    /* about 30 words a second; a long backlog (a live answer arriving in big pieces) catches up faster */
    const left = total - n;
    const t = setTimeout(() => setN((x) => Math.min(total, x + (left > 60 ? Math.ceil(left / 60) : 1))), 32);
    return () => clearTimeout(t);
  }, [n, total, done]);
  return <MdText text={n >= total ? text : toks.slice(0, n).join('')} fade />;
}
