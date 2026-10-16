'use client';
/* The Wega page (ideas doc "Wega page: Decade references and ideas"): a greeting, one input, six topics whose
   ready questions open on hover, and answers shown in a conversation (src/lib/wega-chat.ts).
   Client feedback (Oct 15): the Decade ideas are adapted to crypto and to data the platform has: the member's
   snapshot in My Portfolio (coins, protocols, amounts), the model portfolio, coin prices, the Academy and calls.
   All numbers are the prototype's sample data (the same portfolio as Wega's panel: src/lib/portfolio.ts). */
import { createStore } from './store';
import { PF, hfAt, liqAt } from './portfolio';
import { R, dur, ROUTES } from './curriculum';
import { focus, isDone, quizOpen, type Step } from './progress';
import { STRATS, fitScore, readiness, strat, sizeFor, valueOf, CHANGES, type Strat } from './strategies';
import { stepTitle, stepCrumb, whyNext } from './learn';
import { hrefLesson, hrefQuiz, hrefStrategies } from './nav';

/* ---------- categories and their ready prompts ---------- */
export type CatId = 'portfolio' | 'coins' | 'strategies' | 'simulations' | 'learn' | 'w3u';
export type Prompt = { label: string; href: string };
export type Cat = { id: CatId; label: string; icon: string; prompts: Prompt[] };

/** 24px outline icons (stroke = currentColor). */
const IC = {
  portfolio: 'M12 3a9 9 0 1 0 9 9h-9zM15 3.5A9 9 0 0 1 20.5 9H15z',
  coins: 'M3 17l5.5-6 4 4L21 6.5M15 6.5h6v6',
  strategies: 'M5 20 10 4M11 20 16 4M17 20 22 4',
  simulations: 'M9 3h6M10 3v6.5L4.8 18.2A1.9 1.9 0 0 0 6.4 21h11.2a1.9 1.9 0 0 0 1.6-2.8L14 9.5V3M7.2 15h9.6',
  learn: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15',
  w3u: 'M12 2 22 12 12 22 2 12ZM12 7l5 5-5 5-5-5Z',
};

export const CATS: Cat[] = [
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: IC.portfolio,
    prompts: [
      { label: 'Check my portfolio', href: '/wega/portfolio-check' },
      { label: 'How risky is my mix?', href: '/wega/risk-mix' },
      { label: 'Am I close to liquidation?', href: '/wega/scenario?s=liq' },
      { label: 'Are my stablecoins earning anything?', href: '/wega/idle-cost' },
      { label: 'Compare me with the model portfolio', href: '/wega/allocation' },
    ],
  },
  {
    id: 'coins',
    label: 'Coins',
    icon: IC.coins,
    prompts: [
      { label: 'How is ETH doing?', href: '/wega/asset?a=eth' },
      { label: 'How is Bitcoin doing?', href: '/wega/asset?a=btc' },
      { label: 'How is ARB doing?', href: '/wega/asset?a=arb' },
      { label: 'Is USDC holding its peg?', href: '/wega/asset?a=usdc' },
      { label: 'Compare ETH with Bitcoin', href: '/wega/asset?a=eth&vs=btc' },
    ],
  },
  {
    id: 'strategies',
    label: 'Strategies',
    icon: IC.strategies,
    prompts: [
      { label: 'Which strategy fits me as a beginner?', href: '/wega/ask?k=fit' },
      { label: 'Explain Carry Trades simply', href: '/wega/ask?k=carry' },
      { label: 'What changed in the model portfolio this week?', href: '/wega/ask?k=changes' },
      { label: 'How much would I put in Staking?', href: '/wega/ask?k=staking' },
    ],
  },
  {
    id: 'simulations',
    label: 'Simulations',
    icon: IC.simulations,
    prompts: [
      { label: 'What if ETH drops 30%?', href: '/wega/scenario?s=eth30' },
      { label: 'Simulate a crash like 2022', href: '/wega/scenario?s=crash22' },
      { label: 'What if ETH rises 30%?', href: '/wega/scenario?s=up30' },
      { label: 'What if USDC depegs like in March 2023?', href: '/wega/scenario?s=usdc' },
    ],
  },
  {
    id: 'learn',
    label: 'Learn',
    icon: IC.learn,
    prompts: [
      { label: 'What should I learn next?', href: '/wega/learning-path' },
      { label: 'Explain impermanent loss with my numbers', href: '/wega/ask?k=il' },
      { label: 'Summarize the last live call', href: '/wega/ask?k=call' },
      { label: 'Quiz me on my current zone', href: '/wega/ask?k=quiz' },
    ],
  },
  {
    id: 'w3u',
    label: 'Web3 Universe',
    icon: IC.w3u,
    prompts: [
      { label: 'How do I use the platform?', href: '/wega/ask?k=use' },
      { label: 'Where should I start?', href: '/wega/ask?k=start' },
      { label: 'What does my membership include?', href: '/wega/ask?k=membership' },
      { label: 'How is my data used?', href: '/wega/ask?k=data' },
    ],
  },
];
export const cat = (id: CatId) => CATS.find((c) => c.id === id)!;
export const isCat = (id: string | null | undefined): id is CatId => !!id && CATS.some((c) => c.id === id);

