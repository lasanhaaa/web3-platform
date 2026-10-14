'use client';
import { useSyncExternalStore } from 'react';

const never = () => () => {};
/** false during the server render and hydration, true after. Learning progress is seeded 'mid' on the server and
    AppShell restores the viewer's saved demo state in an effect, which can run before a page hydrates. Anything that
    renders from progress waits for this, or hydration fails for any saved state other than 'mid'. */
export const useHydrated = () =>
  useSyncExternalStore(
    never,
    () => true,
    () => false,
  );
