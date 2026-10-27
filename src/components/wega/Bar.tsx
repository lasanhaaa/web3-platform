'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { wega, wgAsk, wgHub, wgLastX, wgOpen, wgRun, wgStop, type Msg } from '@/lib/wega';
import { chipsFor, ctxLabel } from '@/lib/wega-brain';
import { tours, tourDismiss, tourEnd, tourFor, tourNext, tourSeen, tourStart, type Tour } from '@/lib/tours';
import { toast } from '@/lib/toast';
import { GOOSE, I, WI } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { Orb } from './Orb';
import { Thinking } from './Stream';

/* Ask wega as a chat bar fixed at the bottom of every page (felipe, Oct 27, after Decade; Figma section
   "wega chat bar · test" 3333:52128). It replaces the "Ask wega" pill at the top right. A question opens the chat on
   the right (the Wega panel) and the bar hides until the panel closes. Above the bar Wega says one thing at a time:
   the last chat (so a closed chat is never lost: still thinking, then "Answer ready") or the tour of the page.
   Not on lessons (they keep the Wega column beside the video), quizzes (no Wega there) or the Wega page (already a chat). */

const plain = (t: string) => t.replace(/\*\*|`/g, '').replace(/^\s*([-•*]|\d+[.)])\s+/gm, '').replace(/\s+/g, ' ').trim();
const isFocus = (p: string) => /^\/academy\/[^/]+\/\d+\/(\d+|quiz)$/.test(p);

export function WegaBar() {
  const W = wega.use();
  const T = tours.use();
  const path = (usePathname() || '/').replace(/\/$/, '') || '/';
  const off = W.inline || isFocus(path) || path.startsWith('/wega');
  const away = W.open || !!T.run;
  const [sug, setSug] = useState(false);
  useEffect(() => {
    document.body.classList.toggle('wb-on', !off);
    return () => document.body.classList.remove('wb-on');
  }, [off]);
  useEffect(() => setSug(false), [path, away]);
  if (off) return null;
  return (
    <>
      <div className={`wb-fade${away ? ' away' : ''}`} aria-hidden />
      <div className={`wb${away ? ' away' : ''}`} inert={away}>
        {!sug && <BarMessage path={path} />}
        <BarInput path={path} sug={sug} setSug={setSug} />
      </div>
    </>
  );
}

/** What Wega has to say above the bar: the last chat first, otherwise the page's tour (once, a moment after the page opens). */
function BarMessage({ path }: { path: string }) {
  const W = wega.use();
  tours.use();
  const tour = tourFor(path);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    setSettled(false);
    const t = setTimeout(() => setSettled(true), 1200);
    return () => clearTimeout(t);
  }, [path]);
  const q = W.msgs.findLast((m) => m.role === 'user');
  if (q && q.id !== W.lastX) return <LastChat q={q} key={q.id} />;
  if (tour && settled && !tourSeen(tour.key)) return <Invite tour={tour} key={tour.key} />;
  return null;
}

/** The chat the member closed: the question, Wega's thinking line while it works, then the start of the answer.
    Open chat brings the panel back on it; × hides it until the next question (the chat stays in Wega's chats). */
function LastChat({ q }: { q: Msg }) {
  const W = wega.use();
  const a = W.msgs.findLast((m) => m.role === 'wega');
  const state = W.busy ? 'think' : W.ready ? 'ready' : 'seen';
  const preview = a && !a.pending && a.text ? plain(a.text) : '';
  return (
    <div className={`wb-msg last ${state}`} role="status">
      <Orb size={24} thinking={W.busy} />
      <button className="wb-msg-c" onClick={wgOpen}>
        <b>{q.text}</b>
        {state === 'think' ? (
          <Thinking steps={a?.think} />
        ) : (
          <small>
            {state === 'ready' && <em>Answer ready · </em>}
            {preview || 'Open the chat to read Wega’s answer.'}
          </small>
        )}
      </button>
      <button className={`btn sm ${state === 'ready' ? 'primary' : 'ghost'}`} onClick={wgOpen}>
        Open chat
      </button>
      <button className="wb-x" onClick={() => wgLastX(q.id)} aria-label="Close" title="Close">
        <Svg src={I.x} />
      </button>
    </div>
  );
}

function Invite({ tour }: { tour: Tour }) {
  return (
    <div className="wb-msg invite" role="status">
      <Orb size={24} />
      <span className="wb-msg-c">
        <b>{tour.invite}</b>
      </span>
      <button className="btn sm ghost" onClick={() => tourStart(tour)}>
        Start tour
        <Svg src={WI.arrow} />
      </button>
      <button className="wb-x" onClick={() => tourDismiss(tour.key)} aria-label="No thanks" title="No thanks">
        <Svg src={I.x} />
      </button>
    </div>
  );
}

/** The bar itself: the Wega panel's input (Figma "Wega composer"). Clicked while empty it offers the page's questions. */
function BarInput({ path, sug, setSug }: { path: string; sug: boolean; setSug: (v: boolean) => void }) {
  const W = wega.use();
  const [val, setVal] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const box = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const t = ref.current;
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = Math.min(120, t.scrollHeight) + 'px';
  }, [val]);
  useEffect(() => {
    if (!sug) return;
    const out = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setSug(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setSug(false);
    document.addEventListener('pointerdown', out);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', out);
      document.removeEventListener('keydown', esc);
    };
  }, [sug, setSug]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = val.trim();
    if (!t) return;
    setVal('');
    setSug(false);
    ref.current?.blur();
    if (W.busy) wgStop();
    wgAsk(t);
  };
  const go = (f: () => void) => {
    setSug(false);
    f();
  };
  const tour = tourFor(path);
  const chips = chipsFor(W.page).slice(0, 3);
  return (
    <form ref={box} className="wb-box" onSubmit={submit}>
      {sug && !val && (
        <div className="wb-sug" role="menu" aria-label="Ask Wega about this page">
          <p className="wb-sug-h">About {ctxLabel(W.page).replace(/ · .*$/, '')}</p>
          {chips.map((c) => (
            <button type="button" role="menuitem" key={c[1]} onClick={() => go(() => wgRun(c[1], c[0]))}>
              <Svg src={GOOSE} />
              <span>{c[0]}</span>
            </button>
          ))}
          {tour && (
            <button type="button" role="menuitem" onClick={() => go(() => tourStart(tour))}>
              <Svg src={WI.arrow} />
              <span>Take the tour of this page</span>
            </button>
          )}
          <button type="button" role="menuitem" onClick={() => go(wgHub)}>
            <Svg src={I.spark} />
            <span>See everything Wega can help with</span>
          </button>
        </div>
      )}
      <div className="wb-line">
        <Orb size={24} />
        <textarea
          ref={ref}
          rows={1}
          placeholder="Ask wega anything…"
          aria-label="Question for Wega"
          value={val}
          onClick={() => setSug(true)}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
      </div>
      <div className="wb-tools">
        <button type="button" className="wg-ib" onClick={() => toast('Images and screenshots is coming soon.')} aria-label="Attach a file">
          <Svg src={WI.clip} />
        </button>
        <button type="button" className="wg-ib" onClick={() => toast('Voice input is coming soon.')} aria-label="Voice input">
          <Svg src={WI.mic} />
        </button>
        <span className="sp" />
        <button type="submit" className="wg-send" disabled={!val.trim()} aria-label="Send">
          <Svg src={WI.send} />
        </button>
      </div>
    </form>
  );
}

/** A running tour: the page darkens around the part Wega talks about (blue ring) and Wega's bubble sits beside it.
    The highlighted part still works; going to another page ends the tour. */
export function TourLayer() {
  const T = tours.use();
  const path = usePathname();
  const step = T.run?.steps[T.i];
  const [r, setR] = useState<null | { top: number; left: number; width: number; height: number }>(null);
  useEffect(() => {
    tourEnd();
  }, [path]);
  useEffect(() => {
    document.body.classList.toggle('tour-on', !!T.run);
  }, [T.run]);
  useEffect(() => {
    if (!step) return setR(null);
    const el = document.querySelector<HTMLElement>(step.sel);
    if (!el) {
      tourNext();
      return;
    }
    el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    let raf = 0,
      prev = '';
    const loop = () => {
      const b = el.getBoundingClientRect();
      const k = [b.top, b.left, b.width, b.height].map(Math.round).join();
      if (k !== prev) {
        prev = k;
        setR({ top: b.top, left: b.left, width: b.width, height: b.height });
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [step]);
  useEffect(() => {
    if (!T.run) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && tourEnd();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [T.run]);
  if (!T.run || !step || !r) return null;
  const n = T.run.steps.length,
    last = T.i === n - 1;
  const pad = 6,
    hole = { top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
  /* the bubble goes under the ring, else above it, else at the bottom of the screen (a part taller than the screen) */
  const vw = innerWidth,
    vh = innerHeight,
    w = Math.min(380, vw - 32),
    need = 210;
  const left = Math.max(16, Math.min(hole.left, vw - w - 16));
  const pos: React.CSSProperties =
    hole.top + hole.height + 12 + need < vh
      ? { top: Math.max(16, hole.top + hole.height + 12), left, width: w }
      : hole.top - 12 - need > 0
        ? { bottom: vh - hole.top + 12, left, width: w }
        : { bottom: 24, left, width: w };
  return (
    <div className="tr" role="dialog" aria-label="Tour of this page">
      <div className="tr-hole" style={hole} />
      <div className="tr-step" style={pos} key={T.i}>
        <Orb size={30} />
        <div className="tr-bub">
          <div className="tr-h">
            <span>Wega</span>
            <span>
              {T.i + 1} of {n}
            </span>
          </div>
          <p>{step.text}</p>
          <div className="tr-acts">
            {!last && (
              <button className="btn ghost" onClick={tourEnd}>
                End tour
              </button>
            )}
            <span className="sp" />
            <button className="btn primary" onClick={tourNext} autoFocus>
              {last ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
