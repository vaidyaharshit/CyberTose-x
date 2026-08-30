import { CheckCircle2, RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react';
import GlassCard from './GlassCard.jsx';
import { useApp } from '../../state/AppContext.jsx';

// Officer feedback on a prediction, available once a case is Resolved/Escalated
// (reviewed). Feeds the running Model Accuracy metric on the dashboard.
export default function PredictionFeedback({ caseId, className = '' }) {
  const { activeCase, feedback, recordFeedback } = useApp();
  if (!activeCase) return null;

  const reviewable = activeCase.status !== 'Active';
  const existing = feedback.find((f) => f.caseId === caseId);

  return (
    <GlassCard pad="p-4" className={className}>
      <div className="flex items-center gap-2">
        <RotateCcw size={14} className="text-cyanx" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-faint">Prediction feedback loop</h3>
      </div>

      {existing ? (
        <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-edge bg-raise/50 p-2.5 text-xs text-ink">
          {existing.accurate ? <CheckCircle2 size={14} className="text-goodx" /> : <ThumbsDown size={14} className="text-warnx" />}
          <span>
            Reviewed for {caseId}:{' '}
            <span className={existing.accurate ? 'font-semibold text-goodx' : 'font-semibold text-warnx'}>
              {existing.accurate ? 'prediction accurate' : 'false alarm'}
            </span>
          </span>
          <span className="ml-auto font-mono text-[9px] text-faint">logged</span>
        </div>
      ) : reviewable ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            onClick={() => recordFeedback(caseId, true)}
            className="btn border border-goodx/40 bg-goodx/10 px-3 py-1.5 text-xs text-goodx hover:bg-goodx/20"
          >
            <ThumbsUp size={13} /> Prediction Was Accurate
          </button>
          <button
            onClick={() => recordFeedback(caseId, false)}
            className="btn border border-warnx/40 bg-warnx/10 px-3 py-1.5 text-xs text-warnx hover:bg-warnx/20"
          >
            <ThumbsDown size={13} /> False Alarm
          </button>
        </div>
      ) : (
        <p className="mt-2.5 rounded-lg border border-edge bg-raise/50 p-2.5 text-[11px] leading-snug text-dim">
          Feedback unlocks once the case is <span className="text-ink">Resolved</span> or <span className="text-ink">Escalated</span> — rate the predicted cash-out zone against what actually happened.
        </p>
      )}

      <p className="mt-2 text-[10px] leading-relaxed text-dim">
        The model weighs officer feedback into its next location forecast. Honest on synthetic data: this is a simulated feedback loop for the demo.
      </p>
    </GlassCard>
  );
}