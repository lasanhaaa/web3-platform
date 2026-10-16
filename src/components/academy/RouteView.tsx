'use client';
/* Course view (Figma "Learn", node 2640:43289): the route's zones as one timeline down the page,
   each zone with its lessons and quiz, and a sticky progress card on the right.
   /academy/[route]/[zone] shows the whole route and scrolls to that zone. */
import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ROUTES, R, key, pad, dur } from '@/lib/curriculum';
import { parseZL } from '@/lib/nav';
import { S, useProgress, routeCount, zoneOpen, routeOpen, quizOpen, routeDone, isDone, nextStep, pct, lessonState } from '@/lib/progress';
import { useHydrated } from '@/lib/hydrated';
import { toast } from '@/lib/toast';
import { useAcademyActs, img, rc } from './parts';

const A = '/assets/learn/';
/* eslint-disable @next/next/no-img-element */
const Ico = ({ src, s }: { src: string; s: number }) => <img src={A + src} width={s} height={s} alt="" />;

/** Lesson time left, from the player's saved progress (0..1). */
const minsLeft = (m: number, pr: number) => Math.max(1, Math.round(m * (1 - pr)));

function Ring({ v }: { v: number }) {
  const r = 44.75,
    c = 2 * Math.PI * r;
  return (
    <div className="cv-ring">
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={r} className="t" />
        <circle cx="50" cy="50" r={r} className="v" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} />
      </svg>
      <b className="tnum">{v}%</b>
    </div>
  );
}

