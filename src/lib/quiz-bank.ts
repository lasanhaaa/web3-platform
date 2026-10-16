// @ts-nocheck
/* Ported 1:1 from the single-file prototype (academy.html v8). Sample copy for the content team to review. */
import {pad} from './curriculum';
export const C=(q,opts,a,why,hint)=>({t:'choice',q,opts,a,why,hint:hint||'Tap the right answer.'});
/** Match: tap a word, then what it means (Duolingo's pairs). Always 4 pairs, meanings are shuffled on screen. */
export const M=(q,pairs,why)=>({t:'match',q,pairs,why,hint:'Tap a word, then tap what it means.'});
/** Fill in: tap word tiles to fill the blanks (___) in order. */
export const F=(q,text,bank,a,why)=>({t:'fill',q,text,bank,a,why,hint:'Tap the words to fill the gaps.'});
/** Safe or scam: a message or wallet request; opts[0]=Safe, opts[1]=Scam. */
export const X=(card,a,why)=>({t:'scam',q:'Safe or scam?',card,opts:['Safe','Scam'],a,why,hint:'Read it like it just landed on your phone.'});
/** Predict: a trade ticket and a chart; after the answer the chart plays out what happened. */
export const P=(o)=>({t:'predict',hint:'Look at the trade, then pick what happens.',...o});

