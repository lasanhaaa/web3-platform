'use client';
/* A coin's price chart inside Wega's answers (client feedback, Oct 15, after Decade's asset card): ticker, price and
   change, period tabs, a line chart with the member's own levels on it (liquidation price, LP range, a scenario),
   the period's biggest one-day drop as a point of attention, and a comparison with another coin. Sample prices. */
import { useId, useMemo, useState, type CSSProperties } from 'react';
import { PF } from '@/lib/portfolio';
import { COINS, PERIODS, change, fmtAxis, fmtDay, fmtPct, fmtPrice, lowest, price, slice, worstDay, type Period, type Pt, type Sym } from '@/lib/prices';
import { ETH_EXP, LIQ, NET, exposure } from '@/lib/wega-page';
import { GLYPH } from '@/lib/strategies';
import { toast } from '@/lib/toast';
import { Svg } from '@/lib/svg';
import { Answer, AskLink, CHEV, Icon } from './parts';

const COIN_BG: Record<Sym, string> = { eth: '#627EEA', btc: '#F7931A', arb: '#213147', usdc: 'transparent' };
export function CoinMark({ s, size = 32 }: { s: Sym; size?: number }) {
  return (
    <span className={'ac-mark is-' + s} style={{ width: size, height: size, background: COIN_BG[s] } as CSSProperties} aria-hidden>
      {s === 'eth' || s === 'usdc' ? <Svg src={GLYPH[s]} /> : s === 'btc' ? '₿' : <b>A</b>}
    </span>
  );
}

/** Round steps for the price axis (1, 2 or 5 × 10ⁿ). */
function ticks(lo: number, hi: number, n = 3) {
  const raw = (hi - lo) / n,
    mag = 10 ** Math.floor(Math.log10(raw)),
    step = [1, 2, 5, 10].map((k) => k * mag).find((s) => s >= raw)!;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(+v.toFixed(10));
  return out;
}
const axisPrice = (s: Sym, v: number) =>
  s === 'usdc' ? '$' + v.toFixed(2) : v >= 10000 ? '$' + Math.round(v / 1000) + 'k' : v >= 100 ? '$' + Math.round(v).toLocaleString('en-US') : '$' + v.toFixed(2);

type Props = {
  sym: Sym;
  /** a second coin: both lines are drawn as % change from the start of the period */
  vs?: Sym;
  init?: Period;
  /** a scenario price drawn as a dashed line (the slider of a simulation) */
  mark?: number;
  /** inside another card (a simulation): no comparison row */
  compact?: boolean;
};

