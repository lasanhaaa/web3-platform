'use client';
/* BADGES PAGE: badgeweb3's "Grid" and "Paths" views (prototype vBadges / BVIEW / bindBadges). */
import { useProgress } from '@/lib/progress';
import { createStore } from '@/lib/store';
import { B_GRID, B_PATHS } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { BadgeGrid } from './BadgeGrid';
import { BadgePaths } from './BadgePaths';
import { pressKey } from './util';

/** prototype: let BVIEW='grid' (module level, so it survives leaving the page) */
const BVIEW = createStore({ v: 'grid' as 'grid' | 'paths' });

export function BadgesPage() {
  useProgress();
  const v = BVIEW.use().v === 'paths' ? 'paths' : 'grid';
  const set = (nv: 'grid' | 'paths') => BVIEW.set({ v: nv });
  return (
    <div className="page bc fade" key={v}>
      <div className="page-head">
        <div>
          <h1>Badges and certificates</h1>
          <p className="lede">
            Earn a badge for every level you complete. Finish a whole path to collect its gold coin and a certificate, verified on-chain.
          </p>
        </div>
        <div className="head-actions">
          <nav className="view-switch" aria-label="View">
            <a role="button" tabIndex={0} data-act="bview" data-v="grid" aria-current={v === 'grid' ? 'page' : undefined} onClick={() => set('grid')} onKeyDown={pressKey}>
              <Svg src={B_GRID} />
              Grid
            </a>
            <a role="button" tabIndex={0} data-act="bview" data-v="paths" aria-current={v === 'paths' ? 'page' : undefined} onClick={() => set('paths')} onKeyDown={pressKey}>
              <Svg src={B_PATHS} />
              Paths
            </a>
          </nav>
        </div>
      </div>
      {v === 'grid' ? <BadgeGrid /> : <BadgePaths />}
    </div>
  );
}
