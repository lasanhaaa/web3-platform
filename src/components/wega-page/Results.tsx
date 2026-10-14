'use client';
/* Wega's result pages (ideas doc, "Results Wega returns"): a short paragraph about the member's own numbers,
   one visual, a checklist where it helps, and one next step. Sample data, see src/lib/wega-page.ts. */
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  HF,
  LIQ,
  LIQ_DROP,
  NET,
  SNAP_DATE,
  SNAP_AGE,
  IDLE_REPAY,
  IDLE_REST,
  LOAN_APR,
  AAVE_APR,
  SCENS,
  isScen,
  scen,
  layers,
  allocRows,
  allocState,
  idleCost,
  nextSteps,
  stepMin,
  wp,
  wpRemember,
  type CatId,
  type ScenId,
} from '@/lib/wega-page';
import { PF } from '@/lib/portfolio';
import { R } from '@/lib/curriculum';
import { allCount, focus, useProgress } from '@/lib/progress';
import { stepTitle, stepCrumb, whyNext } from '@/lib/learn';
import { hrefLesson, hrefRoute } from '@/lib/nav';
import { StepBtn } from '@/lib/wega-brain';
import { useHydrated } from '@/lib/hydrated';
import { toast } from '@/lib/toast';
import { CHEV, Checklist, Icon, M, ResultFrame } from './parts';

const usd0 = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
const pct0 = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(Math.round(n)) + '%';

/** Adds the result to "Your recent results" on the start page. */
function useRemember(href: string, title: string, cat: CatId) {
  useEffect(() => wpRemember({ href, title, cat }), [href, title, cat]);
}
const NextLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link className="btn primary lg" href={href}>
    {children}
  </Link>
);