export function RouteView() {
  useProgress();
  const a = useAcademyActs();
  const p = useParams<{ route: string; zone: string }>();
  const hydrated = useHydrated();
  const rid = String(p.route),
    zi = parseZL(p.zone).z,
    r = R(rid);
  const zoneEls = useRef<(HTMLElement | null)[]>([]);

  /* the URL's zone: scroll to it (zone 1 is the top of the page) */
  useEffect(() => {
    if (hydrated && zi > 0) zoneEls.current[zi]?.scrollIntoView({ block: 'start' });
  }, [hydrated, rid, zi]);

  if (!hydrated) return <div className="page cv" />;
  const ri = ROUTES.indexOf(r),
    c = routeCount(rid),
    isAc = rid === 'academy',
    badges = r.zones.filter((_: any, i: number) => S.passed.has(rid + '.' + i)).length;

  const zones = r.zones.map((z: any, zj: number) => {
    const open = zoneOpen(rid, zj),
      bk = rid + '.' + zj,
      passed = S.passed.has(bk),
      qo = quizOpen(rid, zj),
      done = z.lessons.filter((_: any, i: number) => isDone(rid, zj, i)).length,
      prev = zj > 0 ? 'Zone ' + pad(zj) : 'the Academy';

    const lessons = z.lessons.map((s: any, i: number) => {
      const st = lessonState(rid, zj, i),
        m = dur(ri, zj, i),
        pr = S.prog[key(rid, zj, i)] || 0;
      return (
        <button key={i} className={`cv-row ${st}`} onClick={() => a.lesson(rid, zj, i)} aria-disabled={st === 'lock'}>
          <span className="cv-mk">
            {st === 'done' ? (
              <Ico src="done.svg" s={40} />
            ) : st === 'now' ? (
              <>
                <i className="cv-mk-bg" />
                <Ico src="progress.svg" s={42} />
              </>
            ) : st === 'lock' ? (
              <Ico src="locked.svg" s={40} />
            ) : (
              <span className="cv-mk-n tnum">{pad(i + 1)}</span>
            )}
          </span>
          <span className="cv-tx">
            <b>{s.t}</b>
            <small className="tnum">{st === 'now' && pr > 0 ? `${minsLeft(m, pr)} min left` : `${m} min`}</small>
          </span>
          <Ico src="chevron.svg" s={24} />
        </button>
      );
    });

    const quizOk = passed || qo;
    const quiz = (
      <button className={`cv-row quiz${quizOk ? '' : ' lock'}`} onClick={() => (passed ? a.badge(bk) : a.quiz(rid, zj))} aria-disabled={!quizOk}>
        <span className="cv-mk">
          <span className={`cv-qt${quizOk ? '' : ' lock'}`}>{quizOk ? <Ico src="star.svg" s={18} /> : <Ico src="lock.svg" s={17} />}</span>
        </span>
        <span className="cv-tx">
          <b>Zone quiz</b>
          <small>{passed ? `Passed ${S.earned[bk] || ''} · View your ${z.name} badge` : `5 questions, earns the ${z.name} badge`}</small>
        </span>
        <Ico src="chevron.svg" s={24} />
      </button>
    );

    const last = zj === r.zones.length - 1 && !isAc,
      rDone = routeDone(rid);
    const cert = last ? (
      <button className={`cv-row quiz${rDone ? '' : ' lock'}`} onClick={() => (rDone ? a.cert(rid) : toast('Pass every zone quiz on this route to earn the certificate.'))} aria-disabled={!rDone}>
        <span className="cv-mk">
          <span className={`cv-qt${rDone ? '' : ' lock'}`}>{rDone ? <Ico src="star.svg" s={18} /> : <Ico src="lock.svg" s={17} />}</span>
        </span>
        <span className="cv-tx">
          <b>{r.name} certificate</b>
          <small>{rDone ? 'Earned · view and share it' : 'After the last zone quiz'}</small>
        </span>
        <Ico src="chevron.svg" s={24} />
      </button>
    ) : null;

    return (
      <section key={zj} className={`cv-zone${open ? '' : ' lock'}`} ref={(el) => void (zoneEls.current[zj] = el)}>
        <div className="cv-div">
          <i />
          <span>
            <em>ZONE {pad(zj + 1)}</em>
            {passed ? 'Completed' : open ? (done ? 'In progress' : 'Up next') : 'Locked'}
          </span>
          <i />
        </div>
        <div className="cv-zh">
          <div className="cv-zh-l">
            <span className="cv-zt tnum">{pad(zj + 1)}</span>
            <div>
              <h2>{z.name}</h2>
              <small className="tnum">
                {done} of {z.lessons.length} lessons
              </small>
            </div>
          </div>
          {!open && (
            <button className="cv-unlock" onClick={() => (zj > 0 ? a.route(rid, zj - 1) : a.route('academy'))}>
              <Ico src="lock-head.svg" s={17} />
              <span>Unlocks after {prev}</span>
              <Ico src="chevron.svg" s={24} />
            </button>
          )}
        </div>
        <div className="cv-rows">
          {lessons}
          {quiz}
          {cert}
        </div>
      </section>
    );
  });

  const f = nextStep(rid);
  let cta: { label: string; go: () => void } | null = null,
    note = '';
  if (f) {
    if (f.quiz) {
      cta = { label: 'Start quiz', go: () => a.quiz(rid, f.z) };
      note = `Zone quiz: ${r.zones[f.z].name}`;
    } else {
      const pr = S.prog[key(rid, f.z, f.l!)] || 0,
        m = dur(ri, f.z, f.l!);
      cta = { label: pr > 0 ? 'Continue lesson' : 'Start lesson', go: () => a.lesson(rid, f.z, f.l!) };
      note = `${r.zones[f.z].lessons[f.l!].t}, ${pr > 0 ? minsLeft(m, pr) + ' min left' : m + ' min'}`;
    }
  } else if (!routeOpen(rid)) {
    cta = { label: 'Go to the Academy', go: () => a.route('academy') };
    note = 'This route opens once you pass the Academy quiz.';
  } else if (isAc) {
    cta = { label: 'Choose your route', go: a.fork };
    note = 'Academy completed.';
  } else {
    cta = { label: 'View certificate', go: () => a.cert(rid) };
    note = 'Course completed.';
  }

  return (
    <div className="page cv">
      <div className="cv-art" aria-hidden style={rc(rid)}>
        <img src={img(r.img)} alt="" />
      </div>
      <div className="cv-grid">
        <header className="cv-head">
          <button className="cv-back" onClick={a.map}>
            <span className="cv-back-i">
              <img src={A + 'back.svg'} alt="" />
            </span>
            Go back
          </button>
          <h1>{r.name}</h1>
          <p>{r.tagline}</p>
        </header>
        <aside className="cv-side">
          <div className="cv-card">
            <div className="cv-stats">
              <Ring v={pct(c.d, c.t)} />
              <div>
                <p>
                  <b className="tnum">
                    {c.d} of {c.t}
                  </b>
                  <small>Lessons done</small>
                </p>
                <p>
                  <b className="tnum">
                    {badges} of {r.zones.length}
                  </b>
                  <small>Badges earned</small>
                </p>
              </div>
            </div>
            {cta && (
              <button className="cv-cta" onClick={cta.go}>
                {cta.label}
                <img src={A + 'chevron.svg'} width={20} height={20} alt="" />
              </button>
            )}
            <p className="cv-note">{note}</p>
          </div>
        </aside>
        <div className="cv-tl">
          <i className="cv-line" aria-hidden />
          {zones}
        </div>
      </div>
    </div>
  );
}
