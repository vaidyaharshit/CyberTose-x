import { ArrowDownRight, ArrowUpRight, BrainCircuit, Minus } from 'lucide-react';
import GlassCard from './GlassCard.jsx';
import Counter from './Counter.jsx';
import { useApp } from '../../state/AppContext.jsx';

// Dashboard summary of the officer-feedback loop. Accuracy = running ratio over
// the last 30 reviewed predictions, with an up/down trend vs the prior half.
export default function ModelAccuracyCard({ className = '' }) {
  const { accuracy } = useApp();

  const Trend = accuracy.trend === 'up' ? ArrowUpRight : accuracy.trend === 'down' ? ArrowDownRight : Minus;
  const trendCls =
    accuracy.trend === 'up' ? 'text-goodx' : accuracy.trend === 'down' ? 'text-badx' : 'text-faint';

  return (
    <GlassCard pad="p-4" className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-panel ring-1 ring-edge text-cyanx">
            <BrainCircuit size={17} />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-faint">Model accuracy</div>
            <div className="flex items-baseline gap-2">
              <Counter value={accuracy.pct} format={(v) => `${Math.round(v)}%`} className="text-2xl font-black text-ink metric-num" />
              <span className="flex items-center gap-0.5 text-[11px] font-semibold">
                <Trend size={13} className={trendCls} />
                <span className={trendCls}>{accuracy.trendPct}%</span>
              </span>
            </div>
            <div className="mt-0.5 text-[10px] text-dim">based on last {accuracy.reviewed} reviewed prediction{accuracy.reviewed === 1 ? '' : 's'}</div>
          </div>
        </div>

        {/* sparkline of last reviews */}
        <div className="flex h-9 items-end gap-[3px]" title={`recent reviews: ${accuracy.accurate}/${accuracy.reviewed} accurate`}>
          {accuracy.spark.map((hit, i) => (
            <span
              key={i}
              className={`w-1 rounded-sm ${hit ? 'bg-goodx/80' : 'bg-badx/70'}`}
              style={{ height: hit ? 90 + (i % 3) * 10 : 30 + (i % 2) * 12 }}
            />
          ))}
        </div>
      </div>
      <p className="mt-3 border-t border-edge pt-2 text-[10px] leading-relaxed text-dim">
        The model incorporates officer feedback to continuously refine location predictions. Synthetic ratings — relative trend only, refreshed on each new review.
      </p>
    </GlassCard>
  );
}