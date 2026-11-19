'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { wega, setWegaPage, wgAsk, wgClose, wgHidden, wgHub, wgNew, wgOpen, wgPeek, wgProbe, wgResume, wgRun, wgSeen, wgSettle, wgStop, type Chip, type Msg, type WegaPage } from '@/lib/wega';
import { promptLabel, wpLoad } from '@/lib/wega-page';
import { chipsFor, ctxLabel } from '@/lib/wega-brain';
import { useProgress } from '@/lib/progress';
import { quiz } from '@/lib/quiz-state';
import { lessonView, player, showLessonChat } from '@/lib/player';
import { rewardOpen } from '@/lib/reward';
import { toast } from '@/lib/toast';
import { I, GOOSE, WI } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { zoneExists, lessonExists } from '@/lib/params';
import { Orb } from './Orb';
import { MdText } from './MdText';
import { Fresh, StreamText, Thinking } from './Stream';
import { AnswerFor } from '@/components/wega-page/Answer';
import { Topics } from '@/components/wega-page/Topics';
import { AskCtx } from '@/components/wega-page/parts';
import { TourLayer, WegaBar } from './Bar';

/* Wega, the AI copilot: the "Ask wega" button at the top right of every page and the side panel (prototype
   wgMount/wgSync/wgPush). Opened with no question, the panel is a small hub like the Wega page's (felipe, Oct 16,
   after PostHog's AI panel); a button with a ready question opens it straight on the answer.
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

export { Orb, MdText, Thinking };

export function ChipBtn({ c }: { c: Chip }) {
  return (
    <button className="wg-chip" onClick={() => wgRun(c[1], c[0])}>
      <Svg src={GOOSE} />
      <span>{c[0]}</span>
    </button>
  );
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

/** Wega's words in a message: the thinking line while it is pending, then the answer written out, then the text. */
export function WegaText({ m }: { m: Msg }) {
  return (
    <div className="wg-txt">
      {m.pending ? (
        <Thinking steps={m.think} />
      ) : m.fresh ? (
        <StreamText text={m.text || ''} done={!m.streaming} onDone={() => wgSettle(m.id)} />
      ) : (
        <>
          <MdText text={m.text || ''} />
          {m.note && <p className="err">{m.note}</p>}
        </>
      )}
    </div>
  );
}

