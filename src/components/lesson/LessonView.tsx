'use client';
import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from 'react';
import { useParams } from 'next/navigation';
import { ROUTES, R, key, pad, dur, chaptersFor, chIdx } from '@/lib/curriculum';
import { Q } from '@/lib/quiz-bank';
import { S, useProgress, isDone, lessonOpen, quizOpen, lessonState } from '@/lib/progress';
import { useGo, parseZL } from '@/lib/nav';
import { toast } from '@/lib/toast';
import { tt } from '@/lib/format';
import { I, GOOSE, SPARK } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { wega, wgRun, wgClose } from '@/lib/wega';
import { rewardOpen } from '@/lib/reward';
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
  cycleRate,
} from '@/lib/player';
import { LessonChat } from './LessonChat';
import { AskWega } from '@/components/wega/Wega';

const FS_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
const FS_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
const CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z"/></svg>';
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

/* The quick check's question: a choice question from this zone's quiz bank. */
function qcQ(rid: string, zi: number, li: number) {
  const pool = (Q[rid + '.' + zi] || Q['academy.0']).filter((q: any) => q.t === 'choice');
  return pool[li % pool.length];
}
/* data-act="lseek": "Rewatch" in the quick check, and the timestamps in the description */
function lseek(p: number, fromQc?: boolean) {
  if (!seekLesson(p, fromQc)) return toast('Open the lesson to jump to this part.');
  if (window.innerWidth < 1280 && wega.get().open) wgClose();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ===== LESSON ===== */
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
  const stage = useRef<HTMLDivElement>(null);
  const [fs, setFs] = useState(false);
  const [fsOk, setFsOk] = useState(false);
  const k = key(rid, zi, li),
    ok = !!R(rid)?.zones[zi]?.lessons[li];

  useEffect(() => {
    if (!ok) return;
    openLesson(rid, zi, li, k);
    return () => closeLesson(k);
  }, [rid, zi, li, k, ok]);
  /* full screen shows the stage (video and chat) over the whole screen; phones without it (iPhone) don't get the button */
  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else stage.current?.requestFullscreen?.().catch(() => toast('Full screen doesn’t work in this browser.'));
  };
  useEffect(() => {
    setFsOk(!!document.fullscreenEnabled);
    const onFs = () => setFs(!!document.fullscreenElement && document.fullscreenElement === stage.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  /* the quick check and the description sit under the video: leave full screen when the quick check stops the video */
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
        else stage.current?.requestFullscreen?.().catch(() => {});
      } else if (key === 'k' || (key === ' ' && !(e.target instanceof HTMLElement && e.target.closest('button,a')))) {
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
  /* the description: what the lesson covers (the first two chapters' notes), then its chapters as timestamps */
  const about = ch[1].n !== ch[0].n ? `${ch[0].n} ${ch[1].n}` : ch[0].n;

  /* data-act="lesson" / "quiz" / "route" */
  const toLesson = (l: number) => {
    if (!lessonOpen(rid, zi, l)) return toast('This lesson is still locked.');
    if (l === li) {
      reopenLesson();
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      return;
    }
    go({ screen: 'lesson', r: rid, z: zi, l });
  };
  const toQuiz = () => {
    if (!quizOpen(rid, zi) && !S.passed.has(rid + '.' + zi)) return toast('Finish all lessons in this zone first.');
    go({ screen: 'quiz', r: rid, z: zi });
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
  const quizIco = passed ? I.check : qOpen ? I.star : I.lock;

  return (
    <>
      <div className="ftop">
        <button className="back" onClick={toRoute}>
          <i>
            <Svg src={I.left} />
          </i>
          {z.name}
        </button>
        <div className="ttl">{rid === 'academy' ? 'Academy' : r.name}</div>
        <div className="right">
          <AskWega where="inline" />
        </div>
      </div>
      <div className={cx('lp', !V.chat && 'nochat')}>
        <div className="l-stage" ref={stage}>
          <div className="l-vid">
            <div className="player" id="player">
              <img src="/assets/video.webp" alt="Lesson video preview" />
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
                    {!V.chat && (
                      <button className="pb wide showchat" onClick={() => showLessonChat(true)}>
                        <Svg src={CHAT} />
                        <span>Show Wega</span>
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
                        <button className="btn primary" onClick={toQuiz}>
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
          <LessonChat rid={rid} zi={zi} li={li} k={k} />
        </div>
        {/* one centred column under the video, as under a YouTube video: title and next step, the description, the lessons */}
        <div className="l-col">
          <QuickCheck rid={rid} zi={zi} li={li} k={k} />
          <div className="l-head">
            <h1>{s.t}</h1>
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
                <button className="btn primary" onClick={toQuiz}>
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
          <section className="l-desc" aria-label="About this lesson">
            <span className="l-meta tnum">{`Lesson ${li + 1} of ${z.lessons.length} · ${z.name} · ${m} min`}</span>
            <p>{about}</p>
            <ol className="l-ts" aria-label="Chapters">
              {ch.map((c: any, i: number) => (
                <li key={c.a}>
                  <button className={cx(i === ci && pr > 0 && 'now')} onClick={() => lseek(c.a)} aria-label={`Play from ${yt(c.sec)}: ${c.t}`}>
                    <span className="tsl tnum">{yt(c.sec)}</span>
                    {c.t}
                  </button>
                </li>
              ))}
            </ol>
          </section>
          <section className="card l-list" aria-labelledby="lzone">
            <h2 id="lzone">{z.name}</h2>
            {z.lessons.map((st: any, i: number) => {
              const ss = lessonState(rid, zi, i);
              return (
                <button key={i} className={cx('li', i === li && 'on', ss === 'done' && 'done')} disabled={ss === 'lock'} onClick={() => toLesson(i)}>
                  <span className="ri">{ss === 'done' && i !== li ? <Svg src={I.check} /> : ss === 'lock' ? <Svg src={I.lock} /> : pad(i + 1)}</span>
                  <span className="t">
                    <b>{st.t}</b>
                    <small>{i === li ? 'Now playing' : `${dur(ri, zi, i)} min`}</small>
                  </span>
                </button>
              );
            })}
            <button className="li" disabled={!qOpen} onClick={toQuiz}>
              <span
                className="ri"
                style={qOpen ? { borderRadius: 8, background: 'rgba(158,255,162,.12)', color: 'var(--good)', boxShadow: 'none' } : { borderRadius: 8 }}
              >
                <Svg src={quizIco} />
              </span>
              <span className="t">
                <b>{`Quiz: ${z.name}`}</b>
                <small>{passed ? 'Passed · badge earned' : qOpen ? 'Ready · 5 questions' : `Opens after ${left} more ${left === 1 ? 'lesson' : 'lessons'}`}</small>
              </span>
            </button>
          </section>
        </div>
      </div>
    </>
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
