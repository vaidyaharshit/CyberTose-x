// Pattern-based reputation flag. Always carries the "requires verification"
// framing — reputation here is an investigative hypothesis, not a verdict.
import { REP_TIERS } from '../../lib/reputation.js';

const STYLE = {
  CLEAN: { text: 'text-goodx', bg: 'bg-goodx/10', border: 'border-goodx/30', dot: 'bg-goodx' },
  WATCH: { text: 'text-cyanx', bg: 'bg-cyanx/10', border: 'border-cyanx/30', dot: 'bg-cyanx' },
  FLAGGED: { text: 'text-warnx', bg: 'bg-warnx/10', border: 'border-warnx/30', dot: 'bg-warnx' },
  CONFIRMED: { text: 'text-badx', bg: 'bg-badx/10', border: 'border-badx/30', dot: 'bg-badx' },
};

export default function ReputationBadge({ tier, label, score, compact = false }) {
  const s = STYLE[tier] || STYLE.CLEAN;
  const text = label || tier || 'Clean';
  return (
    <span className={`chip border ${s.bg} ${s.border} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${tier === 'CONFIRMED' || tier === 'FLAGGED' ? 'animate-pulse' : ''}`} />
      {text}
      {!compact && score != null && <span className={s.text} style={{ opacity: 0.7 }}>{score}/100</span>}
    </span>
  );
}