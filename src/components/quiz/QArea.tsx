'use client';
import { Fragment, useRef, useState, type DragEvent } from 'react';
import { chartData, chartSVG, SIM } from '@/lib/quiz-bank';
import { I } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { S } from '@/lib/progress';
import { quiz, shuffled, simState, simMinRange, type QuizState } from '@/lib/quiz-state';

const L = 'ABCD';
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/** sel / right / wrong (+ hint) for an answer button, as in the prototype. */
function optCls(QZ: QuizState, q: any, i: number, hint: boolean) {
  let c = '';
  if (QZ.locked) {
    if (i === q.a) c = 'right';
    else if (i === QZ.sel) c = 'wrong';
  } else if (i === QZ.sel) c = 'sel';
  return cx(c, hint && i === q.a && 'hint');
}
function qsel(i: number) {
  const QZ = quiz.get().QZ;
  if (!QZ || QZ.locked) return;
  QZ.sel = i;
  quiz.commit();
}

function Opts({ QZ, q, hint }: { QZ: QuizState; q: any; hint: boolean }) {
  return (
    <>
      {q.opts.map((o: string, i: number) => (
        <button key={i} className={cx('opt', optCls(QZ, q, i, hint))} onClick={() => qsel(i)} disabled={QZ.locked}>
          <span className="l">{L[i]}</span>
          <span>{o}</span>
        </button>
      ))}
    </>
  );
}

