'use client';
/* Strategies page data (Figma 915:29166 list, 2725:83996 modal). Perp DEX Airdrops carries the Figma copy;
   the other strategies, all amounts and returns are SAMPLE data for the prototype. */
import { createStore } from './store';
import { R } from './curriculum';
import { S } from './progress';

export type Diff = 'Beginner' | 'Easy' | 'Intermediate' | 'Advanced' | 'Professional';
/** Difficulty bars and colors from the design system (beginner → professional). */
export const DIFF: Record<Diff, { bars: number; c: string }> = {
  Beginner: { bars: 2, c: '#8EFF99' },
  Easy: { bars: 4, c: '#D3DD76' },
  Intermediate: { bars: 6, c: '#FFC95F' },
  Advanced: { bars: 8, c: '#FE963C' },
  Professional: { bars: 10, c: '#FF5F5F' },
};
export const DIFFS = Object.keys(DIFF) as Diff[];

export type Wallet = 1 | 2;
export type Risk = { t: string; p: string; fy?: string };
export type Call = { t: string; at: string; about: string };
export type Leg = { side: 'Short' | 'Long'; dex: string; asset: string };
export type Strat = {
  id: string;
  name: string;
  status: 'Active' | 'On hold' | 'Closed';
  type: string;
  /** allocation group in the model portfolio table */
  group: string;
  val: Partial<Record<Wallet, number>>;
  /** return since entry, in percent */
  ret: number;
  apr: number;
  mech: string;
  chain: string;
  coin: string;
  diff: Diff;
  maxW: number;
  entry: 'Open' | 'Paused' | 'Closed';
  icons: string[];
  sub: string;
  /** Wega's one-paragraph plain explanation */
  simple: string;
  what: string[];
  steps: string[];
  good: string[];
  risks: Risk[];
  calls: Call[];
  /** lesson keys (route.zone.lesson) that prepare for this strategy */
  needs: string[];
  sim: 'hedge' | 'yield';
  legs?: Leg[];
  added: string;
};

