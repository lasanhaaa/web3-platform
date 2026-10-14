'use client';
/* Shared pieces of the Wega page: the prompt box, money that can be hidden, the checklist, the passage popover. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { wp, wpLoad, wpToggleHide, routeQuestion, askHref, CATS, type CatId } from '@/lib/wega-page';
import { wgClose } from '@/lib/wega';
import { toast } from '@/lib/toast';
import { SPARK, WI } from '@/lib/icons';
import { Svg } from '@/lib/svg';

export const Icon = ({ d, size = 20 }: { d: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
export const CHEV = 'm9 6 6 6-6 6';
const BACK = 'M19 12H5M11 6l-6 6 6 6';
const EYE = 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z';
const EYE_OFF = 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2';
const CLIP = 'm21 11.5-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9';

/** The Wega orb from the panel, without the ring. */
export const Orb = ({ size = 40 }: { size?: number }) => (
  <span className="wg-orb" style={{ width: size, height: size }} aria-hidden>
    <span className="wg-av">
      <Svg src={SPARK} />
    </span>
  </span>
);

/** Hides the floating helper while the Wega page is open (one Wega input on screen, not two). */
export function useWegaPageChrome() {
  useEffect(() => {
    wpLoad();
    wgClose();
    document.body.classList.add('wp-on');
    return () => document.body.classList.remove('wp-on');
  }, []);
}

/** A dollar amount that turns into dots when the member hides values. */
export function M({ v, d = 0 }: { v: number; d?: number }) {
  const W = wp.use();
  if (W.hide)
    return (
      <span className="wp-dots" aria-label="hidden amount">
        $<i />
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return <span className="tnum">{(v < 0 && s !== (0).toFixed(d) ? '−$' : '$') + s}</span>;
}

/** Sends a typed question: to a result page when it clearly asks for one, otherwise to a text answer. */
export function useAsk() {
  const router = useRouter();
  return (text: string, passage?: string) => {
    const t = text.trim();
    if (!t) return;
    router.push((!passage && routeQuestion(t)) || askHref(t, passage));
  };
}

/** The prompt box: big on the start page ("hero"), docked at the bottom of results ("dock"). */
export function PromptBox({ variant, placeholder, autoFocus }: { variant: 'hero' | 'dock'; placeholder?: string; autoFocus?: boolean }) {
  const ask = useAsk();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [val, setVal] = useState('');
  useEffect(() => {
    const t = ref.current;
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = Math.min(variant === 'hero' ? 200 : 120, t.scrollHeight) + 'px';
  }, [val, variant]);
  useEffect(() => {
    if (autoFocus && matchMedia('(hover: hover) and (pointer: fine)').matches) ref.current?.focus({ preventScroll: true });
  }, [autoFocus]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!val.trim()) return ref.current?.focus();
    ask(val);
  };
  return (
    <form className={`wp-box wp-box-${variant}`} onSubmit={submit}>
      <textarea
        ref={ref}
        rows={variant === 'hero' ? 2 : 1}
        value={val}
        placeholder={placeholder || 'Ask anything…'}
        aria-label="Question for Wega"
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <div className="wp-box-tools">
        <button type="button" className="wp-ib" onClick={() => toast('Attaching a screenshot of a wallet or a transaction is coming soon.')} aria-label="Attach a screenshot">
          <Icon d={CLIP} />
        </button>
        <span className="sp" />
        <button type="button" className="wp-ib" onClick={() => toast('Voice input is coming soon.')} aria-label="Voice input">
          <Svg src={WI.mic} />
        </button>
        <button type="submit" className={`wp-send${val.trim() ? ' on' : ''}`} aria-label="Ask Wega">
          <Svg src={WI.send} />
        </button>
      </div>
    </form>
  );
}

export function CatIcon({ id, size = 18 }: { id: CatId; size?: number }) {
  return <Icon d={CATS.find((c) => c.id === id)!.icon} size={size} />;
}