export function AssetChart({ sym, vs, init = '1Y', mark, compact }: Props) {
  const [per, setPer] = useState<Period>(init);
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const c = COINS[sym];
  const mine = sym === 'eth' && !vs;

  const D = useMemo(() => {
    let a = slice(sym, per),
      b = vs ? slice(vs, per) : [];
    if (vs) {
      const t0 = Math.max(a[0].t, b[0].t);
      a = a.filter((x) => x.t >= t0);
      b = b.filter((x) => x.t >= t0);
    }
    /* fewer points to draw: every nth day in a comparison (both lines stay aligned), otherwise each stretch's low
       and high, so a one-day spike like the USDC depeg isn't dropped */
    const step = Math.max(1, Math.ceil(a.length / (vs ? 220 : 180)));
    const every = (arr: Pt[]) => arr.filter((_, i) => i % step === 0 || i === arr.length - 1);
    const extremes = (arr: Pt[]) => {
      if (step === 1) return arr;
      const out: Pt[] = [];
      for (let i = 0; i < arr.length; i += step) {
        const seg = arr.slice(i, i + step);
        let mn = seg[0],
          mx = seg[0];
        for (const x of seg) {
          if (x.p < mn.p) mn = x;
          if (x.p > mx.p) mx = x;
        }
        out.push(...(mn === mx ? [mn] : mn.t < mx.t ? [mn, mx] : [mx, mn]));
      }
      if (out[out.length - 1] !== arr[arr.length - 1]) out.push(arr[arr.length - 1]);
      return out;
    };
    const A = vs ? every(a) : extremes(a),
      B = every(b);
    /* in a comparison, both coins as % change from the first day */
    const va = vs ? A.map((x) => x.p / a[0].p - 1) : A.map((x) => x.p),
      vb = B.map((x) => x.p / b[0].p - 1);
    const levels = mine ? [LIQ, PF.lpLo, PF.lpHi] : [];
    if (mark != null && !vs) levels.push(mark);
    const all = [...va, ...vb, ...levels];
    let lo = Math.min(...all),
      hi = Math.max(...all);
    if (sym === 'usdc' && !vs) {
      lo = Math.min(lo, 0.99);
      hi = Math.max(hi, 1.01);
    }
    const pad = (hi - lo) * 0.08;
    lo -= pad;
    hi += pad;
    const t0 = A[0].t,
      t1 = A[A.length - 1].t;
    /* the point of attention: the biggest one-day drop, or for a stablecoin its lowest price */
    const w = sym === 'usdc' ? lowest(sym, per) : null,
      wd = vs || sym === 'usdc' ? null : worstDay(sym, per),
      dd = wd ? slice(sym, per) : [];
    const point = w
      ? w.p < 0.995
        ? { t: w.t, p: w.p, text: `Lowest price: ${fmtPrice(sym, w.p)} on ${fmtDay(w.t, true)}` }
        : null
      : wd && wd.chg < -0.004
        ? { t: wd.t, p: dd[wd.i].p, text: `Biggest one-day drop: ${fmtPct(wd.chg)} on ${fmtDay(wd.t, per === '5Y')}` }
        : null;
    return { A, B, va, vb, lo, hi, t0, t1, chg: vs ? va[va.length - 1] : change(sym, per), chgB: vs ? vb[vb.length - 1] : 0, point };
  }, [sym, vs, per, mark, mine]);

  const X = (t: number) => ((t - D.t0) / (D.t1 - D.t0 || 1)) * 100,
    Y = (v: number) => (1 - (v - D.lo) / (D.hi - D.lo)) * 100;
  const path = (ts: { t: number }[], vs_: number[]) => vs_.map((v, i) => `${i ? 'L' : 'M'}${(X(ts[i].t) * 10).toFixed(1)} ${(Y(v) * 3).toFixed(1)}`).join('');
  const lineA = path(D.A, D.va),
    lineB = vs ? path(D.B, D.vb) : '';
  const up = D.chg >= 0;
  const yt = vs ? ticks(D.lo, D.hi, 4).map((v) => ({ v, l: fmtPct(v, 0) })) : ticks(D.lo, D.hi, 4).map((v) => ({ v, l: axisPrice(sym, v) }));
  const xt = [0, 0.33, 0.66, 1].map((f) => D.A[Math.round(f * (D.A.length - 1))]);
  const h = hover != null ? { a: D.A[hover], v: D.va[hover], b: vs ? D.vb[hover] : null } : null;
  const fmtV = (v: number) => (vs ? fmtPct(v) : fmtPrice(sym, v));

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect(),
      f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      t = D.t0 + f * (D.t1 - D.t0);
    let best = 0;
    for (let i = 1; i < D.A.length; i++) if (Math.abs(D.A[i].t - t) < Math.abs(D.A[best].t - t)) best = i;
    setHover(best);
  };
  const label = vs
    ? `${c.sym} ${fmtPct(D.chg)} and ${COINS[vs].sym} ${fmtPct(D.chgB)} over ${per}`
    : `${c.name} price over ${per}: from ${fmtPrice(sym, D.A[0].p)} to ${fmtPrice(sym, price(sym))}, ${fmtPct(D.chg)}`;

  return (
    <section className={'wp-card ac' + (compact ? ' compact' : '')} aria-label={`${c.name} chart`}>
      <div className="ac-top">
        <span className="ac-id">
          <CoinMark s={sym} />
          <span>
            <b>{vs ? `${c.sym} and ${COINS[vs].sym}` : c.sym}</b>
            <small>{vs ? 'Change over the period' : c.name}</small>
          </span>
        </span>
        <span className="ac-now">
          {vs ? (
            <>
              <b className={'tnum ' + (D.chg >= 0 ? 'ok' : 'bad')}>
                {c.sym} {fmtPct(D.chg)}
              </b>
              <small className="tnum">
                {COINS[vs].sym} {fmtPct(D.chgB)}
              </small>
            </>
          ) : (
            <>
              <b className="tnum">{fmtPrice(sym, price(sym))}</b>
              <small className={'tnum ' + (up ? 'ok' : 'bad')}>
                {fmtPct(D.chg)} <span>{per === 'YTD' ? 'this year' : per === '1M' ? 'in 1 month' : per === '1Y' ? 'in 1 year' : sym === 'arb' ? 'since launch' : 'in 5 years'}</span>
              </small>
            </>
          )}
        </span>
      </div>
      <div className="ac-tabs" role="tablist" aria-label="Period">
        {PERIODS.map((p) => (
          <button key={p} role="tab" aria-selected={p === per} className={p === per ? 'on' : undefined} onClick={() => setPer(p)}>
            {p}
          </button>
        ))}
      </div>

      <div className="ac-plot" role="img" aria-label={label} onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHover(null)}>
        {yt.map((t) => (
          <span key={t.v} className="ac-grid" style={{ top: Y(t.v) + '%' }}>
            <span>{t.l}</span>
          </span>
        ))}
        {mine && (
          <>
            <i className="ac-band" style={{ top: Y(PF.lpHi) + '%', height: Y(PF.lpLo) - Y(PF.lpHi) + '%' }} />
            <i className="ac-lvl liq" style={{ top: Y(LIQ) + '%' }}>
              <span>Your liquidation price {fmtPrice('eth', LIQ)}</span>
            </i>
          </>
        )}
        {mark != null && !vs && (
          <i className="ac-lvl mark" style={{ top: Y(mark) + '%' }}>
            <span>Scenario {fmtPrice(sym, mark)}</span>
          </i>
        )}
        <svg viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={vs ? '#9ED3FF' : up ? '#8EFF99' : '#FF6161'} stopOpacity=".22" />
              <stop offset="1" stopColor={vs ? '#9ED3FF' : up ? '#8EFF99' : '#FF6161'} stopOpacity="0" />
            </linearGradient>
          </defs>
          {!vs && <path d={`${lineA}L1000 300L0 300Z`} fill={`url(#${gid})`} />}
          {vs && <path d={lineB} className="ac-l b" vectorEffect="non-scaling-stroke" />}
          <path d={lineA} className={'ac-l ' + (vs ? 'a' : up ? 'up' : 'down')} vectorEffect="non-scaling-stroke" />
        </svg>
        {D.point && <i className="ac-dot warn" style={{ left: X(D.point.t) + '%', top: Y(D.point.p) + '%' }} title={D.point.text} />}
        {h && (
          <>
            <i className="ac-x" style={{ left: X(h.a.t) + '%' }} />
            <i className="ac-dot now" style={{ left: X(h.a.t) + '%', top: Y(h.v) + '%' }} />
            {h.b != null && <i className="ac-dot now b" style={{ left: X(h.a.t) + '%', top: Y(h.b) + '%' }} />}
            <span className={'ac-tip' + (X(h.a.t) > 60 ? ' left' : '')} style={{ left: X(h.a.t) + '%' }}>
              <small>{fmtDay(h.a.t, true)}</small>
              <b className="tnum">
                {vs && c.sym + ' '}
                {fmtV(h.v)}
              </b>
              {h.b != null && (
                <b className="tnum b">
                  {COINS[vs!].sym} {fmtV(h.b)}
                </b>
              )}
            </span>
          </>
        )}
      </div>
      <div className="ac-xax" aria-hidden>
        {xt.map((p, i) => (
          <span key={i}>{fmtAxis(p.t, per)}</span>
        ))}
      </div>

      <ul className="ac-legend" aria-label="Points of attention">
        {vs ? (
          <>
            <li>
              <i className="sw a" />
              {c.name}
            </li>
            <li>
              <i className="sw b" />
              {COINS[vs].name}
            </li>
          </>
        ) : (
          <>
            {D.point && (
              <li>
                <i className="dot" />
                {D.point.text}
              </li>
            )}
            {mine && (
              <>
                <li>
                  <i className="sw liq" />
                  Your liquidation price
                </li>
                <li>
                  <i className="sw band" />
                  Your LP range
                </li>
              </>
            )}
            {mark != null && (
              <li>
                <i className="sw mark" />
                Scenario
              </li>
            )}
          </>
        )}
      </ul>

      {!compact && <Foot sym={sym} vs={vs} />}
    </section>
  );
}

