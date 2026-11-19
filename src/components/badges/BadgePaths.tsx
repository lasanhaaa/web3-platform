'use client';
/* Paths view: per path the badge before, the latest one live in 3D, and the next one
   (prototype bImage / bCaption / bPast / bLive / bNext / bEmpty / bDone / bRow, live canvas from bindBadges). */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CAT, still, nameOf, stepOf, bState } from '@/lib/badges';
import { B_CHECK, B_LOCK, B_SPARK } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { whenEngine } from '@/lib/reward';
import { showcase } from './showcase';
import { css } from './util';

type Item = any;
type Cat = any;
type Slot = { it: Item; state: string; done: number; total: number; hint: string };

/** canvases already handed to the showcase (React may run an effect twice on the same canvas in dev) */
const ADDED = new WeakSet<HTMLCanvasElement>();

const BImage = ({ it, lazy = true }: { it: Item; lazy?: boolean }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={still(it.id)} alt="" width={320} height={320} loading={lazy ? 'lazy' : undefined} decoding="async" />
);
const Caption = ({ it, c, children }: { it: Item; c: Cat; children: ReactNode }) => (
  <>
    <p className="slot-step">{stepOf(it)}</p>
    <h3 className="slot-name">{nameOf(it, c)}</h3>
    {children}
  </>
);

const Past = ({ x, c }: { x: Slot; c: Cat }) => (
  <li className="slot slot--past">
    <div className="art">
      <BImage it={x.it} />
    </div>
    <Caption it={x.it} c={c}>
      <p className="slot-status">
        <Svg src={B_CHECK} />
        Earned
      </p>
    </Caption>
  </li>
);

function Live({ x, c }: { x: Slot; c: Cat }) {
  const id = x.it.id;
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLButtonElement>(null);
  const [ready, setReady] = useState(false);
  const [hitOn, setHitOn] = useState(true);
  useEffect(() => {
    let alive = true;
    const cv = canvas.current;
    whenEngine((wb) => {
      if (!alive || !cv) return;
      const show = showcase();
      if (!show || !wb || !hit.current) return setHitOn(false);
      if (ADDED.has(cv)) return;
      ADDED.add(cv);
      show.add({ canvas: cv, hit: hit.current, badge: wb.findBadge(id), onReady: () => setReady(true) });
    }, 10000);
    return () => {
      alive = false;
      /* the engine skips canvases with no width: once this one has left the page it stops being drawn */
      setTimeout(() => {
        if (cv && !cv.isConnected) cv.width = 0;
      }, 0);
    };
  }, [id]);
  return (
    <li className="slot slot--live">
      <div className={`art art--live${ready ? ' is-live' : ''}`}>
        <BImage it={x.it} lazy={false} />
        <canvas aria-hidden="true" ref={canvas} />
        {hitOn && <button className="live-hit" type="button" data-badge={id} aria-label={`${nameOf(x.it, c)}, your latest badge. Flip it over.`} ref={hit} />}
      </div>
      <Caption it={x.it} c={c}>
        <p className="slot-status slot-status--latest">
          <Svg src={B_SPARK} />
          Latest badge
        </p>
      </Caption>
    </li>
  );
}

function Next({ x, c }: { x: Slot; c: Cat }) {
  const { it, state, done, total, hint } = x;
  return (
    <li className={`slot slot--next${state === 'locked' ? ' is-locked' : ''}`}>
      <div className="art">
        <BImage it={it} />
      </div>
      <Caption it={it} c={c}>
        <div className="meter">
          <span className="bar" role="progressbar" aria-label={`${nameOf(it, c)} progress`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
            <span style={{ width: `${(done / total) * 100}%` }} />
          </span>
          <span className="count">
            {done}/{total}
          </span>
        </div>
        <p className="slot-status">
          {state === 'locked' && <Svg src={B_LOCK} />}
          {hint}
        </p>
      </Caption>
    </li>
  );
}

const Empty = () => (
  <li className="slot slot--empty" aria-hidden="true">
    <div className="art">
      <span className="ghost" />
    </div>
  </li>
);

const Done = ({ n }: { n: number }) => (
  <li className="slot slot--done">
    <div className="art">
      <span className="ghost ghost--done">
        <Svg src={B_CHECK} />
      </span>
    </div>
    <p className="slot-step">
      {n} of {n}
    </p>
    <h3 className="slot-name">Path complete</h3>
    <p className="slot-status">Every badge earned</p>
  </li>
);

function Row({ c }: { c: Cat }) {
  const items: Slot[] = c.items.filter((x: Item) => !x.card).map((it: Item) => ({ it, ...bState(it) }));
  const earned = items.filter((i) => i.state === 'earned').length,
    latest = items.map((i) => i.state).lastIndexOf('earned'),
    before = items[latest - 1],
    after = items[latest + 1];
  const slots =
    latest >= 0
      ? [
          before ? before.state === 'earned' ? <Past key={'p' + before.it.id} x={before} c={c} /> : <Next key={'n' + before.it.id} x={before} c={c} /> : <Empty key="e0" />,
          <Live key={'l' + items[latest].it.id} x={items[latest]} c={c} />,
          after ? <Next key={'n' + after.it.id} x={after} c={c} /> : <Done key="d" n={items.length} />,
        ]
      : [<Empty key="e0" />, <Next key={'n' + items[0].it.id} x={items[0]} c={c} />, items[1] ? <Next key={'n' + items[1].it.id} x={items[1]} c={c} /> : <Empty key="e2" />];
  const glow = latest >= 0 ? items[latest].it.glow : items[0].it.glow;
  return (
    <section className={`path${latest >= 0 ? ' has-live' : ''}`} style={css({ '--c': c.color, '--glow': glow })} aria-labelledby={`path-${c.id}`}>
      <header className="path-head">
        <h2 id={`path-${c.id}`}>
          <span className="dot" aria-hidden="true" />
          {c.name}
        </h2>
        <p className="path-progress">
          <span className="steps" aria-hidden="true">
            {items.map((i) => (
              <i key={i.it.id} className={i.state === 'earned' ? 'on' : undefined} />
            ))}
          </span>
          {earned} of {items.length} earned
        </p>
      </header>
      <ol className="slots">{slots}</ol>
    </section>
  );
}

export function BadgePaths() {
  return (
    <div className="paths">
      {CAT.map((c: Cat) => (
        <Row key={c.id} c={c} />
      ))}
    </div>
  );
}