/* ---------- result page frame ---------- */
type St = 'ok' | 'check' | 'na';
const ST_LABEL: Record<St, string> = { ok: 'OK', check: 'Check', na: 'Doesn’t apply' };
/** "What Wega checked": one row per criterion with OK / Check / Doesn't apply. */
export function Checklist({ rows, title = 'What Wega checked' }: { rows: { t: ReactNode; s?: ReactNode; st: St }[]; title?: string }) {
  return (
    <section className="wp-card wp-check" aria-label={title}>
      <h2 className="wp-card-h">{title}</h2>
      <ul>
        {rows.map((r, i) => (
          <li key={i} className={'is-' + r.st}>
            <span className="t">
              {r.t}
              {r.s && <small>{r.s}</small>}
            </span>
            <span className="st">{ST_LABEL[r.st]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The result page: back, snapshot date and hide values on top; title, the member's numbers, the visual,
    one next step, "Something not right?" and the follow-up input docked at the bottom. */
export function ResultFrame({
  cat,
  title,
  lead,
  children,
  next,
  source = true,
}: {
  cat: CatId;
  title: string;
  lead: ReactNode;
  children?: ReactNode;
  next?: ReactNode;
  source?: boolean;
}) {
  useWegaPageChrome();
  const W = wp.use();
  const c = CATS.find((x) => x.id === cat)!;
  return (
    <div className="page wp wp-res fade">
      <div className="wp-bar">
        <Link href={`/wega?c=${cat}`} className="wp-back" aria-label="Back to Wega">
          <Icon d={BACK} />
        </Link>
        {source && (
          <>
            <span className="wp-src">From your snapshot of Oct 9</span>
            <button className="wp-ib" onClick={wpToggleHide} aria-pressed={W.hide} aria-label={W.hide ? 'Show values' : 'Hide values'} title={W.hide ? 'Show values' : 'Hide values'}>
              <Icon d={W.hide ? EYE_OFF : EYE} />
            </button>
          </>
        )}
      </div>
      <header className="wp-rh">
        <div>
          <span className="wp-eyebrow">
            <CatIcon id={cat} size={14} />
            {c.label}
          </span>
          <h1>{title}</h1>
        </div>
        <button className="wp-share" onClick={() => toast('Sharing is coming soon: a private link or the Discord community.')}>
          Share
        </button>
      </header>
      <div className="wp-lead wp-prose">{lead}</div>
      {children}
      {next && (
        <div className="wp-next">
          {next}
          <button className="btn ghost lg" onClick={() => toast('Pinned to your Overview. The Overview isn’t part of the prototype.')}>
            Pin to Overview
          </button>
        </div>
      )}
      {source && (
        <div className="wp-review">
          <span>Something not right? Your snapshot is from Oct 9.</span>
          <button className="btn ghost" onClick={() => toast('This opens your snapshot in My Portfolio. It isn’t part of the prototype.')}>
            Review
            <Icon d="M5 12h14M13 6l6 6-6 6" size={16} />
          </button>
        </div>
      )}
      <div className="wp-dock">
        <PromptBox variant="dock" placeholder="Ask a follow-up…" />
        <p className="wp-note">Wega can make mistakes · Sample data · Not financial advice</p>
      </div>
      <Passage />
    </div>
  );
}

/* ---------- "Question or correction on this passage?" (Decade's select-to-ask) ---------- */
function Passage() {
  const ask = useAsk();
  const box = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [at, setAt] = useState<null | { x: number; y: number; text: string }>(null);
  const [val, setVal] = useState('');
  useEffect(() => {
    const onUp = (e: Event) => {
      if (box.current?.contains(e.target as Node)) return;
      setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().replace(/\s+/g, ' ').trim() || '';
        const node = sel && sel.rangeCount ? sel.getRangeAt(0).commonAncestorContainer : null;
        const el = node && (node.nodeType === 1 ? (node as Element) : node.parentElement);
        if (text.length < 3 || !el?.closest('.wp-prose')) return setAt(null);
        const r = sel!.getRangeAt(0).getBoundingClientRect();
        const w = Math.min(380, window.innerWidth - 32);
        setVal('');
        setAt({ x: Math.max(16, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 16)), y: r.bottom + 10, text: text.slice(0, 280) });
      }, 0);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAt(null);
    const onScroll = () => setAt(null);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  if (!at) return null;
  const send = (q: string) => {
    setAt(null);
    window.getSelection()?.removeAllRanges();
    ask(q || 'Explain this more simply', at.text);
  };
  return (
    <form
      ref={box}
      className="wp-pop"
      style={{ left: at.x, top: at.y }}
      onSubmit={(e) => {
        e.preventDefault();
        send(val.trim());
      }}
    >
      <label htmlFor="wp-pop-in">Question or correction on this passage?</label>
      <input id="wp-pop-in" ref={input} value={val} onChange={(e) => setVal(e.target.value)} placeholder="Write here…" autoComplete="off" />
      <button type="button" className="wp-pop-link" onClick={() => send(val.trim())}>
        Talk about this with Wega
      </button>
    </form>
  );
}
