import type { ReactNode } from 'react';

/** The chat's light markdown: paragraphs, - and 1. lists, **bold**, `code`. With `fade` every word is its own span,
    keyed by where it sits in the text, so while an answer is written out only the new words fade in. An unclosed
    **bold (a word still being written) is already bold. */
function words(s: string, k: string, at: number): ReactNode[] {
  const out: ReactNode[] = [];
  let i = at;
  for (const w of s.split(/(\s+)/)) {
    if (w) out.push(/\S/.test(w) ? <span key={k + i} className="wg-w">{w}</span> : w);
    i += w.length;
  }
  return out;
}
function inline(s: string, k: string, fade?: boolean): ReactNode[] {
  const out: ReactNode[] = [];
  let at = 0;
  for (const p of s.split(/(\*\*.+?(?:\*\*|$)|`[^`]+`)/g)) {
    if (p.startsWith('**') && p.length > 2) {
      const t = p.endsWith('**') && p.length > 4 ? p.slice(2, -2) : p.slice(2);
      out.push(<b key={k + at}>{fade ? words(t, k + at + 'b', 0) : t}</b>);
    } else if (p.startsWith('`') && p.endsWith('`') && p.length > 2) out.push(<code key={k + at}>{p.slice(1, -1)}</code>);
    else if (p) out.push(...(fade ? words(p, k, at) : [p]));
    at += p.length;
  }
  return out;
}
export function MdText({ text, fade }: { text: string; fade?: boolean }) {
  const out: ReactNode[] = [];
  let list: { tag: 'ul' | 'ol'; items: ReactNode[] } | null = null;
  const flush = () => {
    if (list) out.push(list.tag === 'ul' ? <ul key={out.length}>{list.items}</ul> : <ol key={out.length}>{list.items}</ol>);
    list = null;
  };
  text.split('\n').forEach((raw, n) => {
    const l = raw.trim();
    const ul = /^[-•*] +/.test(l),
      ol = /^\d+[.)] +/.test(l);
    if (ul || ol) {
      const tag = ul ? 'ul' : 'ol';
      if (!list || list.tag !== tag) {
        flush();
        list = { tag, items: [] };
      }
      list.items.push(<li key={n}>{inline(l.replace(/^([-•*]|\d+[.)]) +/, ''), 'l' + n, fade)}</li>);
      return;
    }
    flush();
    if (!l) return;
    out.push(<p key={'p' + n}>{inline(l.replace(/^#+ +(.*)$/, '**$1**'), 'p' + n, fade)}</p>);
  });
  flush();
  return <>{out}</>;
}