/* Glyphs from the Figma protocol tiles (32 viewBox). */
export const GLYPH: Record<string, string> = {
  avax: '<svg viewBox="0 0 32 32"><path fill="#E84142" fill-rule="evenodd" clip-rule="evenodd" d="M25.6 16a9.6 9.6 0 1 1-19.2 0 9.6 9.6 0 0 1 19.2 0Zm-12.32 3.82h-1.86c-.39 0-.59 0-.7-.08a.47.47 0 0 1-.22-.37c0-.14.09-.31.28-.65l4.6-8.1c.2-.35.3-.52.42-.58a.47.47 0 0 1 .43 0c.12.06.22.23.42.58l.94 1.65c.21.37.32.56.37.76.05.21.05.44 0 .65-.05.2-.15.39-.37.76l-2.42 4.27c-.21.37-.32.56-.47.7a1.4 1.4 0 0 1-.57.33c-.2.06-.42.06-.86.06Zm4.7 0h2.68c.39 0 .59 0 .7-.08a.47.47 0 0 0 .22-.37c0-.13-.09-.3-.27-.62l-1.35-2.31c-.19-.32-.29-.48-.41-.54a.47.47 0 0 0-.43 0c-.12.06-.22.23-.42.57l-1.33 2.29c-.2.34-.3.5-.29.64.01.15.09.29.22.37.11.08.31.08.7.08Z"/></svg>',
  lighter:
    '<svg viewBox="0 0 32 32"><path fill="#FEFEFE" d="M15.22 5.6c.08.12.02 14.98.05 16.52-.37.38-1 .88-1.43 1.24l-2.26 1.93c-.44.38-.87.71-1.29 1.11-.03-.17-.02-1.37-.02-1.63V13.9c0-1.12-.05-2.71.02-3.79.36-.5 1.15-1.1 1.62-1.54 1.08-1 2.24-1.97 3.31-2.97ZM21.71 15.57c.07.25.03 1.76.03 2.11v2.83c0 .46.03 1.21-.02 1.65-.27.35-.95.85-1.32 1.17a281 281 0 0 1-3.58 3.03c-.05-.25-.04-1.64-.03-2 .01-1.42-.02-2.85 0-4.26.26-.3.89-.82 1.21-1.11l2.58-2.31c.29-.26.93-.8 1.16-1.08Z"/></svg>',
  extended:
    '<svg viewBox="0 0 32 32"><path fill="#C1FF00" d="M17.69 14.42h6.57v2.98l-.04.17c-3.63.06-6.57 3.1-6.53 6.75l-3.43-.04v-6.7H7.72l-.04-3.16c3.65.03 6.62-3.1 6.58-6.74l3.43.04v6.7Z"/></svg>',
  usdc: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="9.6" fill="#2775CA"/><path fill="#fff" d="M18.6 17.6c0-1.4-.8-1.9-2.5-2.1-1.2-.2-1.4-.5-1.4-1s.4-.9 1.2-.9c.7 0 1.1.2 1.3.8l.1.1h.8v-.1a1.9 1.9 0 0 0-1.7-1.6v-.9h-.7v.9c-1 .1-1.7.8-1.7 1.6 0 1.3.8 1.8 2.5 2 1.1.2 1.5.5 1.5 1.1 0 .6-.5 1-1.3 1-1 0-1.4-.4-1.5-1h-.9c.1.9.7 1.5 1.9 1.7v.9h.7v-.9c1-.2 1.7-.8 1.7-1.7Z"/><path fill="#fff" d="M13.4 21.2a5.6 5.6 0 0 1 0-10.4v-.8a6.3 6.3 0 0 0 0 12v-.8Zm5.2-11.2v.8a5.6 5.6 0 0 1 0 10.4v.8a6.3 6.3 0 0 0 0-12Z" opacity=".9"/></svg>',
  sol: '<svg viewBox="0 0 32 32"><defs><linearGradient id="solg" x1="8" y1="22" x2="24" y2="10" gradientUnits="userSpaceOnUse"><stop stop-color="#9945FF"/><stop offset="1" stop-color="#14F195"/></linearGradient></defs><path fill="url(#solg)" d="M10.6 19.4a.5.5 0 0 1 .4-.2h12.5c.2 0 .4.3.2.5l-2.3 2.4a.5.5 0 0 1-.4.1H8.5c-.2 0-.4-.3-.2-.5l2.3-2.3Zm0-8.7a.5.5 0 0 1 .4-.2h12.5c.2 0 .4.3.2.5l-2.3 2.3a.5.5 0 0 1-.4.2H8.5c-.2 0-.4-.3-.2-.5l2.3-2.3Zm10.8 4.3a.5.5 0 0 0-.4-.2H8.5c-.2 0-.4.3-.2.5l2.3 2.3c.1.1.3.2.4.2h12.5c.2 0 .4-.3.2-.5l-2.3-2.3Z"/></svg>',
  eth: '<svg viewBox="0 0 32 32"><path fill="#C9D2FF" d="m16 6.4-.1.4v12.7l.1.1 5.9-3.5Z"/><path fill="#fff" d="M16 6.4 10.1 16.1l5.9 3.5Z"/><path fill="#C9D2FF" d="m16 20.7-.1.1v4.5l.1.3 5.9-8.4Z"/><path fill="#fff" d="M16 25.6v-4.9l-5.9-3.5Z"/></svg>',
  gold: '<svg viewBox="0 0 32 32"><path fill="#E2B65E" d="M9 21.5 11.4 15h9.2l2.4 6.5Z"/><path fill="#F5D58A" d="M12.4 14 14 9.5h4l1.6 4.5Z"/></svg>',
};
/** Hyperliquid's mark is a bitmap in the Figma file. */
export const PROTO_IMG: Record<string, string> = { hl: '/assets/proto-hl.png' };

export const PORTFOLIO = 17260; // the user's sample net worth (same as Wega's portfolio)
export const LAST_VISIT = 'Oct 9';

const FIGMA_DISC =
  'The figures shown are the allocation held in the model portfolio and are not a recommendation for your own situation. Digital assets can lose their entire value. Nothing here is investment, tax or legal advice, and past results do not indicate future performance. Positions are documented so members can verify them, not so they can be copied without understanding them.';
export const DISCLAIMER = FIGMA_DISC;
const CALL = 'DeFi (Basics) Live Call - 23.12.24';