/* ---- sim: leverage and range over 7 days ---- */
function simSVG(QZ: QuizState) {
  const st = simState(QZ),
    W = 640,
    H = 280,
    P = 16,
    lo = Math.min(st.liq, st.e * (1 - st.w / 100), st.mn) * 0.985,
    hi = Math.max(st.e * (1 + st.w / 100), Math.max(...SIM)) * 1.01;
  const X = (i: number) => P + (i / (SIM.length - 1)) * (W - 2 * P - 70),
    Y = (v: number) => H - P - ((v - lo) / (hi - lo)) * (H - 2 * P);
  const path = SIM.map((v: number, i: number) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
  const top = st.e * (1 + st.w / 100),
    bot = st.e * (1 - st.w / 100),
    lab = (y: number, txt: string, c: string, bg: string) =>
      `<g transform="translate(${W - 80} ${y - 9})"><rect width="76" height="18" rx="4" fill="${bg}"/><text x="38" y="12.5" text-anchor="middle" font-family="Geist Mono,monospace" font-size="10" fill="${c}">${txt}</text></g>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Price over 7 days"><rect x="${P}" y="${Y(top)}" width="${W - 2 * P - 70}" height="${Y(bot) - Y(top)}" fill="rgba(158,211,255,.08)"/>
    <line x1="${P}" x2="${W - 84}" y1="${Y(top)}" y2="${Y(top)}" stroke="#9ED3FF" stroke-opacity=".7"/><line x1="${P}" x2="${W - 84}" y1="${Y(bot)}" y2="${Y(bot)}" stroke="#9ED3FF" stroke-opacity=".7"/>
    <line x1="${P}" x2="${W - 84}" y1="${Y(st.e)}" y2="${Y(st.e)}" stroke="#E2B65E" stroke-dasharray="3 4"/><line x1="${P}" x2="${W - 84}" y1="${Y(st.liq)}" y2="${Y(st.liq)}" stroke="#FF5A5F" stroke-dasharray="3 4"/>
    <path d="${path}" fill="none" stroke="#DCE9F7" stroke-width="1.5" stroke-linejoin="round"/>
    ${lab(Y(top), '$' + Math.round(top), '#9ED3FF', 'rgba(158,211,255,.12)')}${lab(Y(bot), '$' + Math.round(bot), '#9ED3FF', 'rgba(158,211,255,.12)')}${lab(Y(st.e), 'ENTRY', '#E2B65E', 'rgba(226,182,94,.12)')}${lab(Y(st.liq), 'LIQ $' + Math.round(st.liq), '#FF5A5F', 'rgba(255,90,95,.14)')}
    <text x="${P}" y="${H - 2}" font-family="Geist Mono,monospace" font-size="9.5" fill="rgba(255,255,255,.4)">DAY 1</text><text x="${W - 84}" y="${H - 2}" text-anchor="end" font-family="Geist Mono,monospace" font-size="9.5" fill="rgba(255,255,255,.4)">DAY 7</text></svg>`;
}
function SimStatus({ QZ }: { QZ: QuizState }) {
  const st = simState(QZ);
  return (
    <>
      <div>
        <span>LIQUIDATION</span>
        <b>${Math.round(st.liq).toLocaleString('en-US')}</b>
      </div>
      <div>
        <span>STATUS</span>
        <b className={st.safe ? 'ok' : 'no'}>{st.safe ? 'SAFE' : 'LIQUIDATED'}</b>
      </div>
      <div>
        <span>LOW</span>
        <b>${Math.round(st.mn).toLocaleString('en-US')}</b>
      </div>
      <div>
        <span>RANGE</span>
        <b className={st.inr ? 'ok' : 'no'}>{st.inr ? 'IN RANGE' : 'OUT OF RANGE'}</b>
      </div>
      <p>{st.safe && st.inr ? 'The position survives all 7 days.' : !st.safe ? 'The low drops below your liquidation price.' : 'The closing price is outside your range.'}</p>
    </>
  );
}
function Sim({ QZ, hint }: { QZ: QuizState; hint: boolean }) {
  const st = simState(QZ),
    lk = QZ.locked;
  const upd = (k: 'lev' | 'rng', v: string) => {
    QZ.sim[k] = +v;
    quiz.commit();
  };
  return (
    <div className="sim">
      <div className="plot">
        <Svg src={simSVG(QZ)} />
      </div>
      <div className="ctl">
        <span className="mono">Position settings</span>
        <div className="sl">
          <label htmlFor="simLev">
            Leverage <b id="simLevV">{st.lev.toFixed(1)}x</b>
          </label>
          <input id="simLev" type="range" min="1" max="10" step="0.5" value={st.lev} disabled={lk} onChange={(e) => upd('lev', e.target.value)} />
          <div className="rng">
            <span>1x</span>
            <span>10x</span>
          </div>
        </div>
        <div className="sl">
          <label htmlFor="simRng">
            Range width <b id="simRngV">±{st.w}%</b>
          </label>
          <input id="simRng" type="range" min="2" max="20" step="1" value={st.w} disabled={lk} onChange={(e) => upd('rng', e.target.value)} />
          <div className="rng">
            <span>±2%</span>
            <span>±20%</span>
          </div>
        </div>
        <div className="status" id="simStatus">
          <SimStatus QZ={QZ} />
        </div>
        {hint && (
          <p className="quiet" style={{ fontSize: 12 }}>
            Solution: leverage up to 5x, range at least ±{simMinRange()}%.
          </p>
        )}
      </div>
    </div>
  );
}

/* ---- order: drag and drop, or the arrow buttons ---- */
function Order({ QZ, q, hint }: { QZ: QuizState; q: any; hint: boolean }) {
  const lk = QZ.locked;
  if (!QZ.order) QZ.order = shuffled(q.items, QZ.i * 31 + 7); // deterministic, so safe during render
  const order = QZ.order;
  const from = useRef<number | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const omove = (p: number, d: number) => {
    const o = QZ.order!;
    [o[p], o[p + d]] = [o[p + d], o[p]];
    quiz.commit();
  };
  const dnd = (pos: number) =>
    lk
      ? {}
      : {
          onDragStart: (e: DragEvent<HTMLDivElement>) => {
            from.current = pos;
            setDrag(pos);
            e.dataTransfer.effectAllowed = 'move';
            try {
              e.dataTransfer.setData('text/plain', String(pos));
            } catch {}
          },
          onDragEnd: () => setDrag(null),
          onDragOver: (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setOver(pos);
          },
          onDragLeave: () => setOver((o) => (o === pos ? null : o)),
          onDrop: (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setOver(null);
            const f = from.current;
            if (f == null || f === pos) return;
            const o = QZ.order!,
              [it] = o.splice(f, 1);
            o.splice(pos, 0, it);
            from.current = null;
            setDrag(null);
            quiz.commit();
          },
        };
  return (
    <div className="order" id="order">
      {order.map((v, pos) => (
        <div key={v} className={cx('oi', lk && (v === pos ? 'right' : 'wrong'), drag === pos && 'drag', over === pos && 'over')} draggable={!lk} data-pos={pos} {...dnd(pos)}>
          <span className="grip" aria-hidden="true">
            <Svg src={I.grip} />
          </span>
          <span className="n">{pos + 1}</span>
          <span className="t">
            {q.items[v]}
            {hint && (
              <>
                {' '}
                <span className="quiet" style={{ fontSize: 12 }}>
                  → {v + 1}
                </span>
              </>
            )}
          </span>
          {lk ? (
            v === pos ? (
              <span style={{ color: 'var(--good)' }}>
                <Svg src={I.check} width="16" height="16" />
              </span>
            ) : (
              <span className="quiet" style={{ fontSize: 12 }}>
                correct: {v + 1}
              </span>
            )
          ) : (
            <span className="mv">
              <button onClick={() => omove(pos, -1)} aria-label="Move up" disabled={pos === 0}>
                <Svg src={I.up} />
              </button>
              <button onClick={() => omove(pos, 1)} aria-label="Move down" disabled={pos === order.length - 1}>
                <Svg src={I.down} />
              </button>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/** The answer area for every question type: choice, chart, flow, order, sim. */
export function QArea({ QZ, q }: { QZ: QuizState; q: any }) {
  const lk = QZ.locked,
    hint = S.hint && !lk;
  if (q.t === 'choice')
    return (
      <div className="opts">
        <Opts QZ={QZ} q={q} hint={hint} />
      </div>
    );
  if (q.t === 'chart') {
    const d = chartData(q);
    return (
      <div className="charts">
        {d.bands.map((b: number[], i: number) => (
          <button key={i} className={cx('ccard', optCls(QZ, q, i, hint))} onClick={() => qsel(i)} disabled={lk}>
            <Svg src={chartSVG(d, b)} />
            <span className="cl">
              <span className="l">{L[i]}</span>Position {L[i]}
            </span>
          </button>
        ))}
      </div>
    );
  }
  if (q.t === 'flow') {
    const ch = QZ.sel;
    return (
      <>
        <div className="flow">
          {q.steps.map((s: string | null, i: number) => (
            <Fragment key={i}>
              {i ? <span className="farrow" /> : null}
              {s ? (
                <div className="fstep">{s}</div>
              ) : (
                <div className={cx('fstep slot', ch != null && 'filled', lk && (ch === q.a ? 'right' : 'wrong'))}>{ch != null ? q.opts[ch] : '?'}</div>
              )}
            </Fragment>
          ))}
        </div>
        <div className="fopts">
          <Opts QZ={QZ} q={q} hint={hint} />
        </div>
      </>
    );
  }
  if (q.t === 'order') return <Order key={QZ.i} QZ={QZ} q={q} hint={hint} />;
  if (q.t === 'sim') return <Sim QZ={QZ} hint={hint} />;
  return null;
}
