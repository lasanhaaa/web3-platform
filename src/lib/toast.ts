'use client';
import { useSyncExternalStore } from 'react';

/* One global toast line, as in the prototype: toast('Saved to your notes'). */
let msg = { text: '', show: false, n: 0 };
const subs = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;
const emit = () => subs.forEach((f) => f());
export function toast(text: string) {
  msg = { text, show: true, n: msg.n + 1 };
  emit();
  clearTimeout(timer);
  timer = setTimeout(() => {
    msg = { ...msg, show: false };
    emit();
  }, 2400);
}
export function useToast() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => msg,
    () => msg,
  );
}
