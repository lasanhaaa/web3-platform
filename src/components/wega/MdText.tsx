import type { ReactNode } from 'react';

/** The chat's light markdown: paragraphs, - and 1. lists, **bold**, `code`. */
function inline(s: string, k: string): ReactNode[] {
  return s.split(/(\*\*.+?\*\*|`[^`]+`)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') && p.length > 4 ? (
      <b key={k + i}>{p.slice(2, -2)}</b>
    ) : p.startsWith('`') && p.endsWith('`') && p.length > 2 ? (
      <code key={k + i}>{p.slice(1, -1)}</code>
    ) : (
      p
    ),
  );
}
export function MdText({ text }: { text: string }) {
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
      list.items.push(<li key={n}>{inline(l.replace(/^([-•*]|\d+[.)]) +/, ''), 'l' + n)}</li>);
      return;
    }
    flush();
    if (!l) return;
    out.push(<p key={'p' + n}>{inline(l.replace(/^#+ +(.*)$/, '**$1**'), 'p' + n)}</p>);
  });
  flush();
  return <>{out}</>;
}
