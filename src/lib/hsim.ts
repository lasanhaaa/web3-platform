'use client';
import { createStore } from './store';
import { PF, hfAt, liqAt, netAt } from './portfolio';

/* The ETH what-if simulator (lending lessons and Wega's answers share it). */
export const hsim = createStore({ chg: 0, repay: false });
export function simVals() {
  const H = hsim.get();
  const c = H.chg,
    p = PF.eth * (1 + c),
    debt = PF.debt - (H.repay ? 1500 : 0),
    h = hfAt(p, debt),
    n = netAt(p);
  return { c, p, h, n, inR: p >= PF.lpLo && p <= PF.lpHi, liq: liqAt(debt) };
}
