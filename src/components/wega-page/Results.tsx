'use client';
/* Wega's rich answers in the chat (ideas doc, "Results Wega returns"): a short paragraph about the member's own
   numbers, one visual, a checklist where it helps, and one next step. Sample data, see src/lib/wega-page.ts. */
import { useId, useState, type CSSProperties, type ReactNode } from 'react';
import { HF, LIQ, LIQ_DROP, NET, SNAP_DATE, SNAP_AGE, ETH_EXP, ETH_BETA, SCENS, scen, exposure, allocRows, stableYield, nextSteps, stepMin, type ScenId } from '@/lib/wega-page';
import { PF } from '@/lib/portfolio';
import { R } from '@/lib/curriculum';
import { allCount, focus, useProgress } from '@/lib/progress';
import { stepTitle, stepCrumb, whyNext } from '@/lib/learn';
import { hrefLesson, hrefRoute, hrefStrategies } from '@/lib/nav';
import { StepBtn } from '@/lib/wega-brain';
import { useHydrated } from '@/lib/hydrated';
import { toast } from '@/lib/toast';
import { Answer, AskLink, CHEV, Checklist, Icon, M } from './parts';
import { AssetChart } from './Asset';

const usd0 = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
const pct0 = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(Math.round(n)) + '%';

const NextLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <AskLink className="btn primary lg" href={href}>
    {children}
  </AskLink>
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
/** 15 bars, the first ones lit: Decade's "weight of positions" tile. */
const Ticks = ({ pct, tone }: { pct: number; tone?: 'ok' }) => (
  <span className={'wp-ticks' + (tone ? ' ' + tone : '')} aria-hidden>
    {Array.from({ length: 15 }, (_, i) => (
      <i key={i} className={i < Math.round((pct / 100) * 15) ? 'on' : undefined} />
    ))}
  </span>
);

/* ---------- Portfolio check ---------- */
export function PortfolioCheck() {
  const ethPct = Math.round((ETH_EXP / NET) * 100),
    usdcPct = Math.round((PF.usdc / NET) * 100),
    best = stableYield().at(-1)!;
  return (
    <Answer
      title="Portfolio check"
      lead={
        <p>
          I checked your snapshot of {SNAP_DATE}. Three things need a look. Your Aave loan has a Health Factor of <b>{HF.toFixed(2)}</b>, so a 30% ETH drop would get you liquidated.{' '}
          <b>
            <M v={PF.usdc} />
          </b>{' '}
          in USDC isn’t in any strategy. And about <b>{ethPct}%</b> of your money moves with ETH. Your LP is in range and earning fees.
        </p>
      }
      next={
        <button className="btn primary lg" onClick={() => toast('This opens a new snapshot in My Portfolio. It isn’t part of the prototype.')}>
          Update snapshot
        </button>
      }
    >
      <section className="wp-tiles" aria-label="Summary">
        <AskLink href="/wega/scenario?s=liq" className="wp-tile">
          <span className="wp-tile-h">Liquidation safety</span>
          <b className="wp-tile-v warn tnum">{HF.toFixed(2)}</b>
          <HfGauge hf={HF} />
          <span className="wp-tile-c">Health Factor. Liquidation if ETH falls to {usd0(LIQ)}</span>
        </AskLink>
        <AskLink href="/wega/idle-cost" className="wp-tile">
          <span className="wp-tile-h">Stablecoins not earning</span>
          <b className="wp-tile-v">
            <M v={PF.usdc} />
          </b>
          <Ticks pct={usdcPct} tone="ok" />
          <span className="wp-tile-c">
            {best.s.name} pays {best.s.apr}% a year in the model portfolio
          </span>
        </AskLink>
        <AskLink href="/wega/risk-mix" className="wp-tile">
          <span className="wp-tile-h">Moves with ETH</span>
          <b className="wp-tile-v tnum">{ethPct}%</b>
          <Ticks pct={ethPct} />
          <span className="wp-tile-c">A 10% ETH move changes your net worth by about {Math.round(ETH_BETA * 100)}%</span>
        </AskLink>
      </section>
      <Checklist
        rows={[
          { t: `Health Factor of ${HF.toFixed(2)}`, s: `Liquidation if ETH falls ${Math.round(LIQ_DROP * 1000) / 10}% to ${usd0(LIQ)}`, st: 'check' },
          {
            t: 'Stablecoins not in a strategy',
            s: (
              <>
                <M v={PF.usdc} /> in USDC since {SNAP_DATE}
              </>
            ),
            st: 'check',
          },
          { t: 'Most of your money in one coin', s: `About ${ethPct}% moves with ETH`, st: 'check' },
          { t: 'LP in range', s: 'ETH $3,200 is inside $2,900–$3,400', st: 'ok' },
          { t: 'Snapshot up to date', s: `${SNAP_AGE} days old`, st: 'ok' },
        ]}
      />
    </Answer>
  );
}

