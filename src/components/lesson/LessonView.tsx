'use client';
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent as RKeyboardEvent, type MouseEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ROUTES, R, key, dur, chaptersFor, chIdx } from '@/lib/curriculum';
import { Q } from '@/lib/quiz-bank';
import { S, useProgress, isDone, lessonOpen, quizOpen, lessonState, zoneOpen } from '@/lib/progress';
import { useGo, parseZL, hrefStrategies } from '@/lib/nav';
import { toast } from '@/lib/toast';
import { tt } from '@/lib/format';
import { I, GOOSE, SPARK } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { wgRun } from '@/lib/wega';
import { rewardOpen } from '@/lib/reward';
import { readiness } from '@/lib/strategies';
import {
  player,
  openLesson,
  closeLesson,
  playToggle,
  seekBy,
  scrubTo,
  markLessonDone,
  qcAnswer,
  qcContinue,
  reopenLesson,
  seekLesson,
  lessonView,
  showLessonChat,
  showLessonMenu,
  cycleRate,
} from '@/lib/player';
import { transcriptFor, notes, notesFor, addNote, removeNote, strategiesFor } from '@/lib/lesson-tabs';
import { LessonChat } from './LessonChat';
import { AskWega } from '@/components/wega/Wega';
import { DiffMeter, Pts, diffStyle } from '@/components/strategies/bits';

const FS_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
const FS_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
const MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
const VIDEO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M10 9.2v5.6l4.6-2.8Z" fill="currentColor"/></svg>';
const TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';
/** Keys outside text fields, as on YouTube: F for full screen, K or Space to play and pause. */
const typing = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest('input,textarea,select,[contenteditable="true"]');
/** Timestamps the way YouTube writes them in a description: 0:00, 4:57, 12:05. */
const yt = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;

/* false during the server render and hydration, true after. The server always renders the seeded 'mid' state, while
   AppShell restores the saved demo state in an effect that can run before this page hydrates (it streams in its own
   boundary). The lesson therefore renders on the client only, as the prototype did, so no saved state fails hydration. */
const noSub = () => () => {};
const useHydrated = () => useSyncExternalStore(noSub, () => true, () => false);

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ') || undefined;

/* The quick check's question: a question with answer options from this zone's quiz bank (a choice, or a "predict the
   trade", which has the same options). A zone without one (none so far) borrows the Academy's. */
const QC_TYPES = ['choice', 'predict'];
function qcQ(rid: string, zi: number, li: number) {
  const pick = (k: string) => (Q[k] || []).filter((q: any) => QC_TYPES.includes(q.t));
  const own = pick(rid + '.' + zi),
    pool = own.length ? own : pick('academy.0');
  return pool[li % pool.length];
}
/* data-act="lseek": "Rewatch" in the quick check, the transcript, the notes. The video comes back into view. */
function lseek(p: number, fromQc?: boolean) {
  if (!seekLesson(p, fromQc)) return toast('Open the lesson to jump to this part.');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
/* Enter or Space on a transcript sentence, which is a span so the sentences wrap as one paragraph */
const onEnter = (f: () => void) => (e: RKeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    f();
  }
};

/* ===== LESSON =====
   The lesson page after Coursera's video page (felipe, Oct 21): full screen without the dashboard menu. The zone's
   lessons on the left, the video on the right with Transcript, Notes and Strategies under it. Wega opens as a column
   on the right, as wide as the lessons menu, and the menu folds to a rail while it is open. */
