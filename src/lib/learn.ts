'use client';
/* Shared copy helpers about the user's next step (used by the Academy screens and by Wega). */
import { R, pad } from './curriculum';
import type { Step } from './progress';

export const stepTitle = (f: Step) => {
  const r = R(f.r),
    z = r.zones[f.z];
  return f.quiz ? `Quiz: ${z.name}` : z.lessons[f.l!].t;
};
export const stepCrumb = (f: Step) => {
  const r = R(f.r);
  return f.r === 'academy' ? 'Academy' : `${r.name} · Zone ${pad(f.z + 1)}`;
};
/** Wega's one-line reason for the next step, tied to the sample portfolio. */
export function whyNext(f: Step | null) {
  if (!f) return '';
  if (f.r === 'academy') return 'The Academy is the required start. After it, the three routes open.';
  if (f.r === 'r1' && f.z === 0) return 'You have 4 unlimited approvals open. This zone shows how to check and revoke them.';
  if (f.r === 'r1' && f.z === 1) return 'Fits your 5,900 USDC on Arbitrum: here you learn to move them safely to other chains.';
  if (f.r === 'r1' && f.z === 2) return 'Fits your Aave loan: this zone explains Health Factor and liquidation.';
  if (f.r === 'r2') return 'Your ETH/USDC LP is a strategy from this route.';
  return 'Pick up where you left off.';
}
/** What this zone means for the sample portfolio (lesson notes and Wega). Supports **bold**. */
export function portFor(r: string, z: number) {
  if (r === 'academy') return 'Right now **$17,260** depends on your wallet (sample data). All of it hangs on one seed phrase. For that amount a hardware wallet is worth it, and the seed phrase belongs on paper only.';
  if (r === 'r1' && z === 0) return 'You have **4 unlimited approvals** open. One goes to an unverified contract that has been unused for 214 days. That’s exactly the case from the lesson “Approvals”.';
  if (r === 'r1' && z === 1) return 'Your **5,900 USDC** sit on Arbitrum. If you want them on another chain, CCTP is the direct route: native USDC, no pool, no slippage. You still need gas on the destination chain.';
  if (r === 'r1' && z === 2) return 'Your Aave loan has a **Health Factor of 1.42**. If ETH drops 29.5% to $2,255, you get liquidated. That’s the math from “Collateral and liquidation”.';
  if (r === 'r2') return 'Your ETH/USDC LP (**$4,200**, range $2,900–$3,400) earned $38 in fees over 30 days. If ETH leaves the range, it stops earning and you carry impermanent loss.';
  return 'Your LP has a range of $2,900–$3,400. PerpPilot could move the range when ETH leaves it, and warn you first.';
}
