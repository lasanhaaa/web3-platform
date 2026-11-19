import type { CSSProperties, SVGProps } from 'react';

/* Renders an SVG string (icons, charts) as a real <svg> element.
   The outer tag's attributes become React props; the inner markup is injected as is. */
const ATTRS: Record<string, string> = {
  class: 'className',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-opacity': 'strokeOpacity',
  'fill-rule': 'fillRule',
  'fill-opacity': 'fillOpacity',
  'clip-rule': 'clipRule',
};
const cache = new Map<string, { attrs: Record<string, string>; inner: string }>();

function parse(src: string) {
  let hit = cache.get(src);
  if (hit) return hit;
  const m = src.trim().match(/^<svg([^>]*)>([\s\S]*)<\/svg>$/);
  const attrs: Record<string, string> = {};
  if (m) {
    for (const a of m[1].matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[ATTRS[a[1]] || a[1]] = a[2];
  }
  hit = { attrs, inner: m ? m[2] : '' };
  cache.set(src, hit);
  return hit;
}

type Props = Omit<SVGProps<SVGSVGElement>, 'dangerouslySetInnerHTML'> & { src: string; style?: CSSProperties };

export function Svg({ src, className, ...rest }: Props) {
  const { attrs, inner } = parse(src);
  const cls = [attrs.className, className].filter(Boolean).join(' ') || undefined;
  return <svg {...(attrs as SVGProps<SVGSVGElement>)} {...rest} className={cls} dangerouslySetInnerHTML={{ __html: inner }} />;
}

/* Inline markup that the prototype copy uses (**bold** only). */
export function Md({ text, as: Tag = 'span', className }: { text: string; as?: 'span' | 'p' | 'div'; className?: string }) {
  const parts = String(text).split(/\*\*(.+?)\*\*/g);
  return <Tag className={className}>{parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : p))}</Tag>;
}