export function Message({ m }: { m: Msg }) {
  if (m.role === 'user')
    return (
      <div className="wg-m u" data-m={m.id}>
        <span className="wg-lbl">You</span>
        <div className="wg-bub">{m.text}</div>
      </div>
    );
  if (m.href && !m.pending) return <RichMessage m={m} href={m.href} />;
  /* the cards, the actions and the follow-ups come in once the text is written */
  const shown = !m.pending && !m.fresh;
  return (
    <div className="wg-m a">
      <span className="wg-lbl">Wega</span>
      <WegaText m={m} />
      {shown && m.node && <div className="wg-in">{m.node}</div>}
      {shown && <Meta m={m} />}
      {shown && m.follow && m.follow.length > 0 && (
        <div className="wg-follow">
          {m.follow.map((c) => (
            <ChipBtn key={c[1] + c[0]} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}

/** One of the Wega page's ready questions, answered in the panel as on that page; questions inside it stay in the panel. */
const askHere = (href: string) => wgRun(href, promptLabel(href) || undefined);
function RichMessage({ m, href }: { m: Msg; href: string }) {
  useEffect(wpLoad, []);
  /* only the scripted text answers (/wega/ask?k=…) are written out; the others come in part by part */
  const writes = href.startsWith('/wega/ask');
  useEffect(() => {
    if (!writes) wgSettle(m.id);
  }, [writes, m.id]);
  return (
    <div className="wg-m a">
      <span className="wg-lbl">Wega</span>
      <AskCtx.Provider value={askHere}>
        <Fresh.Provider value={{ fresh: writes && !!m.fresh, done: () => wgSettle(m.id) }}>
          <div className="wg-rich">
            <AnswerFor href={href} />
          </div>
        </Fresh.Provider>
      </AskCtx.Provider>
      {!(writes && m.fresh) && m.follow && m.follow.length > 0 && (
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

/** On a lesson Wega is a column beside the video (a sheet on phones): "Ask wega" opens it with the cursor in its input,
    and closes it again, like the panel on the other pages. */
function toggleLessonChat() {
  if (lessonView.get().chat) return showLessonChat(false);
  showLessonChat(true);
  wgSeen();
  requestAnimationFrame(() => {
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) document.querySelector<HTMLElement>('#lc textarea')?.focus({ preventScroll: true });
  });
}

/** "Ask wega", in the same place on every page (Figma 2870:33537): the top right, where the page's top bar ends; in
    the phone's top bar; in the lesson's top bar. With no question it opens Wega's hub. */
export function AskWega({ where }: { where: 'top' | 'bar' | 'inline' }) {
  const W = wega.use();
  const V = lessonView.use();
  const click = () => (W.inline ? toggleLessonChat() : W.open ? wgClose() : wgHub());
  /* out of sight, Wega still shows it is thinking, and says when the answer is there (felipe, Oct 23) */
  const think = W.busy && (W.inline ? !V.chat : !W.open);
  return (
    <button
      className={`wg-ask ${where}${W.ready ? ' ready' : ''}${think ? ' busy' : ''}`}
      onClick={click}
      aria-label={think ? 'Ask Wega: Wega is thinking' : W.ready ? 'Ask Wega: your answer is ready' : 'Ask Wega'}
      aria-controls={W.inline ? 'lc' : 'wg'}
      aria-expanded={W.inline ? V.chat : W.open}
    >
      <Orb thinking={think} />
      <span className="wg-ask-l">{think ? <span className="wg-shim">Thinking…</span> : W.ready ? 'Answer ready' : 'Ask wega'}</span>
    </button>
  );
}

/** The pop-up under "Ask wega" when an answer arrives while Wega is out of sight: the start of the answer and a way
    to read it. It goes after a few seconds (not while the pointer is on it); "Ask wega" keeps saying "Answer ready". */
const plain = (t: string) => t.replace(/\*\*|`/g, '').replace(/^\s*([-•*]|\d+[.)])\s+/gm, '').replace(/\s+/g, ' ').trim();
function Peek() {
  const W = wega.use();
  lessonView.use();
  const [at, setAt] = useState<null | { top: number; right: number }>(null);
  const over = useRef(false);
  useEffect(() => {
    if (!W.peek) return setAt(null);
    const place = () => {
      const b = [...document.querySelectorAll<HTMLElement>('.wg-ask')].find((x) => x.getClientRects().length && getComputedStyle(x).opacity !== '0');
      const r = b?.getBoundingClientRect();
      setAt(r ? { top: r.bottom + 10, right: Math.max(12, innerWidth - r.right) } : null);
    };
    place();
    let t: ReturnType<typeof setTimeout>;
    const later = (ms: number) => (t = setTimeout(() => (over.current ? later(2500) : wgPeek(false)), ms));
    later(8000);
    addEventListener('resize', place);
    addEventListener('scroll', place, { passive: true, capture: true });
    return () => {
      clearTimeout(t);
      removeEventListener('resize', place);
      removeEventListener('scroll', place, { capture: true });
    };
  }, [W.peek]);
  /* outside lessons the chat bar's "last chat" message says it instead */
  if (!W.inline || !W.peek || !at || !wgHidden(W)) return null;
  const a = W.msgs.findLast((m) => m.role === 'wega' && !m.pending),
    q = W.msgs.findLast((m) => m.role === 'user')?.text;
  const text = a?.text ? plain(a.text) : '';
  const read = () => {
    if (W.inline) {
      showLessonChat(true);
      wgSeen();
    } else wgOpen();
  };
  return (
    <div
      className="wg-peek"
      style={{ top: at.top, right: at.right }}
      role="status"
      onMouseEnter={() => (over.current = true)}
      onMouseLeave={() => (over.current = false)}
    >
      <button className="wg-peek-open" onClick={read}>
        <Orb size={30} />
        <span className="wg-peek-c">
          <b>{text ? 'Wega answered' : 'Your answer is ready'}</b>
          <small>{text || (q ? `“${q}”` : 'Open Wega to read it.')}</small>
          <em>
            Read the answer
            <Svg src={WI.arrow} />
          </em>
        </span>
      </button>
      <button className="wg-peek-x" onClick={() => wgPeek(false)} aria-label="Close" title="Close">
        <Svg src={I.x} />
      </button>
    </div>
  );
}

/** The hub: the panel opened with no question. A greeting, the input, the Wega page's topics with their ready
    questions, and the questions about the page the member is on. */
function Hub() {
  const W = wega.use();
  const here = chipsFor(W.page).slice(0, 3);
  const last = W.prev?.find((m) => m.role === 'user')?.text;
  return (
    <div className="wg-hub">
      <Orb size={36} />
      <h3>
        <span>Hi, Daniel.</span> What do you want to understand today?
      </h3>
      <Composer />
      <p className="wg-try">Try Wega for</p>
      <Topics ask={(href, label) => wgRun(href, label)} />
      {here.length > 0 && (
        <section className="wg-here" aria-label={`About ${ctxLabel(W.page)}`}>
          <h4>About this page</h4>
          <ul>
            {here.map((c) => (
              <li key={c[1]}>
                <button onClick={() => wgRun(c[1], c[0])}>
                  <Svg src={GOOSE} />
                  <span>{c[0]}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {last && (
        <button className="wg-resume" onClick={wgResume}>
          <span>Back to your last chat</span>
          <small>“{last}”</small>
        </button>
      )}
    </div>
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

  useEffect(() => {
    const pg = pageFromPath(path, wega.get().page);
    setWegaPage(pg);
    /* no Wega in a quiz (felipe, Oct 21: it could give the answer away), so an open panel closes on the way in */
    if (pg.screen === 'quiz') wgClose();
  }, [path]);
  useEffect(() => {
    wgProbe();
  }, []);
  useEffect(() => {
    document.body.classList.toggle('wg-open', W.open);
    if (!W.open && document.activeElement && document.getElementById('wg')?.contains(document.activeElement))
      [...document.querySelectorAll<HTMLElement>('.wg-ask, .wb textarea')].find((b) => b.getClientRects().length)?.focus({ preventScroll: true });
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
    lastQ = W.msgs.findLast((m) => m.role === 'user')?.id;
  /* a new question goes to the top of the panel, so its answer reads from the start */
  useEffect(() => {
    const b = body.current,
      el = b?.querySelector<HTMLElement>(`[data-m="${lastQ}"]`);
    if (b && el) b.scrollTo({ top: el.offsetTop - b.offsetTop - 8, behavior: 'smooth' });
  }, [lastQ]);

  const label = ctxLabel(W.page);
  const chips = chipsFor(W.page);
  return (
    <>
      <div className="wg-scrim" onClick={wgClose} />
      <aside className={`wg-panel${n === 0 ? ' hub' : ''}`} id="wg" aria-label="Wega, your AI copilot" aria-hidden={!W.open} inert={!W.open}>
        <header className="wg-head">
          <Orb thinking={W.busy} />
          <b>Ask wega</b>
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
          {n > 0 && (
            <button className="wg-ib" onClick={wgNew} aria-label="New chat" title="New chat">
              <Svg src={WI.plus} />
            </button>
          )}
          <button className="wg-ib" onClick={wgClose} aria-label="Close" title="Close">
            <Svg src={I.x} />
          </button>
        </header>
        {n > 0 && (
          <div className="wg-ctx">
            <span className="chip">
              <span>{label}</span>
            </span>
          </div>
        )}
        <div className="wg-body" ref={body} aria-live="polite">
          {n === 0 ? <Hub /> : W.msgs.map((m) => <Message key={m.id} m={m} />)}
        </div>
        {n > 0 && (
          <>
            <div className="wg-sugg">
              {chips.map((c) => (
                <ChipBtn key={c[1]} c={c} />
              ))}
            </div>
            <Composer />
          </>
        )}
        <p className="wg-note">Wega can make mistakes · Sample data · Not financial advice</p>
      </aside>
      <Peek />
      <WegaBar />
      <TourLayer />
    </>
  );
}
