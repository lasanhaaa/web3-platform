'use client';
import { useSyncExternalStore, type CSSProperties, type KeyboardEvent } from 'react';

/** prototype keydown: Enter / Space on [role=button][data-act] clicks it */
export function pressKey(e: KeyboardEvent<HTMLElement>) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.currentTarget.click();
  }
}
/** inline style with custom properties (--c, --glow, --mask) */
export const css = (o: Record<string, string>) => o as CSSProperties;

const never = () => () => {};
/** false during the server render and hydration, true after. The progress store is seeded 'mid' on the server, but
    AppShell restores the saved demo state in an effect that can run before this page hydrates, so the badge
    content (which depends on progress) renders on the client only, like the prototype did. */
export const useHydrated = () =>
  useSyncExternalStore(
    never,
    () => true,
    () => false,
  );