/* ---------- the member's snapshot (sample) ---------- */
export const SNAP_DATE = 'Oct 9';
export const SNAP_AGE = 5; // days, as of Oct 14
const ethV = PF.wEth * PF.eth, // 3,520
  arbV = PF.arb * PF.arbP, // 960
  aaveNet = PF.aEth * PF.eth - PF.debt; // 2,680
export const NET = ethV + PF.usdc + arbV + aaveNet + PF.lp; // 17,260
export const HF = hfAt(); // 1.42
export const LIQ = liqAt(); // $2,255
export const LIQ_DROP = 1 - LIQ / PF.eth; // 29.5%

/** Whole percentages that add up to 100 (largest remainder). */
export function shares(vals: number[]) {
  const tot = vals.reduce((a, b) => a + b, 0),
    raw = vals.map((v) => (v / tot) * 100),
    out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  raw
    .map((v, i) => [v - Math.floor(v), i] as const)
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (left > 0) {
        out[i]++;
        left--;
      }
    });
  return out;
}

/** What moves the member's money: their net worth split by the coin each part follows. The Aave loan is in USDC,
    so it is subtracted there; the LP is half ETH, half USDC. */
export type CoinRow = { id: 'eth' | 'usdc' | 'arb'; name: string; what: string; v: number; pct: number; items: { name: string; where: string; v: number }[] };
export const ETH_EXP = ethV + PF.aEth * PF.eth + PF.lp / 2; // 12,020
export function exposure(): CoinRow[] {
  const L = [
    {
      id: 'eth',
      name: 'ETH',
      what: 'Moves fully with the ETH price',
      items: [
        { name: 'In your wallet', where: '1.1 ETH', v: ethV },
        { name: 'Collateral on Aave', where: '2 ETH', v: PF.aEth * PF.eth },
        { name: 'Half of your Uniswap LP', where: 'ETH/USDC', v: PF.lp / 2 },
      ],
    },
    {
      id: 'usdc',
      name: 'USDC',
      what: 'Stays at one dollar',
      items: [
        { name: 'In your wallet', where: '5,900 USDC', v: PF.usdc },
        { name: 'Half of your Uniswap LP', where: 'ETH/USDC', v: PF.lp / 2 },
        { name: 'Your Aave loan', where: '3,720 USDC borrowed', v: -PF.debt },
      ],
    },
    { id: 'arb', name: 'ARB', what: 'Moves even more than ETH', items: [{ name: 'In your wallet', where: '1,500 ARB', v: arbV }] },
  ] as Omit<CoinRow, 'v' | 'pct'>[];
  const vs = L.map((l) => l.items.reduce((a, b) => a + b.v, 0)),
    p = shares(vs);
  return L.map((l, i) => ({ ...l, v: vs[i], pct: p[i] }));
}
/** How much the net worth moves when ETH moves 10% (the Aave loan makes it more than ETH's share of the snapshot). */
export const ETH_BETA = 1 - scen(-0.1).net / NET; // ≈ 7%

