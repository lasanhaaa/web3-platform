'use client';
/* Wega on the Strategies page: context, chips, system prompt facts and scripted answers (s_* intents).
   Wega explains and sizes strategies with the user's sample numbers. It never tells anyone to buy or sell. */
import type { Answer, Chip, WegaPage } from './wega';
import { STRATS, GROUPS, WALLET, strat, readiness, lessonOf, sizeFor, fitScore, PORTFOLIO, LAST_VISIT, liqDist, DIFF, toggleNotify, stUi, type Strat } from './strategies';
import { num, usd } from './portfolio';
import { hrefLesson, hrefStrategies } from './nav';
import { toast } from './toast';
import { GoBtn, Spark } from './wega-brain';
import { GOAL } from './curriculum';

const pctF = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${num(Math.abs(n), 2)}%`;
const perYear = (s: Strat, amt = sizeFor(s)) => Math.round((amt * s.apr) / 100);

export function stratCtxLabel(p: WegaPage) {
  const s = strat(p.sid);
  return s ? `Strategies · ${s.name}` : 'Strategies · Model portfolio';
}
export function stratChips(p: WegaPage): Chip[] {
  const s = strat(p.sid);
  if (s) {
    const c: Chip[] = [
      ['Explain it simply', 's_explain'],
      ['How much would I put in?', 's_size'],
      ['What are the risks for me?', 's_risk'],
    ];
    if (s.legs && s.status !== 'Closed') c.push(['Check my setup', 's_setup']);
    return c;
  }
  return [
    ['What changed since my last visit?', 's_changes'],
    ['Which strategy fits me?', 's_fit'],
    ['How is the model portfolio doing?', 's_overview'],
  ];
}
export function stratHello(p: WegaPage) {
  const s = strat(p.sid);
  return s
    ? `You’re looking at ${s.name}. I can explain it, size it to your portfolio or check your setup.`
    : 'I know the model portfolio and what you’ve learned so far. Ask me what changed or what fits you.';
}
export function stratRules(p: WegaPage) {
  const s = strat(p.sid);
  const mp = `Model portfolio Wallet 1: $74,174 (+20.24%): ${GROUPS.map((g) => `${g.name} ${usd(g.val[1])}`).join(', ')}.`;
  if (!s) return `Strategies page, model portfolio. ${mp} Strategies: ${STRATS.map((x) => `${x.name} (${x.status}, ${x.apr}% APR, ${x.diff})`).join('; ')}.`;
  const r = readiness(s);
  return `Strategy “${s.name}” (${s.status}, new entries ${s.entry}). ${s.sub} APR ${s.apr}%, chain ${s.chain}, coin ${s.coin}, mechanism ${s.mech}, max weight ${s.maxW}%, difficulty ${s.diff}. What it is: ${s.what.join(' ')} How to enter: ${s.steps.map((x, i) => `${i + 1}. ${x}`).join(' ')} Good to know: ${s.good.join(' ').replace(/\*\*/g, '')} Risks: ${s.risks.map((x) => `${x.t}: ${x.p}`).join(' ')} The user's size at max weight: ${usd(sizeFor(s))} of a $${num(PORTFOLIO)} sample portfolio. Lessons done for this strategy: ${r.done} of ${r.total}${r.missing.length ? ` (missing: ${r.missing.map((k) => lessonOf(k).t).join(', ')})` : ''}. ${mp}`;
}

/* free text on this page */
export function stratRoute(s: string, p: WegaPage): Answer | null {
  const has = (re: RegExp) => re.test(s),
    open = !!strat(p.sid);
  if (open && has(/setup|my position|check/)) return stratAnswer('s_setup', null, p);
  if (has(/risk|danger|lose|liquidat|safe/) && open) return stratAnswer('s_risk', null, p);
  if (has(/how much|size|invest|put in|amount|allocate/)) return stratAnswer(open ? 's_size' : 's_fit', null, p);
  if (has(/chang|since|new|update|last visit/)) return stratAnswer('s_changes', null, p);
  if (has(/fit|which|recommend|best|for me|start with/)) return stratAnswer('s_fit', null, p);
  if (has(/portfolio|model|allocation|doing|perform/)) return stratAnswer('s_overview', null, p);
  if (open && has(/explain|what is|simple|how does|mean/)) return stratAnswer('s_explain', null, p);
  return null;
}

const Acts = ({ children }: { children: React.ReactNode }) => <div className="wg-acts">{children}</div>;
const Row = ({ k, v, cls }: { k: React.ReactNode; v: React.ReactNode; cls?: string }) => (
  <div className="wg-row">
    <span>{k}</span>
    <b className={cls}>{v}</b>
  </div>
);
function NotifyBtn({ id }: { id: string }) {
  const U = stUi.use();
  const on = U.notify.includes(id);
  return (
    <button
      className="btn ghost sm"
      aria-pressed={on}
      onClick={() => toast(toggleNotify(id) ? 'Wega will tell you when new entries reopen.' : 'Notification off.')}
    >
      {on ? 'Notifying you' : 'Notify me when entries reopen'}
    </button>
  );
}

