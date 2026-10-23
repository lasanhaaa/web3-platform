/** Wega's avatar (Figma "Wega goose", Oct 2026): the goose with its headset, its head rising over a blue circle.
    The box is the circle; the head reaches above it. While Wega thinks, a thin light runs around the circle (behind
    the goose's head) and the goose tilts its head, as if thinking. */
export function Orb({ size, thinking, cls }: { size?: number; thinking?: boolean; cls?: string }) {
  return (
    <span className={['wg-orb', thinking && 'thinking', cls].filter(Boolean).join(' ')} style={size ? { width: size, height: size } : undefined} aria-hidden>
      <i className="ring" />
      <span className="wg-av" />
      <span className="wg-goose" />
    </span>
  );
}