/* ---------- small visuals ---------- */
const hfPos = (h: number) => Math.max(0, Math.min(100, ((h - 0.5) / 2.5) * 100)); // scale 0.5 … 3.0
const hfTone = (h: number) => (h < 1 ? 'bad' : h < 1.75 ? 'warn' : 'ok');
/** Health Factor on a track: liquidation line at 1.0, the comfortable band from 1.75, a dot for the value. */
function HfGauge({ hf, was }: { hf: number; was?: number }) {
  return (
    <span className="wp-gauge" aria-hidden>
      <span className="track">
        <i className="liq" style={{ left: hfPos(1) + '%' }} />
        <i className="band" style={{ left: hfPos(1.75) + '%', right: 0 }} />
        {was != null && <i className="dot was" style={{ left: hfPos(was) + '%' }} />}
        <i className={'dot ' + hfTone(hf)} style={{ left: hfPos(hf) + '%' }} />
      </span>
      <span className="lbl">
        <span style={{ left: hfPos(1) + '%' }}>Liquidation</span>
        <span style={{ right: 0 }}>Comfortable</span>
      </span>
    </span>
  );
}
/** A tiny area chart of what idle money costs over 5 years. */
function IdleSpark() {
  const pts = Array.from({ length: 21 }, (_, i) => i / 4),
    max = idleCost(5).total,
    xy = pts.map((t) => [(t / 5) * 120, 40 - (idleCost(t).total / max) * 36] as const),
    line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  return (
    <svg className="wp-spark" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden>
      <path d={`${line}L120 40L0 40Z`} className="a" />
      <path d={line} className="l" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
/** 15 bars, the first ones lit: Decade's "weight of positions" tile. */
const Ticks = ({ pct }: { pct: number }) => (
  <span className="wp-ticks" aria-hidden>
    {Array.from({ length: 15 }, (_, i) => (
      <i key={i} className={i < Math.round((pct / 100) * 15) ? 'on' : undefined} />
    ))}
  </span>
);

/* ---------- Portfolio check ---------- */
export function PortfolioCheck() {
  useRemember('/wega/portfolio-check', 'Check my portfolio', 'portfolio');
  const vol = layers()[2].pct,
    yearCost = idleCost(1).total;
  return (
    <ResultFrame
      cat="portfolio"
      title="Portfolio check"
      lead={
        <p>
          Since your snapshot of {SNAP_DATE}, three things need a look. Your Aave loan is close to liquidation, with a Health Factor of <b>{HF.toFixed(2)}</b>.{' '}
          <b>
            <M v={PF.usdc} />
          </b>{' '}
          in USDC is sitting idle. And an approval to an unverified contract is still open after 214 days. Your LP is in range and earning fees.
        </p>
      }
      next={
        <button className="btn primary lg" onClick={() => toast('This opens a new snapshot in My Portfolio. It isn’t part of the prototype.')}>
          Update snapshot
        </button>
      }
    >
      <section className="wp-tiles" aria-label="Summary">
        <Link href="/wega/scenario?s=liq" className="wp-tile">
          <span className="wp-tile-h">Liquidation safety</span>
          <b className="wp-tile-v warn tnum">{HF.toFixed(2)}</b>
          <HfGauge hf={HF} />
          <span className="wp-tile-c">Health Factor. Liquidation if ETH falls to {usd0(LIQ)}</span>
        </Link>
        <Link href="/wega/idle-cost" className="wp-tile">
          <span className="wp-tile-h">Idle money</span>
          <b className="wp-tile-v">
            <M v={PF.usdc} />
          </b>
          <IdleSpark />
          <span className="wp-tile-c">
            costs about <M v={yearCost} /> a year
          </span>
        </Link>
        <Link href="/wega/risk-mix" className="wp-tile">
          <span className="wp-tile-h">Risk mix</span>
          <b className="wp-tile-v tnum">{vol}%</b>
          <Ticks pct={vol} />
          <span className="wp-tile-c">of your money moves fully with prices</span>
        </Link>
      </section>
      <Checklist
        rows={[
          { t: `Health Factor of ${HF.toFixed(2)}`, s: `Liquidation if ETH falls ${Math.round(LIQ_DROP * 1000) / 10}% to ${usd0(LIQ)}`, st: 'check' },
          {
            t: 'USDC sitting idle',
            s: (
              <>
                <M v={PF.usdc} /> since {SNAP_DATE}
              </>
            ),
            st: 'check',
          },
          { t: 'Open approvals', s: '1 of 4 goes to an unverified contract, unused for 214 days', st: 'check' },
          { t: 'LP in range', s: 'ETH $3,200 is inside $2,900–$3,400', st: 'ok' },
          { t: 'Snapshot up to date', s: `${SNAP_AGE} days old`, st: 'ok' },
        ]}
      />
    </ResultFrame>
  );
}

/* ---------- Risk mix ---------- */
export function RiskMix() {
  useRemember('/wega/risk-mix', 'How risky is my mix?', 'portfolio');
  const L = layers();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ResultFrame
      cat="portfolio"
      title="Your risk mix"
      lead={
        <p>
          Wega sorts your money into three layers. <b>Safe</b> doesn’t move with crypto prices, <b>Moderate</b> moves about half as much, and <b>Volatile</b> moves fully. <b>{L[2].pct}%</b> of your money is volatile, and part of
          it is borrowed against on Aave, so it swings more than its size suggests.
        </p>
      }
      next={<NextLink href="/wega/scenario?s=eth30">What if ETH drops 30%?</NextLink>}
    >
      <div className="wp-split" role="img" aria-label={L.map((l) => `${l.name} ${l.pct}%`).join(', ')}>
        {L.map((l) => (
          <span key={l.id} className={'is-' + l.id} style={{ flexGrow: l.pct }}>
            <b className="tnum">{l.pct}%</b>
            {l.name}
          </span>
        ))}
      </div>
      <section className="wp-card wp-table" aria-label="Layers">
        <div className="wp-tr wp-th">
          <span>Layer</span>
          <span className="hide-s">What it means</span>
          <span className="r">Share</span>
          <span className="r">Value</span>
        </div>
        {L.map((l) => (
          <div key={l.id} className={'wp-tgroup is-' + l.id}>
            <button className="wp-tr" aria-expanded={open === l.id} onClick={() => setOpen(open === l.id ? null : l.id)}>
              <span className="nm">
                {l.name}
                <Icon d={CHEV} size={16} />
              </span>
              <span className="hide-s q">{l.what}</span>
              <span className="r tnum">{l.pct}%</span>
              <span className="r q">
                <M v={l.v} />
              </span>
            </button>
            {open === l.id &&
              l.items.map((it) => (
                <div key={it.name} className="wp-tr wp-sub">
                  <span>{it.name}</span>
                  <span className="hide-s q">{it.where}</span>
                  <span className="r q tnum">{Math.round((it.v / NET) * 100)}%</span>
                  <span className="r q">
                    <M v={it.v} />
                  </span>
                </div>
              ))}
          </div>
        ))}
        <div className="wp-tr wp-total">
          <span>Total</span>
          <span className="hide-s" />
          <span className="r tnum">100%</span>
          <span className="r">
            <M v={NET} />
          </span>
        </div>
      </section>
    </ResultFrame>
  );
}

/* ---------- Allocation check ---------- */
export function Allocation() {
  useRemember('/wega/allocation', 'Compare me with the model portfolio', 'portfolio');
  const rows = allocRows();
  const at = (v: number) => Math.min(100, v) + '%';
  return (
    <ResultFrame
      cat="portfolio"
      title="You and the model portfolio"
      lead={
        <p>
          This puts your mix next to how the team runs the model portfolio. It isn’t a target for you, it shows where you differ. The biggest gaps: nothing in yield strategies yet, <b>{rows[2].you}%</b> waiting in
          stablecoins, and <b>{rows[4].you}%</b> in single tokens.
        </p>
      }
      next={<NextLink href="/strategies">Open Strategies</NextLink>}
    >
      <section className="wp-card wp-alloc" aria-label="Your mix and the model portfolio">
        <div className="wp-alloc-h">
          <div>
            <h2 className="wp-card-h">Your mix and the model portfolio</h2>
            <span className="wp-base">
              Base: your net worth, <M v={NET} />
            </span>
          </div>
          <span className="col">You</span>
          <span className="col">Model</span>
        </div>
        {rows.map((r) => {
          const st = allocState(r);
          return (
            <div key={r.name} className={'wp-arow is-' + st}>
              <span className="nm">
                {r.name}
                {r.sub && <small>{r.sub}</small>}
              </span>
              <span className="bar" aria-hidden>
                <i className="band" style={{ left: at(r.lo), width: `max(10px, ${r.hi - r.lo}%)` }} />
                <i className="mk" style={{ left: `clamp(0px, calc(${at(r.you)} - 2px), calc(100% - 4px))` }} />
              </span>
              <span className="you tnum">{r.you}%</span>
              <span className="mod tnum">
                {r.lo}–{r.hi}%
              </span>
            </div>
          );
        })}
        <p className="wp-legend">
          <span>
            <i className="ok" />
            Inside the model’s range
          </span>
          <span>
            <i className="near" />
            Up to 10 points off
          </span>
          <span>
            <i className="far" />
            More than 10 points off
          </span>
        </p>
      </section>
    </ResultFrame>
  );
}

/* ---------- Cost of idle money ---------- */
function IdleChart() {
  const W = wp.use();
  const N = 50,
    max = 1600,
    ts = Array.from({ length: N + 1 }, (_, i) => (i / N) * 5),
    X = (t: number) => (t / 5) * 500,
    Y = (v: number) => 200 - (v / max) * 200,
    path = (f: (t: number) => number) => ts.map((t, i) => `${i ? 'L' : 'M'}${X(t).toFixed(1)} ${Y(f(t)).toFixed(1)}`).join(''),
    lower = path((t) => idleCost(t).loan),
    upper = path((t) => idleCost(t).total),
    end = idleCost(5);
  return (
    <section className="wp-card wp-chart" aria-label="What idle money costs over 5 years">
      <h2 className="wp-card-h">What idle money costs you, by source, over 5 years</h2>
      <div className="wp-plot">
        {[0.25, 0.5, 0.75].map((g) => (
          <i key={g} className="grid" style={{ top: g * 100 + '%' }} />
        ))}
        <svg viewBox="0 0 500 200" preserveAspectRatio="none" aria-hidden>
          <path d={`${upper}L500 200L0 200Z`} className="a2" />
          <path d={`${lower}L500 200L0 200Z`} className="a1" />
          <path d={upper} className="l2" vectorEffect="non-scaling-stroke" />
          <path d={lower} className="l1" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="end tnum" style={{ top: `calc(${(Y(end.total) / 200) * 100}% - 52px)` }}>
          {W.hide ? '$•••••' : usd0(end.total)}
          <small>in 5 years</small>
        </span>
      </div>
      <div className="wp-xax" aria-hidden>
        {['Today', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'].map((l, i) => (
          <span key={l} style={{ left: i * 20 + '%' } as CSSProperties}>
            {l}
          </span>
        ))}
      </div>
      <p className="wp-legend">
        <span>
          <i className="a1" />
          Loan interest you could save
        </span>
        <span>
          <i className="a2" />
          Interest the rest could earn on Aave
        </span>
      </p>
    </section>
  );
}
export function IdleCost() {
  useRemember('/wega/idle-cost', 'How much money is sitting idle?', 'portfolio');
  const save = IDLE_REPAY * LOAN_APR,
    earn = IDLE_REST * AAVE_APR;
  return (
    <ResultFrame
      cat="portfolio"
      title="The cost of idle money"
      lead={
        <p>
          <b>
            <M v={PF.usdc} />
          </b>{' '}
          in USDC has been sitting in your wallet since {SNAP_DATE}. At the same time you pay about <b>5%</b> on the <M v={IDLE_REPAY} /> you borrowed on Aave. Repaying the loan with idle USDC would save about{' '}
          <b>
            <M v={save} />
          </b>{' '}
          a year, and lending the rest at about <b>4.1%</b> would earn about{' '}
          <b>
            <M v={earn} />
          </b>{' '}
          more. Rates change, so treat this as math, not advice.
        </p>
      }
      next={<NextLink href={hrefLesson('r1', 2, 0)}>Watch “Lending basics”</NextLink>}
    >
      <IdleChart />
      <Checklist
        title="What Wega looked for"
        rows={[
          {
            t: 'Stablecoins sitting idle',
            s: (
              <>
                <M v={PF.usdc} /> since {SNAP_DATE}
              </>
            ),
            st: 'check',
          },
          {
            t: 'Paying interest while holding cash',
            s: (
              <>
                <M v={IDLE_REPAY} /> borrowed at about 5%
              </>
            ),
            st: 'check',
          },
          { t: 'LP out of range, earning nothing', s: 'In range: ETH $3,200 is inside $2,900–$3,400', st: 'ok' },
          { t: 'Rewards left unclaimed', s: 'No reward programs in your snapshot', st: 'na' },
        ]}
      />
    </ResultFrame>
  );
}