export function LessonView() {
  const params = useParams<{ route: string; zone: string; lesson: string }>();
  const rid = String(params.route);
  const { z: zi, l: li0 } = parseZL(params.zone, params.lesson);
  const li = li0 ?? 0;
  const v = useProgress();
  const P = player.use();
  const V = lessonView.use();
  const go = useGo();
  const hydrated = useHydrated();
  const root = useRef<HTMLDivElement>(null);
  const [fs, setFs] = useState(false);
  const [fsOk, setFsOk] = useState(false);
  const k = key(rid, zi, li),
    ok = !!R(rid)?.zones[zi]?.lessons[li];

  useEffect(() => {
    if (!ok) return;
    openLesson(rid, zi, li, k);
    return () => closeLesson(k);
  }, [rid, zi, li, k, ok]);
  /* full screen shows the video over the whole screen, with Wega's column beside it when it is open; phones without
     it (iPhone) don't get the button */
  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else root.current?.requestFullscreen?.().catch(() => toast('Full screen doesn’t work in this browser.'));
  };
  useEffect(() => {
    setFsOk(!!document.fullscreenEnabled);
    const onFs = () => setFs(!!document.fullscreenElement && document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  /* the quick check sits under the video: leave full screen when the quick check stops the video */
  const qcOpen = P.k === k && P.qc[k] === 'open';
  useEffect(() => {
    if (qcOpen && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, [qcOpen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || rewardOpen()) return;
      const key = e.key.toLowerCase();
      if (key === 'f' && document.fullscreenEnabled) {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else root.current?.requestFullscreen?.().catch(() => {});
      } else if (key === 'k' || (key === ' ' && !(e.target instanceof HTMLElement && e.target.closest('button,a,[role=button]')))) {
        e.preventDefault();
        const msg = playToggle();
        if (msg) toast(msg);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  /* the prototype could only open existing lessons: an unknown lesson URL renders nothing */
  if (!hydrated || !ok) return null;

  const r = R(rid),
    z = r.zones[zi],
    s = z.lessons[li],
    ri = ROUTES.indexOf(r),
    m = dur(ri, zi, li);

  const here = P.k === k,
    playing = here && P.playing,
    ended = here && P.ended;
  const pr = S.prog[k] ?? 0,
    left = z.lessons.filter((_: any, i: number) => !isDone(rid, zi, i)).length,
    isLast = li === z.lessons.length - 1,
    sec = Math.round(m * 60 * pr);
  const ch = chaptersFor(rid, zi, li),
    ci = chIdx(ch, pr);
  const passed = S.passed.has(rid + '.' + zi),
    qOpen = quizOpen(rid, zi),
    done = isDone(rid, zi, li);
  const showBig = !playing && !ended && !(P.bigK === k && P.bigV === v);

  /* data-act="lesson" / "quiz" / "route" */
  const toLesson = (l: number, zj = zi) => {
    if (!lessonOpen(rid, zj, l)) return toast('This lesson is still locked.');
    if (zj === zi && l === li) {
      reopenLesson();
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      return;
    }
    go({ screen: 'lesson', r: rid, z: zj, l });
  };
  const toQuiz = (zj = zi) => {
    if (!quizOpen(rid, zj) && !S.passed.has(rid + '.' + zj)) return toast('Finish all lessons in this zone first.');
    go({ screen: 'quiz', r: rid, z: zj });
  };
  const toRoute = () => go({ screen: 'route', r: rid, z: zi });
  const onPlay = () => {
    const msg = playToggle();
    if (msg) toast(msg);
  };
  const onScrub = (e: MouseEvent<HTMLDivElement>) => {
    const rc = e.currentTarget.getBoundingClientRect();
    scrubTo((e.clientX - rc.left) / rc.width);
  };

  const nxt = isLast ? null : z.lessons[li + 1];

  return (
    <>
      <div className="ftop l-top">
        <nav className="crumbs" aria-label="You are here">
          <button className="back" onClick={toRoute} aria-label={`Back to ${rid === 'academy' ? 'the Academy' : r.name}`}>
            <i>
              <Svg src={I.left} />
            </i>
          </button>
          <button className="crumb" onClick={toRoute}>
            {rid === 'academy' ? 'Academy' : r.name}
          </button>
          {rid !== 'academy' && (
            <>
              <Svg src={I.chev} className="sep" />
              <button className="crumb" onClick={toRoute}>
                {z.name}
              </button>
            </>
          )}
        </nav>
        <div className="right">
          <AskWega where="inline" />
        </div>
      </div>
      <div className={cx('lp', V.menu ? 'menu' : 'rail', V.chat && 'chat')} ref={root}>
        <LessonMenu rid={rid} zi={zi} li={li} toLesson={toLesson} toQuiz={toQuiz} />
        <div className="l-main">
          <div className="l-in">
            <div className="l-vid">
              <div className="player" id="player">
                <img src="/assets/video.webp" alt="Lesson video preview" />
                {/* a click on the picture plays and pauses, as on YouTube; a double click is full screen */}
                <button className="p-hit" tabIndex={-1} aria-hidden="true" onClick={onPlay} onDoubleClick={fsOk ? toggleFs : undefined} />
                {showBig && (
                  <button className="bigplay" aria-label="Play" onClick={onPlay}>
                    <Svg src={I.play} />
                  </button>
                )}
                <div className="p-ui">
                  <div className="scrub" onClick={onScrub}>
                    <span id="scrubFill" style={{ width: `${pr * 100}%` }} />
                    {ch.slice(1).map((c: any) => (
                      <b key={c.a} className="tk" style={{ left: `${c.a * 100}%` }} title={`${c.t} · ${tt(c.sec)}`} />
                    ))}
                    <i id="scrubKnob" style={{ left: `${pr * 100}%` }} />
                  </div>
                  <div className="ctrls">
                    <div className="lft">
                      <span className="time tnum" id="ptime">{`${tt(sec)} / ${tt(m * 60)}`}</span>
                      {pr > 0 && <span className="pch">{ch[ci].t}</span>}
                    </div>
                    <div className="mid">
                      <button aria-label="Back 15 seconds" onClick={() => seekBy(-0.1)}>
                        <Svg src={I.rw} />
                      </button>
                      <button id="pbtn" aria-label={playing ? 'Pause' : 'Play'} onClick={onPlay}>
                        <Svg src={playing ? I.pause : I.play} />
                      </button>
                      <button aria-label="Forward 15 seconds" onClick={() => seekBy(0.1)}>
                        <Svg src={I.ff} />
                      </button>
                    </div>
                    <div className="rgt">
                      <button className="pb rate tnum" onClick={cycleRate} aria-label={`Playback speed ${P.rate}x`} title="Playback speed">
                        {`${P.rate}x`}
                      </button>
                      {/* in full screen the top bar is gone, so Wega has its own button here */}
                      {fs && (
                        <button className={cx('pb wide', V.chat && 'on')} onClick={() => showLessonChat(!V.chat)}>
                          <Svg src={GOOSE} />
                          <span>{V.chat ? 'Hide Wega' : 'Ask Wega'}</span>
                        </button>
                      )}
                      {fsOk && (
                        <button className="pb wide fsbtn" onClick={toggleFs} title="Full screen (F)">
                          <Svg src={fs ? FS_OFF : FS_ON} />
                          <span>{fs ? 'Exit full screen' : 'Full screen'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {ended && (
                  <div className="endcard">
                    <div>
                      <span className="okc">
                        <Svg src={I.check} />
                      </span>
                      <h3>Lesson complete</h3>
                      <p className="muted">{isLast ? `You’ve finished every lesson in ${z.name}. The quiz is now open.` : `Up next: ${nxt.t}`}</p>
                      <div className="actions">
                        {isLast ? (
                          <button className="btn primary" onClick={() => toQuiz()}>
                            Start quiz
                          </button>
                        ) : (
                          <button className="btn primary" onClick={() => toLesson(li + 1)}>
                            Next lesson
                          </button>
                        )}
                        <button className="btn ghost" onClick={toRoute}>
                          Back to course
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="l-body">
              <QuickCheck rid={rid} zi={zi} li={li} k={k} />
              <div className="l-head">
                <div className="l-tt">
                  <h1>{s.t}</h1>
                  <span className="l-meta tnum">{`Lesson ${li + 1} of ${z.lessons.length} · ${m} min`}</span>
                </div>
                {/* one next step: mark it done, then the next lesson, or the quiz once every lesson is done */}
                <div className="actions">
                  {done && (
                    <span className="l-done">
                      <Svg src={I.check} />
                      Done
                    </span>
                  )}
                  {!done ? (
                    <button className="btn primary" onClick={markLessonDone}>
                      Mark as done
                    </button>
                  ) : qOpen && !passed && (isLast || left === 0) ? (
                    <button className="btn primary" onClick={() => toQuiz()}>
                      Start the quiz
                    </button>
                  ) : !isLast ? (
                    <button className="btn primary" onClick={() => toLesson(li + 1)}>
                      Next lesson
                    </button>
                  ) : (
                    <button className="btn primary" onClick={toRoute}>
                      Back to course
                    </button>
                  )}
                </div>
              </div>
              <LessonTabs rid={rid} zi={zi} li={li} k={k} len={m * 60} />
            </div>
          </div>
        </div>
        <aside className="l-wega" aria-label="Wega">
          <LessonChat rid={rid} zi={zi} li={li} k={k} />
        </aside>
        {/* phones: Wega is a sheet over the page, and a tap outside it closes it */}
        <div className="l-scrim" onClick={() => showLessonChat(false)} aria-hidden="true" />
      </div>
    </>
  );
}

/* ===== The lessons menu: the route's zones, the current one open, like Coursera's module list ===== */
function LessonMenu({
  rid,
  zi,
  li,
  toLesson,
  toQuiz,
}: {
  rid: string;
  zi: number;
  li: number;
  toLesson: (l: number, z?: number) => void;
  toQuiz: (z?: number) => void;
}) {
  const r = R(rid),
    ri = ROUTES.indexOf(r);
  const [open, setOpen] = useState<number[]>([zi]);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => setOpen((o) => (o.includes(zi) ? o : [...o, zi])), [zi]);
  /* the lesson on screen is in view in the menu */
  useEffect(() => {
    const b = box.current,
      el = b?.querySelector<HTMLElement>('.lm-i.on');
    if (b && el && b.scrollHeight > b.clientHeight) b.scrollTop = Math.max(0, el.offsetTop - b.clientHeight / 3);
  }, [zi, li]);
  const toggle = (zj: number) => setOpen((o) => (o.includes(zj) ? o.filter((x) => x !== zj) : [...o, zj]));
  return (
    <nav className="l-menu" aria-label="Lessons">
      <div className="l-rail">
        <button onClick={() => showLessonMenu(true)} title="Show the lessons">
          <Svg src={MENU} />
          <span>Lessons</span>
        </button>
      </div>
      <div className="l-mbox" ref={box}>
        <button className="l-hide" onClick={() => showLessonMenu(false)}>
          <Svg src={MENU} />
          Hide menu
        </button>
        {r.zones.map((z: any, zj: number) => {
          const isOpen = open.includes(zj),
            zOk = zoneOpen(rid, zj),
            nDone = z.lessons.filter((_: any, i: number) => isDone(rid, zj, i)).length,
            passed = S.passed.has(rid + '.' + zj),
            qOpen = quizOpen(rid, zj),
            left = z.lessons.length - nDone;
          return (
            <section key={zj} className={cx('lm-z', zj === zi && 'cur')}>
              {r.zones.length > 1 ? (
                <button className="lm-zh" onClick={() => toggle(zj)} aria-expanded={isOpen}>
                  <span>
                    <b>{z.name}</b>
                    <small>{zOk ? `${nDone} of ${z.lessons.length} done` : 'Opens after the quiz before it'}</small>
                  </span>
                  <Svg src={zOk ? I.down : I.lock} className={cx('lm-chev', !zOk && 'lk')} />
                </button>
              ) : (
                <div className="lm-zh static">
                  <span>
                    <b>{z.name}</b>
                    <small>{`${nDone} of ${z.lessons.length} done`}</small>
                  </span>
                </div>
              )}
              {isOpen && (
                <div className="lm-list">
                  {z.lessons.map((st: any, i: number) => {
                    const ss = lessonState(rid, zj, i),
                      on = zj === zi && i === li;
                    return (
                      <button key={i} className={cx('lm-i', on && 'on', ss === 'done' && 'done')} disabled={ss === 'lock'} onClick={() => toLesson(i, zj)} aria-current={on ? 'page' : undefined}>
                        <span className="lm-ico">
                          <Svg src={ss === 'done' ? I.check : ss === 'lock' ? I.lock : VIDEO} />
                        </span>
                        <span className="lm-t">
                          <b>{st.t}</b>
                          <small>{on ? `Now playing · ${dur(ri, zj, i)} min` : `${dur(ri, zj, i)} min`}</small>
                        </span>
                      </button>
                    );
                  })}
                  <button className={cx('lm-i quiz', passed && 'done')} disabled={!qOpen && !passed} onClick={() => toQuiz(zj)}>
                    <span className="lm-ico">
                      <Svg src={passed ? I.check : qOpen ? I.star : I.lock} />
                    </span>
                    <span className="lm-t">
                      <b>{`Quiz: ${z.name}`}</b>
                      <small>{passed ? 'Passed · badge earned' : qOpen ? 'Ready · 5 questions' : `Opens after ${left} more ${left === 1 ? 'lesson' : 'lessons'}`}</small>
                    </span>
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </nav>
  );
}

/* ===== Tabs under the video: Transcript, Notes, Strategies (Coursera's Transcript, Notes, Downloads) ===== */
type Tab = 'transcript' | 'notes' | 'strategies';
const TABS: [Tab, string][] = [
  ['transcript', 'Transcript'],
  ['notes', 'Notes'],
  ['strategies', 'Strategies'],
];
let lastTab: Tab = 'transcript';

function LessonTabs({ rid, zi, li, k, len }: { rid: string; zi: number; li: number; k: string; len: number }) {
  const [tab, setTab0] = useState<Tab>(lastTab);
  const setTab = (t: Tab) => {
    lastTab = t;
    setTab0(t);
  };
  notes.use();
  const n = notesFor(k).length;
  /* arrow keys move between the tabs, as in any tab list */
  const onKey = (e: RKeyboardEvent) => {
    const i = TABS.findIndex((t) => t[0] === tab),
      d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    const t = TABS[(i + d + TABS.length) % TABS.length][0];
    setTab(t);
    document.getElementById(`lt-${t}`)?.focus();
  };
  return (
    <section className="l-tabs">
      <div className="l-tablist" role="tablist" aria-label="About this lesson" onKeyDown={onKey}>
        {TABS.map(([id, label]) => (
          <button
            key={id}
            id={`lt-${id}`}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`lp-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
          >
            {label}
            {id === 'notes' && n > 0 && <span className="l-count tnum">{n}</span>}
          </button>
        ))}
      </div>
      <div className="l-panel" role="tabpanel" id={`lp-${tab}`} aria-labelledby={`lt-${tab}`}>
        {tab === 'transcript' ? (
          <Transcript rid={rid} zi={zi} li={li} k={k} />
        ) : tab === 'notes' ? (
          <Notes k={k} len={len} />
        ) : (
          <Strategies rid={rid} zi={zi} li={li} />
        )}
      </div>
    </section>
  );
}

/** The transcript in the video's chapters. The sentence being said is highlighted, and any sentence plays from there. */
function Transcript({ rid, zi, li, k }: { rid: string; zi: number; li: number; k: string }) {
  player.use();
  const pr = S.prog[k] ?? 0;
  const tr = transcriptFor(rid, zi, li);
  const all = tr.flatMap((c) => c.lines);
  const now = pr > 0 ? all.filter((l) => l.a <= pr).at(-1) : undefined;
  return (
    <div className="tr">
      <p className="l-hint">Sample transcript. Tap a sentence to watch from there.</p>
      {tr.map((c) => (
        <div key={c.a} className="tr-ch">
          <button className="tr-at tnum" onClick={() => lseek(c.a)} aria-label={`Play from ${yt(c.sec)}: ${c.t}`}>
            {yt(c.sec)}
          </button>
          <div>
            <h3>{c.t}</h3>
            <p>
              {c.lines.map((l) => (
                <span key={l.a} role="button" tabIndex={0} className={cx('tr-s', l === now && 'now')} onClick={() => lseek(l.a)} onKeyDown={onEnter(() => lseek(l.a))}>
                  {l.text}{' '}
                </span>
              ))}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Notes: what the member writes, saved with the moment of the video it was written at. */
function Notes({ k, len }: { k: string; len: number }) {
  player.use();
  notes.use();
  const [text, setText] = useState('');
  const at = S.prog[k] ?? 0;
  const list = notesFor(k);
  const save = (e?: { preventDefault(): void }) => {
    e?.preventDefault();
    if (!text.trim()) return;
    addNote(k, at, text.trim());
    setText('');
    toast(`Note saved at ${yt(at * len)}`);
  };
  return (
    <div className="nt">
      <form className="nt-new" onSubmit={save}>
        <textarea
          aria-label="Your note"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write down what you want to remember from this part…"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save(e);
          }}
        />
        <div className="nt-act">
          <span className="l-hint">Saved with the video time, so you can watch that part again.</span>
          <button className="btn primary sm" disabled={!text.trim()}>
            {`Save note at ${yt(at * len)}`}
          </button>
        </div>
      </form>
      {list.length > 0 ? (
        <ul className="nt-list">
          {list.map((n) => (
            <li key={n.id}>
              <button className="tr-at tnum" onClick={() => lseek(n.at)} aria-label={`Watch from ${yt(n.at * len)}`}>
                {yt(n.at * len)}
              </button>
              <p>{n.text}</p>
              <button className="nt-del" onClick={() => removeNote(k, n.id)} aria-label="Delete note" title="Delete note">
                <Svg src={TRASH} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="nt-empty">No notes for this lesson yet.</p>
      )}
    </div>
  );
}

/** Strategies of the model portfolio that build on this lesson, with how ready the member is for each. */
function Strategies({ rid, zi, li }: { rid: string; zi: number; li: number }) {
  const rel = strategiesFor(rid, zi, li);
  return (
    <div className="ls">
      <p className="l-hint">Where you use this lesson: strategies from the model portfolio.</p>
      <ul className="ls-list">
        {rel.map(({ s, why }) => {
          const rd = readiness(s);
          return (
            <li key={s.id}>
              <Link href={hrefStrategies(s.id)} className="ls-row" style={diffStyle(s.diff)}>
                <Pts icons={s.icons} />
                <span className="ls-t">
                  <b>{s.name}</b>
                  <small>{`${s.status} · ${s.type} · ${why}`}</small>
                </span>
                <span className="ls-r">
                  <DiffMeter d={s.diff} />
                  {rd.missing.length === 0 ? (
                    <span className="st-fit ok">
                      <Svg src={I.check} />
                      Ready
                    </span>
                  ) : (
                    <span className="st-fit">{`${rd.missing.length} ${rd.missing.length === 1 ? 'lesson' : 'lessons'} to go`}</span>
                  )}
                </span>
                <Svg src={I.chev} className="ls-go" />
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href="/strategies" className="btn ghost sm ls-all">
        See all strategies
      </Link>
    </div>
  );
}

/* ===== Quick check: pauses the video at 50% ===== */
function QuickCheck({ rid, zi, li, k }: { rid: string; zi: number; li: number; k: string }) {
  const P = player.use();
  if (P.qc[k] !== 'open') return null;
  const q = qcQ(rid, zi, li),
    sel = P.qcsel[k],
    done = sel != null,
    ok = done && sel === q.a,
    back = chaptersFor(rid, zi, li)[1];
  return (
    <section className="card qc fade" id="qc" aria-live="polite">
      <div className="qc-h">
        <span className="mono acc">
          <Svg src={SPARK} />
          Quick check
        </span>
        <span className="mono">Paused · 1 question · doesn’t count toward the quiz</span>
      </div>
      <b className="qc-q">{q.q}</b>
      <div className="qc-opts">
        {q.opts.map((o: string, j: number) => (
          <button key={j} className={cx('wg-opt', done && j === q.a && 'right', done && j === sel && !ok && 'wrong')} disabled={done} onClick={() => qcAnswer(j)}>
            <span>{'ABCD'[j]}</span>
            {o}
          </button>
        ))}
      </div>
      {done ? (
        <>
          <p className={cx('qc-f', ok ? 'ok' : 'no')}>
            <b>{ok ? 'Correct.' : 'Not quite.'}</b>
            {` ${q.why}`}
          </p>
          <div className="wg-acts">
            {!ok && (
              <button className="btn ghost sm" onClick={() => lseek(back.a, true)}>
                {`Rewatch “${back.t}” from ${tt(back.sec)}`}
              </button>
            )}
            <button className="btn primary sm" onClick={qcContinue}>
              Keep watching
            </button>
          </div>
        </>
      ) : (
        <div className="wg-acts">
          <button className="btn ghost sm" onClick={() => wgRun('l_terms', 'Explain the key terms')}>
            <Svg src={GOOSE} />
            Explain the key terms
          </button>
          <button className="btn text sm" onClick={qcContinue}>
            Skip
          </button>
        </div>
      )}
    </section>
  );
}
