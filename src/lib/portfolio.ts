// @ts-nocheck
/* Ported 1:1 from the single-file prototype (academy.html v8). Sample copy for the content team to review. */
export const PF={eth:3200,wEth:1.1,usdc:5900,arb:1500,arbP:.64,aEth:2,debt:3720,lt:.825,lp:4200,lpLo:2900,lpHi:3400,fees30:38,int30:23,apy:.041,borrow:.05};
export const hfAt=(p=PF.eth,debt=PF.debt,coll=PF.aEth)=>coll*p*PF.lt/debt;
export const liqAt=(debt=PF.debt,coll=PF.aEth)=>debt/(coll*PF.lt);
export const netAt=p=>PF.wEth*p+PF.usdc+PF.arb*PF.arbP+PF.aEth*p-PF.debt+PF.lp/2+PF.lp/2*p/PF.eth;
export const num=(n,d=0)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
export const usd=n=>'$'+num(Math.round(n));
export const pctS=n=>{const v=Math.round(Math.abs(n)*10)/10;return(n>0.04?'+':n<-0.04?'−':'')+num(v,v%1?1:0)+'%'};
export const hfCls=h=>h<1?'no':h<1.75?'warn':'ok';
export const APPR=[['Uniswap Universal Router','verified · last used 3 days ago',true],['1inch Aggregation Router','verified · last used 41 days ago',true],['Aave Pool v3','verified · active loan',true],['0x7a3f…c91e','unverified · unused for 214 days',false]];
export const WATCH=[{id:'hf',t:'Health Factor below 1.30',s:'Aave · now 1.42',on:true},{id:'lp',t:'LP leaves its range',s:'ETH/USDC · $2,900–$3,400',on:true},{id:'appr',t:'New unlimited approval',s:'All wallets',on:true}];
export const ALERT_SUGG=[{id:'eth',t:'ETH below $2,800',s:'Push and email · now $3,200'},{id:'hf2',t:'Health Factor below 1.20',s:'Last warning before liquidation'},{id:'fund',t:'Funding rate turns negative',s:'Perp markets you follow'}];
