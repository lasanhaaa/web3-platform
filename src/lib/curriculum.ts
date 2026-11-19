// @ts-nocheck
/* Ported 1:1 from the single-file prototype (academy.html v8). Sample copy for the content team to review. */
export const pad=(n:number)=>String(n).padStart(2,'0');
export const ROUTES:any[]=[
 {id:'academy',label:'Required start',name:'Academy',img:'assets/pawn-m.webp',metal:'silver',tagline:'The base for every route: wallet, on-ramps and your first DeFi terms.',by:'',
  zones:[{name:'Academy',lessons:[['Start','Welcome, track record, team, security'],['Wallet','Set up Rabby, Phantom/Solflare, Ledger'],['On-ramps','OKX, deposits and withdrawals, stablecoins, gas'],['Intro to DeFi','Terms, chains, bridging, Debank/Jup']]}]},
 {id:'r1',label:'Route 1',name:'DeFi Fundamentals',img:'assets/bishop-m.webp',metal:'gold',tagline:'Move, hold and borrow against your assets.',by:'Mara',
  zones:[{name:'Swaps & Approvals',lessons:['Swapping vs. bridging: the difference','Swap protocols and aggregators','Checks before a swap','Approvals','Swap example (EVM)']},
   {name:'Bridges & Routes',lessons:['Bridging basics','Choosing and checking a route','Bridge example (EVM)','USDC bridge (CCTP)','USDT0 and XAUT0 bridge','Bridge from EVM to Solana','Troubleshooting ladder for technical issues']},
   {name:'Lending & Collateral',lessons:['Lending basics','Collateral and liquidation','Aave','Morpho','Lending example','Putting your HODL stack to work','BTC in DeFi','BTC routes, worked example']}]},
 {id:'r2',label:'Route 2',name:'DeFi Strategies',img:'assets/queen-m.webp',metal:'rose',tagline:'Turn positions into yield.',by:'Daniel',
  zones:[{name:'Perp DEX & Funding',lessons:['Perp DEX basics','Funding','Margin and liquidation','Order book','Perp example','Vault','Vault example','Funding rate farming basics','Selection and monitoring','FRF example']},
   {name:'DeFi Strategies',lessons:['USDC hedge (perp & lending)','Staking: basics','Staking example','V3 with correlated assets','V2 pool: stable + 2 volatile assets','IL: impermanent loss','Dexscreener, Dextools, GeckoTerminal','V2 pool example + IL offset']},
   {name:'DeFi Expert',lessons:['Total return strategy','Uniswap V3 + basics','V3 example + pointer to PerpPilot','Looping: the 3 types, oracles','Depeg monitor','LSTs explained','Looping yield calculation','Looping example','Arbitrage','Arbitrage example']}]},
 {id:'r3',label:'Route 3',name:'PerpPilot',img:'assets/king-m.webp',metal:'titan',tagline:'Automate it all.',by:'Chris',
  zones:[{name:'PerpPilot Start',lessons:['Introduction: what is PerpPilot','Sign-up (24h waiting period)','Connecting DEXs (Extended, Nado, Hyperliquid, Lighter)','Pointbot basics','Pointbot setup']},
   {name:'PerpPilot Advanced',lessons:['V3 basics','V3 DEX simulator tool','Setting up the V3 bot with an initial long','Setting up the V3 bot without an initial long','Calculating V3 leverage','Closing V3 (out of range, in range)']}]}
];
ROUTES.forEach(r=>r.zones.forEach(z=>z.lessons=z.lessons.map(s=>Array.isArray(s)?{t:s[0],d:s[1]}:{t:s,d:''})));
export const BADGE_TXT={'academy.0':'Wallet set up, on-ramps understood, and your first DeFi terms down pat.','r1.0':'You swap tokens safely and keep your approvals under control.','r1.1':'You choose bridge routes deliberately and know what to do when something goes wrong.','r1.2':'You understand collateral, Health Factor and liquidation.','r2.0':'You know your way around perps, funding and funding rate farming.','r2.1':'You build pool and staking positions and understand impermanent loss.','r2.2':'Looping, LSTs, depeg risks and arbitrage are part of your toolkit.','r3.0':'PerpPilot is set up and your Pointbot is running.','r3.1':'You set up V3 bots with the right leverage and close them out cleanly.'};
export const MINS=[12,18,9,24,15,21,7,14,11,19,16,8,22,13,10,17];
export const dur=(ri,zi,li)=>MINS[(ri*7+zi*5+li*3)%MINS.length];
export const R=(id:string):any=>ROUTES.find(r=>r.id===id);
export const gen=n=>n+'’s'; /* English possessive: Mara’s, Daniel’s, Chris’s */
export const key=(r,z,l)=>`${r}.${z}.${l}`;

