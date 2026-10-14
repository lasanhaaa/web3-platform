'use client';
/* Academy home (prototype vMap): continue card, study plan + daily review, the required start, the routes and the badge strip. */
import { ROUTES, R, key, pad, dur, gen } from '@/lib/curriculum';
import { I, SPARK } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { S, useProgress, focus, allCount, routeCount, routeDone, routeOpen, zoneOpen, quizOpen, isDone, pct, lessonState, firstOpenZone } from '@/lib/progress';
import { whyNext } from '@/lib/learn';
import { ZTile, SegBar } from '@/components/ui/bits';
import { BadgeImg } from '@/components/badges/BadgeImg';
import { useAcademyActs, img } from './parts';
import { StudyPlan } from './StudyPlan';
import { DailyReview } from './DailyReview';

export function AcademyHome() {
  useProgress();
  const a = useAcademyActs();
  if (!useHydrated()) return <div className="page" />;
  const f = focus(),
    all = allCount(),
    earned = Object.keys(S.earned).length,
    certs = ['r1', 'r2', 'r3'].filter(routeDone).length;

  let cont = null;
  if (f) {
    const r = R(f.r),
      z = r.zones[f.z],
      ri = ROUTES.indexOf(r);
    const c = routeCount(f.r);
    const crumb = f.r === 'academy' ? 'Academy · Required start' : `${r.name} · Zone ${pad(f.z + 1)}`;
    const title = f.quiz ? `Quiz: ${z.name}` : z.lessons[f.l!].t;
    const k = f.quiz ? null : key(f.r, f.z, f.l),
      m = f.quiz ? 0 : dur(ri, f.z, f.l),
      pr = k ? S.prog[k] || 0 : 0;
    const sub = f.quiz
      ? 'All lessons done · 5 questions, 4 correct to pass'
      : `Lesson ${f.l! + 1} of ${z.lessons.length} · ${pr > 0 ? `${Math.max(1, Math.round(m * (1 - pr)))} min left` : m + ' min'}`;
    cont = (
      <section className="card cont fade">
        <div className="cont-body">
          <span className="mono quiet">Continue learning</span>
          <h2>{title}</h2>
          <span className="crumb">
            {crumb} · {sub}
          </span>
          <p className="wg-why">
            <Svg src={SPARK} />
            <span>
              <b>Wega:</b> {whyNext(f)}
            </span>
          </p>
          <div className="kpis tnum">
            <div className="kpi">
              <span className="mono">This course</span>
              <b>{pct(c.d, c.t)}%</b>
            </div>
            <div className="kpi">
              <span className="mono">All courses</span>
              <b>{pct(all.d, all.t)}%</b>
            </div>
            <div className="kpi">
              <span className="mono">Badges</span>
              <b>{earned}/9</b>
            </div>
            <div className="kpi">
              <span className="mono">Certificates</span>
              <b>{certs}/3</b>
            </div>
          </div>
          <SegBar rid={f.r} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
            <button className="btn primary lg" onClick={() => (f.quiz ? a.quiz(f.r, f.z) : a.lesson(f.r, f.z, f.l!))}>
              {f.quiz ? 'Start quiz' : pr > 0 ? 'Resume lesson' : 'Start lesson'}
            </button>
            <button className="btn ghost lg" onClick={() => a.route(f.r, f.z)}>
              View course
            </button>
          </div>
        </div>
        <div className="pic">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(r.img)} alt="" />
        </div>
      </section>
    );
  }

  const ac = R('academy'),
    aPassed = S.passed.has('academy.0');
  const acCard = (
    <button className="card ac-card fade" onClick={() => a.route('academy', 0)}>
      <div className="pic">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img(ac.img)} alt="" />
      </div>
      <div className="ac-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <span className="mono quiet">Required start · 4 lessons · 1 quiz</span>
          {aPassed && (
            <span className="chip good">
              <Svg src={I.check} />
              Completed
            </span>
          )}
        </div>
        <h3>Academy</h3>
        <p className="muted" style={{ fontSize: 14.5 }}>
          {ac.tagline}
        </p>
        <div className="ac-row">
          {ac.zones[0].lessons.map((s: any, li: number) => {
            const st = lessonState('academy', 0, li);
            return (
              <span key={li} className={`chip ${st === 'done' ? 'good' : st === 'now' ? 'acc' : ''}`}>
                {st === 'done' ? <Svg src={I.check} /> : st === 'lock' ? <Svg src={I.lock} /> : null}
                {s.t}
              </span>
            );
          })}
          <span className={`chip ${aPassed ? 'good' : quizOpen('academy', 0) ? 'acc' : ''}`}>
            <Svg src={aPassed ? I.check : I.star} />
            Quiz
          </span>
        </div>
      </div>
    </button>
  );

  const cards = ['r1', 'r2', 'r3'].map((id) => {
    const r = R(id),
      open = routeOpen(id),
      c = routeCount(id);
    return (
      <button key={id} className={`card rcard ${open ? '' : 'locked'} fade`} onClick={() => a.route(id, firstOpenZone(id))}>
        <div className="pic">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(r.img)} alt="" />
        </div>
        <div className="rcard-body">
          <span className="mono quiet">
            {r.label} · Based on {gen(r.by)} call outline
          </span>
          <h3>{r.name}</h3>
          <p>{r.tagline}</p>
          <div className="zl">
            {r.zones.map((z: any, zi: number) => {
              const o = zoneOpen(id, zi);
              return (
                <div key={zi}>
                  <ZTile n={zi + 1} s={24} locked={!o} ico={S.passed.has(id + '.' + zi) ? <Svg src={I.check} /> : !o ? <Svg src={I.lock} /> : null} />
                  {z.name}
                  <span className="n tnum">
                    {z.lessons.filter((_: any, l: number) => isDone(id, zi, l)).length}/{z.lessons.length}
                  </span>
                </div>
              );
            })}
          </div>
          <SegBar rid={id} />
          <div className="foot">
            {open ? (
              <span className="meta tnum">
                {c.d} of {c.t} lessons · {r.zones.length} badges · 1 certificate
              </span>
            ) : (
              <span className="lockline">
                <Svg src={I.lock} />
                Unlocks with the Academy quiz
              </span>
            )}
          </div>
        </div>
      </button>
    );
  });

  const recent = Object.keys(S.earned);
  const strip = recent.length ? (
    <div className="strip">
      {recent.map((k) => {
        const [rid, zi] = k.split('.');
        return (
          <button key={k} className="card bt" onClick={() => a.badge(k)}>
            <span className="bwrap">
              <BadgeImg k={k} />
            </span>
            <b>{R(rid).zones[+zi].name}</b>
            <small>{S.earned[k]}</small>
          </button>
        );
      })}
    </div>
  ) : (
    <div className="card" style={{ padding: 22, color: 'var(--t2)' }}>
      You’ll earn your first badge with the Academy quiz.
    </div>
  );

  return (
    <div className="page">
      <div className="fade">
        <p className="mono lt-eyebrow">Learn</p>
        <h1 className="lt">Academy</h1>
        <p className="lt-sub">{all.t} lessons in 4 courses. Every zone ends with a quiz and a badge, every route with a certificate.</p>
      </div>
      {cont}
      {f && (
        <div className="ap-grid">
          <StudyPlan f={f} />
          <DailyReview />
        </div>
      )}
      <section className="sec">
        <div className="sec-h">
          <div>
            <span className="mono">Step 1</span>
            <h2>Required start</h2>
          </div>
        </div>
        {acCard}
      </section>
      <section className="sec">
        <div className="sec-h">
          <div>
            <span className="mono">Step 2</span>
            <h2>Choose your route</h2>
          </div>
          {aPassed ? null : (
            <span className="lockline">
              <Svg src={I.lock} />
              After the Academy quiz
            </span>
          )}
        </div>
        <div className="routes">{cards}</div>
      </section>
      <section className="sec">
        <div className="sec-h">
          <div>
            <span className="mono">Your badges</span>
            <h2>{earned} of 9 earned</h2>
          </div>
          <button className="btn text" onClick={a.badges}>
            All badges and certificates <Svg src={I.chev} />
          </button>
        </div>
        {strip}
      </section>
    </div>
  );
}