export const STRATS: Strat[] = [
  {
    id: 'perp-airdrops',
    name: 'Perp DEX Airdrops',
    status: 'On hold',
    type: 'Looping',
    group: 'hedge',
    val: { 1: 4105 },
    ret: 2.7,
    apr: 15.2,
    mech: 'Looping',
    chain: 'Solana',
    coin: 'USDC',
    diff: 'Advanced',
    maxW: 8,
    entry: 'Paused',
    icons: ['extended', 'lighter', 'usdc'],
    sub: 'Farming the airdrops of new perp DEX protocols, hedged with opposite positions so price exposure stays close to zero.',
    simple:
      'You open the same trade twice in opposite directions, on two new exchanges. If BTC goes up, one side wins and the other loses the same amount, so the price barely matters. What you collect is the activity: exchanges reward it with points, and points can turn into an airdrop.',
    what: [
      'We farm the airdrops of new perp DEX protocols. Hyperliquid and Lighter paid out very good airdrops in the past, and newer perp DEXs reward early activity the same way.',
      'Points come from activity, so we farm the vault and open hedging shorts. Funding-rate arbitrage between DEXs can be worth farming too.',
    ],
    steps: [
      'Deposit margin on Variational and Extended. If you already have margin there, check that both sides are funded and the ratio still fits.',
      'Open a BTC short on Variational and a BTC long on Extended, with the same token amount.',
      'Open a SOL long on Variational and a SOL short on Extended, with the same token amount.',
    ],
    good: [
      '**Extended** is recommended because the vault capital doubles as margin: 90% of what you deposit is available as margin. It has its own strategy page.',
      '**Variational** could have a very strong airdrop. Please join with our ref link.',
      '**Robinhood** Lighter runs a live rewards program paid in LIT. Check each token’s open interest before sizing up.',
      '**Leverage:** on Variational, set it as high as possible. It moves your liquidation price further away, and since we trade in cross mode, your margin is what keeps you safe.',
      '**Nado is coming**. We will add a referral code once we negotiate good terms.',
    ],
    risks: [
      { t: 'Liquidation', p: 'We trade in cross mode, so the margin you hold is what keeps you safe. If margin runs low against your open positions, a position can be liquidated. Keep cross-account leverage low.', fy: 'liq' },
      { t: 'Protocol and smart-contract risk', p: 'New perp DEXs are young. A bug, an exploit or a shutdown can lock or cost you the funds held there, as with HyENA, which was shut down in August 2026.', fy: 'size' },
      { t: 'Airdrop uncertainty', p: 'Points are not a promise. Each protocol decides whether, when and how much it pays out, so the farming can earn little or nothing.', fy: 'zero' },
    ],
    calls: [
      { t: CALL, at: '14:32', about: 'Sizing the hedge on Variational' },
      { t: CALL, at: '31:05', about: 'Why Extended’s vault doubles as margin' },
      { t: CALL, at: '48:40', about: 'Questions on points and airdrops' },
    ],
    needs: ['r2.0.0', 'r2.0.2', 'r2.0.5', 'r2.0.7'],
    sim: 'hedge',
    legs: [
      { side: 'Short', dex: 'Variational', asset: 'BTC' },
      { side: 'Long', dex: 'Extended', asset: 'BTC' },
    ],
    added: '2026-09-02',
  },
  {
    id: 'perp-farm',
    name: 'Perp DEX Farming',
    status: 'Active',
    type: 'Farming',
    group: 'perp',
    val: { 1: 7240 },
    ret: 9.8,
    apr: 18.6,
    mech: 'Delta neutral',
    chain: 'Hyperliquid',
    coin: 'USDC',
    diff: 'Advanced',
    maxW: 10,
    entry: 'Open',
    icons: ['hl', 'lighter', 'usdc'],
    sub: 'Opposite perp positions on Hyperliquid and Lighter that earn points and funding while price exposure stays near zero.',
    simple:
      'Two exchanges, two opposite bets of the same size. The price move cancels out between them, and you keep what the exchanges pay for activity and what the funding rate pays the side it favors.',
    what: [
      'We hold a long on one perp DEX and an equally sized short on another. Price moves cancel out; the position earns trading points and, when funding diverges between the venues, a funding spread.',
      'The team rebalances when one side drifts by more than 10%, so neither leg carries a large unhedged position.',
    ],
    steps: [
      'Deposit USDC margin on Hyperliquid and on Lighter, roughly half on each.',
      'Open an ETH short on Hyperliquid and an ETH long on Lighter with the same token amount.',
      'Check both legs weekly and rebalance when they drift apart by more than 10%.',
    ],
    good: [
      '**Funding** is paid every hour on both venues. A spread between them is a bonus, not the plan.',
      '**Points** reset each season. The team posts the current season’s rules in the live call notes.',
    ],
    risks: [
      { t: 'Liquidation', p: 'Each leg has its own margin. A fast move can liquidate one side before you rebalance, leaving the other side unhedged.', fy: 'liq' },
      { t: 'Funding cost', p: 'Funding can turn against you on one venue for days and eat into the yield.', fy: 'size' },
    ],
    calls: [{ t: CALL, at: '22:10', about: 'Rebalancing the two legs' }],
    needs: ['r2.0.0', 'r2.0.1', 'r2.0.2', 'r2.0.7'],
    sim: 'hedge',
    legs: [
      { side: 'Short', dex: 'Hyperliquid', asset: 'ETH' },
      { side: 'Long', dex: 'Lighter', asset: 'ETH' },
    ],
    added: '2026-06-18',
  },
  {
    id: 'gldx-usdc',
    name: 'xStocks GLDx/USDC',
    status: 'Active',
    type: 'Liquidity pool',
    group: 'gldx-usdc',
    val: { 1: 13351 },
    ret: 6.2,
    apr: 11.4,
    mech: 'Concentrated LP',
    chain: 'Solana',
    coin: 'GLDx, USDC',
    diff: 'Intermediate',
    maxW: 18,
    entry: 'Open',
    icons: ['gold', 'usdc', 'sol'],
    sub: 'Tokenized gold paired with USDC in a concentrated pool, earning trading fees while gold stays inside the range.',
    simple: 'You become the exchange counter for gold and dollars. Every trade pays you a small fee, as long as the gold price stays inside the range you picked.',
    what: ['GLDx tracks the price of gold. Paired with USDC in a concentrated pool, the position earns fees from every trade that crosses its range.', 'Gold moves slowly, so the range can be tight and the fees per dollar are high.'],
    steps: ['Swap half of the amount to GLDx on Jupiter.', 'Open a GLDx/USDC position on the pool linked in the notes, with the range the team posts.', 'Check weekly whether the price is still inside the range.'],
    good: ['**Range:** the team posts the current range in each live call. Outside it, the position earns nothing.', '**GLDx** is a tokenized stock product: check its issuer terms before buying.'],
    risks: [
      { t: 'Impermanent loss', p: 'When gold moves strongly, the pool sells the side that rises. You end up with less than simply holding.', fy: 'size' },
      { t: 'Issuer risk', p: 'GLDx depends on its issuer holding the underlying asset.', fy: 'size' },
    ],
    calls: [{ t: CALL, at: '09:45', about: 'Choosing the GLDx range' }],
    needs: ['r1.0.2', 'r2.1.3', 'r2.1.5'],
    sim: 'yield',
    added: '2026-08-21',
  },
  {
    id: 'gldx-xaut',
    name: 'xStocks GLDx/XAUT',
    status: 'Active',
    type: 'Liquidity pool',
    group: 'gldx-xaut',
    val: { 1: 8901, 2: 6300 },
    ret: 3.1,
    apr: 6.8,
    mech: 'Correlated LP',
    chain: 'Ethereum',
    coin: 'GLDx, XAUT',
    diff: 'Easy',
    maxW: 12,
    entry: 'Open',
    icons: ['gold', 'eth'],
    sub: 'Two gold tokens in one pool. They move together, so the position earns fees with very little impermanent loss.',
    simple: 'Both sides of the pool are gold. Whatever gold does, the two tokens move together, so you mostly just collect the fees from people swapping between them.',
    what: ['GLDx and XAUT both track gold. Because they move together, the pool almost never leaves its range.', 'The yield is lower than the GLDx/USDC pool, and so is the risk.'],
    steps: ['Get XAUT on Ethereum, or bridge XAUT0 as shown in the lesson.', 'Swap half to GLDx.', 'Add both to the pool linked in the notes with a wide range.'],
    good: ['**Bridging XAUT0** is covered in the lesson “USDT0 and XAUT0 bridge”.'],
    risks: [{ t: 'Depeg', p: 'If one of the two tokens loses its link to gold, the pool fills up with the weaker one.', fy: 'size' }],
    calls: [{ t: CALL, at: '12:20', about: 'Correlated pools explained' }],
    needs: ['r1.0.2', 'r1.1.4'],
    sim: 'yield',
    added: '2026-07-30',
  },
  {
    id: 'hl-vault',
    name: 'Hyperliquid HLP Vault',
    status: 'Active',
    type: 'Vault',
    group: 'perp',
    val: { 1: 4610 },
    ret: 4.9,
    apr: 14.3,
    mech: 'Vault',
    chain: 'Hyperliquid',
    coin: 'USDC',
    diff: 'Easy',
    maxW: 8,
    entry: 'Open',
    icons: ['hl', 'usdc'],
    sub: 'USDC in Hyperliquid’s market-making vault, which earns from trading fees and liquidations.',
    simple: 'You lend your dollars to the exchange’s own trading desk. When it earns from fees and liquidations, you get your share; when it loses, so do you.',
    what: ['The vault provides liquidity on Hyperliquid and takes over liquidated positions. Depositors share its profit and loss.'],
    steps: ['Bridge USDC to Hyperliquid.', 'Deposit into the vault.', 'Withdrawals unlock after the vault’s lock period.'],
    good: ['**Lock period:** deposits stay locked for a few days after each deposit.'],
    risks: [{ t: 'Vault losses', p: 'In a sharp market move, the vault can lose money on the positions it takes over.', fy: 'size' }],
    calls: [{ t: CALL, at: '36:15', about: 'How the vault earns' }],
    needs: ['r2.0.5', 'r2.0.6'],
    sim: 'yield',
    added: '2026-05-12',
  },
  {
    id: 'extended-vault',
    name: 'Extended Vault',
    status: 'Active',
    type: 'Vault',
    group: 'perp',
    val: { 1: 4468 },
    ret: 5.6,
    apr: 16,
    mech: 'Vault',
    chain: 'Starknet',
    coin: 'USDC',
    diff: 'Intermediate',
    maxW: 8,
    entry: 'Open',
    icons: ['extended', 'usdc'],
    sub: 'Extended’s vault, where 90% of the deposit also counts as trading margin.',
    simple: 'The same dollars do two jobs: they earn in the vault, and the exchange lets you use most of them as margin for your trades.',
    what: ['Vault capital doubles as margin: 90% of what you deposit is available for positions. That makes it the base for the airdrop strategies.'],
    steps: ['Deposit USDC on Extended.', 'Move it into the vault.', 'Use the margin for hedged positions if you follow Perp DEX Airdrops.'],
    good: ['**Margin:** if you use it for positions, vault losses and trading losses add up.'],
    risks: [{ t: 'Protocol risk', p: 'Extended is a young exchange. A bug or exploit can cost the funds held there.', fy: 'size' }],
    calls: [{ t: CALL, at: '31:05', about: 'Why Extended’s vault doubles as margin' }],
    needs: ['r2.0.5', 'r2.0.6'],
    sim: 'yield',
    added: '2026-08-05',
  },
  {
    id: 'funding-carry',
    name: 'Funding Rate Carry',
    status: 'Active',
    type: 'Carry trade',
    group: 'carry',
    val: { 1: 6925 },
    ret: 4.4,
    apr: 12.6,
    mech: 'Funding arbitrage',
    chain: 'Hyperliquid',
    coin: 'USDC',
    diff: 'Intermediate',
    maxW: 10,
    entry: 'Open',
    icons: ['hl', 'eth', 'usdc'],
    sub: 'Long spot, short perp: the position is price neutral and collects the funding rate when longs pay shorts.',
    simple: 'When many people bet on rising prices, they pay a fee to those betting against them. You hold the coin and bet against it at the same time, so the price doesn’t matter and you collect that fee.',
    what: ['Holding the asset and shorting its perp cancels the price exposure. When funding is positive, the short collects it every hour.'],
    steps: ['Buy ETH spot with half of the amount.', 'Short the same ETH amount on the perp with the other half as margin.', 'Close when funding stays negative for more than a few days.'],
    good: ['**Funding flips:** what pays today can cost tomorrow. The team watches it daily.'],
    risks: [{ t: 'Negative funding', p: 'When funding turns negative, the short pays instead of earning.', fy: 'size' }, { t: 'Liquidation of the short', p: 'A strong rally can liquidate the short if its margin is too thin.', fy: 'size' }],
    calls: [{ t: CALL, at: '41:30', about: 'When to close a carry trade' }],
    needs: ['r2.0.1', 'r2.0.7', 'r2.0.9'],
    sim: 'yield',
    added: '2026-04-28',
  },
  {
    id: 'usde-carry',
    name: 'USDe Carry',
    status: 'Active',
    type: 'Carry trade',
    group: 'carry',
    val: { 1: 4943, 2: 5728 },
    ret: 3.2,
    apr: 9.1,
    mech: 'Lending',
    chain: 'Ethereum',
    coin: 'USDe',
    diff: 'Easy',
    maxW: 8,
    entry: 'Open',
    icons: ['eth', 'usdc'],
    sub: 'Staked USDe, a synthetic dollar whose yield comes from funding on hedged positions.',
    simple: 'A dollar token that earns because its issuer runs a carry trade for you. You get a steady yield without managing positions, and you take on the issuer’s risk.',
    what: ['USDe is backed by spot crypto and an equal short perp. Staking it passes the funding income to holders.'],
    steps: ['Swap USDC to USDe.', 'Stake it to receive sUSDe.', 'Unstaking has a cooldown of several days.'],
    good: ['**Cooldown:** plan withdrawals ahead, or swap sUSDe on a DEX at a small discount.'],
    risks: [{ t: 'Depeg', p: 'USDe can trade below $1 when funding turns negative for long or redemptions spike.', fy: 'size' }],
    calls: [{ t: CALL, at: '18:50', about: 'What backs USDe' }],
    needs: ['r1.2.0', 'r1.2.2'],
    sim: 'yield',
    added: '2026-03-15',
  },
  {
    id: 'sol-lst',
    name: 'SOL Liquid Staking',
    status: 'Active',
    type: 'Staking',
    group: 'staking',
    val: { 1: 6112, 2: 5200 },
    ret: -3.4,
    apr: 7.2,
    mech: 'Staking',
    chain: 'Solana',
    coin: 'SOL',
    diff: 'Beginner',
    maxW: 14,
    entry: 'Open',
    icons: ['sol'],
    sub: 'SOL staked through a liquid staking token, so it earns staking rewards and stays usable in DeFi.',
    simple: 'You lend your SOL to the network’s validators and get a receipt token back. The receipt slowly grows in value, and you can still use it elsewhere.',
    what: ['A liquid staking token represents staked SOL. It earns the staking yield and can be used as collateral or in pools.'],
    steps: ['Get SOL in Phantom or Solflare.', 'Stake it for the liquid staking token linked in the notes.', 'Keep a little SOL unstaked for fees.'],
    good: ['**Weight raised** from 12% to 14% of the model portfolio on Oct 11.', '**Price** moves your value far more than the yield does.'],
    risks: [{ t: 'SOL price', p: 'The yield is small next to SOL’s price swings. This month SOL is down and so is the position.', fy: 'size' }],
    calls: [{ t: CALL, at: '05:40', about: 'Liquid staking on Solana' }],
    needs: ['academy.0.1', 'r2.1.1', 'r2.1.2'],
    sim: 'yield',
    added: '2026-02-03',
  },
  {
    id: 'hype-stake',
    name: 'HYPE Staking',
    status: 'Active',
    type: 'Staking',
    group: 'staking',
    val: { 1: 4272, 2: 4538 },
    ret: 1.1,
    apr: 2.4,
    mech: 'Staking',
    chain: 'Hyperliquid',
    coin: 'HYPE',
    diff: 'Beginner',
    maxW: 6,
    entry: 'Open',
    icons: ['hl'],
    sub: 'HYPE staked with a validator on Hyperliquid for staking rewards and lower trading fees.',
    simple: 'You put your HYPE to work securing the network. It earns a little and lowers your trading fees on Hyperliquid.',
    what: ['Staked HYPE earns validator rewards. The bigger benefit for active traders is the fee discount.'],
    steps: ['Move HYPE to your Hyperliquid account.', 'Stake it with a validator from the notes.', 'Unstaking takes several days.'],
    good: ['**Fee discount** applies to the account that holds the stake.'],
    risks: [{ t: 'HYPE price', p: 'The value follows HYPE’s price; the yield is small.', fy: 'size' }],
    calls: [{ t: CALL, at: '27:00', about: 'Staking HYPE' }],
    needs: ['academy.0.1', 'r2.1.1'],
    sim: 'yield',
    added: '2026-01-20',
  },
  {
    id: 'lighter-hedge',
    name: 'Lighter Points Hedge',
    status: 'Active',
    type: 'Hedging',
    group: 'hedge',
    val: { 1: 3312 },
    ret: 6.9,
    apr: 21.5,
    mech: 'Delta neutral',
    chain: 'Ethereum',
    coin: 'USDC',
    diff: 'Professional',
    maxW: 5,
    entry: 'Open',
    icons: ['lighter', 'avax', 'usdc'],
    sub: 'High-volume hedged trading on Lighter to earn LIT rewards, with the hedge on a second venue.',
    simple: 'You trade a lot on one exchange because it pays rewards for volume, and you cancel the price risk on another exchange.',
    what: ['Lighter pays LIT rewards for volume. The position trades actively there and holds the opposite exposure elsewhere.'],
    steps: ['Fund Lighter and the hedge venue.', 'Run the volume setup from the notes.', 'Rebalance the hedge daily.'],
    good: ['**Fees** add up quickly at high volume. Track them against the rewards weekly.'],
    risks: [{ t: 'Fees above rewards', p: 'If rewards drop, trading fees can exceed what the volume earns.', fy: 'size' }, { t: 'Liquidation', p: 'Active trading with leverage needs close monitoring.', fy: 'liq' }],
    calls: [{ t: CALL, at: '52:15', about: 'Volume farming on Lighter' }],
    needs: ['r2.0.0', 'r2.0.2', 'r2.0.3', 'r3.0.3'],
    sim: 'hedge',
    legs: [
      { side: 'Long', dex: 'Lighter', asset: 'BTC' },
      { side: 'Short', dex: 'Hyperliquid', asset: 'BTC' },
    ],
    added: '2026-09-10',
  },
  {
    id: 'eth-loop',
    name: 'ETH Looping',
    status: 'Closed',
    type: 'Looping',
    group: '',
    val: {},
    ret: 18.3,
    apr: 0,
    mech: 'Looping',
    chain: 'Ethereum',
    coin: 'wstETH',
    diff: 'Advanced',
    maxW: 0,
    entry: 'Closed',
    icons: ['eth'],
    sub: 'wstETH deposited and borrowed against repeatedly to multiply the staking yield. Closed on Oct 12 at +18.30%.',
    simple: 'You deposit staked ETH, borrow ETH against it, stake that too, and repeat. The staking yield multiplies, and so does the risk.',
    what: ['The loop earned the gap between the staking yield and the borrow rate, multiplied by the leverage. The team closed it when the borrow rate caught up.'],
    steps: ['Closed: no new entries.'],
    good: ['**Final result:** +18.30% over the life of the position.'],
    risks: [{ t: 'Liquidation', p: 'A depeg of wstETH against ETH could trigger liquidation of the loop.' }],
    calls: [{ t: CALL, at: '44:20', about: 'Why the loop was closed' }],
    needs: ['r1.2.1', 'r2.2.3', 'r2.2.6'],
    sim: 'yield',
    added: '2025-11-02',
  },
];
export const strat = (id: string | null | undefined) => STRATS.find((s) => s.id === id) || null;

