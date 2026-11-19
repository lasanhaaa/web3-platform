'use client';
/* Wega in the Academy: the study plan (prototype vPlan). */
import { ROUTES, R, dur, GOAL } from '@/lib/curriculum';
import { GOOSE } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { createStore } from '@/lib/store';
import { S, useProgress, isDone, fmtMin, type Step } from '@/lib/progress';
import { whyNext } from '@/lib/learn';
import { useAcademyActs, useNow } from './parts';

/** PLAN_H: hours a week, kept across navigation like the prototype's module variable. */
const PLAN = createStore({ h: 3 });

type PlanStep = { t: string; m: number; z: number; l?: number; quiz?: boolean };
function planSteps(rid: string) {
  const r = R(rid),
    ri = ROUTES.indexOf(r),
    out: PlanStep[] = [];
  r.zones.forEach((z: any, zi: number) => {
    z.lessons.forEach((s: any, li: number) => {
      if (!isDone(rid, zi, li)) out.push({ t: s.t, m: dur(ri, zi, li), z: zi, l: li });
    });
    if (!S.passed.has(rid + '.' + zi)) out.push({ t: `Quiz: ${z.name}`, m: 5, z: zi, quiz: true });
  });
  return out;
}

const dayN = ['Today', 'Fri', 'Sun', 'Tue'];

export function StudyPlan({ f }: { f: Step }) {
  useProgress();
  const { h } = PLAN.use();
  const now = useNow();
  const a = useAcademyActs();
  const r = R(f.r),
    steps = planSteps(f.r),
    left = steps.reduce((acc, s) => acc + s.m, 0),
    days = Math.max(1, Math.ceil((left / (h * 60)) * 7));
  const end = now == null ? '' : new Date(now + days * 864e5).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const name = f.r === 'academy' ? 'the Academy' : r.name;
  const wk: PlanStep[] = [];
  let acc = 0;
  for (const s of steps) {
    if (wk.length && acc + s.m > h * 60) break;
    wk.push(s);
    acc += s.m;
    if (wk.length >= 4) break;
  }
  const setH = (v: number) => {
    PLAN.get().h = v;
    PLAN.commit();
  };
  return (
    <section className="card ap fade">
      <div className="ap-h">
        <h3>
          <Svg src={GOOSE} />
          Your study plan
        </h3>
        <span className="mono">Planned by Wega</span>
      </div>
      <p className="ap-big">
        Finish <b>{name}</b> by <b>{end}</b>
      </p>
      <p className="ap-sub">
        {fmtMin(left)} left. Planned around your goal: {GOAL}.
      </p>
      <div className="seg3" role="radiogroup" aria-label="Time per week">
        {[1, 3, 5].map((x) => (
          <button key={x} role="radio" aria-checked={x === h} className={x === h ? 'on' : ''} onClick={() => setH(x)}>
            {x} h a week
          </button>
        ))}
      </div>
      <div className="ap-week">
        <span className="mono">This week</span>
        {wk.map((s, i) => (
          <button key={i} className="ap-row" onClick={() => (s.quiz ? a.quiz(f.r, s.z) : a.lesson(f.r, s.z, s.l || 0))}>
            <span className="mono">{dayN[i]}</span>
            <b>{s.t}</b>
            <small className="tnum">{s.m} min</small>
          </button>
        ))}
      </div>
      <p className="wg-why">
        <Svg src={GOOSE} />
        <span>
          <b>Why this order:</b> {whyNext(f)}
        </span>
      </p>
      <div className="wg-acts">
        <button className="btn ghost sm" onClick={() => a.wgsoon('Calendar sync')}>
          Add to my calendar
        </button>
        <button className="btn ghost sm" onClick={() => a.wgsoon('Changing your goal')}>
          Change goal
        </button>
      </div>
    </section>
  );
}