/* learning content Wega knows about */
export const LSUM={
 'Start':['Who is behind Web3 Universe and how the track record is built.','The security rules: seed phrase offline, no DMs from “support”, read every signature.'],
 'Wallet':['Rabby for EVM chains, Phantom or Solflare for Solana.','With a Ledger the private key stays on the device, and you confirm every signature there.'],
 'On-ramps':['On OKX you swap euros for USDC and withdraw to your own wallet.','Gas is paid in the chain’s native coin, so you always need a little ETH, SOL and so on.'],
 'Intro to DeFi':['Chains, bridges and protocols: how value moves between networks.','Debank and Jupiter show an address’s positions and swaps at a glance.'],
 'Swapping vs. bridging: the difference':['A swap trades tokens on the same chain; a bridge moves value between chains.','Many tools combine both, so it helps to know which step is happening.'],
 'Swap protocols and aggregators':['DEXs like Uniswap have their own pools; aggregators like 1inch find the best route across many pools.','The best price isn’t always the best deal: gas and slippage count too.'],
 'Checks before a swap':['Before every swap: check the contract address, the price impact and the slippage setting.','In small pools, swap in parts.'],
 'Approvals':['An approval lets a contract move tokens out of your wallet.','Unlimited approvals are convenient, but they stay open until you revoke them.'],
 'Swap example (EVM)':['A full swap in Rabby: approval, check the price, sign, verify in the explorer.','Afterwards, reset the approval if you rarely use that contract.'],
 'Bridging basics':['A bridge locks or burns tokens on chain A and issues them on chain B.','The risk sits in the bridge itself: who holds the locked tokens?'],
 'Choosing and checking a route':['Bridge aggregators compare cost, time and the token that arrives at the end.','Check whether you get the native token or a wrapped version.'],
 'Bridge example (EVM)':['From Ethereum to Arbitrum step by step, including gas on the destination chain.','Test with a small amount first, then send the rest.'],
 'USDC bridge (CCTP)':['CCTP is Circle’s own bridge: USDC is burned on the source chain and minted again on the destination chain.','You get native USDC instead of a wrapped version, with no pool and no slippage.'],
 'USDT0 and XAUT0 bridge':['USDT0 and XAUT0 move USDT and tokenized gold between chains over LayerZero.','Same rule here: check that the destination chain supports the native version.'],
 'Bridge from EVM to Solana':['Between EVM and Solana you need two wallets and a bridge that speaks both.','The destination is a Solana address, not a 0x address.'],
 'Troubleshooting ladder for technical issues':['When a bridge hangs: find the transaction in the explorer, check the status with the provider, and only use official support channels.','Never give your seed phrase to “support”.'],
 'Lending basics':['You deposit collateral and borrow a different token against it.','Interest rates depend on how much of the pool is in use.'],
 'Collateral and liquidation':['The Health Factor compares your collateral with your debt. Below 1, you get liquidated.','A liquidation costs a penalty of a few percent of the collateral.'],
 'Aave':['Aave is the largest lending market, with its own liquidation threshold per asset.','The dashboard shows your Health Factor, rates and liquidation price.'],
 'Morpho':['Morpho builds isolated markets and vaults, often with better rates.','Each market carries its own risk, depending on the oracle and the curator.'],
 'Lending example':['Deposit ETH, borrow USDC, keep the Health Factor above 1.5.','Set an alert before things get tight.'],
 'Putting your HODL stack to work':['Long-term holdings can serve as collateral instead of sitting idle.','A loan turns a HODL stack into a position with liquidation risk.'],
 'BTC in DeFi':['BTC enters DeFi as a wrapped token such as WBTC or cbBTC.','Every wrapped version has its own custodian, and with it its own risk.'],
 'BTC routes, worked example':['From BTC to collateral on Aave: pick a wrapped token, bridge it, deposit it.','Finally, check which custodian stands behind your BTC.'],
 /* Routes 2 and 3: sample copy for the content team, written for the lesson descriptions (Oct 16) */
 'Perp DEX basics':['A perpetual future, or perp, lets you bet on a price going up or down, with no end date.','On a perp DEX such as Hyperliquid you trade from your own wallet, with USDC as margin.'],
 'Funding':['Funding is a small payment between longs and shorts, made at regular intervals, that keeps the perp price close to the spot price.','When most traders are long, longs pay shorts. When most are short, shorts pay longs.'],
 'Margin and liquidation':['Margin is the USDC you put up for a position, and leverage multiplies its size.','If the price moves against you and the margin runs out, the DEX closes the position: a liquidation.'],
 'Order book':['The order book lists who wants to buy and sell, and at which price.','A limit order waits at your price and often pays a lower fee. A market order fills at once at the best price available.'],
 'Perp example':['Opening a 2x long on ETH with 1,000 USDC of margin, step by step.','Setting a stop loss and checking the liquidation price before you confirm.'],
 'Vault':['A vault trades or provides liquidity for you with the USDC you deposit.','You earn a share of its profits, and you also carry its losses.'],
 'Vault example':['Depositing 1,000 USDC into a perp DEX vault, after reading its track record.','How withdrawals work, including lock-up periods.'],
 'Funding rate farming basics':['Funding rate farming collects funding without betting on the price: you hold the coin and short the same amount as a perp.','The price moves cancel out. What is left is the funding you collect.'],
 'Selection and monitoring':['How to pick a coin to farm: funding that stays positive, enough liquidity and a reliable DEX.','What to check every day: the funding rate, your margin and the gap between spot and perp.'],
 'FRF example':['A full funding rate farm with 2,000 USDC: buying ETH and shorting the same amount on a perp DEX.','Reading the funding earned after a week and deciding when to close.'],
 'USDC hedge (perp & lending)':['Earning on USDC while staying protected: lending on one side, a perp hedge on the other.','How the two sides balance each other when the market moves.'],
 'Staking: basics':['Staking locks coins to help secure a network, and the network pays you for it.','Liquid staking gives you a token back, such as stETH, that you can keep using in DeFi.'],
 'Staking example':['Staking 1 ETH through Lido and receiving stETH.','Where to see your rewards, and how to unstake.'],
 'V3 with correlated assets':['A Uniswap V3 pool with two coins that move together, such as ETH and stETH.','Because their prices stay close, a narrow range earns fees with little impermanent loss.'],
 'V2 pool: stable + 2 volatile assets':['A V2 pool spreads your deposit over every price, so it never goes out of range.','Mixing a stablecoin with two volatile coins balances yield and risk.'],
 'IL: impermanent loss':['Impermanent loss is what you give up compared with simply holding, when the prices in a pool move apart.','Fees can make up for it. When you withdraw after a big move, the loss becomes real.'],
 'Dexscreener, Dextools, GeckoTerminal':['Three free tools to look up any pool: price, volume, liquidity and age.','How to spot a pool that is too new, too small or controlled by one wallet.'],
 'V2 pool example + IL offset':['Adding 2,000 USDC to a V2 pool and following it for a month.','Comparing the fees earned with the impermanent loss to see whether it paid off.'],
 'Total return strategy':['Looking at the whole result: yield, price changes, fees and gas together.','A high APY can still lose money once every cost is counted.'],
 'Uniswap V3 + basics':['In Uniswap V3 you choose the price range where your liquidity works.','A narrow range earns more fees, but the price leaves it sooner.'],
 'V3 example + pointer to PerpPilot':['Opening an ETH/USDC V3 position with a range from $2,900 to $3,400.','Why PerpPilot can move the range for you when the price leaves it.'],
 'Looping: the 3 types, oracles':['Looping means depositing, borrowing and depositing again to multiply a yield.','The three kinds of loops, and why the price oracle decides when you get liquidated.'],
 'Depeg monitor':['A depeg is when a coin that should hold a price, such as a stablecoin, drifts away from it.','How the Depeg Tracker warns you before a loop or a pool gets into trouble.'],
 'LSTs explained':['Liquid staking tokens such as stETH, rETH and cbETH earn staking rewards and stay usable.','How they differ in yield, liquidity and risk.'],
 'Looping yield calculation':['How to work out what a loop really earns: the staking yield times the leverage, minus the borrowing cost.','A worked calculation at 3x, and the point where the loop stops paying.'],
 'Looping example':['Building a 3x stETH loop on Aave, step by step.','Watching the Health Factor and unwinding the loop safely.'],
 'Arbitrage':['Arbitrage profits from the same coin having two prices in two places.','Why the gaps are small and close fast, and what eats the profit: fees, gas and slippage.'],
 'Arbitrage example':['Spotting a price gap between two DEXs and closing it.','Counting every cost to see what was really earned.'],
 'Introduction: what is PerpPilot':['PerpPilot is the platform’s automation: bots that run perp and V3 strategies for you.','Your funds stay in your own DEX account, and the bot places the trades.'],
 'Sign-up (24h waiting period)':['How to create your PerpPilot account.','Why there is a 24-hour wait before your first bot can start.'],
 'Connecting DEXs (Extended, Nado, Hyperliquid, Lighter)':['Connecting PerpPilot to Extended, Nado, Hyperliquid and Lighter with API keys.','What an API key allows the bot to do, and what it doesn’t.'],
 'Pointbot basics':['The Pointbot trades to earn points in the DEXs’ rewards programs.','It keeps the price risk low by trading both sides. The cost is the fees.'],
 'Pointbot setup':['Setting up the Pointbot with a budget, a DEX and a daily volume.','Reading its dashboard: volume, points and fees paid.'],
 'V3 basics':['How the V3 bot runs a Uniswap V3 position and hedges it with a perp.','What it does when the price leaves your range.'],
 'V3 DEX simulator tool':['The simulator shows how a V3 position would have done in the past.','Try different ranges and leverage before you put in real money.'],
 'Setting up the V3 bot with an initial long':['Starting the V3 bot with an extra long on ETH, for when you expect the price to rise.','Every setting explained, from the range to the stop loss.'],
 'Setting up the V3 bot without an initial long':['Starting the V3 bot without a bet on the price.','When this is the better choice.'],
 'Calculating V3 leverage':['How to choose the hedge’s leverage so a normal price move can’t liquidate you.','A worked example with a ±8% range.'],
 'Closing V3 (out of range, in range)':['How to close a V3 position when the price is outside your range.','And how to close it while it is still in range, without losing your fees.'],
};
export const GLOSS={
 'academy':[['Seed phrase','12 or 24 words that all your wallet’s keys are derived from. Whoever knows them owns the wallet.'],['Hardware wallet','A device like a Ledger that keeps the private key offline.'],['Stablecoin','A token pegged to a value like the US dollar, such as USDC.'],['Gas','The fee for a transaction, paid in the chain’s native coin.']],
 'r1.0':[['Slippage','How far the executed price may differ from the quoted one.'],['Price impact','How much your own swap moves the price in the pool.'],['Aggregator','A tool that finds the best route across many DEXs, such as 1inch.'],['Approval','Permission for a contract to move tokens out of your wallet.']],
 'r1.1':[['Bridge','A protocol that moves value between two chains.'],['CCTP','Circle’s bridge for native USDC: burn on chain A, mint again on chain B.'],['Wrapped token','A stand-in token backed by the original, which someone holds in custody.'],['Gas on the destination chain','On the new chain you still need a little native coin for transactions.']],
 'r1.2':[['Health Factor','Collateral times the liquidation threshold, divided by debt. Below 1, you get liquidated.'],['Liquidation threshold','The share of the collateral that counts. For ETH on Aave, 82.5%.'],['LTV','The most you can borrow against your collateral.'],['Liquidation','Part of the collateral is sold to cover the debt, with a penalty.']],
 'r2':[['Perp','A futures contract with no expiry date.'],['Funding rate','The payment between longs and shorts that keeps the perp price close to spot.'],['Impermanent loss','The gap between an LP position and simply holding, when prices move.'],['Looping','Depositing collateral and borrowing repeatedly to increase leverage.']],
 'r3':[['PerpPilot','The platform’s automation for perp and V3 strategies.'],['Pointbot','A bot that generates volume for the DEXs’ points programs.'],['Range','The price band in which a V3 position earns fees.'],['Leverage','The ratio of position size to your own capital.']],
};
export const glossFor=(r,z)=>GLOSS[r+'.'+z]||GLOSS[r]||GLOSS['r1.1'];

