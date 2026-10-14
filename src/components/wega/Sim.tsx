'use client';
import { hsim, simVals } from '@/lib/hsim';
import { num, usd, pctS, hfCls } from '@/lib/portfolio';

/* The ETH what-if simulator: lending lessons ("In your wallet") and Wega's answers share it. */
export function SimOut() {
  hsim.use();
  const v = simVals();
  return (
    <>
      <div className="sim-out">
        <div>
          <span>Health Factor</span>
          <b className={hfCls(v.h)}>{num(v.h, 2)}</b>
        </div>
        <div>
          <span>Liquidation at</span>
          <b>{usd(v.liq)}</b>
        </div>
        <div>
          <span>Net worth</span>
          <b>{usd(v.n)}</b>
        </div>
        <div>
          <span>LP range</span>
          <b className={v.inR ? 'ok' : 'warn'}>{v.inR ? 'In range' : 'Out of range'}</b>
        </div>
      </div>
      <p className="sim-msg">
        {v.h < 1
          ? 'Your Aave loan would be liquidated. Repaying 1,500 USDC would prevent it.'
          : v.h < 1.2
            ? 'Very tight: Wega would warn you now.'
            : v.inR
              ? 'All clear: the LP keeps earning fees.'
              : 'Out of range, the LP stops earning fees.'}
      </p>
    </>
  );
}

export function SimBlock() {
  const H = hsim.use();
  const v = simVals();
  return (
    <div className="simx">
      <div className="sim-top">
        <span className="sim-l">
          ETH <span>{pctS(v.c * 100)}</span>
        </span>
        <b>{usd(v.p)}</b>
      </div>
      <input
        type="range"
        min={-50}
        max={50}
        step={5}
        value={Math.round(v.c * 100)}
        aria-label="ETH price change in percent"
        onChange={(e) => {
          H.chg = +e.target.value / 100;
          hsim.commit();
        }}
      />
      <div className="sim-scale">
        <span>−50%</span>
        <span>today</span>
        <span>+50%</span>
      </div>
      <label className="chk2">
        <input
          type="checkbox"
          checked={H.repay}
          onChange={(e) => {
            H.repay = e.target.checked;
            hsim.commit();
          }}
        />{' '}
        Repay 1,500 USDC to Aave
      </label>
      <SimOut />
    </div>
  );
}
