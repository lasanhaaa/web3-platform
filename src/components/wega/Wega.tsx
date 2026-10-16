'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { wega, setWegaPage, wgAsk, wgClose, wgNew, wgProbe, wgRun, wgStop, wgToggle, type Chip, type Msg, type WegaPage } from '@/lib/wega';
import { chipsFor, ctxLabel, helloLead } from '@/lib/wega-brain';
import { useProgress } from '@/lib/progress';
import { quiz } from '@/lib/quiz-state';
import { player } from '@/lib/player';
import { rewardOpen } from '@/lib/reward';
import { toast } from '@/lib/toast';
import { I, SPARK, WI } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { zoneExists, lessonExists } from '@/lib/params';

/* Wega, the AI copilot: floating button + side panel on every page (prototype wgMount/wgSync/wgPush).
   The header's "Open in Wega" goes to the Wega page with the topic of the page you're on. */
const OPEN_IN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-8 8M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg>';

/** Which screen the URL is, in the prototype's terms. The Strategies modal adds its strategy id itself. */
function pageFromPath(path: string, prev: WegaPage): WegaPage {
  const m = path.match(/^\/academy\/([^/]+)\/(\d+)(?:\/(\d+|quiz))?\/?$/);
  /* an unknown zone or lesson shows the 404 page; Wega treats it as the Academy home */
  if (m && (m[3] && m[3] !== 'quiz' ? lessonExists(m[1], m[2], m[3]) : zoneExists(m[1], m[2]))) {
    const r = m[1],
      z = +m[2] - 1;
    if (m[3] === 'quiz') return { screen: 'quiz', r, z };
    if (m[3]) return { screen: 'lesson', r, z, l: +m[3] - 1 };
    return { screen: 'route', r, z };
  }
  if (path.startsWith('/academy/choose')) return { screen: 'fork' };
  if (path.startsWith('/badges')) return { screen: 'badges' };
  if (path.startsWith('/strategies')) return { screen: 'strategies', sid: prev.screen === 'strategies' ? prev.sid : null };
  return { screen: 'map' };
}

export const Orb = ({ thinking }: { thinking?: boolean }) => (
  <span className={`wg-orb${thinking ? ' thinking' : ''}`}>
    <i className="ring" />
    <span className="wg-av">
      <Svg src={SPARK} />
    </span>
  </span>
);

export function ChipBtn({ c }: { c: Chip }) {
  return (
    <button className="wg-chip" onClick={() => wgRun(c[1], c[0])}>
      <Svg src={SPARK} />
      <span>{c[0]}</span>
    </button>
  );
}

