'use client';
/* Shared bits of the Academy screens: the prototype's click actions (data-act) as one hook,
   the step button (stepBtn), Wega's orb and a hydration-safe clock. */
import { useSyncExternalStore } from 'react';
import { R } from '@/lib/curriculum';
import { BID, PATH } from '@/lib/badges';
import { openViewer } from '@/lib/reward';
import { useGo } from '@/lib/nav';
import { S, lessonOpen, quizOpen, chooseRoute, type Step } from '@/lib/progress';
import { toast } from '@/lib/toast';
import { wgRun } from '@/lib/wega';
import { SPARK } from '@/lib/icons';
import { Svg } from '@/lib/svg';

/** Curriculum image paths are relative ('assets/pawn-m.webp'); the app serves them from the root. */
export const img = (src: string) => '/' + String(src).replace(/^\/+/, '');

const bid = (k: string) => (BID as Record<string, string>)[k];
const pathOf = (r: string) => (PATH as Record<string, string>)[r];

/** The prototype's click handler actions used on the Academy screens. */
export function useAcademyActs() {
  const go = useGo();
  const onLocked = (rid: string, z: number) => go({ screen: 'route', r: rid, z });
  const lesson = (r: string, z: number, l: number) => {
    if (!lessonOpen(r, z, l)) return toast('This lesson is still locked.');
    go({ screen: 'lesson', r, z, l });
  };
  const quiz = (r: string, z: number) => {
    if (!quizOpen(r, z) && !S.passed.has(r + '.' + z)) return toast('Finish all lessons in this zone first.');
    go({ screen: 'quiz', r, z });
  };
  return {
    map: () => go({ screen: 'map' }),
    badges: () => go({ screen: 'badges' }),
    fork: () => go({ screen: 'fork' }),
    route: (r: string, z = 0) => go({ screen: 'route', r, z: isNaN(z) ? 0 : z }),
    lesson,
    quiz,
    /** stepBtn's action: the next lesson or the zone quiz */
    step: (f: Step) => (f.quiz ? quiz(f.r, f.z) : lesson(f.r, f.z, f.l ?? 0)),
    choose: (r: string) => {
      chooseRoute(r);
      toast(R(r).name + ' started');
      go({ screen: 'route', r, z: 0 });
    },
    cert: (r: string) => openViewer(pathOf(r) + '-card', onLocked),
    badge: (k?: string, id?: string) => openViewer(id || bid(k || ''), onLocked),
    copy: () => {
      const t = 'https://web3universe.academy/a/W3U-0427';
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
        () => toast('Link copied'),
        () => toast(t),
      );
    },
    wgsoon: (w?: string) => toast(`${w || 'This'} is coming soon.`),
    wgask: (i: string, t: string) => wgRun(i, t),
  };
}

/** stepBtn(f, label, cls): starts the next lesson or the zone quiz. */
export function StepBtn({ f, label, cls = 'primary sm' }: { f: Step; label?: string; cls?: string }) {
  const a = useAcademyActs();
  return (
    <button className={`btn ${cls}`} onClick={() => a.step(f)}>
      {label || (f.quiz ? 'Start quiz' : 'Continue learning')}
    </button>
  );
}

/** Wega's orb (prototype orb()). */
export function Orb({ cls = '' }: { cls?: string }) {
  return (
    <span className={`wg-orb ${cls}`}>
      <i className="ring" />
      <span className="wg-av">
        <Svg src={SPARK} />
      </span>
    </span>
  );
}

const never = () => () => {};

/* false during the server render and hydration, true after.
   The progress store is seeded 'mid' on the server, but AppShell restores the viewer's saved demo state in an effect,
   which can run before this page hydrates (the page streams in its own boundary). The screens below therefore render
   their content on the client only, like the prototype did; otherwise any saved state other than 'mid' fails hydration. */
export function useHydrated() {
  return useSyncExternalStore(
    never,
    () => true,
    () => false,
  );
}

/* The current time, read on the client only (prerendering may not read the clock).
   null during the server render and hydration, then the time the page first rendered on the client. */
let now0: number | null = null;
export function useNow() {
  return useSyncExternalStore(
    never,
    () => (now0 ??= Date.now()),
    () => null,
  );
}