/** Sample positions Wega "sees" for the setup check (in the product: read-only wallet connection). */
const SETUP: Record<string, { leg: string; amt?: string; margin?: number; ok: boolean }[]> = {
  'perp-airdrops': [
    { leg: 'BTC short · Variational', amt: '0.006 BTC', margin: 640, ok: true },
    { leg: 'BTC long · Extended', amt: '0.006 BTC', margin: 700, ok: true },
    { leg: 'SOL long · Variational', ok: false },
    { leg: 'SOL short · Extended', ok: false },
  ],
  'perp-farm': [
    { leg: 'ETH short · Hyperliquid', amt: '0.9 ETH', margin: 1450, ok: true },
    { leg: 'ETH long · Lighter', amt: '0.75 ETH', margin: 1380, ok: false },
  ],
  'lighter-hedge': [
    { leg: 'BTC long · Lighter', ok: false },
    { leg: 'BTC short · Hyperliquid', ok: false },
  ],
};

export function stratAnswer(i: string, _x: unknown, p: WegaPage): Answer | null {
  if (!i.startsWith('s_')) return null;
  const s = strat(p.sid);
  switch (i) {
    case 's_changes':
      return {
        text: `Three changes since your last visit on ${LAST_VISIT}:
- **Perp DEX Airdrops** paused new entries. Positions that are open stay open; the team is waiting for good referral terms with Nado.
- **Staking** went from 12% to 14% of the model portfolio, mostly SOL.
- **ETH Looping** was closed at **+18.30%** after the borrow rate caught up with the staking yield.

For you: none of this needs action. You don’t follow Perp DEX Airdrops yet, so nothing is paused for you.`,
        node: (
          <Acts>
            <GoBtn href={hrefStrategies('perp-airdrops')}>Open Perp DEX Airdrops</GoBtn>
            <NotifyBtn id="perp-airdrops" />
          </Acts>
        ),
        follow: [['Which strategy fits me?', 's_fit']],
      };
    case 's_fit': {
      const top = STRATS.filter((x) => x.status !== 'Closed')
        .sort((a, b) => fitScore(b) - fitScore(a))
        .slice(0, 3);
      return {
        text: `Ranked by fit, not by expected return. I matched the strategies to your goal (${GOAL}) and to the lessons you’ve finished:`,
        node: (
          <>
            <div className="wg-card">
              <div className="wg-rows">
                {top.map((x) => {
                  const r = readiness(x);
                  return (
                    <Row
                      key={x.id}
                      k={
                        <>
                          <b style={{ display: 'block', color: '#fff', textAlign: 'left' }}>{x.name}</b>
                          {x.diff} · {x.apr}% APR · {x.coin}
                        </>
                      }
                      v={r.missing.length ? `${r.missing.length} ${r.missing.length === 1 ? 'lesson' : 'lessons'} to go` : 'Ready'}
                      cls={r.missing.length ? undefined : 'ok'}
                    />
                  );
                })}
              </div>
            </div>
            <p className="wg-why">
              <Spark />
              <span>
                <b>Why {top[0].name} first:</b> {whyFirst(top[0])}
              </span>
            </p>
            <Acts>
              <GoBtn href={hrefStrategies(top[0].id)} cls="btn primary sm">
                Open {top[0].name}
              </GoBtn>
            </Acts>
          </>
        ),
        follow: [['How is the model portfolio doing?', 's_overview']],
      };
    }
    case 's_overview': {
      const w = WALLET[1],
        big = [...GROUPS].filter((g) => g.id !== 'idle').sort((a, b) => b.val[1] - a.val[1])[0],
        idle = GROUPS.find((g) => g.id === 'idle')!;
      return {
        text: `The model portfolio (Wallet 1) is at **${usd(w.total)}**, **${pctF(w.chg)}**. The biggest part is ${big.name} with ${Math.round((big.val[1] / w.total) * 100)}%; ${Math.round((idle.val[1] / w.total) * 100)}% is not deployed and waits for new entries.`,
        node: (
          <div className="wg-card">
            <div className="wg-rows">
              {GROUPS.map((g) => (
                <Row
                  key={g.id}
                  k={
                    <>
                      <i style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: g.color, marginRight: 8, verticalAlign: 2 }} />
                      {g.name}
                    </>
                  }
                  v={`${Math.round((g.val[1] / w.total) * 100)}% · ${usd(g.val[1])}`}
                />
              ))}
            </div>
          </div>
        ),
        follow: [
          ['What changed since my last visit?', 's_changes'],
          ['Which strategy fits me?', 's_fit'],
        ],
      };
    }
    case 's_explain': {
      if (!s) return stratAnswer('s_fit', null, p);
      return {
        text: `In plain words: ${s.simple}

It’s rated **${s.diff}** (${DIFF[s.diff].bars} of 10 bars). ${s.status === 'Closed' ? 'The team closed it, so there are no new entries.' : s.entry === 'Paused' ? 'New entries are paused right now.' : 'New entries are open.'}`,
        follow: [
          ['How much would I put in?', 's_size'],
          ['What are the risks for me?', 's_risk'],
        ],
      };
    }
    case 's_size': {
      if (!s) return stratAnswer('s_fit', null, p);
      if (s.status === 'Closed') return { text: `${s.name} is closed, so there’s nothing to size. It ended at **${pctF(s.ret)}**.` };
      const sz = sizeFor(s),
        half = Math.round(sz / 2);
      return {
        text: `The model portfolio holds at most **${s.maxW}%** in ${s.name}. Applied to your sample portfolio of **${usd(PORTFOLIO)}**, that’s up to **${usd(sz)}**.${s.legs ? `\n\nSplit across both sides: **${usd(half)}** on ${s.legs[0].dex} and **${usd(sz - half)}** on ${s.legs[1].dex}.` : ''}

At ${s.apr}% APR that would be about **${usd(perYear(s))} a year**, if the rate held, which it rarely does. That’s a ceiling, not a target; Wega doesn’t tell you to buy.`,
        follow: [['What are the risks for me?', 's_risk']],
      };
    }
    case 's_risk': {
      if (!s) return stratAnswer('s_fit', null, p);
      const tail = s.id === 'perp-airdrops' ? 'None of this is hypothetical: the guide names a real shutdown (HyENA, August 2026).' : 'The strategy page lists every risk the team sees.';
      return {
        text: `${s.risks.map((r) => `- **${r.t}:** ${riskForYou(s, r.fy) || r.p}`).join('\n')}\n\n${tail}`,
        follow: s.legs ? [['Check my setup', 's_setup']] : [['How much would I put in?', 's_size']],
      };
    }
    case 's_setup': {
      if (!s || !s.legs) return { text: 'I can check setups for strategies with two legs, like Perp DEX Airdrops. In the product this reads your wallet, read-only.' };
      const rows = SETUP[s.id] || [];
      const legs = rows.filter((r) => r.margin);
      const msg =
        s.id === 'perp-airdrops'
          ? 'Your BTC pair is balanced: **0.006 short** on Variational against **0.006 long** on Extended, and the margins ($640 and $700) are within 10% of each other. The SOL pair from step 3 is missing, so you farm points on one market only. New entries are paused, so there’s no rush to add it.'
          : s.id === 'perp-farm'
            ? 'Your two legs have drifted apart: **0.9 ETH short** against **0.75 ETH long**. That leaves about 0.15 ETH (≈ $480) unhedged. The guide rebalances above 10% drift; you’re at about 17%.'
            : 'I don’t see positions for this strategy in your sample wallets yet.';
      return {
        text: msg,
        node: (
          <>
            <div className="wg-card">
              <span className="k">Your positions · sample data</span>
              <div className="wg-rows">
                {rows.map((r) => (
                  <Row key={r.leg} k={r.leg} v={r.amt ? `${r.amt}${r.margin ? ` · $${num(r.margin)} margin` : ''}` : 'Missing'} cls={r.ok ? 'ok' : 'warn'} />
                ))}
              </div>
            </div>
            <Acts>
              {s.entry === 'Paused' ? <NotifyBtn id={s.id} /> : null}
              {legs.length ? null : <GoBtn href={hrefLesson('r2', 0, 4)}>Lesson “Perp example”</GoBtn>}
            </Acts>
          </>
        ),
        follow: [['What are the risks for me?', 's_risk']],
      };
    }
  }
  return null;
}

