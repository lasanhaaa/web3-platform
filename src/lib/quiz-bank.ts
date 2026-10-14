// @ts-nocheck
/* Ported 1:1 from the single-file prototype (academy.html v8). Sample copy for the content team to review. */
import {pad} from './curriculum';
export const C=(q,opts,a,why,hint)=>({t:'choice',q,opts,a,why,hint:hint||'Choose an answer.'});
export const Q:Record<string,any[]>={
'academy.0':[
 C('What should never go in a message, the cloud or a screenshot?',['Your seed phrase','Your wallet address','A transaction hash','Your ENS name'],0,'Whoever knows the seed phrase controls the wallet. Your address and transaction hashes are public.'),
 C('What do you use a hardware wallet like Ledger for?',['To save on gas','To keep private keys offline','To bridge faster','To stake tokens'],1,'The key never leaves the device, and you confirm every signature on the device itself.'),
 {t:'flow',q:'Complete the path from euros to your own wallet.',hint:'Choose the missing step.',steps:['OKX account','Deposit euros',null,'Withdraw to your wallet','Check in Rabby'],opts:['Buy USDC','Store your seed phrase','Grant an approval'],a:0,why:'On the exchange you swap euros for a stablecoin, and only then does it go to your own wallet.'},
 C('What is a stablecoin?',['A token with a fixed total supply','A token pegged to a value like the US dollar','A governance token','An NFT with a fixed price'],1,'USDC and USDT track the dollar and are your on-ramp into DeFi and your way back out.'),
 C('What is Debank useful for?',['Buying coins with a card','Taking out loans','Viewing an address’s positions and holdings','Bridging between chains'],2,'Debank shows an address’s holdings and DeFi positions across many chains.')],
'r1.0':[
 C('What’s the difference between a swap and a bridge?',['Nothing, they’re the same thing','A swap exchanges tokens on one chain, a bridge moves value between chains','Swaps are only for stablecoins','Bridges only work with ETH'],1,'A swap stays on the same chain, while a bridge moves value to another chain.'),
 C('What does a swap aggregator do?',['It holds your tokens','It finds the best rate across multiple DEXs','It creates new tokens','It cuts gas costs to zero'],1,'Aggregators split an order across multiple liquidity sources to find the best price.'),
 {t:'flow',q:'Complete the swap.',hint:'Which step safely connects the approval to the confirmation?',steps:['Wallet','Approve',null,'Swap','Confirm'],opts:['Check rate and slippage','Enter seed phrase','Switch wallets'],a:0,why:'Before the swap, check the rate and the maximum slippage. Only then confirm.'},
 {t:'order',q:'Put a safe swap in the right order.',hint:'Drag to sort, or move items with the arrows.',items:['Check the token contract','Check rate and slippage','Grant the approval','Confirm the swap','Revoke the approval'],why:'Check first, then approve and swap. Finally, revoke the approval.'},
 C('Why do you revoke unlimited approvals?',['So swaps run faster','Because otherwise a compromised contract can drain everything','Because they cost gas','Because they expire after 24h'],1,'Unlimited approvals stay in place until you actively revoke them.')],
'r1.1':[
 C('How does the CCTP USDC bridge work?',['USDC is wrapped and held in custody','USDC is burned on the source chain and minted natively on the destination chain','USDC is swapped into ETH','A market maker sends it manually'],1,'Burn and mint means you get native USDC on the destination chain, not a wrapped token.'),
 {t:'order',q:'Put the bridge steps in the order they actually happen.',hint:'One step in the wrong place means funds get stuck or an approval was wasted.',items:['Choose and check the route','Check the allowance','Grant the approval','Send the bridge transaction','Check arrival on the destination chain'],why:'Check the route and allowance before the approval, and at the end confirm arrival in the explorer.'},
 {t:'flow',q:'Complete the bridge flow.',hint:'Choose the step that safely connects the approval and the confirmation.',steps:['Wallet','Approve',null,'Bridge','Confirm'],opts:['Check the allowance','Increase slippage','Switch wallets'],a:0,why:'The allowance shows whether the approval covers exactly the amount you want to bridge.'},
 C('What is USDT0?',['A fork of USDC','The omnichain version of USDT','An unbacked stablecoin','A gas token'],1,'USDT0 moves USDT between chains without classic wrappers.'),
 C('What do you need to bridge from EVM to Solana?',['A Solana address as the destination, e.g. from Phantom or Solflare','Just your EVM address','A Ledger','A CEX account'],0,'Solana uses a different address format, so the destination has to be a Solana wallet.')],
'r1.2':[
 C('What happens when the Health Factor drops below 1?',['Nothing','The position can be liquidated','You get interest credited','The loan is forgiven'],1,'Below 1, your collateral no longer covers the loan and liquidators can step in.'),
 C('What does LTV describe?',['The ratio of loan to collateral','The loan’s term','The gas costs','The interest rate'],0,'Loan-to-value: the higher it is, the closer you are to liquidation.'),
 C('How is Aave structured?',['As an order book','As a shared liquidity pool per asset','As a peer-to-peer chat','As a central bank'],1,'Lenders and borrowers share pools, and interest rates follow utilization.'),
 C('Why use your HODL stack as collateral?',['To get liquidity without selling','To avoid taxes','Because there’s no risk','To save on gas'],0,'You keep the position and borrow against it, with liquidation risk.'),
 C('How does BTC usually get onto EVM chains?',['It doesn’t','As a wrapped token like WBTC or cbBTC','Only via NFTs','As a stablecoin'],1,'Wrapped BTC represents BTC on EVM chains and can be used as collateral.')],
'r2.0':[
 C('What is a perpetual future?',['A contract with no expiry date','A contract with a fixed term','A stablecoin','A spot order'],0,'Perps run indefinitely, and funding keeps the price close to spot.'),
 C('The funding rate is positive. Who pays?',['Shorts pay longs','Longs pay shorts','The exchange pays both','Nobody'],1,'Positive funding means longs pay shorts.'),
 {t:'sim',q:'Survive 7 days without getting liquidated.',hint:'Set leverage and range so the position is safe and ends up in range.',why:'Lower leverage pushes the liquidation price below the low. A wider range keeps the closing price inside the range.'},
 C('What does an order book show?',['Past airdrops','Open buy and sell orders with price and size','Only the last price','Gas costs'],1,'The bid and ask sides show the liquidity at every price level.'),
 C('At its core, how does funding rate farming work?',['Going long with high leverage','Long spot and short perp to collect funding while delta-neutral','Holding only stablecoins','Farming airdrops'],1,'The price moves cancel each other out, and what’s left is the funding.')],
'r2.1':[
 C('When does impermanent loss occur?',['When the price ratio of the pool assets changes','When gas goes up','When you earn fees','Never in V2'],0,'The pool rebalances, so you end up holding more of the weaker asset.'),
 {t:'chart',q:'Which position is earning fees right now?',hint:'The dashed line is the current price. Choose the range that contains it.',seed:7,a:1,why:'Only a range that contains the current price is active and earns fees.'},
 C('Why use correlated assets in V3?',['Less impermanent loss with a tight range','Higher leverage','No gas','Guaranteed yield'],0,'When both assets move together, the position stays in range longer.'),
 C('What does staking mean?',['Locking tokens to secure a network in return for rewards','Burning tokens','Lending tokens with no yield','Bridging tokens'],0,'Validators and delegators are rewarded for securing the network.'),
 C('What do you use Dexscreener or GeckoTerminal for?',['Checking pools, volume and liquidity','Storing seed phrases','Taking out loans','Calculating taxes'],0,'Before you enter, check a pool’s liquidity, volume and age.')],
'r2.2':[
 C('What is looping?',['Deposit collateral, borrow, deposit again, repeat','Sending a swap multiple times','Bridging back and forth','Staking without a lock-up'],0,'Looping grows the position with leverage, and the liquidation risk grows with it.'),
 {t:'order',q:'Put a loop in the right order.',hint:'Drag to sort, or move items with the arrows.',items:['Deposit ETH as collateral','Borrow USDC','Swap USDC for ETH','Deposit the ETH again','Check the Health Factor'],why:'Every round ends with a look at the Health Factor before you add more leverage.'},
 C('What is an LST?',['A liquid staking token that makes staked value tradable','A lending token','A stablecoin','An NFT'],0,'Examples are stETH or rETH: staked and still usable.'),
 C('What does a depeg monitor watch?',['Whether a pegged token loses its peg','Gas prices','New airdrops','Social media mentions'],0,'If an LST or stablecoin loses its peg, a loop can turn dangerous fast.'),
 C('What does arbitrage exploit?',['Price differences for the same asset across markets','Insider information','Bugs in wallets','High funding rates alone'],0,'Buy low, sell higher, before the prices converge.')],
'r3.0':[
 C('What is PerpPilot?',['A tool that automates strategies on perp DEXs','A wallet','A stablecoin','A lending protocol'],0,'PerpPilot automatically runs defined strategies across connected DEXs.'),
 {t:'order',q:'Put the PerpPilot setup in the right order.',hint:'Drag to sort, or move items with the arrows.',items:['Sign up','Wait out the 24h waiting period','Connect DEXs','Deposit margin','Start the Pointbot'],why:'After you sign up, the 24h waiting period applies. Without connected DEXs and margin, the bot can’t trade.'},
 C('Which DEXs do you connect in the course?',['Uniswap and Curve','Extended, Nado, Hyperliquid and Lighter','Only Binance','Aave and Morpho'],1,'These four perp DEXs are the ones the course uses.'),
 C('What is the Pointbot for?',['Automatically collecting points and volume on DEXs','Securing seed phrases','Paying off loans','Bridging tokens'],0,'Many DEXs reward activity with points, and the bot takes care of that for you.'),
 C('What happens right after you sign up?',['You start right away','A 24-hour waiting period','A mandatory call','A 7-day KYC check'],1,'The course outline lists a 24h waiting period after sign-up.')],
'r3.1':[
 {t:'chart',q:'Which V3 position is in range right now?',hint:'The dashed line is the current price.',seed:21,a:2,why:'Only the position whose range contains the current price is in range. The others earn nothing.'},
 {t:'sim',q:'Set up the hedge so it survives 7 days.',hint:'Adjust leverage and range until the status is safe and in range.',why:'Leverage sets your distance to liquidation, and the range decides whether the position is still working at the end.'},
 C('Why do you calculate leverage in advance?',['So the hedge matches the position size and liquidation stays far away','So fees go down','For tax purposes','It’s not necessary'],0,'Too much leverage gets the hedge liquidated, too little doesn’t hedge enough.'),
 C('What happens out of range?',['The position stops earning fees','The position doubles','The bot stops for good','Nothing changes'],0,'Out of range you only hold one asset, and fees stop.'),
 C('How do you close a position that’s in range?',['Close liquidity and hedge together','Close only the hedge','Only withdraw the liquidity','Wait until it’s out of range'],0,'Closing both together avoids unwanted open exposure.')]
};

