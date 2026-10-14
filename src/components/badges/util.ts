'use client';
import type { CSSProperties, KeyboardEvent } from 'react';

/** prototype keydown: Enter / Space on [role=button][data-act] clicks it */
export function pressKey(e: KeyboardEvent<HTMLElement>) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.currentTarget.click();
  }
}
/** inline style with custom properties (--c, --glow, --mask) */
export const css = (o: Record<string, string>) => o as CSSProperties;