/** The chat's light markdown: paragraphs, - and 1. lists, **bold**, `code`. */
function inline(s: string, k: string): ReactNode[] {
  return s.split(/(\*\*.+?\*\*|`[^`]+`)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') && p.length > 4 ? (
      <b key={k + i}>{p.slice(2, -2)}</b>
    ) : p.startsWith('`') && p.endsWith('`') && p.length > 2 ? (
      <code key={k + i}>{p.slice(1, -1)}</code>
    ) : (
      p
    ),
  );
}
export function MdText({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let list: { tag: 'ul' | 'ol'; items: ReactNode[] } | null = null;
  const flush = () => {
    if (list) out.push(list.tag === 'ul' ? <ul key={out.length}>{list.items}</ul> : <ol key={out.length}>{list.items}</ol>);
    list = null;
  };
  text.split('\n').forEach((raw, n) => {
    const l = raw.trim();
    const ul = /^[-•*] +/.test(l),
      ol = /^\d+[.)] +/.test(l);
    if (ul || ol) {
      const tag = ul ? 'ul' : 'ol';
      if (!list || list.tag !== tag) {
        flush();
        list = { tag, items: [] };
      }
      list.items.push(<li key={n}>{inline(l.replace(/^([-•*]|\d+[.)]) +/, ''), 'l' + n)}</li>);
      return;
    }
    flush();
    if (!l) return;
    out.push(<p key={'p' + n}>{inline(l.replace(/^#+ +(.*)$/, '**$1**'), 'p' + n)}</p>);
  });
  flush();
  return <>{out}</>;
}

function Meta({ m }: { m: Msg }) {
  const [rate, setRate] = useState<'' | 'up' | 'down'>('');
  const copy = () =>
    (navigator.clipboard ? navigator.clipboard.writeText(m.text || '') : Promise.reject()).then(
      () => toast('Answer copied'),
      () => toast('Copying doesn’t work here.'),
    );
  const rateIt = (v: 'up' | 'down') => {
    setRate(v);
    toast('Thanks, Wega learns from this.');
  };
  return (
    <div className="wg-meta">
      <button onClick={copy} aria-label="Copy" title="Copy">
        <Svg src={WI.copy} />
      </button>
      <button className={rate === 'up' ? 'on' : undefined} onClick={() => rateIt('up')} aria-label="Helpful" title="Helpful">
        <Svg src={WI.up} />
      </button>
      <button className={rate === 'down' ? 'on' : undefined} onClick={() => rateIt('down')} aria-label="Not helpful" title="Not helpful">
        <Svg src={WI.down} />
      </button>
      <span className="src">{m.live ? 'Claude · live' : 'Sample answer'}</span>
    </div>
  );
}

export function Message({ m }: { m: Msg }) {
  if (m.kind === 'div') return <div className="wg-div">{m.text}</div>;
  if (m.role === 'user')
    return (
      <div className="wg-m u">
        <span className="wg-lbl">You</span>
        <div className="wg-bub">{m.text}</div>
      </div>
    );
  return (
    <div className="wg-m a">
      <span className="wg-lbl">Wega</span>
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
      {!m.pending && m.node}
      {!m.pending && <Meta m={m} />}
      {!m.pending && m.follow && m.follow.length > 0 && (
        <div className="wg-follow">
          {m.follow.map((c) => (
            <ChipBtn key={c[1] + c[0]} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}

/** The input: in the panel, or inline in a page (the lesson's chat: one line and a send button, like a stream chat). */
export function Composer({ inline, placeholder = 'Ask Wega anything …' }: { inline?: boolean; placeholder?: string }) {
  const W = wega.use();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [val, setVal] = useState('');
  const grow = () => {
    const t = ref.current;
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = Math.min(120, t.scrollHeight) + 'px';
  };
  useEffect(grow, [val]);
  useEffect(() => {
    if (!inline && W.open && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const id = setTimeout(() => ref.current?.focus({ preventScroll: true }), 200);
      return () => clearTimeout(id);
    }
  }, [W.open, inline]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (W.busy) return wgStop();
    const t = val.trim();
    if (!t) return;
    setVal('');
    wgAsk(t);
  };
  return (
    <form className={`wg-comp${inline ? ' one' : ''}`} onSubmit={submit}>
      <textarea
        ref={ref}
        rows={1}
        placeholder={placeholder}
        aria-label="Question for Wega"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
      />
      {inline ? (
        <button type="submit" className={`wg-send${W.busy ? ' stop' : ''}`} aria-label={W.busy ? 'Stop' : 'Send'}>
          <Svg src={W.busy ? WI.stop : WI.send} />
        </button>
      ) : (
        <div className="wg-tools">
          <button type="button" className="wg-ib" onClick={() => toast('Images and screenshots is coming soon.')} aria-label="Attach an image">
            <Svg src={WI.img} />
          </button>
          <button type="button" className="wg-ib" onClick={() => toast('Voice input is coming soon.')} aria-label="Voice input">
            <Svg src={WI.mic} />
          </button>
          <span
            className={`wg-mode${W.live ? ' live' : ''}`}
            title={W.live ? 'Claude answers free questions live.' : W.live === false ? 'Free questions get sample answers.' : undefined}
          >
            {W.live ? 'Live · Claude' : W.live === false ? 'Sample mode' : ''}
          </span>
          <button type="submit" className={`wg-send${W.busy ? ' stop' : ''}`} aria-label={W.busy ? 'Stop' : 'Send'}>
            <Svg src={W.busy ? WI.stop : WI.send} />
          </button>
        </div>
      )}
    </form>
  );
}

export function WegaRoot() {
  const W = wega.use();
  useProgress();
  quiz.use();
  player.use();
  const path = usePathname() || '/';
  const router = useRouter();
  const body = useRef<HTMLDivElement>(null);
  const fab = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setWegaPage(pageFromPath(path, wega.get().page));
  }, [path]);
  useEffect(() => {
    wgProbe();
  }, []);
  useEffect(() => {
    document.body.classList.toggle('wg-open', W.open);
    if (!W.open && document.activeElement && document.getElementById('wg')?.contains(document.activeElement)) fab.current?.focus({ preventScroll: true });
  }, [W.open]);
  useEffect(() => {
    document.body.dataset.screen = W.page.screen;
  }, [W.page.screen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && wega.get().open && !rewardOpen() && !document.querySelector('.st-ov')) wgClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  const n = W.msgs.length,
    lastText = W.msgs.at(-1)?.text;
  useEffect(() => {
    const b = body.current;
    if (b) b.scrollTop = b.scrollHeight;
  }, [n, lastText, W.busy]);

  const label = ctxLabel(W.page);
  const chips = chipsFor(W.page);
  return (
    <>
      <div className="wg-scrim" onClick={wgClose} />
      <button ref={fab} className={`wg-fab${W.ready ? ' ready' : ''}${W.busy ? ' thinking' : ''}`} onClick={wgToggle} aria-label="Open Wega">
        <Orb />
        <span className="wg-fab-l">Ask wega</span>
        <span className="wg-tip">Your response is ready</span>
      </button>
      <aside className="wg-panel" id="wg" aria-label="Wega, your AI copilot" aria-hidden={!W.open} inert={!W.open}>
        <header className="wg-head">
          <Orb thinking={W.busy} />
          <div>
            <b>Wega</b>
            <small>Your AI copilot</small>
          </div>
          <span className="sp" />
          <button
            className="wg-ib"
            onClick={() => {
              wgClose();
              router.push(`/wega?c=${W.page.screen === 'strategies' ? 'strategies' : 'learn'}`);
            }}
            aria-label="Open in Wega"
            title="Open in Wega"
          >
            <Svg src={OPEN_IN} />
          </button>
          <button className="wg-ib" onClick={wgNew} aria-label="New chat" title="New chat">
            <Svg src={WI.plus} />
          </button>
          <button className="wg-ib" onClick={wgClose} aria-label="Close" title="Close">
            <Svg src={I.x} />
          </button>
        </header>
        <div className="wg-ctx">
          <span className="chip">
            <span>{label}</span>
          </span>
        </div>
        <div className="wg-body" ref={body} aria-live="polite">
          {n === 0 ? (
            <div className="wg-hello">
              <Orb />
              <h3>Hi Daniel, how can I help?</h3>
              <p>{helloLead(W.page)}</p>
              <div className="wg-chips">
                {chips.map((c) => (
                  <ChipBtn key={c[1]} c={c} />
                ))}
              </div>
            </div>
          ) : (
            W.msgs.map((m) => <Message key={m.id} m={m} />)
          )}
        </div>
        <div className="wg-sugg">{n > 0 && chips.map((c) => <ChipBtn key={c[1]} c={c} />)}</div>
        <Composer />
        <p className="wg-note">Wega can make mistakes · Sample data · Not financial advice</p>
      </aside>
    </>
  );
}
