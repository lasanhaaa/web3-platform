/* What Wega is sent: the rules, the platform data shared by every member, one member's data, the page and the question.
   Platform content (model portfolio, strategy guides, research, calls) is members-only, so it is read from the data
   folder at run time and never committed. See data/README.md. */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const DATA_DIR = process.env.WEGA_DATA || new URL('./data/', import.meta.url).pathname;
const read = (f) => {
  const p = join(DATA_DIR, f);
  if (!existsSync(p)) throw new Error(`Missing data file ${p}. See data/README.md.`);
  return readFileSync(p, 'utf8').trim();
};
const maybe = (f) => (existsSync(join(DATA_DIR, f)) ? read(f) : null);

/* ---------- rules: the same for everyone, never changes between requests ---------- */
export const RULES = `You are Wega, the AI helper of Web3 Universe, a members' club for DeFi. Members follow a real-money model portfolio, copy its strategies step by step, learn in the Academy and watch live calls. You sit beside every page.

Rules:
- Not financial advice. Never tell a member to buy, sell, enter or exit. Show the options, the math and the risks, and let the member decide.
- Only platform data. Use the platform data and member data below and the current page. If something isn't there, say you can't see it, instead of guessing. Never invent numbers, dates, reasons or quotes.
- Short. In the panel and the lesson chat answer in 120 words at most, on the Wega page in 150, unless the member asks for more.
- Quizzes: while a question is open, give a hint at most and never reveal or confirm the answer. After it is answered, explain with the course's explanation.
- Point to a lesson when one fits.
- Charts and cards come from the app's templates: call a template tool and the app draws it under your answer from live data. Never draw a chart, a table or ASCII art yourself. Use a template only when it helps, one per answer as a rule.
- Answer about what the member is looking at: the page, the lesson moment, the strategy, their positions.
- Language: answer in the member's platform language, English or German. Strategy guides are written in German; explain them in the member's language.
- Plain words for members over 40 with little tech experience. Short paragraphs, lists with "- " for steps, **bold** sparingly. No headings, no tables.

Not part of Wega (say so in one sentence and point to the right place):
- The member's loans, Health Factor, liquidation prices and LP ranges: Wega can't see them. General explanations from the lessons are fine.
- Wallet approvals and anything that needs on-chain checks beyond the balances below.
- Personal finances, taxes.
- Account, login, billing and subscription questions: the support chat at the bottom right handles those.`;

/* ---------- the model portfolio: two weekly snapshots, as on the Track Record page ---------- */
function snapshots(text) {
  const out = [];
  let cur = null;
  for (const line of text.split('\n')) {
    const m = line.match(/^Snapshot (.+?) · capital \$([\d,]+)/);
    if (m) out.push((cur = { date: m[1], capital: m[2], rows: [] }));
    else if (cur && line.includes(' | ') && !line.startsWith('Protocol')) {
      const [protocol, strategy, holdings, weight, ret] = line.split(' | ').map((s) => s.trim());
      cur.rows.push({ protocol, strategy, holdings, weight: parseInt(weight), ret });
    }
  }
  return out;
}
const TRACK = read('track-record.txt');
export const SNAP = snapshots(TRACK);

/* What the app computes from two snapshots: positions added, closed and re-weighted. Wega explains it, it doesn't diff. */
export function changes(a = SNAP[1], b = SNAP[0]) {
  const k = (r) => (r.strategy === '–' ? r.protocol : `${r.protocol} (${r.strategy})`);
  const A = new Map(a.rows.map((r) => [k(r), r])),
    B = new Map(b.rows.map((r) => [k(r), r]));
  const added = [],
    closed = [],
    moved = [];
  for (const [n, r] of B) if (!A.has(n)) added.push(`${n} ${r.weight}%`);
  for (const [n, r] of A) if (!B.has(n)) closed.push(`${n}, was ${r.weight}%`);
  for (const [n, r] of B) if (A.has(n) && A.get(n).weight !== r.weight) moved.push(`${n} ${A.get(n).weight}% → ${r.weight}%`);
  return `Changes from the ${a.date} snapshot to the ${b.date} snapshot (computed by the app):\n- Weight changed: ${moved.join('; ')}\n- New: ${added.join('; ')}\n- Closed: ${closed.join('; ')}`;
}

/* ---------- strategies: key facts for the list; the full German guide only on the strategy's own page ---------- */
export const GUIDE = { GMTrade: read('strategy-gmtrade.txt'), Variational: read('strategy-variational.txt'), Hyperliquid: read('strategy-hyperliquid.txt') };
const keyFacts = (t) => {
  const l = t.split('\n');
  const advice = l.find((x) => /Neueinst/.test(x));
  return `${l[0]}. ${l[1]}${advice ? `. Entry advice (German): "${advice.trim()}"` : ''}`;
};