/* ---------- Scenario ---------- */
export function Scenario() {
  const q = useSearchParams();
  const s: ScenId = isScen(q.get('s')) ? (q.get('s') as ScenId) : 'eth30';
  return <ScenarioView key={s} s={s} />;
}
function ScenarioView({ s }: { s: ScenId }) {
  const def = SCENS[s];
  useRemember('/wega/scenario?s=' + s, def.title, def.cat);
  const [v, setV] = useState(def.init);
  const eth = def.kind === 'eth',
    base = scen(0),
    first = eth ? scen(def.init) : scen(0, def.init),
    now = eth ? scen(v) : scen(0, v),
    chg = (now.net / base.net - 1) * 100;
  const lead =
    s === 'liq' ? (
      <p>
        Your Health Factor is <b>{HF.toFixed(2)}</b>. Aave liquidates part of your collateral when it falls below 1. That happens if ETH drops <b>{Math.round(LIQ_DROP * 1000) / 10}%</b>, to <b>{usd0(LIQ)}</b>. Move the slider to
        see how close that is.
      </p>
    ) : s === 'usdc' ? (
      <p>
        In March 2023, USDC briefly traded at <b>$0.88</b>. At that price your idle USDC would be worth{' '}
        <b>
          <M v={first.usdcV} />
        </b>
        . Your loan is in USDC too, so it gets cheaper in dollars and your Health Factor rises to <b>{first.hf.toFixed(2)}</b>. Net worth: <b>{pct0((first.net / base.net - 1) * 100)}</b>.
      </p>
    ) : (
      <p>
        {s === 'crash22' && <>In 2022, ETH fell about 75% from January to June. </>}
        If ETH drops {Math.round(-def.init * 100)}% to <b>{usd0(first.p)}</b>, your Health Factor falls to <b>{first.hf.toFixed(2)}</b> and Aave liquidates part of your collateral. Your net worth drops to about{' '}
        <b>
          <M v={first.net} />
        </b>{' '}
        ({pct0((first.net / base.net - 1) * 100)}), before the liquidation penalty. Your LP leaves its range and stops earning fees.
      </p>
    );
  return (
    <ResultFrame cat={def.cat} title={def.title} lead={lead} next={<NextLink href={hrefRoute('r1', 2)}>Learn how liquidation works</NextLink>}>
      <section className="wp-card wp-scen" aria-label="Scenario">
        <div className="wp-scen-top">
          <label htmlFor="wp-slider" className="wp-card-h">
            {eth ? 'ETH price' : 'USDC price'}
          </label>
          <b className="tnum">
            {eth ? (
              <>
                {usd0(now.p)} <span>{pct0(v * 100)}</span>
              </>
            ) : (
              <>${v.toFixed(2)}</>
            )}
          </b>
        </div>
        <input
          id="wp-slider"
          type="range"
          min={eth ? -80 : 80}
          max={eth ? 50 : 100}
          step={eth ? 5 : 1}
          value={Math.round(v * 100)}
          onChange={(e) => setV(+e.target.value / 100)}
          style={{ '--p': ((Math.round(v * 100) - (eth ? -80 : 80)) / (eth ? 130 : 20)) * 100 + '%' } as CSSProperties}
        />
        <div className="wp-scale" aria-hidden>
          <span>{eth ? '−80%' : '$0.80'}</span>
          <span className="mid" style={{ left: eth ? `${(80 / 130) * 100}%` : '100%' }}>
            {eth ? 'Today' : ''}
          </span>
          <span>{eth ? '+50%' : '$1.00'}</span>
        </div>
        <div className="wp-tiles in-card">
          <div className="wp-tile">
            <span className="wp-tile-h">Net worth</span>
            <b className="wp-tile-v">
              <M v={now.net} />
            </b>
            <span className={'wp-delta ' + (chg < -0.5 ? 'bad' : chg > 0.5 ? 'ok' : '')}>{pct0(chg)}</span>
            <span className="wp-tile-c">
              today <M v={base.net} />
            </span>
          </div>
          <div className="wp-tile">
            <span className="wp-tile-h">Health Factor</span>
            <b className={'wp-tile-v tnum ' + hfTone(now.hf)}>{now.hf.toFixed(2)}</b>
            <HfGauge hf={now.hf} was={HF} />
            <span className="wp-tile-c">{now.liquidated ? 'Aave liquidates part of your ETH' : `today ${HF.toFixed(2)}`}</span>
          </div>
          <div className="wp-tile">
            <span className="wp-tile-h">Your LP</span>
            <b className={'wp-tile-v ' + (now.inRange ? 'ok' : 'warn')}>{now.inRange ? 'In range' : 'Out of range'}</b>
            <span className="wp-tile-c">{now.inRange ? 'still earning fees' : 'no fees until ETH is back between $2,900 and $3,400'}</span>
          </div>
        </div>
      </section>
      <Checklist
        rows={[
          { t: 'Aave loan', s: now.liquidated ? 'Liquidated: part of the 2 ETH is sold to repay the debt' : `Safe at a Health Factor of ${now.hf.toFixed(2)}`, st: now.liquidated ? 'check' : 'ok' },
          { t: 'Uniswap LP', s: now.inRange ? 'In range, earning fees' : 'Out of range, not earning', st: now.inRange ? 'ok' : 'check' },
          {
            t: 'Idle USDC',
            s: eth ? (
              'Not affected by the ETH price'
            ) : (
              <>
                worth <M v={now.usdcV} />
              </>
            ),
            st: eth || v >= 0.995 ? 'ok' : 'check',
          },
        ]}
      />
    </ResultFrame>
  );
}

