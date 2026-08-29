import { TIER_STYLE } from '../../lib/styles.js';

export default function TierBadge({ tier, label, size = 'sm' }) {
  const s = TIER_STYLE[tier] || TIER_STYLE.LOW;
  if (!s) return null;
  return (
    <span className={`chip border ${s.bg} ${s.border} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${tier === 'HIGH' ? 'animate-pulse' : ''}`} />
      {label || tier}
    </span>
  );
}