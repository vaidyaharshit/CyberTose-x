import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Gauge, Info, Landmark, ShieldAlert, Wallet } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard.jsx';
import Ring from '../components/ui/Ring.jsx';
import TierBadge from '../components/ui/TierBadge.jsx';
import { useApp } from '../state/AppContext.jsx';
import { scoreMule, scoreZoneFromPrediction } from '../lib/riskEngine.js';
import { predictCashOut } from '../lib/predictor.js';
import { ZONES } from '../lib/dataset.js';
import { inrCompact, inrFull } from '../lib/format.js';

const TIER_COLOR = { HIGH: '#fb7185', MEDIUM: '#fbbf24', LOW: '#34d399' };

export default function Risk() {
  const { activeCase, simNow, setView } = useApp();
  const pred = useMemo(() => (activeCase ? predictCashOut(activeCase, simNow) : null), [activeCase, simNow]);
  const [open, setOpen] = useState(null);

  if (!activeCase) return null;

  const muleScores = activeCase.mules.map((m) => scoreMule(m));
  const zoneScores = (pred ? ZONES : []).map((z) => scoreZoneFromPrediction(pred, z));
  const zoneSort = [...zoneScores].sort((a, b) => b.score - a.score).slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Gauge size={18} className="text-cyanx" /> Risk scoring engine · {activeCase.id}
          </h2>
          <p className="mt-0.5 text-xs text-dim">Every score is the sum of weighted, individually-visible indicators — never a black box.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setView('heatmap')}>View prediction <ShieldAlert size={15} /></button>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-warnx/30 bg-warnx/5 p-3.5 text-xs leading-relaxed text-dim">
        <Info size={14} className="mt-0.5 shrink-0 text-warnx" />
        <p>
          Unconfirmed signals are labelled <strong className="text-warnx">“requires verification”</strong>. Scores indicate investigation priority,
          not guilt. Enforcement action must follow verified evidence and legal process.
        </p>
      </div>

      {/* Mule accounts */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <Wallet size={15} className="text-cyanx" /> Suspect accounts
          <span className="chip border-edge text-faint">{muleScores.length}</span>
        </h3>
        <div className="grid gap-3 lg:grid-cols-3">
          {muleScores.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <GlassCard pad="p-4" className="h-full">
                <div className="flex items-center gap-3">
                  <Ring value={s.score / 100} size={62} stroke={7} color={TIER_COLOR[s.tier]} track="currentColor">
                    <span className="text-sm font-black text-ink">{s.score}</span>
                  </Ring>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-faint">
                      {s.id} · {s.role}
                    </div>
                    <div className="truncate text-sm font-semibold text-ink">{s.holder}</div>
                    <div className="mt-1"><TierBadge tier={s.tier} label={s.tierLabel} /></div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg bg-raise/60 px-3 py-2 ring-1 ring-edge">
                  <span className="text-[10px] uppercase tracking-wider text-faint">Live balance</span>
                  <span className={`font-mono text-sm font-bold ${s.balance > 0 ? 'text-warnx' : 'text-dim'}`}>{inrFull(s.balance)}</span>
                </div>
                <button onClick={() => setOpen(open === s.id ? null : s.id)} className="mt-2 w-full rounded-lg border border-edge px-3 py-1.5 text-[11px] font-semibold text-dim transition-colors hover:border-cyanx/50 hover:text-cyanx">
                  {open === s.id ? 'Hide breakdown' : `Why ${s.score} / 100`}
                </button>
                <AnimatePresence>
                  {open === s.id && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-1.5 border-t border-edge pt-2">
                        {s.factors.map((f, j) => (
                          <li key={j} className="flex items-start gap-2 text-[11px] leading-snug text-dim">
                            {f.impact === 'raise' ? (
                              <ArrowUpRight size={12} className="mt-0.5 shrink-0 text-badx" />
                            ) : (
                              <ArrowDownRight size={12} className="mt-0.5 shrink-0 text-goodx" />
                            )}
                            <span><span className="text-ink">{f.label}</span> · {f.note}</span>
                          </li>
                        ))}
                        <li className="pt-1 text-[9px] uppercase tracking-widest text-faint">+{s.score > 65 ? ' Priority: verify first' : s.score > 35 ? ' Priority: monitor' : ' Priority: background'} · opacity below 100 = indicative</li>
                      </div>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Zone / ATM cluster risk */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <Landmark size={15} className="text-violetx" /> ATM cluster / zone risk
          <span className="chip border-edge text-faint">sorted from prediction</span>
        </h3>
        <GlassCard pad="p-0" className="overflow-hidden">
          {zoneSort.map((z, i) => {
            const zone = ZONES.find((x) => x.id === z.zoneId);
            const isTop = pred?.top && pred.top.zone.id === z.zoneId;
            return (
              <div key={z.zoneId} className={`flex flex-col gap-3 border-b border-edge-soft p-4 last:border-0 sm:flex-row sm:items-center ${isTop ? 'bg-badx/[0.04]' : ''}`}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{zone.name}</span>
                      {isTop && <span className="chip border-badx/40 bg-badx/10 text-badx"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-badx" /> predicted next</span>}
                      {z.tier === 'HIGH' && <span className="chip border-warnx/40 bg-warnx/10 text-warnx">high priority ATM watch</span>}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[10px] text-faint">
                      {zone.atms.join(' · ')} · {zone.station}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-ink">{z.score}<span className="text-[10px] text-faint">/100</span></div>
                    <div className="text-[9px] uppercase tracking-widest text-faint">{iz(z)}</div>
                  </div>
                  <TierBadge tier={z.tier} label={z.tierLabel} />
                </div>
              </div>
            );
          })}
        </GlassCard>
      </div>

      <GlassCard pad="p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink">
          <Gauge size={13} className="text-cyanx" /> Why zone risk follows the prediction
        </div>
        <p className="text-xs leading-relaxed text-dim">
          Zone scores in the top panel combine predicted activity mass (probability of the next cash-out),
          historical hotspot baseline {pred ? `(${Math.round(pred.ranked.reduce((a, r) => a + r.shares.history, 0) / pred.ranked.length)} avg history contribution)` : ''},
          foot-traffic density and travel time from the last confirmed on-chain movement. The result feeds the live-alert dispatcher.
        </p>
      </GlassCard>
    </div>
  );
}

function iz(z) {
  return `${z.zoneId} · ${(z.prob || 0) > 0 ? `${(z.prob * 100).toFixed(1)}% mass` : 'no live float'}`;
}