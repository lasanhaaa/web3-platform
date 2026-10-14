'use client';
/* Academy home (Figma "Learn", node 2580:67834): the course you're on as a large card with one button,
   then the other courses as plain cards. A whole card opens its course view. */
import { Fragment } from 'react';
import { R, key } from '@/lib/curriculum';
import { S, useProgress, focus, allCount, routeCount, routeDone, routeOpen, isDone, pct, firstOpenZone, type Step } from '@/lib/progress';
import { useHydrated } from '@/lib/hydrated';
import { useAcademyActs, img } from './parts';

const A = '/assets/learn/';
const COURSES = ['academy', 'r1', 'r2', 'r3'];
/* eslint-disable @next/next/no-img-element */

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
              <img className="ah-mk" src={A + 'seg-done.svg'} width={32} height={32} alt="" />
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
        <section className="ah-card ah-hero fade">
          <button className="ah-hit" onClick={() => a.route(rid, f ? f.z : firstOpenZone(rid))} aria-label={`Open ${r.name}`} />
          <div className="ah-art" aria-hidden>
            <img src={img(r.img)} alt="" />
          </div>
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
            <section key={id} className={`ah-card ah-row fade${routeOpen(id) ? '' : ' ah-off'}`}>
              <button className="ah-hit" onClick={() => a.route(id, firstOpenZone(id))} aria-label={`Open ${c.name}`} />
              <div className="ah-art" aria-hidden>
                <img src={img(c.img)} alt="" />
              </div>
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
