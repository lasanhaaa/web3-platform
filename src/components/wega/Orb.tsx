import { GOOSE_AV } from '@/lib/icons';
import { Svg } from '@/lib/svg';

/** Wega's avatar: the goose in the blue circle (Figma 2878:35278). The ring spins while Wega is writing. */
export function Orb({ size, thinking, cls }: { size?: number; thinking?: boolean; cls?: string }) {
  return (
    <span className={['wg-orb', thinking && 'thinking', cls].filter(Boolean).join(' ')} style={size ? { width: size, height: size } : undefined} aria-hidden>
      <i className="ring" />
      <span className="wg-av">
        <Svg src={GOOSE_AV} />
      </span>
    </span>
  );
}
