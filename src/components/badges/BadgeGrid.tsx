'use client';
/* Grid view: the certificates, then one section per path (prototype bTile / bSection / bGrid). */
import { useRef, type PointerEvent, type ReactNode } from 'react';
import { CAT, still, nameOf, bState } from '@/lib/badges';
import { B_CHECK, B_LOCK } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { openViewer } from '@/lib/reward';
import { useGo } from '@/lib/nav';
import { pressKey, css } from './util';

type Item = any;
type Cat = any;

/* prototype bindBadges: the tilt and shine follow the pointer on devices with a fine pointer */
const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function Tile({ it, c, onOpen }: { it: Item; c: Cat; onOpen: (id: string) => void }) {
  const s = bState(it),
    card = !!it.card,
    name = nameOf(it, c),
    src = still(it.id),
    [w, h] = card ? [800, 566] : [320, 320];
  const icon = s.state === 'earned' ? B_CHECK : s.state === 'locked' ? B_LOCK : '';
  const art = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const move = (e: PointerEvent) => {
    if (!fine()) return;
    const x0 = e.clientX,
      y0 = e.clientY;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = art.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (x0 - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (y0 - r.top) / r.height));
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      if (!reduced()) {
        el.style.setProperty('--ry', `${((x - 0.5) * 14).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${((0.5 - y) * 10).toFixed(2)}deg`);
      }
    });
  };
  const leave = () => {
    if (!fine()) return;
    cancelAnimationFrame(frame.current);
    const el = art.current;
    if (el) ['--mx', '--my', '--rx', '--ry'].forEach((p) => el.style.removeProperty(p));
  };
  return (
    <li
      className={`tile is-${s.state}${card ? ' tile--card' : ''}`}
      style={css({ '--c': c.color, '--glow': it.glow })}
      data-act="badge"
      data-id={it.id}
      role="button"
      tabIndex={0}
      aria-label={name}
      onClick={() => onOpen(it.id)}
      onKeyDown={pressKey}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      <div className="art" ref={art} style={css({ '--mask': `url('${src}')` })}>
        <div className="art-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" width={w} height={h} loading="lazy" decoding="async" />
          <span className="shine" aria-hidden="true" />
          {card && <span className="holo" aria-hidden="true" />}
        </div>
      </div>
      <h3 className="tile-name">
        {card && <span className="dot" aria-hidden="true" />}
        {name}
      </h3>
      <div className="meter">
        <span className="bar" role="progressbar" aria-label={`${name} progress`} aria-valuemin={0} aria-valuemax={s.total} aria-valuenow={s.done}>
          <span style={{ width: `${(s.done / s.total) * 100}%` }} />
        </span>
        <span className="count">
          {s.done}/{s.total}
        </span>
      </div>
      <p className="hint">
        {icon && <Svg src={icon} />}
        {s.hint}
      </p>
    </li>
  );
}

function Section({ id, title, meta, color, cards, children }: { id: string; title: string; meta: string; color?: string; cards?: boolean; children: ReactNode }) {
  return (
    <section className="group" aria-labelledby={`g-${id}`}>
      <header className="group-head">
        <h2 id={`g-${id}`}>
          {color && <span className="dot" style={css({ '--c': color })} aria-hidden="true" />}
          {title}
        </h2>
        <p>{meta}</p>
      </header>
      <ul className={`tiles${cards ? ' tiles--cards' : ''}`}>{children}</ul>
    </section>
  );
}

export function BadgeGrid() {
  const go = useGo();
  const open = (id: string) => openViewer(id, (r, z) => go({ screen: 'route', r, z }));
  const cards: [Item, Cat][] = CAT.flatMap((c: Cat) => c.extra.filter((x: Item) => x.card).map((x: Item) => [x, c]));
  const issued = cards.filter(([x]) => bState(x).state === 'earned').length;
  return (
    <div className="sections">
      <Section id="certificates" title="Certificates" meta={`${issued} of ${cards.length} issued`} cards>
        {cards.map(([x, c]) => (
          <Tile key={x.id} it={x} c={c} onOpen={open} />
        ))}
      </Section>
      {CAT.map((c: Cat) => {
        const its = c.items.filter((x: Item) => !x.card),
          e = its.filter((x: Item) => bState(x).state === 'earned').length;
        return (
          <Section key={c.id} id={c.id} title={c.name} meta={`${e} of ${its.length} unlocked`} color={c.color}>
            {its.map((x: Item) => (
              <Tile key={x.id} it={x} c={c} onOpen={open} />
            ))}
          </Section>
        );
      })}
    </div>
  );
}
