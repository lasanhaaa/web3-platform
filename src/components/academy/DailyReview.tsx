'use client';
/* Wega in the Academy: the daily review (prototype reviewCards / vReview). */
import { R, glossFor } from '@/lib/curriculum';
import { Q } from '@/lib/quiz-bank';
import { I, SPARK } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { createStore } from '@/lib/store';
import { S, useProgress, isDone } from '@/lib/progress';

type Card = { k: string; f: string; b: string; z: string };
type RVState = { i: number; flip: boolean; got: number[]; again: number[] };
/** RV: the review session, kept across navigation like the prototype's module variable. */
const RV = createStore<{ rv: RVState | null }>({ rv: null });
const setRV = (rv: RVState) => RV.set({ rv });

function reviewCards() {
  const cards: Card[] = [];
  const zs = (
    [
      ['academy', 0],
      ['r1', 0],
      ['r1', 1],
      ['r1', 2],
    ] as [string, number][]
  ).filter(([r, z]) => S.passed.has(r + '.' + z) || R(r).zones[z].lessons.some((_: any, l: number) => isDone(r, z, l)));
  zs.forEach(([r, z]) => glossFor(r, z).slice(0, 2).forEach((g: string[]) => cards.push({ k: 'Term', f: g[0], b: g[1], z: R(r).zones[z].name })));
  const passed = zs.filter(([r, z]) => S.passed.has(r + '.' + z));
  if (passed.length) {
    const [r, z] = passed[passed.length - 1],
      q = (Q[r + '.' + z] || []).filter((q) => q.t === 'choice')[1];
    if (q) cards.splice(1, 0, { k: 'Question you missed', f: q.q, b: `${q.opts[q.a]}. ${q.why}`, z: R(r).zones[z].name });
  }
  return cards.slice(0, 5);
}

export function DailyReview() {
  useProgress();
  const { rv } = RV.use();
  const cards = reviewCards();
  const head = (
    <div className="ap-h">
      <h3>
        <Svg src={SPARK} />
        Daily review
      </h3>
      <span className="mono">{cards.length ? `${cards.length} cards · about 3 min` : 'After your first lesson'}</span>
    </div>
  );
  const start = () => setRV({ i: 0, flip: false, got: [], again: [] });
  if (!cards.length)
    return (
      <section className="card ap rv fade">
        {head}
        <p className="ap-sub">After each lesson Wega keeps the key terms and the questions you got wrong, and brings them back right before you’d forget them.</p>
      </section>
    );
  if (!rv)
    return (
      <section className="card ap rv fade" id="rv">
        {head}
        <p className="ap-sub">Wega picks what you’re about to forget: terms from the zones you’ve finished and the quiz question you missed.</p>
        <div className="rv-peek">
          <span className="mono">
            {cards[0].k} · {cards[0].z}
          </span>
          <b>{cards[0].f}</b>
        </div>
        <div className="rv-foot">
          <button className="btn primary sm" onClick={start}>
            Start review
          </button>
          <span className="mono quiet">4-week streak</span>
        </div>
      </section>
    );
  if (rv.i >= cards.length) {
    const got = rv.got.length;
    return (
      <section className="card ap rv fade" id="rv">
        {head}
        <div className="rv-done">
          <span className="okc">
            <Svg src={I.check} />
          </span>
          <b>Done for today</b>
          <p className="ap-sub">
            You knew {got} of {cards.length}.{' '}
            {rv.again.length ? `“${cards[rv.again[0]].f}” comes back tomorrow, the rest in 4 days.` : 'Everything comes back in 4 days.'}
          </p>
        </div>
        <div className="rv-foot">
          <button className="btn ghost sm" onClick={start}>
            Review again
          </button>
          <span className="mono quiet">Streak kept</span>
        </div>
      </section>
    );
  }
  const c = cards[rv.i];
  const next = (ok: boolean) => {
    (ok ? rv.got : rv.again).push(rv.i);
    setRV({ ...rv, i: rv.i + 1, flip: false });
  };
  return (
    <section className="card ap rv fade" id="rv">
      {head}
      <div className={`rv-card ${rv.flip ? 'flip' : ''}`}>
        <span className="mono">
          {c.k} · {c.z} · {rv.i + 1} of {cards.length}
        </span>
        <b>{c.f}</b>
        {rv.flip && <p>{c.b}</p>}
      </div>
      <div className="rv-foot">
        {rv.flip ? (
          <>
            <button className="btn ghost sm" onClick={() => next(false)}>
              Again
            </button>
            <button className="btn primary sm" onClick={() => next(true)}>
              Got it
            </button>
          </>
        ) : (
          <button className="btn primary sm" onClick={() => setRV({ ...rv, flip: true })}>
            Show answer
          </button>
        )}
        <span className="rv-dots">
          {cards.map((_, j) => (
            <i key={j} className={j < rv.i ? 'd' : j === rv.i ? 'n' : ''} />
          ))}
        </span>
      </div>
    </section>
  );
}