/* ---------- Risk mix: what moves your money ---------- */
export function RiskMix() {
  const L = exposure();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Answer
      title="What moves your money"
      lead={
        <p>
          I split your money by the coin it follows. <b>{L[0].pct}%</b> moves with ETH: the ETH in your wallet, the 2 ETH on Aave and half of your LP. Because part of it is borrowed against, a 10% ETH move changes your
          net worth by about <b>{Math.round(ETH_BETA * 100)}%</b>. <b>{L[1].pct}%</b> is USDC, which stays at a dollar, and <b>{L[2].pct}%</b> is ARB.
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
      <section className="wp-card wp-table" aria-label="By coin">
        <div className="wp-tr wp-th">
          <span>Coin</span>
          <span className="hide-s">What it does</span>
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
            {open === l.id && (
              <>
                {l.items.map((it) => (
                  <div key={it.name} className="wp-tr wp-sub">
                    <span>{it.name}</span>
                    <span className="hide-s q">{it.where}</span>
                    <span className="r q tnum" />
                    <span className="r q">
                      <M v={it.v} />
                    </span>
                  </div>
                ))}
                <AskLink href={`/wega/asset?a=${l.id}`} className="wp-tr wp-sub wp-sub-link">
                  <span>See the {l.name} chart</span>
                  <Icon d={CHEV} size={16} />
                </AskLink>
              </>
            )}
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
    </Answer>
  );
}

/* ---------- You and the model portfolio ---------- */
export function Allocation() {
  const rows = allocRows();
  return (
    <Answer
      title="You and the model portfolio"
      lead={
        <p>
          The model portfolio keeps <b>{rows[0].model}%</b> in stablecoin strategies, where the price barely matters, plus gold pools and staking. Your money is mostly ETH and USDC that isn’t in a strategy yet. This isn’t a
          target for you, it shows where you differ.
        </p>
      }
      next={<NextLink href={hrefStrategies()}>Open Strategies</NextLink>}
    >
      <section className="wp-card wp-alloc" aria-label="Your mix and the model portfolio">
        <div className="wp-alloc-h">
          <h2 className="wp-card-h">Share of each portfolio</h2>
          <span className="col you">You</span>
          <span className="col">Model</span>
        </div>
        {rows.map((r) => (
          <div key={r.name} className="wp-arow">
            <span className="nm">
              {r.name}
              {r.sub && <small>{r.sub}</small>}
            </span>
            <span className="bars" aria-hidden>
              <i className="y" style={{ width: r.you + '%' }} />
              <i className="m" style={{ width: r.model + '%' }} />
            </span>
            <span className="you tnum">{r.you}%</span>
            <span className="mod tnum">{r.model}%</span>
          </div>
        ))}
        <p className="wp-legend">
          <span>
            <i className="you" />
            You, from your snapshot
          </span>
          <span>
            <i className="mod" />
            The model portfolio today
          </span>
        </p>
      </section>
    </Answer>
  );
}

/* ---------- Are my stablecoins earning anything? ---------- */
export function IdleCost() {
  const opts = stableYield(),
    max = opts[opts.length - 1].year;
  return (
    <Answer
      title="Stablecoins not earning"
      lead={
        <p>
          Not yet.{' '}
          <b>
            <M v={PF.usdc} />
          </b>{' '}
          in USDC has been in your wallet since {SNAP_DATE} without being in a strategy. In the model portfolio, the two easiest stablecoin strategies pay{' '}
          {opts.map((o, i) => (
            <span key={o.s.id}>
              {i ? ' and ' : ''}
              <b>{o.s.apr}%</b> a year ({o.s.name})
            </span>
          ))}
          . Rates change every week and each strategy has its own risks, so treat this as math, not advice.
        </p>
      }
      next={<NextLink href={hrefStrategies(opts[0].s.id)}>Open {opts[0].s.name}</NextLink>}
    >
      <section className="wp-card wp-yield" aria-label="What 5,900 USDC would earn in a year">
        <h2 className="wp-card-h">
          What your <M v={PF.usdc} /> would earn in a year
        </h2>
        <ul>
          <li>
            <span className="nm">
              In your wallet<small>Not in a strategy</small>
            </span>
            <span className="bar" aria-hidden>
              <i style={{ width: '0%' }} />
            </span>
            <b className="tnum">
              <M v={0} />
            </b>
          </li>
          {opts.map((o) => (
            <li key={o.s.id}>
              <span className="nm">
                {o.s.name}
                <small>
                  {o.s.apr}% APR · {o.s.diff}
                </small>
              </span>
              <span className="bar" aria-hidden>
                <i style={{ width: (o.year / max) * 100 + '%' }} />
              </span>
              <b className="tnum">
                <M v={o.year} />
              </b>
            </li>
          ))}
        </ul>
      </section>
    </Answer>
  );
}

