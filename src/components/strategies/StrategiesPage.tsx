'use client';
import { Suspense, useMemo, useState } from 'react';
import { STRATS, WALLET, DIFFS, CHANGES, LAST_VISIT, allocation, inRow, fitScore, stUi, valueOf, type Diff, type GroupBy, type Wallet } from '@/lib/strategies';
import { useProgress } from '@/lib/progress';
import { usd } from '@/lib/portfolio';
import { GOAL } from '@/lib/curriculum';
import { wgRun } from '@/lib/wega';
import { I, NAV_ICONS } from '@/lib/icons';
import { Svg, Md } from '@/lib/svg';
import { Donut } from './Donut';
import { StratCard } from './StratCard';
import { StratModal } from './StratModal';
import { Dropdown, Orb, Spark } from './bits';

type Status = 'all' | 'Active' | 'On hold' | 'Closed';
type Sort = 'newest' | 'apr' | 'diff' | 'fit';
const SORTS: { v: Sort; label: string; note?: string; wega?: boolean }[] = [
  { v: 'newest', label: 'Newest' },
  { v: 'apr', label: 'Highest APR' },
  { v: 'diff', label: 'Easiest first' },
  { v: 'fit', label: 'Best fit for you', note: 'Wega ranks by your lessons and goal', wega: true },
];

/** Wega's strip above the model portfolio: what changed since the last visit. */
function SinceStrip() {
  const U = stUi.use();
  if (U.stripOff) return null;
  return (
    <div className="st-strip" role="status">
      <Orb />
      <span className="lead">Since {LAST_VISIT}</span>
      <ul>
        {CHANGES.map((c) => (
          <li key={c.id}>
            <Md text={c.html} />
          </li>
        ))}
      </ul>
      <span className="sp" />
      <button className="btn text sm" onClick={() => wgRun('s_changes', 'What changed since my last visit?')}>
        What it means for me
      </button>
      <button
        className="x"
        aria-label="Dismiss"
        onClick={() => {
          stUi.get().stripOff = true;
          stUi.commit();
        }}
      >
        <Svg src={I.x} />
      </button>
    </div>
  );
}

