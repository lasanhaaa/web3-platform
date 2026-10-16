'use client';
import { useEffect, useRef, useState } from 'react';
import { CATS, cat as catOf, type CatId } from '@/lib/wega-page';
import { CHEV, CatIcon, Icon } from './parts';

/** Topic chips: hovering one (or tapping it) opens its ready questions under the row; a question opens the chat. */
export function Topics({ ask }: { ask: (href: string, label: string) => void }) {
  const [open, setOpen] = useState<{ id: CatId; pinned: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(null);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  const hover = (e: React.PointerEvent, id: CatId) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(timer.current);
    setOpen((o) => (o?.pinned ? o : { id, pinned: false }));
  };
  const leave = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen((o) => (o?.pinned ? o : null)), 220);
  };
  const c = open && catOf(open.id);
  return (
    <div className="wp-topics" ref={box} onPointerLeave={leave} onPointerEnter={() => clearTimeout(timer.current)}>
      <div className="wp-chips" role="group" aria-label="Topics">
        {CATS.map((x) => (
          <button
            key={x.id}
            className={open?.id === x.id ? 'on' : undefined}
            aria-expanded={open?.id === x.id}
            aria-controls="wp-topic-pop"
            onPointerEnter={(e) => hover(e, x.id)}
            onClick={() => setOpen((o) => (o?.id === x.id && o.pinned ? null : { id: x.id, pinned: true }))}
          >
            <CatIcon id={x.id} />
            {x.label}
          </button>
        ))}
      </div>
      {c && (
        <ul className="wp-tpop" id="wp-topic-pop" aria-label={`${c.label} questions`}>
          {c.prompts.map((p) => (
            <li key={p.href}>
              <button
                onClick={() => {
                  setOpen(null);
                  ask(p.href, p.label);
                }}
              >
                <span>{p.label}</span>
                <Icon d={CHEV} size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
