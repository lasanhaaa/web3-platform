'use client';
/* The answer area of every quiz question. Figma has five types (choice, chart, flow, order, sim); felipe asked on
   Oct 15 for quizzes that are fun like Duolingo and still teach trading, so four more were added (match, fill,
   safe or scam, predict the trade) and the harder ones became tap-only: order is tapped into place instead of dragged,
   and the 7-day sim plays out after Check. */
import { Fragment, useSyncExternalStore } from 'react';
import { chartData, chartSVG, predictData, SIM } from '@/lib/quiz-bank';
import { I } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { S } from '@/lib/progress';
import { sfx } from '@/lib/sfx';
import { quiz, shuffled, simState, simMinRange, type QuizState } from '@/lib/quiz-state';

const L = 'ABCD';
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const usd = (v: number) => '$' + Math.round(v).toLocaleString('en-US');
const SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6z"/><path d="m9 12 2 2 4-4"/></svg>';
const WARN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>';
const WALLET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a1 1 0 0 1 1 1v4h-4a2 2 0 0 0 0 4h4v3a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5"/></svg>';
export const HAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.8-2.4L3.6 15.4a1.6 1.6 0 0 1 2.4-2.1L9 15"/></svg>';

/** Phones get charts drawn for a narrow box, so their labels stay readable. */
const NARROW = '(max-width: 600px)';
const subNarrow = (f: () => void) => {
  const m = matchMedia(NARROW);
  m.addEventListener('change', f);
  return () => m.removeEventListener('change', f);
};
const useNarrow = () => useSyncExternalStore(subNarrow, () => matchMedia(NARROW).matches, () => false);

