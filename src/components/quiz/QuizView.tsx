'use client';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { R } from '@/lib/curriculum';
import { Q, rightText } from '@/lib/quiz-bank';
import { I, SPARK } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { S, useProgress, restoreDemo, quizOpen, lessonOpen, passZone } from '@/lib/progress';
import { useGo, parseZL, hrefRoute } from '@/lib/nav';
import { toast } from '@/lib/toast';
import { wgRun, wgAskLive } from '@/lib/wega';
import { earnFlow, closeReward } from '@/lib/reward';
import { quiz, getQZ, freshQuiz, freshMatch, startQuizState, startPractice, quizQs, answered, isRight, type QuizState } from '@/lib/quiz-state';
import { sound, soundLoad, soundToggle, sfx } from '@/lib/sfx';
import { BadgeImg } from '@/components/badges/BadgeImg';
import { ZTile } from '@/components/ui/bits';
import { QArea, HAND } from './QArea';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const toTop = () => window.scrollTo({ top: 0 });
const OK_WORDS = ['Nice!', 'Exactly right!', 'You got it!', 'Great job!', 'Spot on!'];
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const SND_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const SND_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>';
const FLAME = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s5 4.6 5 10.2A5 5 0 0 1 12 17a5 5 0 0 1-5-4.8c0-2.2 1.2-3.9 2-4.7.2 1.6 1 2.7 2 3.2C11 7.9 12 2 12 2Zm0 20a7 7 0 0 1-7-7c0-.6.1-1.2.2-1.7A7 7 0 0 0 12 19a7 7 0 0 0 6.8-5.7c.1.5.2 1.1.2 1.7a7 7 0 0 1-7 7Z"/></svg>';

/** A small burst of sparks around a check mark (right answer, quiz done). */
export const Burst = ({ n = 12 }: { n?: number }) => (
  <span className="burst" aria-hidden>
    {Array.from({ length: n }, (_, i) => (
      <i key={i} style={{ ['--a' as string]: `${(360 / n) * i}deg`, ['--d' as string]: `${i % 2 ? 30 : 42}px` }} />
    ))}
  </span>
);
const canQuiz = (r: string, z: number) => quizOpen(r, z) || S.passed.has(r + '.' + z);

/** The zone quiz: intro, five questions with three lives, then the result stages. */
export function QuizView() {
  useProgress();
  const st = quiz.use();
  const params = useParams<{ route: string; zone: string }>();
  const r = String(params.route);
  const { z } = parseZL(params.zone);
  const router = useRouter();
  /* 'init' renders the intro (the same on the server and while hydrating, whatever demo state the browser restores);
     'ready' renders the running quiz; 'blocked' renders nothing while redirecting. */
  const [phase, setPhase] = useState<'init' | 'ready' | 'blocked'>('init');
  const valid = !!(R(r) && R(r).zones[z] && Q[r + '.' + z]);

  // A fresh quiz whenever the page opens for a zone (or the demo state changes under it). Before paint, so a locked quiz never shows.
  useLayoutEffect(() => {
    restoreDemo();
    if (!valid) return;
    if (!canQuiz(r, z)) {
      setPhase('blocked');
      toast('Finish all lessons in this zone first.');
      router.replace(hrefRoute(r, z));
      return;
    }
    startQuizState(r, z);
    setPhase('ready');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r, z, valid, S.demo]);
  // The "lost" life animation only plays on the render right after the answer (prototype: render() clears QZ.lost).
  useEffect(() => {
    const q = getQZ();
    if (q) q.lost = false;
  });

  if (!valid || phase === 'blocked') return null;
  const cur = st.QZ;
  return <Quiz QZ={phase === 'ready' && cur && cur.r === r && cur.z === z ? cur : freshQuiz(r, z)} />;
}