/* ---------- Academy: routes, zones and lessons as in the prototype (src/lib/curriculum.ts) ---------- */
export const ROUTES = [
  ['academy', 'Academy', 'Required start', [['Academy', ['Start', 'Wallet', 'On-ramps', 'Intro to DeFi']]]],
  ['r1', 'DeFi Fundamentals', 'Route 1', [
    ['Swaps & Approvals', ['Swapping vs. bridging: the difference', 'Swap protocols and aggregators', 'Checks before a swap', 'Approvals', 'Swap example (EVM)']],
    ['Bridges & Routes', ['Bridging basics', 'Choosing and checking a route', 'Bridge example (EVM)', 'USDC bridge (CCTP)', 'USDT0 and XAUT0 bridge', 'Bridge from EVM to Solana', 'Troubleshooting ladder for technical issues']],
    ['Lending & Collateral', ['Lending basics', 'Collateral and liquidation', 'Aave', 'Morpho', 'Lending example', 'Putting your HODL stack to work', 'BTC in DeFi', 'BTC routes, worked example']],
  ]],
  ['r2', 'DeFi Strategies', 'Route 2', [
    ['Perp DEX & Funding', ['Perp DEX basics', 'Funding', 'Margin and liquidation', 'Order book', 'Perp example', 'Vault', 'Vault example', 'Funding rate farming basics', 'Selection and monitoring', 'FRF example']],
    ['DeFi Strategies', ['USDC hedge (perp & lending)', 'Staking: basics', 'Staking example', 'V3 with correlated assets', 'V2 pool: stable + 2 volatile assets', 'IL: impermanent loss', 'Dexscreener, Dextools, GeckoTerminal', 'V2 pool example + IL offset']],
    ['DeFi Expert', ['Total return strategy', 'Uniswap V3 + basics', 'V3 example + pointer to PerpPilot', 'Looping: the 3 types, oracles', 'Depeg monitor', 'LSTs explained', 'Looping yield calculation', 'Looping example', 'Arbitrage', 'Arbitrage example']],
  ]],
  ['r3', 'PerpPilot', 'Route 3', [
    ['PerpPilot Start', ['Introduction: what is PerpPilot', 'Sign-up (24h waiting period)', 'Connecting DEXs (Extended, Nado, Hyperliquid, Lighter)', 'Pointbot basics', 'Pointbot setup']],
    ['PerpPilot Advanced', ['V3 basics', 'V3 DEX simulator tool', 'Setting up the V3 bot with an initial long', 'Setting up the V3 bot without an initial long', 'Calculating V3 leverage', 'Closing V3 (out of range, in range)']],
  ]],
];
const MINS = [12, 18, 9, 24, 15, 21, 7, 14, 11, 19, 16, 8, 22, 13, 10, 17];
export const dur = (ri, zi, li) => MINS[(ri * 7 + zi * 5 + li * 3) % MINS.length];
export const LESSONS = ROUTES.flatMap(([, , , zones], ri) => zones.flatMap(([, ls], zi) => ls.map((t, li) => ({ t, ri, zi, li, min: dur(ri, zi, li) }))));
const academyText = ROUTES.map(
  ([, name, label, zones], ri) =>
    `${label} "${name}": ` + zones.map(([z, ls], zi) => `zone "${z}" (${ls.map((t, li) => `${t} ${dur(ri, zi, li)} min`).join('; ')})`).join(' · '),
).join('\n');

const calls = read('live-calls.txt');
const research = read('research-week41.txt');
const researchHead = research.split('\n').slice(0, 10).join('\n');

/* ---------- platform data: the same for every member, changes once a week ---------- */
export const PLATFORM = `PLATFORM DATA (today is Oct 19, 2026)

Model portfolio
${TRACK.split('\n')[0]}
Latest weekly snapshot, ${SNAP[0].date}, capital $${SNAP[0].capital}:
${SNAP[0].rows.map((r) => `- ${r.protocol}: ${r.strategy === '–' ? '' : r.strategy + ', '}$${r.holdings.replace('$', '')}, weight ${r.weight}%, farm return ${r.ret}`).join('\n')}
${changes()}
${TRACK.split('\n').filter((l) => l.startsWith('Strategy status')).join('')}

Strategy details on the Strategies page (others show name and status only):
- ${keyFacts(GUIDE.GMTrade)}
- ${keyFacts(GUIDE.Variational)}
- ${keyFacts(GUIDE.Hyperliquid)}

Academy (an Academy quiz opens all three routes; every zone ends with a 5-question quiz, 4 correct answers earn the zone's badge; 9 badges, and a certificate for each finished route):
${academyText}

Coin Watchlist (close of Oct 11, from the Week 41 briefing): BTC about $83,000 (week −4%), ETH about $2,500 (week −9%). No other coin prices are available.
Depeg Tracker: watches the liquid staking pairs bnSOL/SOL, kHYPE/HYPE, jitoSOL/SOL and cbETH/ETH. The current ratios are not in this data; the peg chart template shows them.

Live calls
${calls}

Research: the latest weekly briefing
${researchHead}`;

