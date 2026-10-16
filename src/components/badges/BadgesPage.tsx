'use client';
/* Badges and certificates (Figma 2402:51204): the three certificates first (felipe, Oct 16), then every badge in one grid.
   Each tile says plainly where it stands: completed, how far along, or what opens it.
   Earned items open in the 3D viewer; the others take you to the zone that earns them. */
import type { CSSProperties } from 'react';
import { CAT, still } from '@/lib/badges';
import { S, useProgress, routeOpen, zoneOpen, isDone } from '@/lib/progress';
import { openViewer } from '@/lib/reward';
import { useGo } from '@/lib/nav';
import { useHydrated } from '@/lib/hydrated';

type Item = any;
type Cat = any;
type Status = { state: 'earned' | 'progress' | 'locked'; label: string; pct?: number };

/* eslint-disable @next/next/no-img-element */
function status(it: Item, c: Cat): Status {
  const r = c.r;
  if (!it.coin && !it.card) {
    const z = r.zones[it.index],
      total = z.lessons.length,
      done = z.lessons.filter((_: any, l: number) => isDone(it.rid, it.index, l)).length;
    if (S.passed.has(it.k)) return { state: 'earned', label: 'Completed' };
    if (!zoneOpen(it.rid, it.index)) return { state: 'locked', label: it.index > 0 ? `Opens after ${r.zones[it.index - 1].name}` : 'Opens after the Academy' };
    if (done === total) return { state: 'progress', label: 'Quiz ready', pct: 100 };
    return { state: 'progress', label: `${done} of ${total} lessons`, pct: (done / total) * 100 };
  }
  const n = r.zones.length,
    d = r.zones.filter((_: any, i: number) => S.passed.has(it.rid + '.' + i)).length;
  if (d === n) return { state: 'earned', label: it.card ? 'Issued' : 'Completed' };
  if (!routeOpen(it.rid)) return { state: 'locked', label: 'Opens after the Academy' };
  return { state: 'progress', label: `${d} of ${n} badges`, pct: (d / n) * 100 };
}

function Tile({ it, c, onOpen }: { it: Item; c: Cat; onOpen: (id: string) => void }) {
  const st = status(it, c),
    eye = it.card ? 'Certificate' : it.intro ? 'Required start' : c.name,
    name = it.card ? c.name : it.coin ? 'Completion coin' : it.title;
  return (
    <li className={`bx-tile is-${st.state}${it.card ? ' bx-cert' : ''}`} style={{ '--c': c.color } as CSSProperties}>
      <button className="bx-btn" onClick={() => onOpen(it.id)} aria-label={`${name}, ${st.label}`}>
        <span className="bx-art">
          <img src={still(it.id)} alt="" width={it.card ? 800 : 320} height={it.card ? 566 : 320} loading="lazy" decoding="async" />
        </span>
        <span className="bx-meta">
          <span className="bx-eye">{eye}</span>
          <span className="bx-name">{name}</span>
          <span className="bx-st tnum">
            {st.state === 'progress' && (
              <span className="bx-bar" aria-hidden>
                <i style={{ width: st.pct + '%' }} />
              </span>
            )}
            {st.state === 'locked' && <img src="/assets/learn/seg-lock.svg" width={14} height={14} alt="" />}
            <span>{st.label}</span>
            {st.state === 'earned' && <img src="/assets/badges/check.svg" width={12} height={9} alt="" />}
          </span>
        </span>
      </button>
    </li>
  );
}

export function BadgesPage() {
  useProgress();
  const hydrated = useHydrated();
  const go = useGo();
  if (!hydrated) return <div className="page bx" />;
  const open = (id: string) => openViewer(id, (r, z) => go({ screen: 'route', r, z }));
  const badges: [Item, Cat][] = CAT.flatMap((c: Cat) => c.items.filter((x: Item) => !x.card).map((x: Item) => [x, c]));
  const certs: [Item, Cat][] = CAT.flatMap((c: Cat) => c.extra.filter((x: Item) => x.card).map((x: Item) => [x, c]));
  const nb = badges.filter(([x, c]) => status(x, c).state === 'earned').length,
    nc = certs.filter(([x, c]) => status(x, c).state === 'earned').length;
  return (
    <div className="page bx fade">
      <header className="bx-head">
        <h1>Badges and certificates</h1>
        <p className="tnum">
          {nc} of {certs.length} certificates · {nb} of {badges.length} badges
        </p>
      </header>
      <ul className="bx-certs">
        {certs.map(([x, c]) => (
          <Tile key={x.id} it={x} c={c} onOpen={open} />
        ))}
      </ul>
      <ul className="bx-grid">
        {badges.map(([x, c]) => (
          <Tile key={x.id} it={x} c={c} onOpen={open} />
        ))}
      </ul>
    </div>
  );
}