export const Q:Record<string,any[]>={
'academy.0':[
 X({kind:'dm',from:'MetaMask Support',handle:'@metamask_helpdesk',text:'Hi Daniel, we noticed an error on your wallet. To fix it, reply with your 12-word recovery phrase within 24 hours.'},1,'Real support never asks for your seed phrase. Whoever has it owns your wallet. Block the account and report it.'),
 C('What do you use a hardware wallet like Ledger for?',['To save on gas','To keep private keys offline','To bridge faster','To stake tokens'],1,'The key never leaves the device, and you confirm every signature on the device itself.'),
 {t:'flow',q:'Complete the path from euros to your own wallet.',hint:'Tap the missing step.',steps:['OKX account','Deposit euros',null,'Withdraw to your wallet','Check in Rabby'],opts:['Buy USDC','Store your seed phrase','Grant an approval'],a:0,why:'On the exchange you swap euros for a stablecoin, and only then does it go to your own wallet.'},
 M('Match each word to what it means.',[['Seed phrase','The words that control your wallet'],['Stablecoin','A token that follows the dollar'],['Hardware wallet','Keeps your keys offline'],['Gas','The fee for a transaction']],'These four words come up in every lesson after this one.'),
 P({q:'ETH rises 10%. How much is your ETH worth now?',ticket:[['You buy','ETH'],['Amount','$1,000'],['Leverage','None'],['ETH moves','+10%','ok']],entry:3000,move:.1,seed:4,opts:['$1,010','$1,100','$2,000'],a:1,result:'$1,100',tone:'ok',why:'Without leverage your money moves exactly with the price: 10% of $1,000 is $100, so your ETH is worth $1,100. Later routes show what leverage does to the same move.'})],
'r1.0':[
 C('What does a swap aggregator do?',['It holds your tokens','It finds the best rate across multiple DEXs','It creates new tokens','It cuts gas costs to zero'],1,'Aggregators split an order across multiple liquidity sources to find the best price.'),
 F('Swap or bridge?','A swap exchanges tokens on ___ chain. A bridge moves value to ___ chain.',['one','another','every'],['one','another'],'A swap stays on the same chain, while a bridge moves value to another chain.'),
 {t:'flow',q:'Complete the swap.',hint:'Tap the step that safely connects the approval to the confirmation.',steps:['Wallet','Approve',null,'Swap','Confirm'],opts:['Check rate and slippage','Enter seed phrase','Switch wallets'],a:0,why:'Before the swap, check the rate and the maximum slippage. Only then confirm.'},
 {t:'order',q:'Put a safe swap in the right order.',hint:'Tap the steps in the order they happen.',items:['Check the token contract','Check rate and slippage','Grant the approval','Confirm the swap','Revoke the approval'],why:'Check first, then approve and swap. Finally, revoke the approval.'},
 X({kind:'wallet',from:'uniswap-airdrop-claim.io',title:'Approve spending',text:'Allow 0x9f2…c41 to spend UNLIMITED USDC',meta:'Contract not verified · Site created 2 days ago'},1,'A fake airdrop site asking for unlimited USDC is the classic approval drain. Only approve verified contracts, and only the amount you need.')],
'r1.1':[
 C('How does the CCTP USDC bridge work?',['USDC is wrapped and held in custody','USDC is burned on the source chain and minted natively on the destination chain','USDC is swapped into ETH','A market maker sends it manually'],1,'Burn and mint means you get native USDC on the destination chain, not a wrapped token.'),
 {t:'order',q:'Put the bridge steps in the order they actually happen.',hint:'Tap the steps in the order they happen.',items:['Choose and check the route','Check the allowance','Grant the approval','Send the bridge transaction','Check arrival on the destination chain'],why:'Check the route and allowance before the approval, and at the end confirm arrival in the explorer.'},
 {t:'flow',q:'Complete the bridge flow.',hint:'Tap the step that safely connects the approval and the confirmation.',steps:['Wallet','Approve',null,'Bridge','Confirm'],opts:['Check the allowance','Increase slippage','Switch wallets'],a:0,why:'The allowance shows whether the approval covers exactly the amount you want to bridge.'},
 M('Match each word to what it means.',[['Bridge','Moves value to another chain'],['CCTP','Burns USDC here, mints it there'],['Allowance','How much a contract may spend'],['Explorer','Shows if the transfer arrived']],'You’ll use all four on every bridge you make.'),
 X({kind:'wallet',from:'jumper.exchange',title:'Approve spending',text:'Allow LI.FI Diamond to spend 250 USDC',meta:'Verified contract · You are bridging 250 USDC'},0,'This one is fine: a known bridge, a verified contract and exactly the amount you are bridging. That is what a safe approval looks like.')],
'r1.2':[
 C('What happens when the Health Factor drops below 1?',['Nothing','The position can be liquidated','You get interest credited','The loan is forgiven'],1,'Below 1, your collateral no longer covers the loan and liquidators can step in.'),
 M('Match each word to what it means.',[['Collateral','What you lock to borrow'],['LTV','Your loan compared with your collateral'],['Health Factor','Below 1 means liquidation'],['Liquidation','Collateral sold to repay the loan']],'Lenders watch these four numbers every day.'),
 C('How is Aave structured?',['As an order book','As a shared liquidity pool per asset','As a peer-to-peer chat','As a central bank'],1,'Lenders and borrowers share pools, and interest rates follow utilization.'),
 P({q:'ETH falls 25% this week. What happens to your loan?',ticket:[['Collateral','2 ETH'],['Loan','$3,720'],['Liquidation at','$2,255','bad'],['ETH this week','−25%','bad']],entry:3200,move:-.25,liq:2255,seed:11,opts:['The loan is liquidated','Still safe, but close to the line','The loan gets smaller'],a:1,result:'Safe: $2,400',tone:'ok',why:'ETH ends at $2,400, still above the $2,255 liquidation price. Safe this time, but only 6% away. Repaying part of the loan would move the line down.'}),
 C('How does BTC usually get onto EVM chains?',['It doesn’t','As a wrapped token like WBTC or cbBTC','Only via NFTs','As a stablecoin'],1,'Wrapped BTC represents BTC on EVM chains and can be used as collateral.')],
'r2.0':[
 P({q:'ETH rises 10%. What happens to your $1,000?',ticket:[['Side','Long','ok'],['Deposit','$1,000'],['Leverage','5x'],['ETH moves','+10%','ok']],entry:3000,move:.1,seed:5,opts:['You earn $100','You earn $500','You lose $500'],a:1,result:'+$500',tone:'ok',why:'A long wins when the price goes up. With 5x leverage, a 10% rise is a 50% gain on your $1,000: +$500. The same 10% drop would have cost you $500.'}),
 F('Who pays funding?','When funding is positive, ___ pay ___.',['longs','shorts','the exchange'],['longs','shorts'],'Positive funding means longs pay shorts. It keeps the perp price close to the spot price.'),
 {t:'sim',q:'Survive 7 days without getting liquidated.',hint:'Set leverage and range, then press Play to watch the 7 days.',why:'Lower leverage pushes the liquidation price below the low. A wider range keeps the closing price inside the range.'},
 P({q:'ETH rises 10%. What happens to your short?',ticket:[['Side','Short','bad'],['Deposit','$1,000'],['Leverage','10x'],['ETH moves','+10%','ok']],entry:3000,move:.1,liq:3270,seed:9,opts:['You earn $1,000','You lose $100','You lose all $1,000: liquidated'],a:2,result:'Liquidated',tone:'bad',why:'A short loses when the price rises. With 10x, a 10% rise wipes out your whole deposit, so the position is liquidated at about +9%, before ETH even gets to +10%.'}),
 M('Match each word to what it means.',[['Long','You win when the price goes up'],['Short','You win when the price goes down'],['Leverage','Trading bigger than your deposit'],['Funding','A fee between longs and shorts']],'Long, short, leverage and funding are the four words behind every perp trade.')],
'r2.1':[
 {t:'chart',q:'Which position is earning fees right now?',hint:'The dashed line is the current price. Tap the range that contains it.',seed:7,a:1,why:'Only a range that contains the current price is active and earns fees.'},
 C('When does impermanent loss occur?',['When the price ratio of the pool assets changes','When gas goes up','When you earn fees','Never in V2'],0,'The pool rebalances, so you end up holding more of the weaker asset.'),
 C('Why use correlated assets in V3?',['Less impermanent loss with a tight range','Higher leverage','No gas','Guaranteed yield'],0,'When both assets move together, the position stays in range longer.'),
 M('Match each word to what it means.',[['In range','The price is in your band: fees'],['Out of range','No fees until the price returns'],['Impermanent loss','More of the token that fell'],['Staking','Locking tokens to secure a network']],'In range, out of range and impermanent loss decide what a liquidity position really earns.'),
 C('What do you use Dexscreener or GeckoTerminal for?',['Checking pools, volume and liquidity','Storing seed phrases','Taking out loans','Calculating taxes'],0,'Before you enter, check a pool’s liquidity, volume and age.')],
'r2.2':[
 C('What is looping?',['Deposit collateral, borrow, deposit again, repeat','Sending a swap multiple times','Bridging back and forth','Staking without a lock-up'],0,'Looping grows the position with leverage, and the liquidation risk grows with it.'),
 {t:'order',q:'Put a loop in the right order.',hint:'Tap the steps in the order they happen.',items:['Deposit ETH as collateral','Borrow USDC','Swap USDC for ETH','Deposit the ETH again','Check the Health Factor'],why:'Every round ends with a look at the Health Factor before you add more leverage.'},
 C('What is an LST?',['A liquid staking token that makes staked value tradable','A lending token','A stablecoin','An NFT'],0,'Examples are stETH or rETH: staked and still usable.'),
 C('What does a depeg monitor watch?',['Whether a pegged token loses its peg','Gas prices','New airdrops','Social media mentions'],0,'If an LST or stablecoin loses its peg, a loop can turn dangerous fast.'),
 F('How arbitrage works','Arbitrage means buying where the price is ___ and selling where it is ___.',['lower','higher','the same'],['lower','higher'],'Buy low, sell higher, before the prices converge.')],
'r3.0':[
 C('What is PerpPilot?',['A tool that automates strategies on perp DEXs','A wallet','A stablecoin','A lending protocol'],0,'PerpPilot automatically runs defined strategies across connected DEXs.'),
 {t:'order',q:'Put the PerpPilot setup in the right order.',hint:'Tap the steps in the order they happen.',items:['Sign up','Wait out the 24h waiting period','Connect DEXs','Deposit margin','Start the Pointbot'],why:'After you sign up, the 24h waiting period applies. Without connected DEXs and margin, the bot can’t trade.'},
 C('Which DEXs do you connect in the course?',['Uniswap and Curve','Extended, Nado, Hyperliquid and Lighter','Only Binance','Aave and Morpho'],1,'These four perp DEXs are the ones the course uses.'),
 C('What is the Pointbot for?',['Automatically collecting points and volume on DEXs','Securing seed phrases','Paying off loans','Bridging tokens'],0,'Many DEXs reward activity with points, and the bot takes care of that for you.'),
 X({kind:'dm',from:'PerpPilot Team',handle:'@perppilot_support_desk',text:'Your bot is paused. Send us your exchange API key with withdrawal rights so we can restart it for you.'},1,'PerpPilot never needs withdrawal rights. An API key that can withdraw lets anyone empty your account.')],
'r3.1':[
 {t:'chart',q:'Which V3 position is in range right now?',hint:'The dashed line is the current price. Tap the range that contains it.',seed:21,a:2,why:'Only the position whose range contains the current price is in range. The others earn nothing.'},
 {t:'sim',q:'Set up the hedge so it survives 7 days.',hint:'Set leverage and range, then press Play to watch the 7 days.',why:'Leverage sets your distance to liquidation, and the range decides whether the position is still working at the end.'},
 C('Why do you calculate leverage in advance?',['So the hedge matches the position size and liquidation stays far away','So fees go down','For tax purposes','It’s not necessary'],0,'Too much leverage gets the hedge liquidated, too little doesn’t hedge enough.'),
 C('What happens out of range?',['The position stops earning fees','The position doubles','The bot stops for good','Nothing changes'],0,'Out of range you only hold one asset, and fees stop.'),
 C('How do you close a position that’s in range?',['Close liquidity and hedge together','Close only the hedge','Only withdraw the liquidity','Wait until it’s out of range'],0,'Closing both together avoids unwanted open exposure.')]
};

