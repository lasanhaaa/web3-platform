'use client';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { GLYPH, PROTO_IMG, DIFF, type Diff } from '@/lib/strategies';
import { GOOSE } from '@/lib/icons';
import { Svg } from '@/lib/svg';

/** Protocol icon tiles (Figma "hyper-foundation": glass tile, -11px overlap). Extra icons collapse into "+n". */
export function Pts({ icons, size, max = 3 }: { icons: string[]; size?: 32 | 36; max?: number }) {
  const shown = icons.slice(0, icons.length > max ? max - 1 : max),
    rest = icons.length - shown.length;
  return (
    <div className={`pts${size ? ' s' + size : ''}`} aria-hidden="true">
      {shown.map((k) => (
        <span className="pt" key={k}>
          {PROTO_IMG[k] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={PROTO_IMG[k]} alt="" width={32} height={32} />
          ) : (
            <Svg src={GLYPH[k]} />
          )}
        </span>
      ))}
      {rest > 0 && <span className="pt n">+{rest}</span>}
    </div>
  );
}

/** The 10-bar difficulty meter from the card footer. */
export function DiffMeter({ d }: { d: Diff }) {
  return (
    <span className="st-diff">
      <span className="st-bars" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} className={i < DIFF[d].bars ? 'on' : undefined} />
        ))}
      </span>
      {d}
    </span>
  );
}
export const diffStyle = (d: Diff) => ({ '--dc': DIFF[d].c, '--dg': `color-mix(in srgb, ${DIFF[d].c} 20%, transparent)` }) as CSSProperties;

export const Spark = () => <Svg src={GOOSE} />;
export { Orb } from '@/components/wega/Orb';
const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

export type Opt<T extends string> = { v: T; label: string; note?: string; wega?: boolean };
/** Pill dropdown from the filter row (Figma "Select status", "All portfolios", "Sort by"). */
export function Dropdown<T extends string>({
  label,
  value,
  opts,
  onChange,
  set,
  className,
  icon,
}: {
  label: ReactNode;
  value: T;
  opts: Opt<T>[];
  onChange: (v: T) => void;
  set?: boolean;
  className?: string;
  icon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', off);
    document.addEventListener('keydown', esc, true);
    return () => {
      document.removeEventListener('mousedown', off);
      document.removeEventListener('keydown', esc, true);
    };
  }, [open]);
  return (
    <div className={`st-dd${className ? ' ' + className : ''}`} ref={box}>
      <button className={`st-ddb${set ? ' set' : ''}`} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
        {icon}
        <span>{label}</span>
        <Svg src={CHEV} />
      </button>
      {open && (
        <div className="st-menu" role="listbox">
          {opts.map((o) => (
            <button
              key={o.v}
              role="option"
              aria-selected={o.v === value}
              className={o.v === value ? 'on' : undefined}
              onClick={() => {
                onChange(o.v);
                setOpen(false);
              }}
            >
              <span className={o.wega ? 'wg' : undefined}>
                {o.wega && <Spark />}
                {o.label}
                {o.note && <small>{o.note}</small>}
              </span>
              {o.v === value && <Svg src={CHECK} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
