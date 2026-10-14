'use client';
/* Text answers on the Wega page: ready prompts get their scripted answer at once; typed questions and
   "ask about this passage" go live through /api/wega when a model key is set, otherwise a sample answer. */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CATS, textAnswer, promptLabel, wpRemember, type CatId, type TextAnswer } from '@/lib/wega-page';
import { GLOSS } from '@/lib/curriculum';
import { rulesPrompt, StepBtn } from '@/lib/wega-brain';
import { wega, wgProbe } from '@/lib/wega';
import { useProgress } from '@/lib/progress';
import { useHydrated } from '@/lib/hydrated';
import { MdText } from '@/components/wega/Wega';
import { CHEV, Icon, ResultFrame } from './parts';

const POPULAR = ['/wega/portfolio-check', '/wega/risk-mix', '/wega/scenario?s=eth30', '/wega/learning-path'];

/** A glossary definition for the first known term in a passage (the sample answer for "ask about this passage"). */
function glossaryFor(text: string) {
  const s = text.toLowerCase();
  for (const list of Object.values(GLOSS as Record<string, string[][]>)) for (const [t, d] of list) if (s.includes(t.toLowerCase())) return { t, d };
  return null;
}
function sampleAnswer(q: string, p: string | null): string {
  const g = p ? glossaryFor(p) || glossaryFor(q) : glossaryFor(q);
  if (g) return `**${g.t}**: ${g.d}\n\nThis is a sample answer from the glossary. With live answers on, Wega explains ${p ? 'the passage' : 'it'} with your own numbers.`;
  return 'In the prototype, Wega answers the ready questions. With live answers switched on, it answers anything you type, using your own snapshot and course progress.\n\nTry one of these:';
}

function Follow({ hrefs }: { hrefs: string[] }) {
  const items = hrefs.map((h) => [h, promptLabel(h)] as const).filter(([, l]) => l);
  if (!items.length) return null;
  return (
    <ul className="wp-list wp-follow" aria-label="Related questions">
      {items.map(([h, l]) => (
        <li key={h}>
          <Link href={h}>
            <span>{l}</span>
            <Icon d={CHEV} size={18} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Ask() {
  const q = useSearchParams();
  const k = q.get('k'),
    text = q.get('q'),
    passage = q.get('p');
  return <AskView key={`${k}|${text}|${passage}`} k={k} text={text} passage={passage} />;
}

function AskView({ k, text, passage }: { k: string | null; text: string | null; passage: string | null }) {
  useProgress();
  const hydrated = useHydrated();
  const W = wega.use();
  const [live, setLive] = useState<{ text: string; done: boolean; failed?: boolean } | null>(null);
  const scripted: TextAnswer | null = k ? textAnswer(k) : null;
  const question = scripted?.q || (text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Ask Wega');

  useEffect(() => {
    if (scripted) wpRemember({ href: `/wega/ask?k=${k}`, title: scripted.q, cat: scripted.cat });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);

  /* typed questions: stream a live answer when the server has a model key */
  useEffect(() => {
    if (scripted || !text) return;
    wgProbe();
  }, [scripted, text]);
  useEffect(() => {
    if (scripted || !text || W.live !== true) return;
    const c = new AbortController();
    const system = rulesPrompt().replace(/Current page:[\s\S]*$/, 'Current page: the Wega page, where each answer is shown as a full page. Answer in 150 words at most.');
    const content = passage ? `About this passage: “${passage}”\n\n${text}` : text;
    (async () => {
      try {
        const res = await fetch('/api/wega', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ system, messages: [{ role: 'user', content }] }), signal: c.signal });
        if (!res.ok || !res.body) throw new Error('bad');
        const rd = res.body.getReader(),
          dec = new TextDecoder();
        let out = '';
        for (;;) {
          const { done, value } = await rd.read();
          if (done) break;
          out += dec.decode(value, { stream: true });
          setLive({ text: out, done: false });
        }
        setLive({ text: out, done: true });
      } catch (e: any) {
        if (e?.name !== 'AbortError') setLive({ text: '', done: true, failed: true });
      }
    })();
    return () => c.abort();
  }, [scripted, text, passage, W.live]);

  if (!hydrated) return <div className="page wp wp-res" />;
  const cat: CatId = scripted?.cat || (passage ? 'portfolio' : 'w3u');
  const waiting = !scripted && !!text && (W.live === undefined || (W.live === true && !live));
  const useLive = !scripted && W.live === true && live && !live.failed;
  const body = scripted ? scripted.a : useLive ? live!.text : text ? sampleAnswer(text, passage) : 'Ask Wega anything about your portfolio, the strategies or your courses.';
  const lead = (
    <>
      {passage && <blockquote className="wp-quote">“{passage}”</blockquote>}
      {waiting ? (
        <span className="wg-dots" aria-label="Wega is writing">
          <i />
          <i />
          <i />
        </span>
      ) : (
        <MdText text={body} />
      )}
      {live?.failed && <p className="wp-err">The live answer didn’t work. This is a sample answer.</p>}
      {!scripted && text && !waiting && <p className="wp-mode">{useLive ? 'Live answer · Claude' : 'Sample answer'}</p>}
    </>
  );
  const nx = scripted?.next;
  return (
    <ResultFrame
      cat={cat}
      title={question}
      source={false}
      lead={lead}
      next={
        nx ? (
          nx.step ? (
            <StepBtn f={nx.step} cls="btn primary lg" label={nx.label} />
          ) : (
            <Link className="btn primary lg" href={nx.href!}>
              {nx.label}
            </Link>
          )
        ) : undefined
      }
    >
      <Follow hrefs={scripted?.follow || (!useLive && !waiting && text && !glossaryFor(passage || text) ? POPULAR : [])} />
      {!scripted && !text && (
        <div className="wp-chips start">
          {CATS.map((c) => (
            <Link key={c.id} href={`/wega?c=${c.id}`}>
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </ResultFrame>
  );
}