/* ---------- members (test data, not real people) ---------- */
const alexWallet = `Wallet balances (read from public wallet data, Oct 19): total $9,850.
- Variational: $2,900 (29%)
- Hyperliquid: $1,700 (17%)
- Extended, perp DEX airdrop farming + vault: $1,000 (10%)
- AFX: $900 (9%)
- USDC idle on Arbitrum: $2,100 (21%)
- ETH in the wallet: 0.4 ETH, $1,000 (10%)
- USDC in Phantom on Solana: $250 (3%)
About 10% of the total moves with the ETH price; the rest is USDC or in the strategies above.`;

function progress(done) {
  // done: { 'r1.1': 5 } = lessons finished per zone; zones not listed are untouched.
  let d = 0,
    t = 0;
  const z = [];
  ROUTES.forEach(([id, name, label, zones], ri) =>
    zones.forEach(([zn, ls], zi) => {
      const k = `${id}.${zi}`,
        n = Math.min(done[k] || 0, ls.length);
      d += n;
      t += ls.length;
      if (n) z.push(`${zn} (${label}) ${n} of ${ls.length}${n === ls.length ? ', quiz passed, badge earned' : `, open: ${ls.slice(n).map((x, i) => `${x} ${dur(ri, zi, n + i)} min`).join('; ')}`}`);
    }),
  );
  return `Academy progress: ${d} of ${t} lessons. ${z.join(' · ')}.`;
}

export const MEMBERS = {
  alex: {
    lang: 'English',
    text: `MEMBER
Alex (test member). Member since Aug 2026. Platform language: English. Last visit: Sep 28, 2026, before the ${SNAP[0].date} snapshot.
${progress({ 'academy.0': 4, 'r1.0': 5, 'r1.1': 5, 'r2.0': 7 })}
Badges: 2 of 9 (Academy, Swaps & Approvals). Certificates: 0 of 3. Current lesson: Funding rate farming basics.
${alexWallet}`,
  },
  sam: {
    lang: 'English',
    text: `MEMBER
Sam (test member). Member since Oct 17, 2026, first week. Platform language: English. No wallet connected and no snapshot, so Wega can't see any positions. The app can show the model portfolio instead, with an "Add your wallet" button.
${progress({ 'academy.0': 2 })}
Badges: 0 of 9. Certificates: 0 of 3. Current lesson: On-ramps.`,
  },
};
// The same member with the platform switched to German (DT), to price and check German answers.
MEMBERS['alex-de'] = { lang: 'German', text: MEMBERS.alex.text.replace('Platform language: English', 'Platform language: German (answer in German)') };

/* ---------- pages: what the app sends about the page the member is on ---------- */
const FRF = `Current page: Lesson "Funding rate farming basics" (${LESSONS.find((l) => l.t === 'Funding rate farming basics').min} min), zone "Perp DEX & Funding", Route 2 DeFi Strategies, in the lesson chat beside the video (120 words). Video at 4:10. Lesson outline: Funding rate farming collects funding without betting on the price: you hold the coin and short the same amount as a perp. The price moves cancel out. What is left is the funding you collect.`;
const TRANSCRIPT = maybe('lesson-frf-transcript.txt');
const QUIZ = `Current page: Quiz "Perp DEX & Funding" (Route 2), question 4 of 5: "ETH rises 10%. What happens to your short?" Trade ticket: side Short, deposit $1,000, leverage 10x, ETH moves +10%. Options: You earn $1,000 | You lose $100 | You lose all $1,000: liquidated.`;
const strat = (n, extra = '') => `Current page: Strategy "${n}" (strategy modal, Wega panel, 120 words). The strategy page as published (German):\n${GUIDE[n]}${extra}`;

