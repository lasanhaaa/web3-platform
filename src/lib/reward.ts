'use client';
/* Reward overlay (badgeweb3 reward screen) and badge viewer.
   OWNER: the badges port. Contract used by the quiz and the Academy screens:
   - earnFlow(k, after, done): plays the earn animation for zone key k ('r1.0'); after() continues the quiz flow,
     done() is called at the end of a path (badge, coin, certificate) and should navigate to /badges.
   - openViewer(id, onLocked?): opens an earned badge/coin/card in 3D; for a locked level badge calls onLocked(rid, zoneIndex).
   - closeReward(): closes the overlay if open. */
export function earnFlow(_k: string, after: () => void, _done: () => void) {
  after();
}
export function openViewer(_id: string, _onLocked?: (rid: string, z: number) => void) {}
export function closeReward() {}
