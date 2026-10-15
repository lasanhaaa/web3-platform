'use client';
import { useEffect, useSyncExternalStore, type MouseEvent } from 'react';
import { useParams } from 'next/navigation';
import { ROUTES, R, key, pad, dur, chaptersFor, chIdx } from '@/lib/curriculum';
import { Q } from '@/lib/quiz-bank';
import { S, useProgress, isDone, lessonOpen, quizOpen, lessonState } from '@/lib/progress';
import { useGo, parseZL } from '@/lib/nav';
import { toast } from '@/lib/toast';
import { tt } from '@/lib/format';
import { I, SPARK } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { wega, wgRun, wgClose } from '@/lib/wega';
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
} from '@/lib/player';
import { LessonChat, focusLessonChat } from './LessonChat';

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
/* data-act="lseek": "Rewatch" in the quick check */
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
  const go = useGo();
  const hydrated = useHydrated();
  const k = key(rid, zi, li),
    ok = !!R(rid)?.zones[zi]?.lessons[li];

  useEffect(() => {
    if (!ok) return;
    openLesson(rid, zi, li, k);
    return () => closeLesson(k);
  }, [rid, zi, li, k, ok]);
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
        <div className="ttl">
          <span className="mono">{`Lesson ${li + 1} of ${z.lessons.length}`}</span>
          {rid === 'academy' ? 'Academy' : r.name}
        </div>
        <div className="right">
          <button className="btn wega" onClick={focusLessonChat}>
            <span style={{ color: 'var(--accent)', display: 'inline-flex' }}>
              <Svg src={I.spark} />
            </span>
            <span className="wega-l">Ask wega</span>
          </button>
        </div>
      </div>
      <div className="l-grid">
        <div>
          <div className="player" id="player">
            <img src="/assets/video.webp" alt="Lesson video preview" />
            {showBig && (
              <button className="bigplay" aria-label="Play" onClick={onPlay}>
                <Svg src={I.play} />
              </button>
            )}
            <div className="p-ui">
              <span className="mono">
                {`Lesson ${li + 1} · ${z.name}${pr > 0 ? ' · ' : ''}`}
                {pr > 0 && <span className="pch">{ch[ci].t}</span>}
              </span>
              <h2>{s.t}</h2>
              <div className="scrub" onClick={onScrub}>
                <span id="scrubFill" style={{ width: `${pr * 100}%` }} />
                {ch.slice(1).map((c: any) => (
                  <b key={c.a} className="tk" style={{ left: `${c.a * 100}%` }} title={`${c.t} · ${tt(c.sec)}`} />
                ))}
                <i id="scrubKnob" style={{ left: `${pr * 100}%` }} />
              </div>
              <div className="ctrls">
                <span className="time tnum" id="ptime">{`${tt(sec)} / ${tt(m * 60)}`}</span>
                <div className="mid">
                  <button aria-label="Back 15 seconds" onClick={() => seekBy(-0.1)}>
                    <Svg src={I.rw} />
                  </button>
                  <button id="pbtn" aria-label="Play or pause" onClick={onPlay}>
                    <Svg src={playing ? I.pause : I.play} />
                  </button>
                  <button aria-label="Forward 15 seconds" onClick={() => seekBy(0.1)}>
                    <Svg src={I.ff} />
                  </button>
                </div>
                <button
                  className="askm"
                  aria-label="Ask Wega about this moment"
                  onClick={() => wgRun('l_moment', `What is the lesson saying at ${tt(Math.round(m * 60 * (S.prog[k] || 0)))}?`)}
                >
                  <Svg src={I.spark} />
                  <span>Ask about this moment</span>
                </button>
                <span className="time">1x</span>
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
          <QuickCheck rid={rid} zi={zi} li={li} k={k} />
          <div className="l-info">
            <div>
              <h1>{s.t}</h1>
              <p>{`${s.d ? s.d + '. ' : ''}Lesson ${li + 1} of ${z.lessons.length} in the ${z.name} zone${rid === 'academy' ? '' : `, ${r.label} ${r.name}`}.`}</p>
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
          <LessonChat rid={rid} zi={zi} li={li} k={k} />
        </div>
        <aside className="card l-list">
          <h3>
            <span>{z.name}</span>
            <span className="tnum">{`${z.lessons.length - left}/${z.lessons.length}`}</span>
          </h3>
          {z.lessons.map((st: any, i: number) => {
            const ss = lessonState(rid, zi, i);
            return (
              <button key={i} className={cx('li', i === li && 'on', ss === 'done' && 'done')} disabled={ss === 'lock'} onClick={() => toLesson(i)}>
                <span className="ri">{ss === 'done' && i !== li ? <Svg src={I.check} /> : ss === 'lock' ? <Svg src={I.lock} /> : pad(i + 1)}</span>
                <span className="t">
                  <b>{st.t}</b>
                  <small>{`${dur(ri, zi, i)} min`}</small>
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
        </aside>
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
            <Svg src={SPARK} />
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