export const PAGES = {
  overview: 'Current page: Overview, the home page with widgets (Wega panel, 120 words).',
  wega: 'Current page: the Wega page, a full-page chat (150 words).',
  lesson: FRF,
  'lesson-transcript': TRANSCRIPT && `${FRF}\nLesson transcript (stand-in written from the outline, for measuring size and cost):\n${TRANSCRIPT}`,
  'quiz-open': `${QUIZ}\nThe question is still open: do NOT reveal or confirm the correct answer, give a hint at most.`,
  'quiz-wrong': `${QUIZ}\nAlready answered. The member chose "You lose $100", which is wrong. Correct answer: "You lose all $1,000: liquidated". Explanation from the course: A short loses when the price rises. With 10x, a 10% rise wipes out your whole deposit, so the position is liquidated at about +9%, before ETH even gets to +10%.`,
  'quiz-right': `Current page: Quiz "Perp DEX & Funding" (Route 2), question 2 of 5, fill the gaps: "When funding is positive, ___ pay ___." Already answered correctly: "longs pay shorts". Explanation from the course: Positive funding means longs pay shorts. It keeps the perp price close to the spot price.`,
  academy: 'Current page: Academy home: the current course (Route 2 DeFi Strategies) as one big card, the other courses as cards (Wega panel, 120 words).',
  badges: 'Current page: Badges & Certificates (Wega panel, 120 words).',
  gmtrade: strat('GMTrade', '\nThe member holds no position in this strategy.'),
  'gmtrade-guide': strat('GMTrade', '\nThe member holds no position in this strategy. Guide in progress: "Guide me through entering" is at the GMTrade step 5, "GLV (Forex) staken".'),
  variational: strat('Variational', '\nThe member holds $2,900 in this strategy (29% of their wallet).'),
  hyperliquid: strat('Hyperliquid', '\nThe member holds $1,700 in this strategy (17% of their wallet).'),
  strategies: 'Current page: Strategies, the list of all strategies with their status (Wega panel, 120 words).',
  track: 'Current page: Track Record, the weekly snapshots of the model portfolio (Wega panel, 120 words).',
  calls: 'Current page: Live calls, the feed of recorded calls (Wega panel, 120 words).',
  depeg: 'Current page: Depeg Tracker (Wega panel, 120 words).',
  research: `Current page: Research, Weekly Briefing Week 41 (Wega panel, 120 words). Full text:\n${research}`,
  'passage-variational': 'Current page: the Wega page (150 words). The member selected this passage of your previous answer and asks about it: "Your Variational position is $2,900, about 29% of your wallet, while the model portfolio holds 12%."',
  'passage-apr': 'Current page: the Wega page (150 words). The member selected this passage of your previous answer and asks about it: "GMTrade\'s APR is 15%, paid partly as a bonus in GT tokens."',
};

/* ---------- the app's chart and card templates. Claude only picks one and its settings; the app draws it. ---------- */
const PROTOCOLS = [...new Set(SNAP.flatMap((s) => s.rows.map((r) => r.protocol)))].filter((p) => p !== 'Wallet');
const tool = (name, description, properties = {}) => ({
  name,
  description,
  strict: true,
  input_schema: { type: 'object', properties, required: Object.keys(properties), additionalProperties: false },
});
export const TOOLS = [
  tool('show_strategy_card', 'Show a strategy card (name, APR, status, difficulty, entry advice, button to open it). Use it when you talk about a strategy the member is not already looking at.', {
    strategy: { type: 'string', enum: PROTOCOLS },
  }),
  tool('show_portfolio_changes', 'Show what changed in the model portfolio: positions added, closed and re-weighted.', {
    period: { type: 'string', enum: ['since_last_visit', 'last_snapshot'] },
  }),
  tool('show_call_moment', 'Show a live call with a button that starts the video at a chapter. Only for chapters listed in the platform data.', {
    call_date: { type: 'string', enum: ['2026-10-15', '2026-10-14', '2026-10-13', '2026-10-08', '2026-10-07'] },
    start: { type: 'string', description: 'Chapter start as hh:mm:ss, or 00:00:00 for the start of the call.' },
  }),
  tool('show_peg_chart', "Show the Depeg Tracker's chart for one liquid staking pair, with its peg bands.", {
    pair: { type: 'string', enum: ['bnSOL/SOL', 'kHYPE/HYPE', 'jitoSOL/SOL', 'cbETH/ETH'] },
  }),
  tool('show_coin_chart', 'Show the price chart of a coin from the Coin Watchlist, optionally compared with a second coin.', {
    coin: { type: 'string', enum: ['btc', 'eth'] },
    period: { type: 'string', enum: ['1M', 'YTD', '1Y', '5Y'] },
    compare: { type: 'string', enum: ['none', 'btc', 'eth'] },
  }),
  tool('show_what_if', "Show the 'what if a coin moves' card: the member's total before and after a price move. The app does the math.", {
    coin: { type: 'string', enum: ['btc', 'eth'] },
    change_pct: { type: 'integer', description: 'For example -30 for a 30% drop.' },
  }),
  tool('show_exposure', "Show how much of the member's total depends on each coin and protocol."),
  tool('show_vs_model_portfolio', "Show the member's weights next to the model portfolio's, position by position."),
  tool('show_stablecoin_earnings', "Show the member's idle stablecoins and what the model portfolio's stablecoin strategies pay."),
  tool('show_learning_path', "Show the member's Academy progress: done, open, minutes left and the next badge."),
  tool('link_lesson', 'Show a button to an Academy lesson.', { lesson: { type: 'string', enum: LESSONS.map((l) => l.t) } }),
];
export const TOOL_RESULT = 'Shown to the member under your answer.';
