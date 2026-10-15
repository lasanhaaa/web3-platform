'use client';
/* Wega's text answers in the chat: ready questions get their scripted answer; typed questions and
   "ask about this passage" go live through /api/wega when a model key is set, otherwise a sample answer. */
import { useEffect, useState } from 'react';
import { textAnswer } from '@/lib/wega-page';
import { chatFill, chatHistory, type ChatMsg } from '@/lib/wega-chat';
import { GLOSS } from '@/lib/curriculum';
import { rulesPrompt, StepBtn } from '@/lib/wega-brain';
import { wega, wgProbe } from '@/lib/wega';
import { useProgress } from '@/lib/progress';
import { MdText } from '@/components/wega/Wega';
import { Answer, AskLink } from './parts';

export const POPULAR = ['/wega/portfolio-check', '/wega/risk-mix', '/wega/scenario?s=eth30', '/wega/learning-path'];

/** A glossary definition for the first known term in a passage (the sample answer for "ask about this passage"). */
function glossaryFor(text: string) {
  const s = text.toLowerCase();
  for (const list of Object.values(GLOSS as Record<string, string[][]>)) for (const [t, d] of list) if (s.includes(t.toLowerCase())) return { t, d };
  return null;
}
function sampleAnswer(q: string, p?: string): string {
  const g = p ? glossaryFor(p) || glossaryFor(q) : glossaryFor(q);
  if (g) return `**${g.t}**: ${g.d}\n\nThis is a sample answer from the glossary. With live answers on, I explain ${p ? 'the passage' : 'it'} with your own numbers.`;
  return 'In the prototype I answer the ready questions. With live answers switched on, I answer anything you type, using your own snapshot and course progress.\n\nYou could try one of these:';
}
/** Follow-ups after a typed question: the popular questions when the sample answer had nothing specific to say. */
export const freeFollow = (m: Extract<ChatMsg, { kind: 'free' }>) => (m.mode === 'sample' && !glossaryFor(m.passage || m.q) ? POPULAR : []);

/** A ready question with a scripted answer (/wega/ask?k=…). */
export function TextReply({ k }: { k: string }) {
  useProgress();
  const a = textAnswer(k);
  if (!a) return null;
  const nx = a.next;
  return (
    <Answer
      title={a.q}
      lead={<MdText text={a.a} />}
      next={
        nx ? (
          nx.step ? (
            <StepBtn f={nx.step} cls="btn primary lg" label={nx.label} />
          ) : (
            <AskLink className="btn primary lg" href={nx.href!}>
              {nx.label}
            </AskLink>
          )
        ) : undefined
      }
    />
  );
}

/** A typed question: streams a live answer when the server has a model key, otherwise writes a sample answer. */
export function FreeReply({ m }: { m: Extract<ChatMsg, { kind: 'free' }> }) {
  const W = wega.use();
  const [preview, setPreview] = useState('');
  const pending = !m.mode;
  useEffect(() => {
    if (pending) wgProbe();
  }, [pending]);
  useEffect(() => {
    if (!pending || W.live === undefined) return;
    if (W.live === false) {
      const t = setTimeout(() => chatFill(m.id, { text: sampleAnswer(m.q, m.passage), mode: 'sample' }), 900);
      return () => clearTimeout(t);
    }
    const c = new AbortController();
    const system = rulesPrompt().replace(/Current page:[\s\S]*$/, 'Current page: the Wega page, a full-page chat. Answer in 150 words at most.');
    (async () => {
      let out = '';
      try {
        const res = await fetch('/api/wega', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ system, messages: chatHistory(m.id) }), signal: c.signal });
        if (!res.ok || !res.body) throw new Error('bad');
        const rd = res.body.getReader(),
          dec = new TextDecoder();
        for (;;) {
          const { done, value } = await rd.read();
          if (done) break;
          out += dec.decode(value, { stream: true });
          setPreview(out);
        }
        chatFill(m.id, { text: out, mode: 'live' });
      } catch (e: unknown) {
        if ((e as Error)?.name !== 'AbortError') chatFill(m.id, { text: sampleAnswer(m.q, m.passage), mode: 'sample', failed: true });
      }
    })();
    return () => c.abort();
  }, [pending, W.live, m.id, m.q, m.passage]);

  const text = m.text || preview;
  return (
    <section className="wp-ans" aria-label={m.q} aria-busy={pending}>
      <div className="wp-text wp-prose">
        {text ? (
          <MdText text={text} />
        ) : (
          <span className="wg-dots" aria-label="Wega is writing">
            <i />
            <i />
            <i />
          </span>
        )}
        {m.failed && <p className="wp-err">The live answer didn’t work. This is a sample answer.</p>}
      </div>
      {m.mode === 'live' && <p className="wp-mode">Live answer · Claude</p>}
    </section>
  );
}
