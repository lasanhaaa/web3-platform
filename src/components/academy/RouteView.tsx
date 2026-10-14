'use client';
/* Route / course view (prototype vRoute): header, zone tabs, the zone's lessons, quiz and certificate rows, progress aside. */
import { notFound, useParams } from 'next/navigation';
import { ROUTES, R, key, pad, dur, gen } from '@/lib/curriculum';
import { I } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { parseZL } from '@/lib/nav';
import { S, useProgress, routeCount, zoneOpen, routeOpen, quizOpen, routeDone, isDone, nextStep, pct, fmtMin, lessonState } from '@/lib/progress';
import { ZTile, SegBar } from '@/components/ui/bits';
import { BadgeImg } from '@/components/badges/BadgeImg';
import { useAcademyActs, useHydrated, img } from './parts';

export function RouteView() {
  useProgress();
  const a = useAcademyActs();
  const p = useParams<{ route: string; zone: string }>();
  const hydrated = useHydrated();
  const rid = String(p.route),
    zi = parseZL(p.zone).z,
    r = R(rid);
  if (!r || !r.zones[zi]) notFound();
  if (!hydrated) return <div className="page" />;
  const z = r.zones[zi],
    ri = ROUTES.indexOf(r),
    c = routeCount(rid),
    zo = zoneOpen(rid, zi),
    isAc = rid === 'academy';

  const tabs = isAc ? null : (
    <div className="tabs" role="tablist">
      {r.zones.map((zz: any, i: number) => {
        const o = zoneOpen(rid, i),
          d = zz.lessons.filter((_: any, l: number) => isDone(rid, i, l)).length;
        return (
          <button key={i} className={`tab ${i === zi ? 'on' : ''}`} role="tab" aria-selected={i === zi} onClick={() => a.route(rid, i)}>
            <ZTile n={i + 1} s={28} locked={!o} ico={S.passed.has(rid + '.' + i) ? <Svg src={I.check} /> : !o ? <Svg src={I.lock} /> : null} />
            <span>
              <b>{zz.name}</b>
              <small className="tnum">
                Zone {pad(i + 1)} · {d}/{zz.lessons.length}
              </small>
            </span>
          </button>
        );
      })}
    </div>
  );

  const rows = z.lessons.map((s: any, i: number) => {
    const st = lessonState(rid, zi, i),
      k = key(rid, zi, i),
      m = dur(ri, zi, i),
      pr = S.prog[k] || 0;
    const meta = st === 'done' ? 'Done' : pr > 0 && st !== 'lock' ? `${Math.max(1, Math.round(m * (1 - pr)))} min left` : `${m} min`;
    return (
      <button key={i} className={`row ${st}`} disabled={st === 'lock'} onClick={() => a.lesson(rid, zi, i)}>
        <span className="ri">{st === 'done' ? <Svg src={I.check} /> : st === 'lock' ? <Svg src={I.lock} /> : st === 'now' ? <Svg src={I.play} /> : pad(i + 1)}</span>
        <span className="tx">
          <b>{s.t}</b>
          <small>
            {s.d ? s.d + ' · ' : ''}
            {meta}
          </small>
        </span>
        {st === 'now' && <span className="chip acc">{pr > 0 ? 'Continue' : 'Up next'}</span>}
        {st !== 'lock' && (
          <span className="go">
            <Svg src={I.chev} />
          </span>
        )}
      </button>
    );
  });

  const passed = S.passed.has(rid + '.' + zi),
    qo = quizOpen(rid, zi),
    left = z.lessons.filter((_: any, i: number) => !isDone(rid, zi, i)).length,
    bk = rid + '.' + zi;
  const quizRow = (
    <button className={`row quiz ${passed ? 'done' : qo ? '' : 'lock'}`} disabled={!(passed || qo)} onClick={() => (passed ? a.badge(bk) : a.quiz(rid, zi))}>
      <span className="ri">
        <Svg src={passed ? I.check : qo ? I.star : I.lock} />
      </span>
      <span className="tx">
        <b>Quiz: {z.name}</b>
        <small>
          {passed ? `Passed ${S.earned[bk]} · View badge` : qo ? '5 questions · 4 correct to pass' : `${left} ${left === 1 ? 'lesson' : 'lessons'} left until the quiz`}
        </small>
      </span>
      <span className="mini-badge">
        <BadgeImg k={bk} locked={!passed} />
      </span>
    </button>
  );

  const last = zi === r.zones.length - 1 && !isAc,
    rDone = routeDone(rid);
  const certRow = last ? (
    <button className={`row ${rDone ? '' : 'lock'}`} disabled={!rDone} onClick={() => a.cert(rid)}>
      <span className="ri" style={rDone ? { background: 'var(--gold)', color: '#2a1d05', boxShadow: 'none' } : undefined}>
        <Svg src={I.star} />
      </span>
      <span className="tx">
        <b>{r.name} certificate</b>
        <small>{rDone ? 'Earned · view and share' : 'After the last quiz on this route'}</small>
      </span>
    </button>
  ) : null;

  const prev = zi > 0 ? r.zones[zi - 1].name : 'Academy';
  const banner = zo ? null : (
    <div className="lock-banner">
      <p>
        <Svg src={I.lock} />
        This zone unlocks once you pass the {prev} quiz.
      </p>
      <button className="btn ghost" onClick={() => a.route(zi > 0 ? rid : 'academy', zi > 0 ? zi - 1 : 0)}>
        Go to {prev}
      </button>
    </div>
  );

  const f = nextStep(rid),
    pc = pct(c.d, c.t),
    circ = 2 * Math.PI * 38;
  const nm = f ? (f.quiz ? `Quiz: ${r.zones[f.z].name}` : r.zones[f.z].lessons[f.l!].t) : '';
  const aside = (
    <aside className="aside">
      <div className="card pcard">
        <div className="ring-wrap">
          <div className="ring">
            <svg viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
              <circle cx="44" cy="44" r="38" fill="none" stroke="#9ED3FF" strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pc / 100)} />
            </svg>
            <b className="tnum">{pc}%</b>
          </div>
          <div>
            <div className="kv">
              <b className="tnum">
                {c.d} of {c.t}
              </b>
              <span className="mono">Lessons</span>
            </div>
            <div className="kv">
              <b className="tnum">
                {r.zones.filter((_: any, i: number) => S.passed.has(rid + '.' + i)).length} of {r.zones.length}
              </b>
              <span className="mono">Badges</span>
            </div>
          </div>
        </div>
        {f ? (
          <>
            <button className="btn primary" onClick={() => (f.quiz ? a.quiz(rid, f.z) : a.lesson(rid, f.z, f.l!))}>
              {f.quiz ? 'Start quiz' : 'Continue learning'}
            </button>
            <p className="next-txt">{nm}</p>
          </>
        ) : routeOpen(rid) ? (
          <p className="next-txt">Course completed.</p>
        ) : (
          <p className="next-txt">Unlocks with the Academy quiz.</p>
        )}
      </div>
      <div className="card bcard">
        <h3>Badges in this course</h3>
        <div className="bgrid">
          {r.zones.map((zz: any, i: number) => {
            const k = rid + '.' + i,
              g = S.passed.has(k);
            return (
              <button key={k} onClick={() => a.badge(k)}>
                <span className="bwrap">
                  <BadgeImg k={k} locked={!g} />
                </span>
                <span>{zz.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="page">
      <button className="back" onClick={a.map}>
        <i>
          <Svg src={I.left} />
        </i>
        Academy
      </button>
      <section className="card r-head fade">
        <div className="r-head-body">
          <span className="mono quiet">
            {isAc ? 'Required start' : r.label}
            {r.by ? ' · Based on ' + gen(r.by) + ' call outline' : ''}
          </span>
          <h1>{r.name}</h1>
          <p className="muted" style={{ fontSize: 16 }}>
            {r.tagline}
          </p>
          <div style={{ marginTop: 8 }}>
            <SegBar rid={rid} />
          </div>
          <span className="quiet tnum" style={{ fontSize: 13 }}>
            {c.d} of {c.t} lessons · {r.zones.length} {r.zones.length === 1 ? 'zone' : 'zones'} · {isAc ? 'then choose a route' : 'certificate at the end'}
          </span>
        </div>
        <div className="pic">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(r.img)} alt="" />
        </div>
      </section>
      {tabs}
      <div className="r-grid">
        <div>
          <div className="z-head">
            <ZTile n={zi + 1} s={56} locked={!zo} ico={isAc ? 'A' : ''} />
            <div>
              <span className="mono quiet">{isAc ? 'Required start' : 'Zone ' + pad(zi + 1) + ' of ' + pad(r.zones.length)}</span>
              <h2>{z.name}</h2>
              <p className="tnum">
                {z.lessons.filter((_: any, i: number) => isDone(rid, zi, i)).length} of {z.lessons.length} lessons · about{' '}
                {fmtMin(z.lessons.reduce((acc: number, _: any, i: number) => acc + dur(ri, zi, i), 0))}
              </p>
            </div>
          </div>
          {banner}
          <div className="card list">
            {rows}
            {quizRow}
            {certRow}
          </div>
        </div>
        {aside}
      </div>
    </div>
  );
}