function whyFirst(s: Strat) {
  const miss = readiness(s).missing.map((k) => `“${lessonOf(k).t}”`),
    goal = /USD/.test(s.coin) ? `it pays in ${s.coin}, which fits your goal` : `it’s rated ${s.diff}`;
  return miss.length ? `${goal}, and you’re ${miss.length === 1 ? 'one lesson' : miss.length + ' lessons'} away: ${miss.join(' and ')}.` : `${goal}, and you’ve finished every lesson it needs.`;
}

/** The personal line Wega adds under a risk (also shown in the modal). */
export function riskForYou(s: Strat, fy?: string): string {
  if (!fy || s.status === 'Closed') return '';
  const sz = sizeFor(s),
    half = Math.round(sz / 2);
  if (fy === 'liq' && s.legs) return `At your ${usd(half)} per side and 3x, BTC would have to move about ${Math.round(liqDist(3, 'Short') * 100)}% against one leg before it’s liquidated. At 10x it’s only ${Math.round(liqDist(10, 'Short') * 100)}%.`;
  if (fy === 'liq') return `At 3x, a move of about ${Math.round(liqDist(3, 'Long') * 100)}% against you reaches liquidation.`;
  if (fy === 'zero') return `If nothing is paid out, you keep the hedged ${usd(sz)} minus fees and funding. The upside is the airdrop alone.`;
  return `Your ${usd(sz)} at max weight would be ${s.maxW}% of your sample portfolio, all exposed to this risk.`;
}