/* ---- model portfolio ---- */
export type Group = { id: string; name: string; color: string; val: Record<Wallet, number> };
export const GROUPS: Group[] = [
  { id: 'gldx-usdc', name: 'xStocks GLDx/USDC', color: '#E2B65E', val: { 1: 13351, 2: 0 } },
  { id: 'gldx-xaut', name: 'xStocks GLDx/XAUT', color: '#F5D58A', val: { 1: 8901, 2: 6300 } },
  { id: 'perp', name: 'Perp DEX Farming', color: '#9ED3FF', val: { 1: 16318, 2: 0 } },
  { id: 'carry', name: 'Carry Trades', color: '#1783FF', val: { 1: 11868, 2: 5728 } },
  { id: 'staking', name: 'Staking', color: '#8EFF99', val: { 1: 10384, 2: 9738 } },
  { id: 'hedge', name: 'Hedging + Airdrops', color: '#FE963C', val: { 1: 7417, 2: 0 } },
  { id: 'idle', name: 'Not deployed', color: 'rgba(255,255,255,.28)', val: { 1: 5935, 2: 6874 } },
];
export const WALLET: Record<Wallet, { total: number; chg: number }> = { 1: { total: 74174, chg: 20.24 }, 2: { total: 28640, chg: 7.85 } };
export type GroupBy = 'strategy' | 'chain' | 'type';
const PALETTE = ['#9ED3FF', '#1783FF', '#8EFF99', '#E2B65E', '#FE963C', '#B69CFF', '#F5D58A'];
/** Rows of the allocation table and donut: by strategy group, chain or type. */
export function allocation(w: Wallet, by: GroupBy): { id: string; name: string; color: string; v: number }[] {
  const idle = GROUPS.find((g) => g.id === 'idle')!;
  if (by === 'strategy') return GROUPS.filter((g) => g.val[w] > 0).map((g) => ({ id: g.id, name: g.name, color: g.color, v: g.val[w] }));
  const acc = new Map<string, number>();
  for (const s of STRATS) {
    const v = s.val[w] || 0;
    if (!v) continue;
    const k = by === 'chain' ? s.chain : s.type;
    acc.set(k, (acc.get(k) || 0) + v);
  }
  const rows = [...acc.entries()].sort((a, b) => b[1] - a[1]).map(([k, v], i) => ({ id: k, name: k, color: PALETTE[i % PALETTE.length], v }));
  return [...rows, { id: 'idle', name: idle.name, color: idle.color, v: idle.val[w] }];
}
/** Does strategy s belong to the selected allocation row? */
export function inRow(s: Strat, by: GroupBy, row: string) {
  if (by === 'strategy') return s.group === row;
  return (by === 'chain' ? s.chain : s.type) === row;
}