/** The right answer of a question as text, for the feedback sheet and for Wega. */
export function rightText(q){
  if(q.t==='choice'||q.t==='flow'||q.t==='predict'||q.t==='scam')return q.opts[q.a];
  if(q.t==='chart')return 'Position '+'ABCD'[q.a];
  if(q.t==='fill'){let k=0;return q.text.replace(/___/g,()=>q.a[k++])}
  if(q.t==='order')return q.items.map((t,k)=>`${k+1}. ${t}`).join('  ');
  if(q.t==='match')return q.pairs.map(p=>p[0]+': '+p[1]).join(' · ');
  return '';
}

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


/** Predict: the price path before the trade (shown) and after it (played on answer). Ends exactly at entry×(1+move);
    with a liquidation line in the way, the path stops where it crosses it. */
export function predictData(q){
  const r=rng(q.seed||3),past=[],fut=[],n1=48,n2=30,target=q.entry*(1+q.move);
  let v=q.entry*(1-q.move*.35);
  for(let i=0;i<n1;i++){past.push(v);v+= (q.entry-v)/(n1-i)+(r()-.5)*q.entry*.012}
  past[n1-1]=q.entry;
  for(let i=1;i<=n2;i++){const base=q.entry+(target-q.entry)*(i/n2);fut.push(i===n2?target:base+(r()-.5)*q.entry*.014*(1-i/n2*.6))}
  let hit=-1;
  if(q.liq!=null){const above=q.liq>q.entry;hit=fut.findIndex(x=>above?x>=q.liq:x<=q.liq);if(hit>=0){fut.length=hit+1;fut[hit]=q.liq}}
  const all=[...past,...fut,q.entry,...(q.liq!=null?[q.liq]:[])];
  return{past,fut,hit,mn:Math.min(...all),mx:Math.max(...all),n:n1+n2};
}
