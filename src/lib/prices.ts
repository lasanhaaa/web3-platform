/* Coin prices for Wega's asset charts (client feedback, Oct 15: "when Wega talks about an asset, attach its chart").
   SAMPLE data: a daily series per coin, drawn deterministically through a few anchor prices that follow the
   real shape of the market (the 2022 crash, the USDC depeg of March 2023…) and ending at the prototype's
   prices. The live platform would read the same coins from its price provider (Coin Watchlist). */
import { PF } from './portfolio';

export type Sym = 'eth' | 'btc' | 'arb' | 'usdc';
export type Period = '1M' | 'YTD' | '1Y' | '5Y';
export const PERIODS: Period[] = ['1M', 'YTD', '1Y', '5Y'];

const DAY = 864e5;
/** The prototype's "today" (the snapshot is from Oct 9 and 5 days old). */
export const TODAY = Date.UTC(2026, 9, 14);
const START = TODAY - 5 * 365 * DAY;

type CoinDef = { sym: string; name: string; dp: number; vol: number; anchors: [string, number][] };
export const COINS: Record<Sym, CoinDef> = {
  eth: {
    sym: 'ETH',
    name: 'Ethereum',
    dp: 0,
    vol: 0.034,
    anchors: [
      ['2021-10-15', 3800],
      ['2021-11-10', 4800],
      ['2022-01-22', 2500],
      ['2022-03-30', 3400],
      ['2022-06-18', 1000],
      ['2022-08-14', 1950],
      ['2022-11-10', 1150],
      ['2023-04-15', 2100],
      ['2023-10-12', 1550],
      ['2024-03-12', 4000],
      ['2024-08-05', 2250],
      ['2024-12-16', 4000],
      ['2025-04-09', 1500],
      ['2025-08-24', 4900],
      ['2025-10-14', 4100],
      ['2025-11-21', 2750],
      ['2025-12-31', 2950],
      ['2026-02-06', 2050],
      ['2026-05-20', 2600],
      ['2026-07-28', 3150],
      ['2026-09-14', 2960],
      ['2026-09-25', 2840],
      ['2026-10-14', PF.eth],
    ],
  },
  btc: {
    sym: 'BTC',
    name: 'Bitcoin',
    dp: 0,
    vol: 0.026,
    anchors: [
      ['2021-10-15', 60000],
      ['2021-11-10', 68000],
      ['2022-01-22', 35000],
      ['2022-03-30', 47000],
      ['2022-06-18', 19000],
      ['2022-11-21', 15800],
      ['2023-04-14', 30500],
      ['2023-09-11', 25000],
      ['2024-03-14', 73000],
      ['2024-08-05', 54000],
      ['2024-12-17', 106000],
      ['2025-04-08', 77000],
      ['2025-10-06', 124000],
      ['2026-02-06', 78000],
      ['2026-06-10', 92000],
      ['2026-09-14', 95500],
      ['2026-10-14', 98400],
    ],
  },
  arb: {
    sym: 'ARB',
    name: 'Arbitrum',
    dp: 2,
    vol: 0.05,
    anchors: [
      ['2023-03-23', 1.25],
      ['2023-06-15', 1.05],
      ['2023-10-12', 0.8],
      ['2024-01-12', 2.1],
      ['2024-08-05', 0.48],
      ['2024-12-07', 1.1],
      ['2025-04-07', 0.25],
      ['2025-08-13', 0.55],
      ['2026-02-06', 0.42],
      ['2026-07-20', 0.7],
      ['2026-09-14', 0.6],
      ['2026-10-14', PF.arbP],
    ],
  },
  usdc: {
    sym: 'USDC',
    name: 'USD Coin',
    dp: 2,
    vol: 0.00015,
    anchors: [
      ['2021-10-15', 1],
      ['2023-03-09', 1],
      ['2023-03-10', 0.997],
      ['2023-03-11', 0.88],
      ['2023-03-12', 0.97],
      ['2023-03-14', 1],
      ['2026-10-14', 1],
    ],
  },
};
export const isSym = (s: string | null | undefined): s is Sym => !!s && s in COINS;

/* seeded noise, so every visit draws the same chart */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());

export type Pt = { t: number; p: number };
const cache = new Map<Sym, Pt[]>();
/** One price per day, from the first anchor (or 5 years ago) to today. */
export function series(s: Sym): Pt[] {
  const hit = cache.get(s);
  if (hit) return hit;
  const c = COINS[s],
    r = rng(s.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7)),
    A = c.anchors.map(([d, p]) => [Date.parse(d + 'T00:00:00Z'), p] as const),
    out: Pt[] = [];
  for (let i = 0; i + 1 < A.length; i++) {
    const [t0, p0] = A[i],
      [t1, p1] = A[i + 1],
      n = Math.round((t1 - t0) / DAY);
    /* a random walk pinned to zero at both anchors (a Brownian bridge), on top of the straight line between them */
    const w = [0];
    for (let k = 1; k <= n; k++) w.push(w[k - 1] + gauss(r) * c.vol);
    for (let k = i ? 1 : 0; k <= n; k++) {
      const u = k / n,
        b = (w[k] - u * w[n]) * 0.6;
      out.push({ t: t0 + k * DAY, p: Math.exp(Math.log(p0) + (Math.log(p1) - Math.log(p0)) * u + b) });
    }
  }
  const from = out.findIndex((x) => x.t >= START);
  const res = out.slice(Math.max(0, from));
  cache.set(s, res);
  return res;
}

export function slice(s: Sym, per: Period): Pt[] {
  const all = series(s),
    from = per === '1M' ? TODAY - 30 * DAY : per === 'YTD' ? Date.UTC(2026, 0, 1) : per === '1Y' ? TODAY - 365 * DAY : 0;
  return all.filter((x) => x.t >= from);
}
export const price = (s: Sym) => series(s).at(-1)!.p;
export function change(s: Sym, per: Period) {
  const d = slice(s, per);
  return d[d.length - 1].p / d[0].p - 1;
}
/** The lowest price in a period (for a stablecoin, the point of attention is how far it fell from $1). */
export function lowest(s: Sym, per: Period) {
  const d = slice(s, per);
  let at = 0;
  for (let i = 1; i < d.length; i++) if (d[i].p < d[at].p) at = i;
  return d[at];
}
/** The biggest one-day drop in a period: the chart's "point of attention". */
export function worstDay(s: Sym, per: Period) {
  const d = slice(s, per);
  let at = 1,
    worst = 0;
  for (let i = 1; i < d.length; i++) {
    const c = d[i].p / d[i - 1].p - 1;
    if (c < worst) {
      worst = c;
      at = i;
    }
  }
  return { i: at, t: d[at].t, chg: worst };
}

export function fmtPrice(s: Sym, p: number) {
  const dp = COINS[s].dp;
  return '$' + p.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDay = (t: number, year = false) => {
  const d = new Date(t);
  return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}${year ? ', ' + d.getUTCFullYear() : ''}`;
};
export const fmtAxis = (t: number, per: Period) => {
  const d = new Date(t);
  return per === '1M' ? fmtDay(t) : per === '5Y' ? String(d.getUTCFullYear()) : MON[d.getUTCMonth()];
};
export const fmtPct = (x: number, dp = 1) => (x > 0.0005 ? '+' : x < -0.0005 ? '−' : '') + Math.abs(x * 100).toFixed(dp) + '%';
