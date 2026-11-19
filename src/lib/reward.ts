'use client';
/* Reward overlay (badgeweb3 reward screen) and badge viewer, ported from the prototype (REW, reward(), closeReward(),
   earnFlow(), openViewer() and the Escape key).
   OWNER: the badges port. Contract used by the quiz and the Academy screens:
   - earnFlow(k, after, done): plays the earn animation for zone key k ('r1.0'); after() continues the quiz flow,
     done() is called at the end of a path (badge, coin, certificate) and should navigate to /badges.
     The overlay is closed before after() / done() run.
   - openViewer(id, onLocked?): opens an earned badge/coin/card in 3D; for a locked level badge it shows the toast
     and calls onLocked(rid, zoneIndex) (the caller navigates to that zone).
   - closeReward(): closes the overlay if open.
   - rewardOpen(): true while the overlay is open (and for the rest of the keydown that closed it with Escape),
     so Wega's own Escape handling can step aside, as in the prototype.
   - openCert(rid, onLocked?) / copyLink(): the prototype's `cert` and `copy` actions.
   The engine is public/w3u-badges.js (window.W3UBadges), loaded with next/script after hydration, so every entry
   point waits briefly for it instead of assuming it is there. */
import { R } from './curriculum';
import { BID, PATH, WB, catItem, bState, deCopy } from './badges';
import { toast } from './toast';

type Reward = { open: (b: unknown, copy: unknown, cb: () => void) => void; go: (b: unknown, copy: unknown, cb: () => void) => void; close: () => void };
type Engine = { createReward: (el: HTMLElement, o: object) => Reward; findBadge: (id: string) => any };

let REW: Reward | null | undefined;
let REW_EL: HTMLElement | null = null;
let REW_MODE: 'earn' | 'view' | null = null;
/** true until the keydown that closed the viewer has finished dispatching */
let escGuard = false;
/** only the latest call that is still waiting for the engine may open the overlay */
let ticket = 0;

const engine = (): Engine | null => WB() as Engine | null;

/** Runs cb with the engine as soon as it has loaded (null if it doesn't load within ms). */
export function whenEngine(cb: (wb: Engine | null) => void, ms = 4000) {
  const wb = engine();
  if (wb || typeof window === 'undefined') return cb(wb);
  const t0 = Date.now();
  const id = setInterval(() => {
    const w = engine();
    if (w || Date.now() - t0 > ms) {
      clearInterval(id);
      cb(w);
    }
  }, 50);
}

function reward(): Reward | null {
  const el = document.getElementById('w3r');
  if (REW !== undefined && REW_EL === el) return REW;
  const wb = engine();
  if (!wb || !el) return null;
  REW_EL = el;
  try {
    REW = wb.createReward(el, {
      hintText: 'Drag to spin · Click to flip',
      hintTouch: 'Drag to spin · Tap to flip',
      thingLabel: (b: any, c: any) => `${c.title}, ${b.kind === 'card' ? 'certificate' : b.completion ? 'completion coin' : 'badge'}. Press to flip.`,
    });
  } catch (e) {
    console.warn(e);
    REW = null;
  }
  return REW;
}

let listening = false;
function listen() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !REW_MODE) return;
    escGuard = true;
    setTimeout(() => (escGuard = false), 0);
    if (REW_MODE === 'view') closeReward();
  });
  /* the prototype's go() closed the overlay on every navigation; browser back/forward is the only one that can
     happen while the overlay covers the app */
  window.addEventListener('popstate', () => closeReward());
}

export const rewardOpen = () => REW_MODE !== null || escGuard;

export function closeReward() {
  if (REW && REW_MODE) {
    REW.close();
    REW_MODE = null;
  }
}

/* quiz passed: the level badge, and at the end of a path the gold coin and the platinum card, as in badgeweb3 */
export function earnFlow(k: string, after: () => void, done: () => void) {
  const [rid, zs] = k.split('.'),
    zi = +zs,
    r = R(rid),
    isAc = rid === 'academy',
    last = zi === r.zones.length - 1;
  const a = () => {
    closeReward();
    after();
  };
  const d = () => {
    closeReward();
    done();
  };
  const t = ++ticket;
  whenEngine(() => {
    if (t !== ticket) return;
    const rw = reward(),
      WBx = engine(),
      b = WBx && WBx.findBadge((BID as Record<string, string>)[k]);
    if (!rw || !b) {
      if (last && !isAc) return d();
      return a();
    }
    listen();
    REW_MODE = 'earn';
    if (isAc || !last) return rw.open(b, deCopy(b), a);
    const p = (PATH as Record<string, string>)[rid];
    const coin = WBx!.findBadge(p + '-coin'),
      card = WBx!.findBadge(p + '-card');
    rw.open(b, deCopy(b), () => rw.go(coin, deCopy(coin), () => rw.go(card, deCopy(card), d)));
  });
}

/* any badge, coin or card from the app: earned ones open on the reward screen */
export function openViewer(id: string, onLocked?: (rid: string, z: number) => void) {
  const [it, c] = catItem(id);
  if (!it || !c) return;
  const s = bState(it);
  if (s.state !== 'earned') {
    if (!it.coin && !it.card) {
      toast(`Pass the ${it.title} quiz to earn this badge.`);
      onLocked?.(it.rid, it.index);
      return;
    }
    return toast(s.hint + '.');
  }
  const t = ++ticket;
  whenEngine(() => {
    if (t !== ticket) return;
    const rw = reward(),
      WBx = engine(),
      b = WBx && WBx.findBadge(id);
    if (!rw || !b) return toast('The 3D view isn’t available.');
    listen();
    REW_MODE = 'view';
    rw.open(b, { ...deCopy(b), cta: 'Close' }, closeReward);
  });
}

/** data-act="cert": the path's certificate (platinum card) in the viewer. */
export const openCert = (rid: string, onLocked?: (rid: string, z: number) => void) => openViewer((PATH as Record<string, string>)[rid] + '-card', onLocked);

/** data-act="copy": the certificate's share link. */
export function copyLink() {
  const t = 'https://web3universe.academy/a/W3U-0427';
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
    () => toast('Link copied'),
    () => toast(t),
  );
}