/* chapters, tips and analogies used in the lesson player */
export const CH_AT=[0,.24,.55,.82];
/* a worked example and the classic mistake per zone (sample copy for the content team) */
export const ZTIPS={
 'academy.0':['Setting up Rabby and moving the first 50 USDC from OKX to your own wallet.','Typing the seed phrase into a website. Real support never asks for it.'],
 'r1.0':['Swapping 1,000 USDC to ETH on Uniswap with 0.5% slippage.','Leaving an unlimited approval open after the swap.'],
 'r1.1':['Moving 500 USDC from Ethereum to Arbitrum with CCTP.','Arriving without gas: keep a little ETH on the destination chain.'],
 'r1.2':['Depositing 2 ETH on Aave and borrowing 3,720 USDC against it.','Borrowing close to the limit: a 10% drop can be enough for a liquidation.'],
 'r2':['A delta-neutral position: long spot, short perp, collecting funding.','Funding can flip: what pays today can cost tomorrow.'],
 'r3':['Starting a V3 bot with a ±8% range.','Too much leverage turns a normal move into a liquidation.'],
};
/* the same idea told as an everyday picture */
export const ANALOGY={
 'academy.0':'Think of your wallet as a safe that has exactly one key: the seed phrase. Whoever has the 12 words can open the safe from anywhere in the world, so the words never go online.',
 'r1.0':'A swap is like changing money at a counter: one currency in, another out. An approval is a standing order you give the counter. It stays valid until you cancel it, even when you never come back.',
 'r1.1':'A bridge is like sending money abroad. Most bridges keep your money on one side and hand you a voucher on the other. CCTP works like the central bank itself: it destroys the money here and prints the same amount there, with no voucher and no middleman.',
 'r1.2':'Lending works like a pawn shop. You leave something valuable and walk out with cash. If what you left loses too much value, the shop sells it. The Health Factor tells you how far you are from that point.',
 'r2':'A strategy is a recipe: the same ingredients (lending, perps, pools) combined to earn yield. Every ingredient brings its own risk into the dish.',
 'r3':'PerpPilot is like cruise control: it holds the speed you set, but you still choose the route and decide when to take over.',
};
export const zkey=(rid,zi)=>ZTIPS[rid+'.'+zi]?rid+'.'+zi:ZTIPS[rid]?rid:'r1.1';
export function chaptersFor(rid,zi,li){
  const r=R(rid),s=r.zones[zi].lessons[li],m=dur(ROUTES.indexOf(r),zi,li),tip=ZTIPS[zkey(rid,zi)];
  const pts=LSUM[s.t]||[s.d?`${s.d}.`:`The core idea of “${s.t}”.`,'How it works in practice, step by step.'];
  const t=['The idea','How it works','Example','Watch out'],n=[pts[0],pts[1]||pts[0],tip[0],tip[1]];
  return CH_AT.map((a,i)=>({a,sec:Math.round(a*m*60),t:t[i],n:n[i]}));
}
export const chIdx=(ch,pr)=>{let i=0;ch.forEach((c,k)=>{if(pr>=c.a)i=k});return i};
export const GOAL='stablecoin yield while holding ETH';
