'use client';
import Link from 'next/link';
import { readiness, valueOf, type Strat, type Wallet } from '@/lib/strategies';
import { usd } from '@/lib/portfolio';
import { hrefStrategies } from '@/lib/nav';
import { I } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { useHydrated } from '@/lib/hydrated';
import { DiffMeter, Pts, Spark, diffStyle } from './bits';

const pct2 = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(2)}%`;

/** Readiness label Wega adds to the card footer: lessons still missing for this strategy. */
function Fit({ s }: { s: Strat }) {
  const hydrated = useHydrated();
  if (s.status === 'Closed') return <span className="st-fit mute">Closed</span>;
  if (!hydrated) return <span className="st-fit" aria-hidden />;
  const r = readiness(s);
  if (!r.missing.length)
    return (
      <span className="st-fit ok" title="You’ve finished every lesson this strategy needs">
        <Svg src={I.check} />
        Ready
      </span>
    );
  return (
    <span className="st-fit" title="Lessons Wega suggests before you enter">
      <Spark />
      {r.missing.length} {r.missing.length === 1 ? 'lesson' : 'lessons'} to go
    </span>
  );
}

/** Figma "Strategies card" (374 x 297). */
export function StratCard({ s, port }: { s: Strat; port: Wallet | 'all' }) {
  const v = valueOf(s, port),
    closed = s.status === 'Closed';
  return (
    <Link href={hrefStrategies(s.id)} scroll={false} className="st-card" style={diffStyle(s.diff)} aria-label={`${s.name}, ${s.status}`}>
      <div className="st-c-top">
        <div className="st-ico">
          <Pts icons={s.icons} />
        </div>
        <div className="st-c-id">
          <div className="st-tags">
            {s.status}
            <i />
            {s.type}
          </div>
          <h3>{s.name}</h3>
        </div>
        <div className={`st-c-val${closed ? ' closed' : s.ret < 0 ? ' neg' : ''}`}>
          <b>{closed ? 'Closed' : usd(v)}</b>
          <span>
            {pct2(s.ret)}
            {closed ? ' final' : ''}
          </span>
        </div>
        <hr />
        <div className="st-c-meta">
          <div>
            <span>Mechanism</span>
            <b>{s.mech}</b>
          </div>
          <div>
            <span>Chain</span>
            <b>{s.chain}</b>
          </div>
        </div>
      </div>
      <div className="st-c-foot">
        <DiffMeter d={s.diff} />
        <Fit s={s} />
      </div>
    </Link>
  );
}