/** sel / right / wrong (+ hint) for an answer button, as in the prototype. */
function optCls(QZ: QuizState, q: any, i: number, hint: boolean) {
  let c = '';
  if (QZ.locked && !QZ.anim) {
    if (i === q.a) c = 'right';
    else if (i === QZ.sel) c = 'wrong';
  } else if (i === QZ.sel) c = 'sel';
  return cx(c, hint && i === q.a && 'hint');
}
function qsel(i: number) {
  const QZ = quiz.get().QZ;
  if (!QZ || QZ.locked) return;
  if (QZ.sel !== i) sfx('tap');
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

/* ---- sim: leverage and range, then the 7 days play out ---- */
function simSVG(QZ: QuizState, narrow: boolean) {
  const st = simState(QZ),
    W = narrow ? 380 : 640,
    H = narrow ? 260 : 280,
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
  const play = QZ.locked && !QZ.skipped;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Price over 7 days"><rect x="${P}" y="${Y(top)}" width="${W - 2 * P - 70}" height="${Y(bot) - Y(top)}" fill="rgba(158,211,255,.08)"/>
    <line x1="${P}" x2="${W - 84}" y1="${Y(top)}" y2="${Y(top)}" stroke="#9ED3FF" stroke-opacity=".7"/><line x1="${P}" x2="${W - 84}" y1="${Y(bot)}" y2="${Y(bot)}" stroke="#9ED3FF" stroke-opacity=".7"/>
    <line x1="${P}" x2="${W - 84}" y1="${Y(st.e)}" y2="${Y(st.e)}" stroke="#E2B65E" stroke-dasharray="3 4"/><line class="liq${play && !st.safe ? ' hit' : ''}" x1="${P}" x2="${W - 84}" y1="${Y(st.liq)}" y2="${Y(st.liq)}" stroke="#FF5A5F" stroke-dasharray="3 4"/>
    <path d="${path}" fill="none" stroke="#DCE9F7" stroke-opacity="${play ? '.18' : '.9'}" stroke-width="1.5" stroke-linejoin="round"/>
    ${play ? `<path class="draw" pathLength="1" d="${path}" fill="none" stroke="${st.safe && st.inr ? '#9EFFA2' : '#FF6161'}" stroke-width="2" stroke-linejoin="round"/>` : ''}
    ${lab(Y(top), '$' + Math.round(top), '#9ED3FF', 'rgba(158,211,255,.12)')}${lab(Y(bot), '$' + Math.round(bot), '#9ED3FF', 'rgba(158,211,255,.12)')}${lab(Y(st.e), 'ENTRY', '#E2B65E', 'rgba(226,182,94,.12)')}${lab(Y(st.liq), 'LIQ $' + Math.round(st.liq), '#FF5A5F', 'rgba(255,90,95,.14)')}
    <text x="${P}" y="${H - 2}" font-family="Geist Mono,monospace" font-size="9.5" fill="rgba(255,255,255,.4)">DAY 1</text><text x="${W - 84}" y="${H - 2}" text-anchor="end" font-family="Geist Mono,monospace" font-size="9.5" fill="rgba(255,255,255,.4)">DAY 7</text></svg>`;
}
function Sim({ QZ, hint }: { QZ: QuizState; hint: boolean }) {
  const st = simState(QZ),
    lk = QZ.locked,
    narrow = useNarrow();
  const upd = (k: 'lev' | 'rng', v: string) => {
    QZ.sim[k] = +v;
    quiz.commit();
  };
  const dayHit = Math.max(1, Math.ceil((SIM.findIndex((v: number) => v <= st.liq) / (SIM.length - 1)) * 7));
  const res = !lk || QZ.anim || QZ.skipped ? null : !st.safe ? `Liquidated on day ${dayHit}` : !st.inr ? 'Survived, but closed out of range' : 'Survived all 7 days';
  return (
    <div className={cx('sim', lk && !QZ.skipped && 'played')}>
      <div className="plot">
        <Svg src={simSVG(QZ, narrow)} />
      </div>
      <div className="ctl">
        <span className="mono">Position settings</span>
        <div className="sl">
          <label htmlFor="simLev">
            Leverage <b id="simLevV">{st.lev.toFixed(1)}x</b>
          </label>
          <input id="simLev" type="range" min="1" max="10" step="0.5" value={st.lev} disabled={lk} onChange={(e) => upd('lev', e.target.value)} />
          <div className="rng">
            <span>1x · safer</span>
            <span>10x · riskier</span>
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
        <div className="sim-out">
          <div className="sim-liq">
            <span>Liquidation price</span>
            <b className="tnum">{usd(st.liq)}</b>
          </div>
          {res ? (
            <p className={cx('res', st.safe && st.inr ? 'ok' : 'no')}>
              <Svg src={st.safe && st.inr ? I.check : I.x} />
              {res}
            </p>
          ) : (
            <p className="tip">{QZ.anim ? 'Playing the 7 days…' : 'Keep the red line below the lowest point, and the last price inside the blue band.'}</p>
          )}
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

/* ---- order: tap the steps into numbered slots, tap a placed step to take it back ---- */
function Order({ QZ, q, hint }: { QZ: QuizState; q: any; hint: boolean }) {
  const lk = QZ.locked;
  if (!QZ.order) QZ.order = []; // placed steps, filled from slot 1
  const placed = QZ.order;
  const pool = shuffled(q.items, QZ.i * 31 + 7).filter((v) => !placed.includes(v));
  const put = (v: number) => {
    if (lk) return;
    placed.push(v);
    sfx('tap');
    quiz.commit();
  };
  const take = (pos: number) => {
    if (lk) return;
    placed.splice(pos, 1);
    quiz.commit();
  };
  return (
    <div className="ord">
      <ol className="ord-slots">
        {q.items.map((_: string, pos: number) => {
          const v = placed[pos];
          return (
            <li key={pos} className={cx('ord-slot', v != null && 'on', pos === placed.length && !lk && 'next', lk && (v === pos ? 'right' : 'wrong'))}>
              <span className="n">{pos + 1}</span>
              {v != null ? (
                <button className="ord-item" onClick={() => take(pos)} disabled={lk} aria-label={`Step ${pos + 1}: ${q.items[v]}. Tap to take it back.`}>
                  <span>{q.items[v]}</span>
                  {lk ? v === pos ? <Svg src={I.check} /> : <small>Right: {q.items[pos]}</small> : <Svg src={I.x} />}
                </button>
              ) : (
                <span className="ord-empty">{pos === placed.length ? (pos ? 'Tap the next step' : 'Tap the first step') : ''}</span>
              )}
            </li>
          );
        })}
      </ol>
      {!lk && pool.length > 0 && (
        <div className="tiles" role="group" aria-label="Steps to place">
          {pool.map((v) => (
            <button key={v} className="tile" onClick={() => put(v)}>
              {q.items[v]}
              {hint && <small className="quiet"> → {v + 1}</small>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- match: tap a word, then its meaning; finishes by itself when all pairs are found ---- */
function Match({ QZ, q, onAuto }: { QZ: QuizState; q: any; onAuto: () => void }) {
  const mt = QZ.mt,
    lk = QZ.locked;
  const right = shuffled(q.pairs, QZ.i * 17 + 3);
  const tap = (side: 'l' | 'r', i: number) => {
    if (lk || mt.done.includes(i) || mt.bad) return;
    mt[side] = mt[side] === i ? null : i;
    if (mt.l != null && mt.r != null) {
      if (mt.l === mt.r) {
        mt.done.push(mt.l);
        mt.l = mt.r = null;
        sfx('match');
        if (mt.done.length === q.pairs.length) setTimeout(onAuto, 450);
      } else {
        mt.bad = [mt.l, mt.r];
        mt.miss++;
        setTimeout(() => {
          mt.bad = null;
          mt.l = mt.r = null;
          quiz.commit();
        }, 700);
      }
    } else sfx('tap');
    quiz.commit();
  };
  const cls = (side: 'l' | 'r', i: number) =>
    cx('mtc', mt.done.includes(i) && 'done', mt[side] === i && !mt.bad && 'sel', mt.bad && mt.bad[side === 'l' ? 0 : 1] === i && 'bad');
  return (
    <div className="match">
      <div className="col">
        {q.pairs.map((p: string[], i: number) => (
          <button key={i} className={cls('l', i) + ' term'} onClick={() => tap('l', i)} disabled={lk || mt.done.includes(i)}>
            {p[0]}
          </button>
        ))}
      </div>
      <div className="col">
        {right.map((i) => (
          <button key={i} className={cls('r', i)} onClick={() => tap('r', i)} disabled={lk || mt.done.includes(i)}>
            {q.pairs[i][1]}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- fill: tap word tiles into the blanks of a sentence ---- */
function Fill({ QZ, q, hint }: { QZ: QuizState; q: any; hint: boolean }) {
  const lk = QZ.locked;
  if (QZ.fl.length !== q.a.length) QZ.fl = q.a.map(() => null);
  const fl = QZ.fl,
    parts = q.text.split('___');
  const put = (b: number) => {
    const k = fl.indexOf(null);
    if (lk || k < 0 || fl.includes(b)) return;
    fl[k] = b;
    sfx('tap');
    quiz.commit();
  };
  const take = (k: number) => {
    if (lk || fl[k] == null) return;
    fl[k] = null;
    quiz.commit();
  };
  return (
    <div className="fill">
      <p className="fill-s">
        {parts.map((t: string, k: number) => (
          <Fragment key={k}>
            {t}
            {k < parts.length - 1 && (
              <span className="blank-w">
                <button
                  className={cx('blank', fl[k] != null && 'on', fl.indexOf(null) === k && !lk && 'next', lk && (q.bank[fl[k] as number] === q.a[k] ? 'right' : 'wrong'))}
                  onClick={() => take(k)}
                  disabled={lk || fl[k] == null}
                  aria-label={fl[k] != null ? `${q.bank[fl[k] as number]}. Tap to take it back.` : `Gap ${k + 1}`}
                >
                  {fl[k] != null ? q.bank[fl[k] as number] : ' '}
                </button>
                {lk && q.bank[fl[k] as number] !== q.a[k] && <small className="fix">{q.a[k]}</small>}
              </span>
            )}
          </Fragment>
        ))}
      </p>
      <div className="tiles" role="group" aria-label="Words">
        {q.bank.map((w: string, b: number) => (
          <button key={b} className={cx('tile', fl.includes(b) && 'used', hint && q.a.includes(w) && 'hint')} onClick={() => put(b)} disabled={lk || fl.includes(b)}>
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- safe or scam: a message or wallet request, then two big buttons ---- */
function Scam({ QZ, q, hint }: { QZ: QuizState; q: any; hint: boolean }) {
  const c = q.card;
  return (
    <div className="scam">
      <div className={cx('scam-card', c.kind)}>
        {c.kind === 'dm' ? (
          <>
            <div className="sc-h">
              <span className="av" aria-hidden>
                {c.from[0]}
              </span>
              <div>
                <b>{c.from}</b>
                <small>{c.handle}</small>
              </div>
              <span className="tm">now</span>
            </div>
            <p className="sc-msg">{c.text}</p>
          </>
        ) : (
          <>
            <div className="sc-h">
              <span className="av w" aria-hidden>
                <Svg src={WALLET} />
              </span>
              <div>
                <b>{c.title}</b>
                <small>{c.from}</small>
              </div>
            </div>
            <p className="sc-big">{c.text}</p>
            <p className="sc-meta">{c.meta}</p>
            <div className="sc-fake" aria-hidden>
              <span>Reject</span>
              <span>Approve</span>
            </div>
          </>
        )}
      </div>
      <div className="scam-opts">
        {q.opts.map((o: string, i: number) => (
          <button key={i} className={cx('sbtn', i ? 'is-scam' : 'is-safe', optCls(QZ, q, i, hint))} onClick={() => qsel(i)} disabled={QZ.locked}>
            <Svg src={i ? WARN : SHIELD} />
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- predict: a trade ticket and the chart so far; after Check the chart plays out ---- */
function predictSVG(QZ: QuizState, q: any, narrow: boolean) {
  const d = predictData(q),
    W = narrow ? 380 : 640,
    H = narrow ? 230 : 200,
    P = 14,
    R = 96,
    lo = d.mn - (d.mx - d.mn) * 0.12,
    hi = d.mx + (d.mx - d.mn) * 0.12;
  const X = (i: number) => P + (i / (d.n - 1)) * (W - P - R),
    Y = (v: number) => H - P - ((v - lo) / (hi - lo)) * (H - 2 * P);
  const n1 = d.past.length;
  const past = d.past.map((v: number, i: number) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
  const fut = 'M' + X(n1 - 1).toFixed(1) + ' ' + Y(q.entry).toFixed(1) + d.fut.map((v: number, i: number) => 'L' + X(n1 + i).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
  const play = QZ.locked && !QZ.skipped,
    end = d.fut[d.fut.length - 1],
    ex = X(n1 + d.fut.length - 1),
    ok = q.tone === 'ok',
    col = ok ? '#9EFFA2' : '#FF6161';
  const lab = (y: number, txt: string, c: string, bg: string) =>
    `<g transform="translate(${W - R + 10} ${y - 10})"><rect width="${R - 14}" height="20" rx="4" fill="${bg}"/><text x="${(R - 14) / 2}" y="14" text-anchor="middle" font-family="Geist Mono,monospace" font-size="10.5" fill="${c}">${txt}</text></g>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="ETH price before${play ? ' and after' : ''} the trade">
    <line x1="${P}" x2="${W - R}" y1="${Y(q.entry)}" y2="${Y(q.entry)}" stroke="#E2B65E" stroke-dasharray="3 4"/>
    ${q.liq != null ? `<line class="liq${play && d.hit >= 0 ? ' hit' : ''}" x1="${P}" x2="${W - R}" y1="${Y(q.liq)}" y2="${Y(q.liq)}" stroke="#FF5A5F" stroke-dasharray="3 4"/>` : ''}
    <path d="${past}" fill="none" stroke="#DCE9F7" stroke-width="1.8" stroke-linejoin="round"/>
    ${play ? `<path class="draw" pathLength="1" d="${fut}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round"/><g class="pend"><circle cx="${ex}" cy="${Y(end)}" r="5" fill="${col}"/><circle cx="${ex}" cy="${Y(end)}" r="11" fill="${col}" fill-opacity=".2"/></g>` : `<rect x="${X(n1 - 1) + 6}" y="${P}" width="${X(d.n - 1) - X(n1 - 1) - 6}" height="${H - 2 * P}" rx="6" fill="rgba(255,255,255,.03)"/><text x="${(X(n1 - 1) + X(d.n - 1)) / 2 + 3}" y="${H / 2 + 8}" text-anchor="middle" font-family="Geist,sans-serif" font-size="26" fill="rgba(255,255,255,.35)">?</text><circle class="pulse" cx="${X(n1 - 1)}" cy="${Y(q.entry)}" r="5" fill="#E2B65E"/>`}
    ${lab(Y(q.entry), 'ENTRY ' + usd(q.entry), '#E2B65E', 'rgba(226,182,94,.12)')}
    ${q.liq != null ? lab(Y(q.liq), 'LIQ ' + usd(q.liq), '#FF5A5F', 'rgba(255,90,95,.14)') : ''}
    ${play ? `<g class="pend">${lab(Math.min(Math.max(Y(end), 22), H - 22) + (q.liq != null && Math.abs(Y(end) - Y(q.liq)) < 22 ? (Y(end) < Y(q.liq) ? -24 : 24) : 0), q.result.toUpperCase(), col, ok ? 'rgba(158,255,162,.14)' : 'rgba(255,97,97,.16)')}</g>` : ''}
    <text x="${P}" y="${H - 2}" font-family="Geist Mono,monospace" font-size="9.5" fill="rgba(255,255,255,.4)">BEFORE</text><text x="${X(n1 - 1)}" y="${H - 2}" text-anchor="middle" font-family="Geist Mono,monospace" font-size="9.5" fill="rgba(255,255,255,.4)">YOU TRADE</text></svg>`;
}
function Predict({ QZ, q, hint }: { QZ: QuizState; q: any; hint: boolean }) {
  const narrow = useNarrow();
  return (
    <div className="pred">
      <div className="ticket">
        {q.ticket.map(([k, v, t]: string[]) => (
          <div key={k}>
            <span>{k}</span>
            <b className={t}>{v}</b>
          </div>
        ))}
      </div>
      <div className="plot">
        <Svg src={predictSVG(QZ, q, narrow)} />
      </div>
      <div className="opts">
        <Opts QZ={QZ} q={q} hint={hint} />
      </div>
    </div>
  );
}

/** The answer area for every question type. onAuto: a match question finished by itself. */
export function QArea({ QZ, q, onAuto }: { QZ: QuizState; q: any; onAuto: () => void }) {
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
  if (q.t === 'match') return <Match key={QZ.i} QZ={QZ} q={q} onAuto={onAuto} />;
  if (q.t === 'fill') return <Fill key={QZ.i} QZ={QZ} q={q} hint={hint} />;
  if (q.t === 'scam') return <Scam QZ={QZ} q={q} hint={hint} />;
  if (q.t === 'predict') return <Predict QZ={QZ} q={q} hint={hint} />;
  return null;
}
