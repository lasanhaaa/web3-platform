'use client';
import { usd } from '@/lib/portfolio';
import { Pts } from './bits';

type Row = { id: string; name: string; color: string; v: number };
const C = 160,
  R = 146,
  W = 26,
  GAP = 1.4; // degrees between segments

function arc(a0: number, a1: number) {
  const p = (a: number) => {
    const r = ((a - 90) * Math.PI) / 180;
    return [C + R * Math.cos(r), C + R * Math.sin(r)].map((n) => n.toFixed(2)).join(' ');
  };
  return `M ${p(a0)} A ${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p(a1)}`;
}

/** The allocation donut ($74,174 in the middle). Hovering or selecting a row highlights its segment. */
export function Donut({ rows, total, chg, active, onHover, onPick }: { rows: Row[]; total: number; chg: number; active: string | null; onHover: (id: string | null) => void; onPick: (id: string) => void }) {
  const sum = rows.reduce((a, r) => a + r.v, 0) || 1;
  let a = 0;
  const segs = rows.map((r) => {
    const span = (r.v / sum) * 360,
      s = { ...r, a0: a + GAP / 2, a1: a + span - GAP / 2 };
    a += span;
    return s;
  });
  const act = rows.find((r) => r.id === active);
  return (
    <div className={`st-donut${act ? ' hov' : ''}`} onMouseLeave={() => onHover(null)}>
      <svg viewBox="0 0 320 320" role="img" aria-label={`Allocation, ${usd(total)} in total`}>
        {segs.map((s) => (
          <path
            key={s.id}
            className={`seg${s.id === active ? ' hl' : ''}`}
            d={arc(s.a0, Math.max(s.a0 + 0.5, s.a1))}
            fill="none"
            stroke={s.color}
            strokeWidth={W}
            onMouseEnter={() => onHover(s.id)}
            onClick={() => onPick(s.id)}
          >
            <title>{`${s.name}: ${usd(s.v)}`}</title>
          </path>
        ))}
      </svg>
      <div className="st-dc">
        {act ? (
          <>
            <span className="k">{act.name}</span>
            <b>{usd(act.v)}</b>
            <span className="chg">{Math.round((act.v / total) * 100)}% of the portfolio</span>
          </>
        ) : (
          <>
            <Pts icons={['hl', 'extended', 'lighter', 'usdc', 'sol', 'eth', 'gold']} size={32} max={4} />
            <b>{usd(total)}</b>
            <span className="chg">
              ({chg >= 0 ? '+' : '−'}
              {Math.abs(chg).toFixed(2)}%)
            </span>
          </>
        )}
      </div>
    </div>
  );
}