/** The model portfolio's types, grouped the way a member understands them. */
const KIND: Record<string, 'stable' | 'pool' | 'stake'> = {
  Looping: 'stable',
  Farming: 'stable',
  Vault: 'stable',
  'Carry trade': 'stable',
  Hedging: 'stable',
  'Liquidity pool': 'pool',
  Staking: 'stake',
};
/** Allocation check: the member's snapshot next to the model portfolio, both as a share of their total. */
export type AllocRow = { name: string; sub?: string; you: number; model: number };
export function allocRows(): AllocRow[] {
  const m = { stable: 0, pool: 0, stake: 0 };
  for (const x of STRATS) if (x.status !== 'Closed' && KIND[x.type]) m[KIND[x.type]] += valueOf(x, 'all');
  const [mStable, mPool, mStake] = shares([m.stable, m.pool, m.stake]);
  const [yPool, yIdle, yCoins] = shares([PF.lp, PF.usdc, ethV + arbV + aaveNet]);
  return [
    { name: 'Stablecoin strategies', sub: 'Vaults, carry trades, hedged farming', you: 0, model: mStable },
    { name: 'Liquidity pools', sub: 'You: ETH/USDC · Model: gold pools', you: yPool, model: mPool },
    { name: 'Staking', sub: 'SOL, HYPE', you: 0, model: mStake },
    { name: 'Stablecoins not in a strategy', you: yIdle, model: 0 },
    { name: 'Coins and loans', sub: 'ETH, ARB, your Aave loan', you: yCoins, model: 0 },
  ];
}

/** Stablecoins that aren't earning: what the model portfolio's easiest stablecoin strategies pay (APR from Strategies). */
export function stableYield(): { s: Strat; year: number }[] {
  return STRATS.filter((x) => KIND[x.type] === 'stable' && x.status === 'Active' && (x.diff === 'Beginner' || x.diff === 'Easy'))
    .sort((a, b) => a.apr - b.apr)
    .slice(0, 2)
    .map((x) => ({ s: x, year: (PF.usdc * x.apr) / 100 }));
}

/* ---------- scenarios ---------- */
export type ScenId = 'liq' | 'eth30' | 'up30' | 'crash22' | 'usdc';
export const SCENS: Record<ScenId, { title: string; kind: 'eth' | 'usdc'; init: number; cat: CatId }> = {
  liq: { title: 'Am I close to liquidation?', kind: 'eth', init: -0.3, cat: 'portfolio' },
  eth30: { title: 'What if ETH drops 30%?', kind: 'eth', init: -0.3, cat: 'simulations' },
  up30: { title: 'What if ETH rises 30%?', kind: 'eth', init: 0.3, cat: 'simulations' },
  crash22: { title: 'A crash like 2022', kind: 'eth', init: -0.75, cat: 'simulations' },
  usdc: { title: 'What if USDC depegs like in March 2023?', kind: 'usdc', init: 0.88, cat: 'simulations' },
};
export const isScen = (s: string | null): s is ScenId => !!s && s in SCENS;
/** The portfolio at an ETH change and a USDC price (other tokens unchanged). */
export function scen(ethChg: number, usdcP = 1) {
  const p = PF.eth * (1 + ethChg),
    usdcV = PF.usdc * usdcP,
    coll = PF.aEth * p,
    debt = PF.debt * usdcP,
    hf = (coll * PF.lt) / debt,
    lp = (PF.lp / 2) * usdcP + ((PF.lp / 2) * p) / PF.eth,
    net = PF.wEth * p + usdcV + arbV + coll - debt + lp;
  return { p, hf, net, usdcV, inRange: p >= PF.lpLo && p <= PF.lpHi, liquidated: hf < 1 };
}

