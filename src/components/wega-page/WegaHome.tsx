'use client';
/* The Wega page (Decade start page): a greeting, one input, five category chips with ready prompts.
   Nothing is selected when it opens, unless the member came from another page (?c=strategies …). */
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CATS, CHECKS, NEXT_CALL, isCat, wp, type CatId } from '@/lib/wega-page';
import { NAV_ICONS } from '@/lib/icons';
import { useHydrated } from '@/lib/hydrated';
import { toast } from '@/lib/toast';
import { CHEV, CatIcon, Icon, Orb, PromptBox, useWegaPageChrome } from './parts';

export function WegaHome() {
  useWegaPageChrome();
  const q = useSearchParams();
  const qc = q.get('c');
  const [open, setOpen] = useState<CatId | null>(isCat(qc) ? qc : null);
  /* coming back with another ?c= (the floating helper's "Open in Wega") preselects that chip */
  const [prevQc, setPrevQc] = useState(qc);
  if (qc !== prevQc) {
    setPrevQc(qc);
    setOpen(isCat(qc) ? qc : null);
  }
  const W = wp.use();
  const hydrated = useHydrated();
  const c = CATS.find((x) => x.id === open);
  return (
    <div className="page wp wp-home fade">
      <div className="wp-top">
        <Link href="/wega/portfolio-check" className="wp-pill" title={CHECKS.map((x) => x.t).join(' · ')}>
          <i className="dot" aria-hidden />
          {CHECKS.length} things to check
          <Icon d={CHEV} size={16} />
        </Link>
      </div>

      <div className="wp-mid">
        <div className="wp-hello">
          <Orb size={40} />
          <h1>
            <span>Hi, Daniel.</span> What do you want to understand today?
          </h1>
        </div>
        <PromptBox variant="hero" autoFocus />
        <div className="wp-chips" role="group" aria-label="Topics">
          {CATS.map((x) => (
            <button key={x.id} className={x.id === open ? 'on' : undefined} aria-pressed={x.id === open} aria-controls="wp-prompts" onClick={() => setOpen(x.id === open ? null : x.id)}>
              <CatIcon id={x.id} />
              {x.label}
            </button>
          ))}
        </div>
        {c ? (
          <ul className="wp-list wp-prompts" id="wp-prompts" key={c.id} aria-label={`${c.label} questions`}>
            {c.prompts.map((p) => (
              <li key={p.href}>
                <Link href={p.href}>
                  <span>{p.label}</span>
                  <Icon d={CHEV} size={18} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          hydrated &&
          W.recent.length > 0 && (
            <div className="wp-recent">
              <span className="wp-eyebrow">Your recent results</span>
              <ul className="wp-list">
                {W.recent.map((r) => (
                  <li key={r.href}>
                    <Link href={r.href}>
                      <CatIcon id={r.cat} size={16} />
                      <span>{r.title}</span>
                      <Icon d={CHEV} size={18} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </div>

      <button className="wp-call" onClick={() => toast('Live Calls isn’t part of the prototype.')}>
        <span className="wp-call-ic">
          <Icon d={NAV_ICONS.calls} size={22} />
        </span>
        <span className="wp-call-t">
          <small>Next live call · {NEXT_CALL.when}</small>
          {NEXT_CALL.title} with {NEXT_CALL.host}
        </span>
        <Icon d={CHEV} size={18} />
      </button>
    </div>
  );
}
