'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { R } from '@/lib/curriculum';
import { Q } from '@/lib/quiz-bank';
import { I, SPARK } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { S, useProgress, restoreDemo, quizOpen, lessonOpen, passZone, commit as commitP } from '@/lib/progress'; // TEMP-QDBG commit
import { useGo, parseZL, hrefRoute } from '@/lib/nav';
import { toast } from '@/lib/toast';
import { wgRun, wgAskLive } from '@/lib/wega';
import { earnFlow, closeReward } from '@/lib/reward';
import { quiz, getQZ, freshQuiz, startQuizState, answered, isRight, type QuizState } from '@/lib/quiz-state';
import { BadgeImg } from '@/components/badges/BadgeImg';
import { ZTile } from '@/components/ui/bits';
import { QArea } from './QArea';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const toTop = () => window.scrollTo({ top: 0 });
const canQuiz = (r: string, z: number) => quizOpen(r, z) || S.passed.has(r + '.' + z);

/** The zone quiz: intro, five questions with three lives, then the result stages. */
export function QuizView() {
  useProgress();
  const st = quiz.use();
  const params = useParams<{ route: string; zone: string }>();
  const r = String(params.route);
  const { z } = parseZL(params.zone);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const valid = !!(R(r) && R(r).zones[z] && Q[r + '.' + z]);

  // A fresh quiz whenever the page opens for a zone (or the demo state changes under it).
  useEffect(() => {
    restoreDemo();
    if (!valid) return;
    if (!canQuiz(r, z)) {
      toast('Finish all lessons in this zone first.');
      router.replace(hrefRoute(r, z));
      return;
    }
    startQuizState(r, z);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r, z, valid, S.demo]);
  // TEMP-QDBG
  useEffect(() => {
    (window as any).__qdbg = { S, commit: commitP, push: router.push };
  }, [router]);
  // The "lost" life animation only plays on the render right after the answer (prototype: render() clears QZ.lost).
  useEffect(() => {
    const q = getQZ();
    if (q) q.lost = false;
  });

  if (!valid) return null;
  const cur = st.QZ;
  const QZ = ready && cur && cur.r === r && cur.z === z ? cur : canQuiz(r, z) ? freshQuiz(r, z) : null;
  if (!QZ) return null;
  return <Quiz QZ={QZ} />;
}

