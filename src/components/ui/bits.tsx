'use client';
import type { CSSProperties, ReactNode } from 'react';
import { R, pad } from '@/lib/curriculum';
import { I } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { S, isDone, pct, quizOpen } from '@/lib/progress';

/** The "01" zone tile from Figma. */
export function ZTile({ n, s, locked, ico }: { n: number; s: number; locked?: boolean; ico?: ReactNode }) {
  return (
    <span className={`ztile${locked ? ' locked' : ''}`} style={{ '--s': s + 'px' } as CSSProperties}>
      {ico || pad(n)}
    </span>
  );
}

/** Segmented route progress: one bar per zone plus its quiz square. */
export function SegBar({ rid }: { rid: string }) {
  const r = R(rid);
  return (
    <div className="seg">
      {r.zones.map((z: any, zi: number) => {
        const d = z.lessons.filter((_: any, l: number) => isDone(rid, zi, l)).length;
        const st = S.passed.has(rid + '.' + zi) ? 'done' : quizOpen(rid, zi) ? 'open' : '';
        return (
          <span key={zi} style={{ display: 'contents' }}>
            <div className="pbar">
              <span style={{ width: pct(d, z.lessons.length) + '%' }} />
            </div>
            <span className={`sq ${st}`} title={`${z.name} quiz`}>
              <Svg src={st === 'done' ? I.check : st === 'open' ? I.star : I.lock} />
            </span>
          </span>
        );
      })}
    </div>
  );
}
