'use client';
import { useSyncExternalStore } from 'react';

/** Tiny observable for module-level prototype state: mutate the object, then call commit(). */
export function createStore<T extends object>(initial: T) {
  const box = { s: initial, v: 0 };
  const subs = new Set<() => void>();
  const subscribe = (f: () => void) => {
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  };
  return {
    get: () => box.s,
    set(next: T) {
      box.s = next;
      box.v++;
      subs.forEach((f) => f());
    },
    commit() {
      box.v++;
      subs.forEach((f) => f());
    },
    /** Subscribes the component; returns the current state object. */
    use(): T {
      useSyncExternalStore(subscribe, () => box.v, () => 0);
      return box.s;
    },
  };
}