/* ---------- Scenario (client, Oct 15: liked, but smaller) ---------- */
export function Scenario({ s }: { s: ScenId }) {
  const def = SCENS[s];
  const id = useId();
  const [v, setV] = useState(def.init);
  const eth = def.kind === 'eth',
    base = scen(0),
    first = eth ? scen(def.init) : scen(0, def.init),
    now = eth ? scen(v) : scen(0, v),
    chg = (now.net / base.net - 1) * 100,
    firstChg = pct0((first.net / base.net - 1) * 100);
  const lead =
    s === 'liq' ? (
      <p>
        Your Health Factor is <b>{HF.toFixed(2)}</b>. Aave sells part of your ETH when it falls below 1, which happens if ETH drops <b>{Math.round(LIQ_DROP * 1000) / 10}%</b>, to <b>{usd0(LIQ)}</b>. Move the slider to
        see how close that is.
      </p>
    ) : s === 'usdc' ? (
      <p>
        In March 2023, USDC briefly traded at <b>$0.88</b>. At that price your USDC would be worth{' '}
        <b>
          <M v={first.usdcV} />
        </b>
        . Your loan is in USDC too, so your Health Factor rises to <b>{first.hf.toFixed(2)}</b>. Net worth: <b>{firstChg}</b>.
      </p>
    ) : def.init > 0 ? (
      <p>
        If ETH rises {Math.round(def.init * 100)}% to <b>{usd0(first.p)}</b>, your net worth grows to about{' '}
        <b>
          <M v={first.net} />
        </b>{' '}
        ({firstChg}) and your Health Factor rises to <b>{first.hf.toFixed(2)}</b>. Your LP leaves its range above $3,400 and stops earning fees until you move it.
      </p>
    ) : (
      <p>
        {s === 'crash22' && <>In 2022, ETH fell about 75% from January to June. </>}
        If ETH drops {Math.round(-def.init * 100)}% to <b>{usd0(first.p)}</b>, your Health Factor falls to <b>{first.hf.toFixed(2)}</b> and Aave sells part of your ETH. Your net worth drops to about{' '}
        <b>
          <M v={first.net} />
        </b>{' '}
        ({firstChg}), and your LP stops earning fees.
      </p>
    );
  /* one next step that fits the scenario: liquidation for a drop, impermanent loss for a rise, the depeg lesson for USDC */
  const next =
    s === 'usdc' ? (
      <NextLink href={hrefLesson('r2', 2, 4)}>Watch “Depeg monitor”</NextLink>
    ) : def.init > 0 ? (
      <NextLink href={hrefLesson('r2', 1, 5)}>Watch “IL: impermanent loss”</NextLink>
    ) : (
      <NextLink href={hrefRoute('r1', 2)}>Learn how liquidation works</NextLink>
    );
  return (
    <Answer title={def.title} lead={lead} next={next}>
      <section className="wp-card wp-scen" aria-label="Scenario">
        <div className="wp-scen-top">
          <label htmlFor={id} className="wp-card-h">
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
          id={id}
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
            <span className={'wp-delta ' + (chg < -0.5 ? 'bad' : chg > 0.5 ? 'ok' : '')}>
              {pct0(chg)}{' '}
              <span className="wp-tile-c">
                from <M v={base.net} />
              </span>
            </span>
          </div>
          <div className="wp-tile">
            <span className="wp-tile-h">Health Factor</span>
            <b className={'wp-tile-v tnum ' + hfTone(now.hf)}>{now.hf.toFixed(2)}</b>
            <HfGauge hf={now.hf} was={HF} />
            {now.liquidated && <span className="wp-tile-c">Aave sells part of your ETH</span>}
          </div>
          <div className="wp-tile">
            <span className="wp-tile-h">Your LP</span>
            <b className={'wp-tile-v ' + (now.inRange ? 'ok' : 'warn')}>{now.inRange ? 'In range' : 'Out of range'}</b>
            <span className="wp-tile-c">{now.inRange ? 'Earning fees' : 'No fees outside $2,900–$3,400'}</span>
          </div>
        </div>
      </section>
      <AssetChart sym={eth ? 'eth' : 'usdc'} init={s === 'crash22' || !eth ? '5Y' : '1Y'} mark={eth ? now.p : v} compact />
    </Answer>
  );
}

/* ---------- Learning path ---------- */
export function LearningPath() {
  useProgress();
  const hydrated = useHydrated();
  if (!hydrated) return null;
  const f = focus(),
    all = allCount(),
    steps = nextSteps(3);
  return (
    <Answer
      title="What to learn next"
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
    </Answer>
  );
}