function TopBar({ QZ }: { QZ: QuizState }) {
  const go = useGo();
  const z = R(QZ.r).zones[QZ.z];
  return (
    <div className="ftop">
      <button className="back" onClick={() => go({ screen: 'route', r: QZ.r, z: QZ.z })}>
        <i>
          <Svg src={I.left} />
        </i>
        Back
      </button>
      <div className="ttl">
        <span className="mono">Quiz</span>
        {z.name}
      </div>
      <div className="right">
        <div className="lives" aria-label={`${QZ.lives} of 3 lives`}>
          <span className="mono">Lives</span>
          {[0, 1, 2].map((i) => (
            <i key={i} className={cx(i < QZ.lives ? '' : 'off', QZ.lost && i === QZ.lives && 'lost') || undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Quiz({ QZ }: { QZ: QuizState }) {
  const go = useGo();
  const r = R(QZ.r),
    z = r.zones[QZ.z],
    qs = Q[QZ.r + '.' + QZ.z];
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
                quiz.commit();
              }}
            >
              Start quiz
            </button>
            <p className="rules">
              You have 3 lives, and each wrong answer costs one. Skipping counts as wrong. Pass to earn the {z.name} badge and unlock{' '}
              {QZ.z < r.zones.length - 1 ? `the ${r.zones[QZ.z + 1].name} zone` : QZ.r === 'academy' ? 'the three routes' : 'the certificate'}.
            </p>
          </div>
        </div>
      </div>
    );

  const q = qs[QZ.i],
    lk = QZ.locked,
    ok = lk && isRight(QZ, q);

  const answer = (skip: boolean) => {
    QZ.skipped = skip;
    if (skip && q.t !== 'order' && q.t !== 'sim') QZ.sel = null;
    const right = !skip && isRight(QZ, q);
    QZ.answers[QZ.i] = { ok: right };
    if (!right) {
      QZ.lives--;
      QZ.lost = true;
    }
    QZ.locked = true;
    quiz.commit();
  };
  const finishQuiz = () => {
    const right = QZ.answers.filter((a) => a && a.ok).length,
      k = QZ.r + '.' + QZ.z;
    if (right >= 4) {
      const isAc = QZ.r === 'academy',
        last = QZ.z === r.zones.length - 1;
      QZ.stage = 'badge';
      passZone(k);
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
        if (last && !isAc) return done();
        closeReward();
        QZ.stage = isAc ? 'routes' : 'unlock';
        quiz.commit();
        toTop();
      };
      earnFlow(k, after, done);
      return;
    }
    QZ.stage = 'fail';
    quiz.commit();
    toTop();
  };
  const qnext = () => {
    if (QZ.i >= qs.length - 1 || QZ.lives <= 0) return finishQuiz();
    QZ.i++;
    QZ.sel = null;
    QZ.locked = false;
    QZ.order = null;
    QZ.skipped = false;
    QZ.sim = { lev: 8, rng: 4 };
    quiz.commit();
    toTop();
  };

  const foot = lk ? (
    <div className={cx('q-foot', ok ? 'ok' : 'no')}>
      <div className="fb">
        <span className="ic">
          <Svg src={ok ? I.check : I.x} />
        </span>
        <div>
          <span className="mono">
            {ok ? 'Correct' : QZ.skipped ? 'Skipped' : 'Wrong answer'}
            {ok ? '' : ' · −1 life'}
          </span>
          <p>{q.why}</p>
          {!ok && (
            <button className="btn text wg-link" onClick={() => wgAskLive('q_explain', q.opts && q.a != null ? `Why is “${q.opts[q.a]}” correct?` : 'Why is that?')}>
              <Svg src={SPARK} />
              Wega explains
            </button>
          )}
        </div>
      </div>
      <button className={`btn ${ok ? 'good' : 'bad'} lg`} onClick={qnext}>
        {QZ.i === qs.length - 1 || QZ.lives <= 0 ? 'See result' : 'Next question'}
      </button>
    </div>
  ) : (
    <div className="q-foot">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn text" style={{ color: 'var(--t2)' }} onClick={() => answer(true)}>
          Skip
        </button>
        <button className="btn text wg-link" style={{ marginTop: 0 }} onClick={() => wgRun('q_hint', 'Give me a hint without the answer')}>
          <Svg src={SPARK} />
          Hint from Wega
        </button>
      </div>
      <button className="btn primary lg" onClick={() => answer(false)} disabled={!answered(QZ, q)}>
        Confirm answer
      </button>
    </div>
  );

  return (
    <div className={cx('q-wrap', lk && (ok ? 'ok' : 'no'))}>
      <TopBar QZ={QZ} />
      <div className="q-prog">
        <span style={{ width: ((QZ.i + (lk ? 1 : 0)) / qs.length) * 100 + '%' }} />
      </div>
      <div className="q-body">
        <div className="q-head">
          <span className="mono">
            Question {QZ.i + 1} of {qs.length}
          </span>
          <h1>{q.q}</h1>
          <p>{q.hint}</p>
        </div>
        <div className="q-area">
          <QArea QZ={QZ} q={q} />
        </div>
      </div>
      {foot}
    </div>
  );
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
    qs = Q[QZ.r + '.' + QZ.z],
    right = QZ.answers.filter((a) => a && a.ok).length;
  const lastZ = QZ.z === r.zones.length - 1,
    nz = !lastZ ? r.zones[QZ.z + 1] : null;

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
  return (
    <div className="q-wrap">
      <TopBar QZ={QZ} />
      <div className="stage">
        <div className="fade">
          <span className="mono r">Not passed yet</span>
          <h1>{right} of 5 correct</h1>
          <p className="lead">{QZ.lives <= 0 ? 'No lives left. ' : ''}You need 4 correct answers. Look over the explanations and try again right away.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
            <button className="btn primary lg" onClick={retry}>
              Try again
            </button>
            <button className="btn ghost lg" onClick={() => go({ screen: 'route', r: QZ.r, z: QZ.z })}>
              Review lessons
            </button>
            <button className="btn ghost lg" onClick={() => wgRun('practice', 'Start a practice round with Wega')}>
              <Svg src={SPARK} />
              Practice round with Wega
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