/* ---------- learning path ---------- */
/** The member's next n steps (lessons and quizzes), starting at the current focus. */
export function nextSteps(n = 3): Step[] {
  const f = focus();
  if (!f) return [];
  const out: Step[] = [];
  let r = f.r,
    z = f.z,
    l = f.quiz ? -1 : f.l!;
  while (out.length < n) {
    const route = R(r);
    if (z >= route.zones.length) {
      if (r !== 'academy') break;
      r = 'r1';
      z = 0;
      l = 0;
      continue;
    }
    if (l >= 0 && l < route.zones[z].lessons.length) {
      if (!isDone(r, z, l)) out.push({ r, z, l });
      l++;
    } else {
      out.push({ r, z, quiz: true });
      z++;
      l = 0;
    }
  }
  return out;
}
export const stepMin = (s: Step) => (s.quiz ? 5 : dur(ROUTES.indexOf(R(s.r)), s.z, s.l));
export const stepHref = (s: Step) => (s.quiz ? hrefQuiz(s.r, s.z) : hrefLesson(s.r, s.z, s.l!));

/* ---------- text answers (scripted; live answers replace them when a model key is set) ---------- */
export type TextAnswer = { cat: CatId; q: string; a: string; next?: { label: string; href?: string; step?: Step }; follow?: string[] };
export function textAnswer(k: string): TextAnswer | null {
  const f = focus();
  switch (k) {
    case 'fit': {
      const top = STRATS.filter((s) => s.status !== 'Closed')
        .sort((a, b) => fitScore(b) - fitScore(a))
        .slice(0, 3);
      return {
        cat: 'strategies',
        q: 'Which strategy fits me as a beginner?',
        a:
          'These three fit best right now. I rank them by what you’ve already learned and how hard they are:\n' +
          top
            .map((s) => {
              const r = readiness(s);
              return `- **${s.name}**: ${s.diff}, ${s.apr}% APR. ${r.missing.length ? `${r.done} of ${r.total} prep lessons done.` : 'You’ve done all the prep lessons.'}`;
            })
            .join('\n') +
          `\n\nOpen one to see how it works, step by step. It’s information, not a recommendation for your money.`,
        next: { label: `Open ${top[0].name}`, href: hrefStrategies(top[0].id) },
        follow: ['/wega/ask?k=staking', '/wega/risk-mix'],
      };
    }
    case 'carry': {
      const s = strat('funding-carry')!,
        u = strat('usde-carry')!;
      return {
        cat: 'strategies',
        q: 'Explain Carry Trades simply',
        a: `${s.simple}\n\nThe model portfolio holds two of them:\n- **${s.name}**: ${s.apr}% APR, ${s.diff}\n- **${u.name}**: ${u.apr}% APR, ${u.diff}\n\nThe catch: funding can flip. When more people bet on falling prices, you pay the fee instead of collecting it.`,
        next: { label: `Open ${s.name}`, href: hrefStrategies(s.id) },
        follow: ['/wega/ask?k=fit', '/wega/ask?k=changes'],
      };
    }
    case 'changes':
      return {
        cat: 'strategies',
        q: 'What changed in the model portfolio this week?',
        a: `Three changes since your last visit on ${SNAP_DATE}:\n${CHANGES.map((c) => '- ' + c.html).join('\n')}\n\nNothing you hold yourself is affected.`,
        next: { label: 'Open Strategies', href: hrefStrategies() },
        follow: ['/wega/allocation', '/wega/ask?k=carry'],
      };
    case 'staking': {
      const sol = strat('sol-lst')!,
        hype = strat('hype-stake')!;
      return {
        cat: 'strategies',
        q: 'How much would I put in Staking?',
        a: `The model portfolio caps **${sol.name}** at **${sol.maxW}%** and **${hype.name}** at **${hype.maxW}%** of the portfolio.\n\nWith your **$17,260**, the same caps would be **$${sizeFor(sol).toLocaleString('en-US')}** and **$${sizeFor(hype).toLocaleString('en-US')}**.\n\nThat’s the upper limit the team works with, not an amount you should invest.`,
        next: { label: `Open ${sol.name}`, href: hrefStrategies(sol.id) },
        follow: ['/wega/ask?k=fit', '/wega/risk-mix'],
      };
    }
    case 'il':
      return {
        cat: 'learn',
        q: 'Explain impermanent loss with my numbers',
        a: `Your LP holds ETH and USDC and earns fees while ETH stays between **$2,900** and **$3,400**. When the price moves, the pool sells the asset that’s rising and buys the one that’s falling.\n\n- If ETH falls to **$2,900**, your LP is worth about **$3,574**. Just holding what you put in would be worth about **$4,049**. The gap, **$476**, is impermanent loss.\n- If ETH rises to **$3,400**, the gap is only about **$51**.\n\nIt’s “impermanent” because the gap shrinks again if ETH returns to $3,200, and the fees your LP earns make up for part of it.`,
        next: { label: 'Watch “IL: impermanent loss”', href: hrefLesson('r2', 1, 5) },
        follow: ['/wega/scenario?s=eth30', '/wega/risk-mix'],
      };
    case 'call':
      return {
        cat: 'learn',
        q: 'Summarize the last live call',
        a: `**DeFi (Basics) Live Call**, three parts:\n- **14:32** Sizing the hedge on Variational\n- **31:05** Why Extended’s vault doubles as margin\n- **48:40** Questions on points and airdrops\n\nStrategies mentioned: **Perp DEX Airdrops** and **Extended Vault**. The airdrop strategy has paused new entries since.`,
        next: { label: 'Open Perp DEX Airdrops', href: hrefStrategies('perp-airdrops') },
        follow: ['/wega/ask?k=changes', '/wega/learning-path'],
      };
    case 'quiz': {
      if (!f) return { cat: 'learn', q: 'Quiz me on my current zone', a: 'You’ve passed every quiz. Pick a zone in the Academy to practise again.', next: { label: 'Open the Academy', href: '/academy' } };
      const z = R(f.r).zones[f.z],
        done = z.lessons.filter((_: unknown, l: number) => isDone(f.r, f.z, l)).length,
        open = quizOpen(f.r, f.z);
      return {
        cat: 'learn',
        q: 'Quiz me on my current zone',
        a: `Your current zone is **${z.name}** (${stepCrumb(f)}). Its quiz has 5 questions and earns the zone’s badge.\n\n${open ? 'All lessons are done, so the quiz is open.' : `It opens when all lessons are done: **${done} of ${z.lessons.length}** so far. Until then, I can ask you practice questions inside each lesson.`}`,
        next: open ? { label: 'Start the quiz', step: { r: f.r, z: f.z, quiz: true } } : { label: 'Continue lesson', step: f },
        follow: ['/wega/learning-path', '/wega/ask?k=il'],
      };
    }
    case 'use':
      return {
        cat: 'w3u',
        q: 'How do I use the platform?',
        a: 'Web3 Universe has three parts that work together:\n- **Learn** in the Academy: short lessons, a quiz per zone and a badge for each.\n- **Follow** the model portfolio in Strategies: every position the team holds, with a step-by-step guide.\n- **Track** your own positions in My Portfolio, so I can check them for you.\n\nI’m on every page. Ask me about what you see, or come here for bigger questions.',
        next: { label: 'Go to the Academy', href: '/academy' },
        follow: ['/wega/ask?k=start', '/wega/ask?k=membership'],
      };
    case 'start':
      return {
        cat: 'w3u',
        q: 'Where should I start?',
        a: f
          ? `${f.r === 'academy' ? 'Start with the Academy. It’s the required first step: 4 short lessons and a quiz. After it, the three routes open.' : `You’ve already started. Next up is **${stepTitle(f)}** (${stepCrumb(f)}).`}\n\n${whyNext(f)}`
          : 'You’ve finished every lesson that’s open. Have a look at Strategies to see the course in practice.',
        next: f ? { label: f.quiz ? 'Start quiz' : 'Continue', step: f } : { label: 'Open Strategies', href: hrefStrategies() },
        follow: ['/wega/learning-path', '/wega/ask?k=use'],
      };
    case 'membership':
      return {
        cat: 'w3u',
        q: 'What does my membership include?',
        a: 'Your membership includes:\n- The full Academy with its three routes, badges and certificates\n- The model portfolio, with verified strategies and step-by-step guides\n- Live calls with market analysis, and their recordings\n- The portfolio tracker in My Portfolio\n- The Discord community\n- 1:1 support and onboarding\n\nPlans run for 6 months (€2,000) or 12 months (€3,500).',
        follow: ['/wega/ask?k=use', '/wega/ask?k=data'],
      };
    case 'data':
      return {
        cat: 'w3u',
        q: 'How is my data used?',
        a: 'I only read what’s on the platform: your snapshots in My Portfolio, your course progress and the page you’re on.\n\n- I can’t move money or sign anything. Every transaction is yours to sign.\n- I don’t see your seed phrase or private keys, and I’ll never ask for them.\n\nHow long questions are kept and which AI provider answers them will be set out in the privacy policy.',
        follow: ['/wega/ask?k=use', '/wega/ask?k=membership'],
      };
  }
  return null;
}