/** Decade's "Open asset comparison" row. */
function Foot({ sym, vs }: { sym: Sym; vs?: Sym }) {
  if (sym === 'usdc')
    return (
      <button className="ac-foot" onClick={() => toast('This opens the Depeg Tracker in Tools. It isn’t part of the prototype.')}>
        <span>Open the Depeg Tracker</span>
        <Icon d={CHEV} size={18} />
      </button>
    );
  const other: Sym = vs ? (vs === 'btc' ? 'arb' : 'btc') : sym === 'btc' ? 'eth' : 'btc';
  return (
    <AskLink className="ac-foot" href={`/wega/asset?a=${sym}&vs=${other}`}>
      <span>
        Compare {COINS[sym].sym} with {COINS[other].name}
      </span>
      <Icon d={CHEV} size={18} />
    </AskLink>
  );
}

/* ---------- "How is ETH doing?" ---------- */
export function AssetAnswer({ a, vs }: { a: Sym; vs?: Sym }) {
  const c = COINS[a],
    p = fmtPrice(a, price(a)),
    m = fmtPct(change(a, '1M')),
    y = fmtPct(change(a, '1Y')),
    ex = exposure();
  const share = (id: string) => ex.find((x) => x.id === id)?.pct ?? 0;
  const ethPct = Math.round((ETH_EXP / NET) * 100);
  let lead: React.ReactNode, next: { href: string; label: string } | null, init: Period;
  if (vs) {
    const ca = change(a, '1Y'),
      cb = change(vs, '1Y');
    init = '1Y';
    lead = (
      <p>
        Over the last year, {c.sym} is <b>{fmtPct(ca)}</b> and {COINS[vs].name} is <b>{fmtPct(cb)}</b>.{' '}
        {a === 'eth' || vs === 'eth' ? (
          <>
            ETH usually swings more than Bitcoin, up and down. That matters for you because about <b>{ethPct}%</b> of your money moves with ETH.
          </>
        ) : (
          <>Smaller coins like ARB usually swing more than Bitcoin and ETH, in both directions.</>
        )}
      </p>
    );
    next = { href: '/wega/asset?a=' + a, label: `How is ${c.sym} doing?` };
  } else if (a === 'eth') {
    init = '1Y';
    lead = (
      <p>
        ETH is at <b>{p}</b>: <b>{m}</b> in the last month and <b>{y}</b> over the last year. About <b>{ethPct}%</b> of your money moves with it: the 1.1 ETH in your wallet, the 2 ETH on Aave and half of your LP. The
        lines on the chart are yours: Aave liquidates part of your ETH at <b>{fmtPrice('eth', LIQ)}</b>, and your LP earns fees between <b>$2,900</b> and <b>$3,400</b>.
      </p>
    );
    next = { href: '/wega/scenario?s=eth30', label: 'What if ETH drops 30%?' };
  } else if (a === 'btc') {
    init = '1Y';
    lead = (
      <p>
        Bitcoin is at <b>{p}</b>: <b>{m}</b> in the last month and <b>{y}</b> over the last year. You don’t hold Bitcoin in your snapshot. The model portfolio only uses it in hedged trades, where a long and a short
        cancel the price out (Perp DEX Airdrops).
      </p>
    );
    next = { href: '/wega/asset?a=eth&vs=btc', label: 'Compare ETH with Bitcoin' };
  } else if (a === 'arb') {
    init = '1Y';
    lead = (
      <p>
        ARB is at <b>{p}</b>: <b>{m}</b> in the last month and <b>{y}</b> over the last year. Your 1,500 ARB are worth <b>${Math.round(PF.arb * PF.arbP).toLocaleString('en-US')}</b>, about <b>{share('arb')}%</b> of
        your money. ARB swings more than ETH in both directions. It started trading in March 2023, so the 5Y view starts there.
      </p>
    );
    next = { href: '/wega/risk-mix', label: 'How risky is my mix?' };
  } else {
    init = '5Y';
    lead = (
      <p>
        USDC is at <b>$1.00</b> and stayed within a cent of the dollar all month. Its one big break was in <b>March 2023</b>: when its bank, Silicon Valley Bank, failed, USDC fell to <b>$0.88</b> for a weekend and then
        came back. You hold <b>5,900 USDC</b>, and your Aave loan is in USDC too.
      </p>
    );
    next = { href: '/wega/scenario?s=usdc', label: 'What if USDC depegs like in March 2023?' };
  }
  return (
    <Answer
      title={vs ? `${c.sym} and ${COINS[vs].sym}` : c.name}
      lead={lead}
      next={
        next && (
          <AskLink className="btn primary lg" href={next.href}>
            {next.label}
          </AskLink>
        )
      }
    >
      <AssetChart sym={a} vs={vs} init={init} />
    </Answer>
  );
}