/* ===== deterministic price paths ===== */
export function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
export function walk(seed,n){const r=rng(seed);const p=[100];for(let i=1;i<n;i++){p.push(p[i-1]*(1+(r()-.5)*.045+(r()<.04?(r()-.5)*.12:0)))}return p}
export function chartData(q){
  const p=walk(q.seed,90),mn=Math.min(...p),mx=Math.max(...p),last=p.at(-1),f=(last-mn)/(mx-mn);
  const bands=[];const w=.16;
  const cands=[[.80,.97],[Math.max(0,f-w/2),Math.min(1,f+w/2)],[.03,.20],[.48,.64]];
  let others=cands.filter((b,i)=>i!==1&&!(f>=b[0]&&f<=b[1]));
  while(others.length<3)others.push(f>.5?[.03,.15]:[.85,.97]);
  const right=cands[1];let oi=0;
  for(let i=0;i<4;i++)bands.push(i===q.a?right:others[oi++]);
  return{p,mn,mx,last,f,bands};
}
export function chartSVG(d,band){
  const W=240,H=140,P=8,X=i=>P+i/(d.p.length-1)*(W-2*P),Y=v=>H-P-(v-d.mn)/(d.mx-d.mn)*(H-2*P);
  const path=d.p.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join('');
  const yb=H-P-band[1]*(H-2*P),ya=H-P-band[0]*(H-2*P);
  return`<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><rect x="0" y="${yb}" width="${W}" height="${ya-yb}" fill="rgba(158,211,255,.12)"/><line x1="0" x2="${W}" y1="${yb}" y2="${yb}" stroke="rgba(158,211,255,.6)" stroke-width="1"/><line x1="0" x2="${W}" y1="${ya}" y2="${ya}" stroke="rgba(158,211,255,.6)" stroke-width="1"/><path d="${path}" fill="none" stroke="#9EFFA2" stroke-width="1.4" stroke-linejoin="round"/><line x1="0" x2="${W}" y1="${Y(d.last)}" y2="${Y(d.last)}" stroke="#fff" stroke-opacity=".7" stroke-dasharray="3 3"/></svg>`;
}
export const SIM=(()=>{let p=null;for(let s=3;s<400&&!p;s++){const w=walk(s,120);const mn=Math.min(...w);if(w.at(-1)>w[0]*1.01&&w.at(-1)<w[0]*1.05&&mn<w[0]*.97&&w.indexOf(mn)>20&&w.indexOf(mn)<100)p=w}
  const entry=2756,k=(entry*.14)/(p[0]-Math.min(...p));return p.map(v=>entry+(v-p[0])*k)})();