/** Where a typed question goes when it clearly asks for one of the result pages. */
export function routeQuestion(t: string): string | null {
  const s = t.toLowerCase();
  const has = (re: RegExp) => re.test(s);
  const coins = coinsIn(s);
  if (has(/depeg/)) return '/wega/scenario?s=usdc';
  if (has(/crash|2022/)) return '/wega/scenario?s=crash22';
  if (has(/rises?|goes up|pumps?|moons?/) && has(/eth/)) return '/wega/scenario?s=up30';
  if (has(/what if|drops?|falls?|dumps?/) && has(/eth/)) return '/wega/scenario?s=eth30';
  if (has(/liquidat|health factor/)) return '/wega/scenario?s=liq';
  if (coins.length >= 2 && coins[0] !== 'usdc' && coins[1] !== 'usdc') return `/wega/asset?a=${coins[0]}&vs=${coins[1]}`;
  if (coins.length === 1 && (has(/price|doing|chart|going|worth|how is|how's|peg|news/) || s.replace(/[^a-z]/g, '').length <= 9)) return `/wega/asset?a=${coins[0]}`;
  if (has(/risk|risky|volatil|moves my money/)) return '/wega/risk-mix';
  if (has(/idle|sitting|not deployed|earning|stablecoins/)) return '/wega/idle-cost';
  if (has(/model portfolio|compare/)) return '/wega/allocation';
  if (has(/check my portfolio|portfolio check/)) return '/wega/portfolio-check';
  if (has(/learn next|next lesson|what should i learn/)) return '/wega/learning-path';
  if (has(/impermanent/)) return '/wega/ask?k=il';
  if (has(/carry|funding/)) return '/wega/ask?k=carry';
  if (has(/stak/)) return '/wega/ask?k=staking';
  if (has(/beginner|which strategy/)) return '/wega/ask?k=fit';
  if (has(/membership|subscription|price|plan/)) return '/wega/ask?k=membership';
  if (has(/my data|privacy/)) return '/wega/ask?k=data';
  return null;
}

/** Coins named in a question, in the order they appear. */
function coinsIn(s: string) {
  const found: [number, 'eth' | 'btc' | 'arb' | 'usdc'][] = [];
  const look = (re: RegExp, c: 'eth' | 'btc' | 'arb' | 'usdc') => {
    const m = re.exec(s);
    if (m) found.push([m.index, c]);
  };
  look(/\b(eth|ether|ethereum)\b/, 'eth');
  look(/\b(btc|bitcoin)\b/, 'btc');
  look(/\b(arb|arbitrum)\b/, 'arb');
  look(/\busdc\b/, 'usdc');
  return found.sort((a, b) => a[0] - b[0]).map((x) => x[1]);
}

/** Label of a prompt href: what the member "says" when they tap it. */
export function promptLabel(href: string) {
  for (const c of CATS) for (const p of c.prompts) if (p.href === href) return p.label;
  return null;
}

/* ---------- things to check (the pill on the start page) ---------- */
export const CHECKS = [
  { id: 'hf', t: `Health Factor ${HF.toFixed(2)}`, s: `Liquidation if ETH falls to $${Math.round(LIQ).toLocaleString('en-US')}` },
  { id: 'idle', t: '5,900 USDC not earning', s: `Not in any strategy since ${SNAP_DATE}` },
  { id: 'eth', t: `${Math.round((ETH_EXP / NET) * 100)}% of your money moves with ETH`, s: `A 10% ETH move changes your net worth by about ${Math.round(ETH_BETA * 100)}%` },
];

/* ---------- follow-ups Wega suggests after each result ---------- */
export const RESULT_FOLLOW: Record<string, string[]> = {
  '/wega/portfolio-check': ['/wega/scenario?s=liq', '/wega/idle-cost', '/wega/risk-mix'],
  '/wega/risk-mix': ['/wega/asset?a=eth', '/wega/allocation'],
  '/wega/allocation': ['/wega/idle-cost', '/wega/ask?k=fit'],
  '/wega/idle-cost': ['/wega/allocation', '/wega/asset?a=usdc'],
  '/wega/scenario?s=liq': ['/wega/scenario?s=eth30', '/wega/asset?a=eth'],
  '/wega/scenario?s=eth30': ['/wega/scenario?s=crash22', '/wega/risk-mix'],
  '/wega/scenario?s=up30': ['/wega/scenario?s=eth30', '/wega/risk-mix'],
  '/wega/scenario?s=crash22': ['/wega/scenario?s=usdc', '/wega/risk-mix'],
  '/wega/scenario?s=usdc': ['/wega/asset?a=usdc', '/wega/idle-cost'],
  '/wega/asset?a=eth': ['/wega/scenario?s=liq', '/wega/asset?a=eth&vs=btc'],
  '/wega/asset?a=btc': ['/wega/asset?a=eth', '/wega/ask?k=fit'],
  '/wega/asset?a=arb': ['/wega/asset?a=eth', '/wega/portfolio-check'],
  '/wega/asset?a=usdc': ['/wega/idle-cost', '/wega/asset?a=eth'],
  '/wega/asset?a=eth&vs=btc': ['/wega/scenario?s=eth30', '/wega/risk-mix'],
  '/wega/learning-path': ['/wega/ask?k=quiz', '/wega/ask?k=il'],
};

/** The questions Wega suggests after an answer: a result's own, or those of a scripted text answer. */
export function followFor(href: string): string[] {
  const k = /[?&]k=([^&]+)/.exec(href)?.[1];
  return k ? textAnswer(k)?.follow || [] : RESULT_FOLLOW[href] || [];
}

/* ---------- page state: hide values ---------- */
export const wp = createStore({ hide: false, loaded: false });
const LS_HIDE = 'w3u-wega-hide';
export function wpLoad() {
  const W = wp.get();
  if (W.loaded) return;
  W.loaded = true;
  try {
    W.hide = localStorage.getItem(LS_HIDE) === '1';
  } catch {}
  wp.commit();
}
export function wpToggleHide() {
  const W = wp.get();
  W.hide = !W.hide;
  try {
    localStorage.setItem(LS_HIDE, W.hide ? '1' : '0');
  } catch {}
  wp.commit();
}
