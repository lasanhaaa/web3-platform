'use client';
import { BID, still } from '@/lib/badges';

/** Static render of a badge (prototype badgeImg). k = zone key like 'r1.0' or a badge id. */
export function BadgeImg({ k, locked, eager, className }: { k: string; locked?: boolean; eager?: boolean; className?: string }) {
  const id = (BID as Record<string, string>)[k] || k;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={['bimg', locked && 'locked', className].filter(Boolean).join(' ')} src={still(id)} alt="" width={320} height={320} loading={eager ? undefined : 'lazy'} decoding="async" />
  );
}
