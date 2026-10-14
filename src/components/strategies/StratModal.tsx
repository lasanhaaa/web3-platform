'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { strat, readiness, lessonOf, sizeFor, valueOf, liqDist, PORTFOLIO, DISCLAIMER, stUi, toggleNotify, type Strat } from '@/lib/strategies';
import { useProgress, S, lessonOpen } from '@/lib/progress';
import { num, usd } from '@/lib/portfolio';
import { hrefLesson } from '@/lib/nav';
import { setWegaSid, wgRun } from '@/lib/wega';
import { riskForYou } from '@/lib/wega-strategies';
import { useHydrated } from '@/lib/hydrated';
import { toast } from '@/lib/toast';
import { I } from '@/lib/icons';
import { Svg, Md } from '@/lib/svg';
import { Spark, diffStyle } from './bits';

const WARN =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17.5v.01"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9.5"/><path d="M10 8.8v6.4l5.2-3.2Z" fill="currentColor" stroke="none"/></svg>';
const pct2 = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(2)}%`;

function NotifyChip({ id }: { id: string }) {
  const U = stUi.use();
  const on = U.notify.includes(id);
  return (
    <button className={`btn ${on ? 'primary' : 'ghost'} sm`} aria-pressed={on} onClick={() => toast(toggleNotify(id) ? 'Wega will tell you when new entries reopen.' : 'Notification off.')}>
      {on ? 'Notifying you' : 'Notify me'}
    </button>
  );
}

/** What-if for two-legged strategies: a BTC move against both legs at a chosen position size ÷ margin. */
function HedgeSim({ s }: { s: Strat }) {
  const [move, setMove] = useState(12);
  const [lev, setLev] = useState(3);
  const legs = s.legs!;
  const sz = sizeFor(s),
    half = Math.round(sz / 2),
    notional = half * lev,
    asset = legs[0].asset;
  const out = legs.map((l) => {
    const adverse = l.side === 'Long' ? -move : move,
      d = liqDist(lev, l.side) * 100,
      liq = adverse >= d,
      raw = ((l.side === 'Long' ? 1 : -1) * move * notional) / 100;
    return { ...l, d, liq, used: Math.max(0, adverse) / d, pnl: liq ? -half : raw };
  });
  const net = out.reduce((a, l) => a + l.pnl, 0),
    hit = out.find((l) => l.liq),
    tight = out.find((l) => !l.liq && l.used > 0.6);
  const sign = (n: number) => (Math.round(n) === 0 ? usd(0) : `${n > 0 ? '+' : '−'}${usd(Math.abs(n))}`);
  return (
    <div className="st-sim">
      <div className="st-sim-h">
        <b>What if {asset} moves?</b>
        <span className="mono">
          {usd(sz)} · {usd(half)} per side
        </span>
      </div>
      <div className="st-ctl">
        <label>
          <span className="mono">
            {asset} move <b>{move > 0 ? '+' : move < 0 ? '−' : ''}{Math.abs(move)}%</b>
          </span>
          <input type="range" min={-30} max={30} step={1} value={move} onChange={(e) => setMove(+e.target.value)} aria-label={`${asset} price move in percent`} />
        </label>
        <div className="seg3" role="radiogroup" aria-label="Position size ÷ margin">
          {[2, 3, 5, 10].map((x) => (
            <button key={x} role="radio" aria-checked={lev === x} className={lev === x ? 'on' : undefined} onClick={() => setLev(x)}>
              {x}x
            </button>
          ))}
        </div>
      </div>
      <div className="st-legs">
        {out.map((l) => (
          <div className="st-leg" key={l.side + l.dex}>
            <span>
              {l.side} · {l.dex}
            </span>
            <b className={l.liq ? 'no' : undefined}>{l.liq ? 'Liquidated' : sign(l.pnl)}</b>
            <div className="st-gauge" aria-hidden="true">
              <span className={l.liq || l.used > 0.6 ? 'no' : undefined} style={{ width: Math.min(100, l.used * 100) + '%' }} />
            </div>
            <small>
              Liquidation at <b>{l.side === 'Short' ? '+' : '−'}{Math.round(l.d)}%</b>
            </small>
          </div>
        ))}
      </div>
      <p className="wg-why">
        <Spark />
        <span>
          {hit ? (
            <>
              At {lev}x, a {Math.abs(move)}% move liquidates the {hit.side.toLowerCase()} on {hit.dex} before you can rebalance. You lose that side’s {usd(half)} and the hedge is gone. Net: <b>{sign(net)}</b>.
            </>
          ) : tight ? (
            <>
              Both sides survive, but the {tight.side.toLowerCase()} has used {Math.round(tight.used * 100)}% of its room. This is where the team rebalances. Net: <b>{sign(net)}</b> before fees and funding.
            </>
          ) : (
            <>
              Both sides survive. The gain on one cancels the loss on the other, net <b>{sign(net)}</b> before fees and funding. What you keep are the points.
            </>
          )}
        </span>
      </p>
      <p className="st-sim-n">
        Estimate per side with 2.5% maintenance margin. In cross mode your whole account margin counts, which is why the guide says to keep cross-account leverage low.
      </p>
    </div>
  );
}

/** What-if for yield strategies: amount and time at today's APR, and at half of it. */
function YieldSim({ s }: { s: Strat }) {
  const sz = sizeFor(s);
  const [amt, setAmt] = useState(sz);
  const [months, setMonths] = useState(12);
  const y = (amt * s.apr * months) / 1200;
  return (
    <div className="st-sim">
      <div className="st-sim-h">
        <b>What could it earn?</b>
        <span className="mono">at today’s {s.apr}% APR</span>
      </div>
      <div className="st-ctl">
        <label>
          <span className="mono">
            Amount <b>{usd(amt)}</b>
          </span>
          <input type="range" min={0} max={Math.max(1000, sz * 2)} step={50} value={amt} onChange={(e) => setAmt(+e.target.value)} aria-label="Amount in dollars" />
        </label>
        <div className="seg3" role="radiogroup" aria-label="Time">
          {[
            [1, '1 month'],
            [6, '6 months'],
            [12, '1 year'],
          ].map(([m, l]) => (
            <button key={m} role="radio" aria-checked={months === m} className={months === m ? 'on' : undefined} onClick={() => setMonths(+m)}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="st-legs">
        <div className="st-leg">
          <span>At today’s APR</span>
          <b>+{usd(y)}</b>
          <small>
            {s.apr}% a year on {usd(amt)}
          </small>
        </div>
        <div className="st-leg">
          <span>If the APR halves</span>
          <b>+{usd(y / 2)}</b>
          <small>Rates move daily</small>
        </div>
      </div>
      <p className="wg-why">
        <Spark />
        <span>
          {s.id === 'sol-lst' ? (
            <>
              SOL’s price matters more than the yield here: the position is <b>−3.40%</b> this month, while staking added about <b>0.6%</b>.
            </>
          ) : /USD/.test(s.coin) ? (
            <>The yield is paid in dollars, so it adds to your stablecoins without adding ETH exposure.</>
          ) : (
            <>The yield is paid in {s.coin}. Its price moves your value more than the APR does.</>
          )}
        </span>
      </p>
    </div>
  );
}

/** "For you · Wega": readiness, size and the what-if, inside the modal after "What it is". */
function ForYou({ s }: { s: Strat }) {
  const router = useRouter();
  useProgress();
  const r = readiness(s),
    sz = sizeFor(s),
    half = Math.round(sz / 2);
  if (s.status === 'Closed')
    return (
      <section className="st-sec">
        <h3 className="st-sh wg">
          <Spark />
          For you · Wega<small>Sample data</small>
        </h3>
        <p className="st-disc">
          The team closed this strategy at <b style={{ color: '#fff' }}>{pct2(s.ret)}</b>. There’s nothing to size; the lessons below explain how it worked.
        </p>
      </section>
    );
  return (
    <section className="st-sec">
      <h3 className="st-sh wg">
        <Spark />
        For you · Wega<small>Sample data</small>
      </h3>
      <div className="st-fy-grid">
        <div className="st-fy-c">
          <span className="mono">Your readiness</span>
          <b>{r.missing.length ? `${r.done} of ${r.total} lessons` : 'Ready'}</b>
          <div className="pbar">
            <span style={{ width: Math.round((r.done / r.total) * 100) + '%' }} />
          </div>
          <div className="st-ls">
            {s.needs.map((k) => {
              const L = lessonOf(k),
                done = S.done.has(k);
              return (
                <button
                  key={k}
                  className={done ? 'done' : undefined}
                  onClick={() => {
                    if (!lessonOpen(L.r, L.z, L.l)) return toast('This lesson is still locked.');
                    router.push(hrefLesson(L.r, L.z, L.l));
                  }}
                >
                  <span className="sq">
                    <Svg src={done ? I.check : lessonOpen(L.r, L.z, L.l) ? I.play : I.lock} />
                  </span>
                  <span className="t">
                    {L.t}
                    <small>{L.where}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="st-fy-c">
          <span className="mono">Your size at max weight</span>
          <b>{usd(sz)}</b>
          <p>
            {s.maxW}% of your <b>{usd(PORTFOLIO)}</b> sample portfolio, the same weight the model portfolio uses.
            {s.legs ? (
              <>
                {' '}
                Split: <b>{usd(half)}</b> on {s.legs[0].dex}, <b>{usd(sz - half)}</b> on {s.legs[1].dex}.
              </>
            ) : null}{' '}
            It’s a ceiling, not a target.
          </p>
        </div>
      </div>
      {s.legs ? <HedgeSim s={s} /> : <YieldSim s={s} />}
      <div className="wg-acts">
        {s.legs && (
          <button className="btn ghost sm" onClick={() => wgRun('s_setup', 'Check my setup')}>
            <Spark />
            Check my setup
          </button>
        )}
        <button className="btn ghost sm" onClick={() => wgRun('s_explain', 'Explain it simply')}>
          Explain it simply
        </button>
        <button className="btn ghost sm" onClick={() => wgRun('s_risk', 'What are the risks for me?')}>
          Risks for me
        </button>
      </div>
    </section>
  );
}

/** Figma "strategies / modal" (2725:83996): one scroll, 760 wide. Opened with /strategies?s=<id>. */
export function StratModal() {
  const q = useSearchParams();
  const router = useRouter();
  const s = strat(q.get('s'));
  const box = useRef<HTMLDivElement>(null);
  const close = () => router.push('/strategies', { scroll: false });
  /* the "For you" parts render from learning progress, so the modal opens after hydration */
  const hydrated = useHydrated();

  useEffect(() => {
    setWegaSid(s?.id ?? null);
    if (!s || !hydrated) return;
    document.body.classList.add('st-lock');
    box.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) close();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('st-lock');
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.id, hydrated]);
  useEffect(() => () => setWegaSid(null), []);
  if (!s || !hydrated) return null;
  const closed = s.status === 'Closed';
  const v = valueOf(s, 'all');
  return (
    <div className="st-ov" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="st-m" role="dialog" aria-modal="true" aria-labelledby="st-m-title" style={diffStyle(s.diff)} tabIndex={-1} ref={box}>
        <button className="st-m-x" onClick={close} aria-label="Close">
          <Svg src={I.x} />
        </button>
        <header className="st-m-h">
          <div className="st-m-id">
            {s.status}
            <i />
            {s.type}
          </div>
          <div className="st-m-t">
            <h2 id="st-m-title">{s.name}</h2>
            <p>{s.sub}</p>
          </div>
          <div className="st-m-stats">
            <div>
              <span>Capital</span>
              <b>{closed ? '—' : usd(v)}</b>
            </div>
            <div>
              <span>APR</span>
              <b>{closed ? '—' : `${num(s.apr, s.apr % 1 ? 1 : 0)}%`}</b>
            </div>
            <div>
              <span>New entry</span>
              <b>
                {s.entry}
                {s.entry === 'Paused' && <NotifyChip id={s.id} />}
              </b>
            </div>
          </div>
          <div className="st-m-strip">
            {(
              [
                ['Chain', s.chain],
                ['Coin', s.coin],
                ['Mechanism', s.mech],
                ['Max weight', closed ? '—' : s.maxW + '%'],
                ['Difficulty', s.diff],
              ] as [string, string][]
            ).flatMap(([k, val], i) => [
              i ? <i key={'i' + k} /> : null,
              <div key={k}>
                <span>{k}</span>
                <b>{val}</b>
              </div>,
            ])}
          </div>
        </header>
        <div className="st-m-b">
          <section className="st-sec">
            <h3 className="st-sh">What it is</h3>
            <div className="st-what">
              {s.what.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
          <ForYou s={s} />
          <section className="st-sec">
            <h3 className="st-sh">How to enter</h3>
            <div className="st-steps">
              {s.steps.map((p, i) => (
                <div className="st-step" key={i}>
                  <span className="n">{i + 1}</span>
                  <p>{p}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="st-sec">
            <h3 className="st-sh">Good to know</h3>
            <ul className="st-good">
              {s.good.map((g, i) => (
                <li key={i}>
                  <Md text={g} />
                </li>
              ))}
            </ul>
          </section>
          <section className="st-sec">
            <div className="st-risks">
              {s.risks.map((r) => {
                const fy = riskForYou(s, r.fy);
                return (
                  <div className="st-risk" key={r.t}>
                    <div style={{ paddingLeft: 23 }}>
                      <h4>
                        <Svg src={WARN} />
                        {r.t}
                      </h4>
                      <p>{r.p}</p>
                      {fy && (
                        <p className="fy">
                          <Spark />
                          <span>
                            <b>For you:</b> {fy}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="st-disc">{DISCLAIMER}</p>
          </section>
          <section className="st-sec">
            <div className="st-calls">
              {s.calls.map((c) => (
                <button className="st-call" key={c.at} onClick={() => toast(`In the product this opens the recording at ${c.at}.`)}>
                  <Svg src={PLAY} />
                  <span className="tt">
                    {c.t}
                    <small>{c.about}</small>
                  </span>
                  <span className="mm" title="Wega found where this strategy is discussed">
                    <Spark />
                    {c.at}
                  </span>
                  <span className="ch">
                    <Svg src={I.chev} />
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
