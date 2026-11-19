'use client';
/* Academy home (Figma "Learn", node 2580:67834): the course you're on as a large card with one button,
   then the other courses as plain cards. A whole card opens its course view. */
import { Fragment } from 'react';
import { R, key } from '@/lib/curriculum';
import { S, useProgress, focus, allCount, routeCount, routeDone, routeOpen, isDone, pct, firstOpenZone, type Step } from '@/lib/progress';
import { useHydrated } from '@/lib/hydrated';
import { useAcademyActs } from './parts';

const A = '/assets/learn/';
const COURSES = ['academy', 'r1', 'r2', 'r3'];
/* Figma (Oct 16): each course has its own colour and picture, as in the "Learn" frame where Route 1 is the large
   blue card with the pawn and the Academy, Route 2 and Route 3 follow in green, purple and teal. */
const LOOK: Record<string, { tone: string; art: string }> = {
  academy: { tone: 'green', art: 'bishop' },
  r1: { tone: 'blue', art: 'pawn' },
  r2: { tone: 'purple', art: 'queen' },
  r3: { tone: 'teal', art: 'knight' },
};
/* eslint-disable @next/next/no-img-element */

/** The course picture, drawn in Figma for one card size: the pawn for the large card, the others for the small ones. */
function Art({ rid, hero }: { rid: string; hero?: boolean }) {
  const art = LOOK[rid].art,
    fit = hero && art !== 'pawn' ? ' small' : '';
  return (
    <div className={'ah-art' + fit} aria-hidden>
      <img src={A + 'cards/' + art + '.webp'} alt="" />
    </div>
  );
}

/** One bar per zone, each ending in its badge: a check once the zone quiz is passed, a lock until then. */
function Track({ rid }: { rid: string }) {
  return (
    <div className="ah-track" aria-hidden>
      {R(rid).zones.map((z: any, zi: number) => {
        const d = z.lessons.filter((_: any, l: number) => isDone(rid, zi, l)).length;
        return (
          <Fragment key={zi}>
            <span className="ah-bar">
              <i className="f" style={{ flexBasis: pct(d, z.lessons.length) + '%' }} />
              <i className="e" />
            </span>
            {S.passed.has(rid + '.' + zi) ? (
              <img className="ah-mk" src={A + 'seg-done-' + LOOK[rid].tone + '.svg'} width={32} height={32} alt="" />
            ) : (
              <span className="ah-mk lock">
                <img src={A + 'seg-lock.svg'} width={17} height={17} alt="" />
              </span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function Stats({ rid }: { rid: string }) {
  if (!routeOpen(rid))
    return (
      <p className="ah-stats">
        <span className="ah-locked">
          <img src={A + 'seg-lock.svg'} width={17} height={17} alt="" />
          Opens after the Academy
        </span>
      </p>
    );
  const c = routeCount(rid);
  return (
    <p className="ah-stats tnum">
      <span>
        {c.d} of {c.t} lessons
      </span>
      <i />
      <b>{pct(c.d, c.t)}%</b>
    </p>
  );
}

export function AcademyHome() {
  useProgress();
  const a = useAcademyActs();
  const hydrated = useHydrated();
  if (!hydrated) return <div className="page ah" />;

  /* the large card: the course with the next step; with no next step, the Academy (pick a route) or a finished route */
  const f = focus(),
    aPassed = S.passed.has('academy.0');
  let rid: string,
    cta: { label: string; go: () => void };
  if (f) {
    const pr = f.quiz ? 0 : S.prog[key(f.r, f.z, f.l!)] || 0;
    rid = f.r;
    cta = { label: f.quiz ? 'Start quiz' : pr > 0 || routeCount(f.r).d > 0 ? 'Continue lesson' : 'Start lesson', go: () => a.step(f as Step) };
  } else if (!['r1', 'r2', 'r3'].some((r) => routeCount(r).d > 0)) {
    rid = 'academy';
    cta = { label: 'Choose your route', go: a.fork };
  } else {
    rid = [S.chosen, 'r1', 'r2', 'r3'].find((r) => r && routeDone(r)) || 'r1';
    cta = { label: 'View certificate', go: () => a.cert(rid) };
  }
  const r = R(rid),
    all = allCount();

  return (
    <div className="page ah">
      <header className="ah-head fade">
        <h1>Academy</h1>
        <p>{all.d || aPassed || Object.values(S.prog).some((v) => v > 0) ? 'Pick up where you left off.' : 'Start with the Academy, then pick a route.'}</p>
      </header>
      <div className="ah-list">
        <section className={`ah-card ah-hero fade t-${LOOK[rid].tone}`}>
          <button className="ah-hit" onClick={() => a.route(rid, f ? f.z : firstOpenZone(rid))} aria-label={`Open ${r.name}`} />
          <Art rid={rid} hero />
          <div className="ah-in">
            <div className="ah-top">
              <div className="ah-tt">
                <h2>{r.name}</h2>
                <p>{r.tagline}</p>
              </div>
              <Stats rid={rid} />
              <button className="btn primary ah-cta" onClick={cta.go}>
                {cta.label}
                <img src={A + 'chevron-dark.svg'} width={20} height={20} alt="" />
              </button>
            </div>
            <Track rid={rid} />
          </div>
        </section>
        {COURSES.filter((id) => id !== rid).map((id) => {
          const c = R(id);
          return (
            <section key={id} className={`ah-card ah-row fade t-${LOOK[id].tone}${routeOpen(id) ? '' : ' ah-off'}`}>
              <button className="ah-hit" onClick={() => a.route(id, firstOpenZone(id))} aria-label={`Open ${c.name}`} />
              <Art rid={id} />
              <div className="ah-in">
                <div className="ah-top">
                  <div className="ah-tt">
                    <h3>{c.name}</h3>
                    <p>{c.tagline}</p>
                  </div>
                  <Stats rid={id} />
                </div>
                <Track rid={id} />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