export function StrategiesPage() {
  useProgress();
  const [wallet, setWallet] = useState<Wallet>(1);
  const [by, setBy] = useState<GroupBy>('strategy');
  const [hov, setHov] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('all');
  const [diff, setDiff] = useState<'all' | Diff>('all');
  const [port, setPort] = useState<'all' | Wallet>('all');
  const [sort, setSort] = useState<Sort>('newest');

  const rows = useMemo(() => allocation(wallet, by), [wallet, by]);
  const W = WALLET[wallet];
  const active = hov ?? sel;
  const pick = (id: string) => setSel((cur) => (cur === id ? null : id));

  const list = STRATS.filter(
    (s) =>
      (status === 'all' || s.status === status) &&
      (diff === 'all' || s.diff === diff) &&
      (port === 'all' || valueOf(s, port) > 0) &&
      (!sel || inRow(s, by, sel)),
  ).sort((a, b) =>
    sort === 'apr' ? b.apr - a.apr : sort === 'diff' ? DIFFS.indexOf(a.diff) - DIFFS.indexOf(b.diff) : sort === 'fit' ? fitScore(b) - fitScore(a) : b.added.localeCompare(a.added),
  );
  const filtered = status !== 'all' || diff !== 'all' || port !== 'all' || !!sel;
  const clear = () => {
    setStatus('all');
    setDiff('all');
    setPort('all');
    setSel(null);
  };
  const selName = rows.find((r) => r.id === sel)?.name;

  return (
    <div className="page st">
      <div className="st-head">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d={NAV_ICONS.strategies} />
        </svg>
        Strategies
      </div>
      <SinceStrip />
      <section className="st-mp">
        <div className="st-mp-l">
          <div className="st-mp-h">
            <div>
              <h2>Model portfolio</h2>
              <div className="st-seg" role="radiogroup" aria-label="Wallet">
                {([1, 2] as Wallet[]).map((w) => (
                  <button
                    key={w}
                    role="radio"
                    aria-checked={wallet === w}
                    className={wallet === w ? 'on' : undefined}
                    onClick={() => {
                      setWallet(w);
                      setSel(null);
                    }}
                  >
                    Wallet {w}
                  </button>
                ))}
              </div>
            </div>
            <div className="st-seg" role="radiogroup" aria-label="Group by">
              {(
                [
                  ['strategy', 'Strategy'],
                  ['chain', 'Chain'],
                  ['type', 'Type'],
                ] as [GroupBy, string][]
              ).map(([v, l]) => (
                <button
                  key={v}
                  role="radio"
                  aria-checked={by === v}
                  className={by === v ? 'on' : undefined}
                  onClick={() => {
                    setBy(v);
                    setSel(null);
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className={`st-tbl${active ? ' hov' : ''}`} onMouseLeave={() => setHov(null)}>
            {rows.map((r) => (
              <button
                key={r.id}
                className={`st-row${r.id === active ? ' hl' : ''}`}
                aria-pressed={sel === r.id}
                onMouseEnter={() => setHov(r.id)}
                onFocus={() => setHov(r.id)}
                onBlur={() => setHov(null)}
                onClick={() => pick(r.id)}
              >
                <span className="nm">
                  <i style={{ background: r.color }} />
                  <span>{r.name}</span>
                </span>
                <span className="pc">{Math.round((r.v / W.total) * 100)}%</span>
                <span className="vl">{usd(r.v)}</span>
              </button>
            ))}
          </div>
        </div>
        <Donut rows={rows} total={W.total} chg={W.chg} active={active} onHover={setHov} onPick={pick} />
      </section>

      <div className="st-fbar">
        <Dropdown<Status>
          label={status === 'all' ? 'Select status' : status}
          value={status}
          set={status !== 'all'}
          onChange={setStatus}
          opts={[
            { v: 'all', label: 'All statuses' },
            { v: 'Active', label: 'Active' },
            { v: 'On hold', label: 'On hold' },
            { v: 'Closed', label: 'Closed' },
          ]}
        />
        <Dropdown<'all' | Diff>
          label={diff === 'all' ? 'Difficulty' : diff}
          value={diff}
          set={diff !== 'all'}
          onChange={setDiff}
          opts={[{ v: 'all', label: 'All difficulties' }, ...DIFFS.map((d) => ({ v: d, label: d }))]}
        />
        <Dropdown<'all' | '1' | '2'>
          className="st-port"
          label={port === 'all' ? 'All portfolios' : `Wallet ${port}`}
          value={String(port) as 'all' | '1' | '2'}
          set={port !== 'all'}
          onChange={(v) => setPort(v === 'all' ? 'all' : (+v as Wallet))}
          opts={[
            { v: 'all', label: 'All portfolios' },
            { v: '1', label: 'Wallet 1' },
            { v: '2', label: 'Wallet 2' },
          ]}
        />
        {filtered && (
          <button className="st-clear" onClick={clear}>
            <Svg src={I.x} />
            Clear filters{selName ? ` (${selName})` : ''}
          </button>
        )}
        <Dropdown<Sort>
          className="st-sort"
          label={sort === 'newest' ? 'Sort by' : SORTS.find((s) => s.v === sort)!.label}
          icon={sort === 'fit' ? <span className="sp"><Spark /></span> : undefined}
          value={sort}
          set={sort === 'fit'}
          onChange={setSort}
          opts={SORTS}
        />
      </div>
      {sort === 'fit' && (
        <p className="st-note">
          <Spark />
          <span>
            <b>Sorted by Wega</b> for your goal ({GOAL}) and the lessons you’ve finished. It ranks fit, not expected return, and isn’t a recommendation to buy.
          </span>
        </p>
      )}
      <div className="st-grid">
        {list.map((s) => (
          <StratCard key={s.id} s={s} port={port} />
        ))}
        {!list.length && (
          <div className="st-empty">
            <b>No strategy matches these filters</b>
            <button className="btn text" onClick={clear}>
              Clear filters
            </button>
          </div>
        )}
      </div>
      <Suspense fallback={null}>
        <StratModal />
      </Suspense>
    </div>
  );
}