/* ---- the user's side (Wega) ---- */
export const valueOf = (s: Strat, w: Wallet | 'all') => (w === 'all' ? (s.val[1] || 0) + (s.val[2] || 0) : s.val[w] || 0);
export const sizeFor = (s: Strat) => Math.round((s.maxW / 100) * PORTFOLIO);
export function readiness(s: Strat) {
  const done = s.needs.filter((k) => S.done.has(k));
  return { done: done.length, total: s.needs.length, missing: s.needs.filter((k) => !S.done.has(k)) };
}
export function lessonOf(k: string) {
  const [r, z, l] = k.split('.');
  const route = R(r);
  return { r, z: +z, l: +l, t: route.zones[+z].lessons[+l].t, where: r === 'academy' ? 'Academy' : `${route.name} · ${route.zones[+z].name}` };
}
/** Wega's "Best fit for you": ready first, then goal match (stablecoin yield), then lower difficulty. */
export function fitScore(s: Strat) {
  if (s.status === 'Closed') return -1000;
  const r = readiness(s);
  return (r.missing.length === 0 ? 100 : 0) - r.missing.length * 12 + (/USD/.test(s.coin) ? 20 : 0) - DIFFS.indexOf(s.diff) * 4 + (s.entry === 'Open' ? 6 : 0);
}

/* ---- page state that survives navigation ---- */
export const stUi = createStore({
  /** the "since your last visit" strip was dismissed */
  stripOff: false,
  /** strategies the user asked to be notified about when entries reopen */
  notify: [] as string[],
});
export function toggleNotify(id: string) {
  const U = stUi.get();
  U.notify = U.notify.includes(id) ? U.notify.filter((x) => x !== id) : [...U.notify, id];
  stUi.commit();
  return U.notify.includes(id);
}
/** What changed since the last visit (sample). */
export const CHANGES = [
  { id: 'perp-airdrops', html: '**Perp DEX Airdrops** paused new entries' },
  { id: 'sol-lst', html: '**Staking** went from 12% to 14%' },
  { id: 'eth-loop', html: '**ETH Looping** closed at +18.30%' },
];

/* ---- hedge math (isolated estimate; maintenance margin 2.5%) ---- */
export const MM = 0.025;
/** How far price can move against a leg before liquidation, as a fraction. */
export const liqDist = (lev: number, side: 'Short' | 'Long') => (1 / lev - MM) / (side === 'Short' ? 1 + MM : 1 - MM);
