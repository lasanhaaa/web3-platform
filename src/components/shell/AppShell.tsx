'use client';
import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ICONS } from '@/lib/icons';
import { S, useProgress, restoreDemo, setDemo, setHint, type DemoKind } from '@/lib/progress';
import { toast, useToast } from '@/lib/toast';
import { WegaRoot } from '@/components/wega/Wega';
import { toursReset } from '@/lib/tours';
import { GOOSE } from '@/lib/icons';
import { Svg } from '@/lib/svg';

type Item = { label: string; icon: keyof typeof NAV_ICONS; href?: string; on?: (p: string) => boolean; count?: boolean };
const NAV: (Item | '-')[] = [
  { label: 'Overview', icon: 'overview' },
  { label: 'My Portfolio', icon: 'portfolio' },
  { label: 'Wega', icon: 'wega', href: '/wega', on: (p) => p.startsWith('/wega') },
  '-',
  { label: 'Academy', icon: 'academy', href: '/academy', on: (p) => p.startsWith('/academy') },
  { label: 'Badges & Certificates', icon: 'badges', href: '/badges', on: (p) => p.startsWith('/badges'), count: true },
  { label: 'Live Calls', icon: 'calls' },
  { label: 'Glossary', icon: 'glossary' },
  { label: 'Community', icon: 'community' },
  '-',
  { label: 'Track Record', icon: 'track' },
  { label: 'Strategies', icon: 'strategies', href: '/strategies', on: (p) => p.startsWith('/strategies') },
  { label: 'Tools', icon: 'tools' },
  { label: 'Events', icon: 'events' },
  { label: 'Research', icon: 'research' },
  { label: 'Rewards', icon: 'rewards' },
];
const notInPrototype = () => toast('This section isn’t part of the prototype.');
const Ico = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Brand = () => (
  <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
    <path d="M12 2 22 12 12 22 2 12Z" stroke="#9ED3FF" strokeWidth={1.6} />
    <path d="M12 6.5 17.5 12 12 17.5 6.5 12Z" fill="#1783FF" stroke="#9ED3FF" strokeWidth={1.2} />
  </svg>
);

/** Focus mode (no sidebar) for the lesson player and quizzes, as in the prototype. */
const isFocus = (p: string) => /^\/academy\/[^/]+\/\d+\/(\d+|quiz)\/?$/.test(p);

function DemoSelect({ compact }: { compact?: boolean }) {
  useProgress();
  const opts: [DemoKind, string, string][] = [
    ['fresh', 'New: nothing done', 'New'],
    ['academyQuiz', 'Academy done, quiz open', 'Academy quiz'],
    ['mid', 'Midway through Route 1', 'Route 1'],
    ['almost', 'Route 1: last quiz open', 'Last quiz'],
    ['r1done', 'Route 1 finished', 'Route 1 done'],
  ];
  return (
    <select
      aria-label="Prototype state"
      value={S.demo}
      onChange={(e) => {
        setDemo(e.target.value as DemoKind);
        if (e.target.value === 'fresh') toursReset();
      }}
      className={compact ? 'demo-m' : undefined}
    >
      {opts.map(([v, l, s]) => (
        <option key={v} value={v}>
          {compact ? s : l}
        </option>
      ))}
    </select>
  );
}

export function Toast() {
  const t = useToast();
  return (
    <div className={`toast${t.show ? ' show' : ''}`} role="status" aria-live="polite">
      {t.text}
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const p = usePathname() || '/';
  useProgress();
  useEffect(() => {
    restoreDemo();
  }, []);
  const earned = Object.keys(S.earned).length;
  return (
    <>
      <div className={`app${isFocus(p) ? ' focus' : ''}`} id="app">
        <aside className="side" aria-label="Navigation">
          <div className="brand">
            <Brand />
            Web3 Universe
          </div>
          <div className="search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            Search<kbd>⌘ K</kbd>
          </div>
          <nav className="nav">
            {NAV.map((n, i) =>
              n === '-' ? (
                <hr key={i} />
              ) : n.href ? (
                <Link key={n.label} href={n.href} className={n.on?.(p) ? 'on' : undefined} aria-current={n.on?.(p) ? 'page' : undefined}>
                  {n.icon === 'wega' ? <Svg src={GOOSE} className="goose" /> : <Ico d={NAV_ICONS[n.icon]} />}
                  {n.label}
                  {n.count && <span className="count">{earned}/9</span>}
                </Link>
              ) : (
                <button key={n.label} onClick={notInPrototype}>
                  <Ico d={NAV_ICONS[n.icon]} />
                  {n.label}
                </button>
              ),
            )}
          </nav>
          <div className="side-foot">
            <div className="demo">
              <span className="mono">Prototype · State</span>
              <DemoSelect />
              <label className="chk" htmlFor="demoHint">
                <input type="checkbox" id="demoHint" checked={S.hint} onChange={(e) => setHint(e.target.checked)} /> Highlight quiz answer
              </label>
            </div>
            <div className="lang">
              <button className="on">EN</button>
              <button onClick={() => toast('The prototype shows the English interface.')}>DE</button>
            </div>
            <div className="nav">
              <button onClick={notInPrototype}>
                <Ico d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
                Settings
              </button>
            </div>
            <div className="user">
              <div className="avatar">D</div>
              <div>
                Daniel<small>daniel@web.de</small>
              </div>
            </div>
          </div>
        </aside>
        <main>
          <div className="topbar">
            <div className="brand">
              <Brand />
            </div>
            <nav id="mnav">
              <button onClick={notInPrototype}>Overview</button>
              <Link href="/academy" className={p.startsWith('/academy') ? 'on' : undefined}>Academy</Link>
              <Link href="/badges" className={p.startsWith('/badges') ? 'on' : undefined}>Badges</Link>
              <Link href="/strategies" className={p.startsWith('/strategies') ? 'on' : undefined}>Strategies</Link>
              <Link href="/wega" className={p.startsWith('/wega') ? 'on' : undefined}>Wega</Link>
            </nav>
            <div className="tb-r">
              <DemoSelect compact />
            </div>
          </div>
          <div id="view">{children}</div>
        </main>
      </div>
      <div id="overlay" />
      <div className="w3r" id="w3r" hidden />
      <Toast />
      <WegaRoot />
    </>
  );
}
