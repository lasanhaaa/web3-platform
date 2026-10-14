'use client';
/* Wega's scripted brain: context labels, prompt chips, the system prompt and the scripted answers.
   (Filled in from the prototype; see the intents below.) */
import type { WegaPage, Answer, Chip } from './wega';

export function ctxLabel(p: WegaPage): string {
  return p.screen === 'strategies' ? 'Strategies' : 'Web3 Universe';
}
export function chipsFor(_p: WegaPage): Chip[] {
  return [];
}
export function helloLead(_p: WegaPage): string {
  return 'Ask me about your portfolio or your courses.';
}
export function rulesPrompt(): string {
  return 'You are Wega.';
}
export function answer(_i: string, _x?: unknown): Answer {
  return { text: 'Coming soon.' };
}
export function routeText(_t: string): Answer {
  return { text: 'Coming soon.' };
}