function TopBar({ QZ }: { QZ: QuizState }) {
  const go = useGo();
  const z = R(QZ.r).zones[QZ.z];
  const snd = sound.use();
  useEffect(soundLoad, []);
  return (
    <div className="ftop">
      <button className="back" onClick={() => go({ screen: 'route', r: QZ.r, z: QZ.z })}>
        <i>
          <Svg src={I.left} />
        </i>
        Back
      </button>
      <div className="ttl">
        <span className="mono">{QZ.practice ? 'Practice' : 'Quiz'}</span>
        {z.name}
      </div>
      <div className="right">
        <button className="q-snd" onClick={soundToggle} aria-pressed={snd.on} aria-label={snd.on ? 'Sound on. Turn sound off' : 'Sound off. Turn sound on'} title={snd.on ? 'Sound on' : 'Sound off'}>
          <Svg src={snd.on ? SND_ON : SND_OFF} />
        </button>
        {QZ.practice ? (
          <span className="q-prac mono">No lives</span>
        ) : (
          <div className="lives" aria-label={`${QZ.lives} of 3 lives`}>
            <span className="mono">Lives</span>
            {[0, 1, 2].map((i) => (
              <i key={i} className={cx(i < QZ.lives ? '' : 'off', QZ.lost && i === QZ.lives && 'lost') || undefined} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Quiz({ QZ }: { QZ: QuizState }) {
  const go = useGo();
  const r = R(QZ.r),
    z = r.zones[QZ.z],
    qs = quizQs(QZ);
  useKeys(QZ);
  keyAct = () => {};
  if (QZ.stage) return <Stage QZ={QZ} />;

  if (QZ.i === -1)
    return (
      <div className="q-wrap">
        <TopBar QZ={QZ} />
        <div className="q-intro fade">
          <div>
            <div className="q-badge">
              <BadgeImg k={QZ.r + '.' + QZ.z} locked eager />
            </div>
            <span className="mono quiet">Zone quiz · {QZ.r === 'academy' ? 'Academy' : r.label + ' ' + r.name}</span>
            <h1>{z.name}</h1>
            <div className="q-facts tnum">
              <div>
                <b>05</b>
                <span>Questions</span>
              </div>
              <div>
                <b>4 min</b>
                <span>Duration</span>
              </div>
              <div>
                <b>4 of 5</b>
                <span>to pass</span>
              </div>
            </div>
            <button
              className="btn primary lg"
              style={{ minWidth: 240 }}
              onClick={() => {
                QZ.i = 0;
                QZ.t0 = Date.now();
                sfx('tap');
                quiz.commit();
              }}
            >
              Start quiz
            </button>
            <p className="rules">
              Short games: tap, match, put in order, play out a trade. You have 3 lives, and each wrong answer costs one. Pass to earn the {z.name} badge and
              unlock {QZ.z < r.zones.length - 1 ? `the ${r.zones[QZ.z + 1].name} zone` : QZ.r === 'academy' ? 'the three routes' : 'the certificate'}.
            </p>
          </div>
        </div>
      </div>
    );

  const q = qs[QZ.i],
    lk = QZ.locked,
    ok = lk && isRight(QZ, q),
    plays = q.t === 'sim' || q.t === 'predict';

  const answer = (skip: boolean) => {
    if (QZ.locked) return;
    QZ.skipped = skip;
    if (skip && q.t !== 'order' && q.t !== 'sim') QZ.sel = null;
    const right = !skip && isRight(QZ, q);
    QZ.answers[QZ.i] = { ok: right };
    QZ.streak = right ? QZ.streak + 1 : 0;
    QZ.best = Math.max(QZ.best, QZ.streak);
    QZ.locked = true;
    const land = () => {
      if (!right && !QZ.practice) {
        QZ.lives--;
        QZ.lost = true;
      }
      sfx(right ? 'ok' : 'no');
    };
    if (plays && !skip) {
      // the trade or the 7 days play out first, then the result
      QZ.anim = true;
      quiz.commit();
      setTimeout(() => {
        if (getQZ() !== QZ) return;
        QZ.anim = false;
        land();
        quiz.commit();
      }, 1700);
      return;
    }
    land();
    quiz.commit();
  };
  const finishQuiz = () => {
    const right = QZ.answers.filter((a) => a && a.ok).length,
      k = QZ.r + '.' + QZ.z;
    QZ.secs = Math.round((Date.now() - (QZ.t0 || Date.now())) / 1000);
    toTop();
    if (QZ.practice) {
      QZ.stage = 'practiced';
      sfx('done');
      return quiz.commit();
    }
    if (right >= 4) {
      passZone(k);
      QZ.stage = 'done';
      sfx('done');
      return quiz.commit();
    }
    QZ.stage = 'fail';
    quiz.commit();
  };
  const qnext = () => {
    if (QZ.i >= qs.length - 1 || QZ.lives <= 0) return finishQuiz();
    QZ.i++;
    QZ.sel = null;
    QZ.locked = false;
    QZ.order = null;
    QZ.skipped = false;
    QZ.sim = { lev: 8, rng: 4 };
    QZ.mt = freshMatch();
    QZ.fl = [];
    quiz.commit();
    toTop();
  };
  keyAct = () => (lk ? !QZ.anim && qnext() : answered(QZ, q) && q.t !== 'match' && answer(false));

  const last = QZ.i === qs.length - 1 || (QZ.lives <= 0 && !QZ.practice);
  const wrongTxt = !ok && !QZ.skipped && q.t !== 'sim' && q.t !== 'order' && q.t !== 'match' ? rightText(q) : '';
  const foot = lk && QZ.anim ? (
    <div className="q-foot play">
      <span className="q-playing">
        <i />
        {q.t === 'sim' ? 'Playing the 7 days…' : 'Playing out the trade…'}
      </span>
    </div>
  ) : lk ? (
    <div className={cx('q-foot', 'sheet', ok ? 'ok' : 'no')}>
      <div className="fb">
        <span className="ic">
          {ok && <Burst />}
          <Svg src={ok ? I.check : I.x} />
        </span>
        <div>
          <p className="fb-h">
            {ok ? OK_WORDS[QZ.i % OK_WORDS.length] : QZ.skipped ? 'Skipped' : 'Not quite'}
            {ok && QZ.streak >= 2 && (
              <span className="fb-streak">
                <Svg src={FLAME} />
                {QZ.streak} in a row
              </span>
            )}
            {!ok && !QZ.practice && <span className="fb-life">−1 life</span>}
          </p>
          {wrongTxt && (
            <p className="fb-right">
              Right answer: <b>{wrongTxt}</b>
            </p>
          )}
          <p>{q.why}</p>
          {!ok && (
            <button className="btn text wg-link" onClick={() => wgAskLive('q_explain', wrongTxt ? `Why is “${wrongTxt}” correct?` : 'Why is that?')}>
              <Svg src={SPARK} />
              Wega explains
            </button>
          )}
        </div>
      </div>
      <button className={`btn ${ok ? 'good' : 'bad'} lg`} onClick={qnext} autoFocus>
        {last ? 'See result' : 'Next question'}
      </button>
    </div>
  ) : (
    <div className="q-foot">
      <div className="q-foot-l">
        <button className="btn text" style={{ color: 'var(--t2)' }} onClick={() => answer(true)}>
          Skip
        </button>
        <button className="btn text wg-link" style={{ marginTop: 0 }} onClick={() => wgRun('q_hint', 'Give me a hint without the answer')}>
          <Svg src={SPARK} />
          Hint from Wega
        </button>
      </div>
      {q.t === 'match' ? (
        <span className="q-count tnum">
          {QZ.mt.done.length} of {q.pairs.length} matched
        </span>
      ) : (
        <button className="btn primary lg" onClick={() => answer(false)} disabled={!answered(QZ, q)}>
          {q.t === 'sim' ? 'Play the 7 days' : 'Confirm answer'}
        </button>
      )}
    </div>
  );

  return (
    <div className={cx('q-wrap', lk && !QZ.anim && (ok ? 'ok' : 'no'))}>
      <TopBar QZ={QZ} />
      <div className="q-prog">
        <span style={{ width: ((QZ.i + (lk && !QZ.anim ? 1 : 0)) / qs.length) * 100 + '%' }} />
      </div>
      <div className="q-body">
        <div className="q-head" key={QZ.i}>
          <span className="mono">
            {QZ.practice ? 'Practice' : 'Question'} {QZ.i + 1} of {qs.length}
          </span>
          <h1>{q.q}</h1>
          <p className="q-do">
            <Svg src={HAND} />
            {q.hint}
          </p>
        </div>
        <div className={cx('q-area', lk && !QZ.anim && 'lk', lk && !QZ.anim && (ok ? 'is-ok' : 'is-no'))}>
          <QArea QZ={QZ} q={q} onAuto={() => answer(false)} />
        </div>
      </div>
      {foot}
    </div>
  );
}

/* Enter checks the answer, or goes on after the result (desktop). Not while typing to Wega. */
let keyAct: () => unknown = () => {};
function useKeys(QZ: QuizState) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== 'Enter' || e.repeat || t?.closest('textarea,input,button,a,[contenteditable]')) return;
      e.preventDefault();
      keyAct();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [QZ]);
}

const Steps = ({ n }: { n: number }) => (
  <div className="qsteps" aria-hidden="true">
    {[0, 1].map((i) => (
      <i key={i} className={i <= n ? 'on' : undefined} />
    ))}
  </div>
);

function Stage({ QZ }: { QZ: QuizState }) {
  const go = useGo();
  const r = R(QZ.r),
    z = r.zones[QZ.z],
    qs = quizQs(QZ),
    right = QZ.answers.filter((a) => a && a.ok).length;
  const lastZ = QZ.z === r.zones.length - 1,
    nz = !lastZ ? r.zones[QZ.z + 1] : null;

  if (QZ.stage === 'done') {
    const k = QZ.r + '.' + QZ.z,
      isAc = QZ.r === 'academy';
    const collect = () => {
      QZ.stage = 'badge';
      quiz.commit();
      toTop();
      const done = () => {
        closeReward();
        go({ screen: 'badges' });
      };
      const after = () => {
        const cur = getQZ();
        if (cur !== QZ || QZ.stage !== 'badge') return;
        // the end of a path continues on the Badges page (prototype: no reward screen → done())
        if (lastZ && !isAc) return done();
        closeReward();
        QZ.stage = isAc ? 'routes' : 'unlock';
        quiz.commit();
        toTop();
      };
      earnFlow(k, after, done);
    };
    return (
      <div className="q-wrap">
        <TopBar QZ={QZ} />
        <div className="stage">
          <div className="fade">
            <span className="okc big">
              <Burst n={16} />
              <Svg src={I.check} />
            </span>
            <span className="mono g">Quiz completed</span>
            <h1>{z.name}</h1>
            <p className="lead">You passed. Your {z.name} badge is ready.</p>
            <div className="q-stats tnum">
              <div>
                <span>Correct</span>
                <b>
                  {right} of {qs.length}
                </b>
              </div>
              <div>
                <span>Time</span>
                <b>{mmss(QZ.secs)}</b>
              </div>
              <div>
                <span>Best streak</span>
                <b className="fl">
                  <Svg src={FLAME} />
                  {QZ.best}
                </b>
              </div>
            </div>
            <button className="btn primary lg" style={{ minWidth: 240 }} onClick={collect} autoFocus>
              Collect your badge
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (QZ.stage === 'practiced')
    return (
      <div className="q-wrap">
        <TopBar QZ={QZ} />
        <div className="stage">
          <div className="fade">
            <span className="okc big">
              <Svg src={I.check} />
            </span>
            <span className="mono g">Practice done</span>
            <h1>Ready for the real quiz?</h1>
            <p className="lead">
              You got {right} of {qs.length} right in practice. The quiz has 5 questions and 3 lives.
            </p>
            <button
              className="btn primary lg"
              style={{ minWidth: 240 }}
              autoFocus
              onClick={() => {
                if (!canQuiz(QZ.r, QZ.z)) return toast('Finish all lessons in this zone first.');
                startQuizState(QZ.r, QZ.z);
                toTop();
              }}
            >
              Start the quiz
            </button>
            <button className="btn text" onClick={() => go({ screen: 'route', r: QZ.r, z: QZ.z })}>
              Back to course
            </button>
          </div>
        </div>
      </div>
    );
  if (QZ.stage === 'badge')
    return (
      <div className="q-wrap">
        <TopBar QZ={QZ} />
        <div className="stage" />
      </div>
    );
  if (QZ.stage === 'unlock' && nz)
    return (
      <div className="q-wrap">
        <TopBar QZ={QZ} />
        <div className="stage">
          <div className="fade">
            <Steps n={1} />
            <span className="mono a">New zone</span>
            <h1>Zone unlocked</h1>
            <div className="card unlock-card">
              <ZTile n={QZ.z + 2} s={52} />
              <div>
                <b>{nz.name}</b>
                <span className="tnum">
                  {nz.lessons.length} lessons · 1 badge · {r.label} {r.name}
                </span>
              </div>
            </div>
            <button
              className="btn primary lg"
              onClick={() => (lessonOpen(QZ.r, QZ.z + 1, 0) ? go({ screen: 'lesson', r: QZ.r, z: QZ.z + 1, l: 0 }) : toast('This lesson is still locked.'))}
            >
              Start learning
            </button>
            <button className="btn text" onClick={() => go({ screen: 'route', r: QZ.r, z: QZ.z + 1 })}>
              Back to course
            </button>
          </div>
        </div>
      </div>
    );
  if (QZ.stage === 'routes')
    return (
      <div className="q-wrap">
        <TopBar QZ={QZ} />
        <div className="stage">
          <div className="fade">
            <Steps n={1} />
            <span className="mono a">Required start complete</span>
            <h1>Three routes are open</h1>
            <p className="lead">DeFi Fundamentals, DeFi Strategies and PerpPilot. Choose where to start.</p>
            <button className="btn primary lg" style={{ marginTop: 10 }} onClick={() => go({ screen: 'fork' })}>
              Choose a route
            </button>
          </div>
        </div>
      </div>
    );

  const retry = () => {
    if (!canQuiz(QZ.r, QZ.z)) return toast('Finish all lessons in this zone first.');
    startQuizState(QZ.r, QZ.z);
    toTop();
  };
  const missed = qs.map((_: any, i: number) => i).filter((i: number) => !QZ.answers[i]?.ok);
  return (
    <div className="q-wrap">
      <TopBar QZ={QZ} />
      <div className="stage">
        <div className="fade">
          <span className="mono r">Not passed yet</span>
          <h1>{right} of 5 correct</h1>
          <p className="lead">
            {QZ.lives <= 0 ? 'No lives left. ' : ''}You need 4. Practice the {missed.length === 1 ? 'one' : missed.length} you missed, with no lives, then try again.
          </p>
          <button
            className="btn primary lg"
            style={{ minWidth: 240, marginTop: 8 }}
            autoFocus
            onClick={() => {
              startPractice(QZ.r, QZ.z, missed);
              toTop();
            }}
          >
            Practice {missed.length === 1 ? 'the one' : `the ${missed.length}`} I missed
          </button>
          <div className="q-more">
            <button className="btn text" onClick={retry}>
              Try the quiz again
            </button>
            <button className="btn text" onClick={() => go({ screen: 'route', r: QZ.r, z: QZ.z })}>
              Review lessons
            </button>
          </div>
          <div className="review">
            {qs.map((q: any, i: number) => {
              const a = QZ.answers[i];
              if (!a)
                return (
                  <div key={i} className="rv">
                    <span className="m" style={{ background: 'rgba(255,255,255,.1)' }} />
                    <div>
                      <b>{q.q}</b>
                      <p>Not reached, no lives left.</p>
                    </div>
                  </div>
                );
              return (
                <div key={i} className={cx('rv', a.ok ? 'ok' : 'no')}>
                  <span className="m">
                    <Svg src={a.ok ? I.check : I.x} />
                  </span>
                  <div>
                    <b>{q.q}</b>
                    <p>{q.why}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