/* ---------- Learning path ---------- */
export function LearningPath() {
  useRemember('/wega/learning-path', 'What should I learn next?', 'learn');
  useProgress();
  const hydrated = useHydrated();
  if (!hydrated) return <div className="page wp wp-res" />;
  const f = focus(),
    all = allCount(),
    steps = nextSteps(3);
  return (
    <ResultFrame
      cat="learn"
      title="What to learn next"
      source={false}
      lead={
        f ? (
          <p>
            You’ve done <b>{all.d}</b> of {all.t} lessons. Next up is <b>{stepTitle(f)}</b> ({stepCrumb(f)}). {whyNext(f)}
          </p>
        ) : (
          <p>You’ve finished every lesson that’s open. Pick a route in the Academy to keep going.</p>
        )
      }
      next={f ? <StepBtn f={f} cls="btn primary lg" label={f.quiz ? 'Start quiz' : 'Continue lesson'} /> : <NextLink href="/academy">Open the Academy</NextLink>}
    >
      {steps.length > 0 && (
        <ol className="wp-card wp-path" aria-label="Your next steps">
          {steps.map((s, i) => (
            <li key={i} className={i === 0 ? 'now' : undefined}>
              <span className="n tnum">{i + 1}</span>
              <span className="t">
                {i === 0 && <span className="wp-tag">Up next</span>}
                <b>{stepTitle(s)}</b>
                <small>
                  {s.r === 'academy' ? 'Academy' : `${R(s.r).name} · ${R(s.r).zones[s.z].name}`} · {s.quiz ? '5 questions' : stepMin(s) + ' min'}
                </small>
              </span>
            </li>
          ))}
        </ol>
      )}
    </ResultFrame>
  );
}
