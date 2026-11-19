'use client';
/* Short quiz sounds, made with Web Audio (no files): a bright two-note chime for a right answer, a soft low
   tone for a wrong one, a tick for taps and a little fanfare at the end. The member can switch them off. */
import { createStore } from './store';

const KEY = 'w3u-sound';
export const sound = createStore({ on: true, loaded: false });
let ctx: AudioContext | null = null;

export function soundLoad() {
  const s = sound.get();
  if (s.loaded) return;
  s.loaded = true;
  try {
    const v = localStorage.getItem(KEY);
    if (v != null) s.on = v === '1';
  } catch {}
  sound.commit();
}
export function soundToggle() {
  const s = sound.get();
  s.on = !s.on;
  try {
    localStorage.setItem(KEY, s.on ? '1' : '0');
  } catch {}
  sound.commit();
  if (s.on) sfx('match');
}

function tone(a: AudioContext, freq: number, at: number, dur: number, type: OscillatorType = 'sine', vol = 0.12) {
  const o = a.createOscillator(),
    g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(a.destination);
  o.start(at);
  o.stop(at + dur + 0.02);
}

export function sfx(kind: 'ok' | 'no' | 'tap' | 'match' | 'done') {
  if (!sound.get().on) return;
  try {
    ctx ||= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime + 0.01;
    if (kind === 'ok') {
      tone(ctx, 784, t, 0.14);
      tone(ctx, 1175, t + 0.09, 0.3);
    } else if (kind === 'no') {
      tone(ctx, 233, t, 0.2, 'triangle', 0.1);
      tone(ctx, 175, t + 0.13, 0.32, 'triangle', 0.1);
    } else if (kind === 'tap') tone(ctx, 660, t, 0.05, 'sine', 0.04);
    else if (kind === 'match') tone(ctx, 988, t, 0.12, 'sine', 0.07);
    else [523, 659, 784, 1047].forEach((f, i) => tone(ctx!, f, t + i * 0.11, i === 3 ? 0.6 : 0.24));
  } catch {}
}
