import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Flame, Landmark, MapPin, Navigation, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard.jsx';
import Ring from '../components/ui/Ring.jsx';
import TierBadge from '../components/ui/TierBadge.jsx';
import { useApp } from '../state/AppContext.jsx';
import { predictCashOut } from '../lib/predictor.js';
import { scoreZoneFromPrediction } from '../lib/riskEngine.js';
import { GRID_W, GRID_H, ZONES, zoneById, travelMinutes } from '../lib/dataset.js';
import { pct, inrCompact, minsAgo } from '../lib/format.js';

export default function Heatmap() {
  const { activeCase, simNow, refreshPrediction, setView } = useApp();
  const pred = useMemo(() => (activeCase ? predictCashOut(activeCase, simNow) : null), [activeCase, simNow]);
  const [sel, setSel] = useState(null);

  if (!activeCase || !pred) return null;

  const cells = useMemo(() => {
    const arr = [];
    for (let x = 0; x < GRID_W; x++) {
      for (let y = 0; y < GRID_H; y++) {
        let best = null;
        let bestD = Infinity;
        for (const z of ZONES) {
          const d = (z.x - x) ** 2 + (z.y - y) ** 2;
          if (d < bestD) {
            bestD = d;
            best = z;
          }
        }
        const ranked = pred.ranked.find((r) => r.zone.id === best.id);
        arr.push({ x, y, zone: best, prob: ranked ? ranked.prob : 0 });
      }
    }
    return arr;
  }, [pred]);

  const maxP = pred.ranked[0] ? pred.ranked[0].prob : 0;

  const selected = sel ? pred.ranked.find((r) => r.zone.id === sel) : null;
  const selectedRisk = sel ? scoreZoneFromPrediction(pred, zoneById(sel)) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <MapPin size={18} className="text-cyanx" /> Predicted cash-out heatmap · {activeCase.id}
          </h2>
          <p className="mt-0.5 text-xs text-dim">
            Stylised grid of fictional city {activeCase.intake.victim.location || 'Ranagiri'} — zones weighted by history, time-of-day, proximity and velocity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={() => refreshPrediction(activeCase.id)}>
            <RefreshCw size={15} /> Recompute
          </button>
          <button className="btn btn-primary" onClick={() => setView('alert')}>Dispatch alert <MapPin size={15} /></button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Map */}
        <GlassCard pad="p-0" className="relative overflow-hidden">
          <div className="bg-grid absolute inset-0 opacity-60" />
          <svg viewBox={`0 0 ${GRID_W * 100} ${GRID_H * 100}`} className="relative w-full" style={{ minHeight: 300 }}>
            <defs>
              <filter id="hblur" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="12" />
              </filter>
            </defs>

            {cells.map((c) => {
              const rel = maxP > 0 ? c.prob / maxP : 0;
              return (
                <rect
                  key={`${c.x}-${c.y}`}
                  x={c.x * 100}
                  y={c.y * 100}
                  width={100}
                  height={100}
                  fill={heatColor(rel)}
                  className="cursor-pointer transition-colors duration-300"
                  onClick={() => setSel(c.zone.id)}
                >
                  <title>{`${c.zone.name} — ${(c.prob * 100).toFixed(1)}%`}</title>
                </rect>
              );
            })}

            {/* soft glow blobs over hot zones */}
            {pred.ranked.slice(0, 3).map((r) => (
              <circle
                key={`glow-${r.zone.id}`}
                cx={r.zone.x * 100 + 50}
                cy={r.zone.y * 100 + 50}
                r={90}
                fill={heatColor(r.prob / maxP)}
                filter="url(#hblur)"
                opacity={0.35}
              />
            ))}

            {/* roads */}
            {Array.from({ length: GRID_W - 1 }).map((_, i) => (
              <line key={`v${i}`} x1={(i + 1) * 100} y1={0} x2={(i + 1) * 100} y2={GRID_H * 100} stroke="currentColor" strokeWidth={3} opacity={0.06} className="text-ink" />
            ))}
            {Array.from({ length: GRID_H - 1 }).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={(i + 1) * 100} x2={GRID_W * 100} y2={(i + 1) * 100} stroke="currentColor" strokeWidth={3} opacity={0.06} className="text-ink" />
            ))}

            {/* zone labels */}
            {ZONES.map((z) => {
              const ranked = pred.ranked.find((r) => r.zone.id === z.id);
              const isTop = pred.top && pred.top.zone.id === z.id;
              const isSel = sel === z.id;
              return (
                <g key={z.id} onClick={() => setSel(z.id)} className="cursor-pointer">
                  <rect
                    x={z.x * 100 + 8}
                    y={z.y * 100 + 26}
                    width={84}
                    height={36}
                    rx={8}
                    fill="var(--color-void)"
                    opacity={0.82}
                    stroke="var(--color-edge)"
                  />
                  {isSel && (
                    <rect x={z.x * 100 + 8} y={z.y * 100 + 26} width={84} height={36} rx={8} fill="none" stroke="#22d3ee" strokeWidth={2} />
                  )}
                  <text x={z.x * 100 + 50} y={z.y * 100 + 42} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--color-text)">
                    {z.name.split(' ')[0]}
                  </text>
                  <text x={z.x * 100 + 50} y={z.y * 100 + 55} textAnchor="middle" fontSize={9} fontFamily="monospace" fill={isTop ? 'var(--color-badx)' : 'var(--color-dim)'}>
                    {(ranked ? ranked.prob * 100 : 0).toFixed(1)}%
                  </text>
                </g>
              );
            })}

            {/* top zone pulse */}
            {pred.top && (
              <g pointerEvents="none">
                <circle cx={pred.top.zone.x * 100 + 50} cy={pred.top.zone.y * 100 + 10} r={7} fill="#fb7185">
                  <animate attributeName="r" values="7;18" dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0" dur="1.6s" repeatCount="indefinite" />
                </circle>
                <circle cx={pred.top.zone.x * 100 + 50} cy={pred.top.zone.y * 100 + 10} r={4} fill="#fb7185" />
              </g>
            )}

            {/* last-activity marker */}
            <g pointerEvents="none" transform={`translate(${zoneById(pred.lastZone)?.x * 100 + 50 || 0}, ${zoneById(pred.lastZone)?.y * 100 - 20 || 0})`}>
              <circle r={10} fill="#22d3ee" opacity={0.25}>
                <animate attributeName="r" values="8;20" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0" dur="2s" repeatCount="indefinite" />
              </circle>
              <text y={4} textAnchor="middle" fontSize={11}>◉</text>
            </g>
          </svg>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-dim">
              <span className="flex items-center gap-2">
                <span className="chip border-edge"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-cyanx/50" /> lower probability</span>
                <span className="chip border-edge"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-violetx/60" /> medium</span>
                <span className="chip border-edge"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-400/80" /> highest</span>
              </span>
              <span className="flex items-center gap-1"><Navigation size={10} /> ◉ last activity · zone {pred.lastZone}</span>
            </div>
          </div>
        </GlassCard>

        {/* Right rail */}
        <div className="space-y-4">
          {/* Confidence */}
          <GlassCard pad="p-5">
            <div className="flex items-center gap-4">
              <Ring value={pred.confidence} size={104} stroke={10} color="#22d3ee">
                <div className="text-center">
                  <div className="text-xl font-black text-ink">{pred.confidencePct}%</div>
                  <div className="text-[8px] uppercase tracking-widest text-faint">confidence</div>
                </div>
              </Ring>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-ink">Prediction confidence</h3>
                <p className="mt-1 text-xs leading-relaxed text-dim">
                  {confLabel(pred.confidence)}. Field verification is always required before enforcement.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="chip border-cyanx/40 bg-cyanx/10 text-cyanx"><Flame size={10} /> {inrCompact(pred.exposure)} exposed</span>
                  <span className="chip border-edge text-faint"><Clock size={10} /> ~{pred.windowMinutes} min window</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Selected zone detail */}
          <AnimatePresence mode="wait">
            {selected && selectedRisk ? (
              <motion.div key={selected.zone.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <GlassCard pad="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-ink">{selected.zone.name}</h3>
                    <TierBadge tier={selectedRisk.tier} label={selectedRisk.tierLabel} />
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-faint">{selected.zone.id} · grid ({selected.zone.x},{selected.zone.y})</p>
                  <div className="mt-3 grid gap-2 text-xs">
                    <Row k="Activity mass" v={pct(selected.prob, 1)} />
                    <Row k="Nearest PS" v={`${selected.zone.station}`} small />
                    <Row k="Response time" v={`~${selected.zone.respMin} min`} />
                    <Row k="Travel from last" v={`~${travelMinutes(pred.lastZone, selected.zone.id)} min`} />
                    <Row k="ATM units" v={`${selected.zone.atms.length}`} />
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 text-[10px] uppercase tracking-wider text-faint">Why this zone scores here</div>
                    <ul className="space-y-1.5">
                      {selectedRisk.factors.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-dim">
                          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${f.impact === 'raise' ? 'bg-badx' : 'bg-goodx'}`} />
                          <span>{f.note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GlassCard pad="p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Sparkles size={15} className="text-violetx" /> Tap a zone
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-dim">
                    Select any zone on the grid to see its probability, nearest police station, ATM units and a transparent "why" risk breakdown.
                  </p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Feature breakdown */}
      <GlassCard pad="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ShieldAlert size={15} className="text-warnx" /> Why this prediction — feature breakdown
          </h3>
          <span className="chip border-edge text-faint">for {pred.ranked[0].zone.name}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            {pred.contributions.map((c, i) => (
              <div key={c.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-dim"><span className="font-mono text-cyanx">{i + 1}</span>{c.label}</span>
                  <span className="font-mono text-ink">{c.share}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <motion.div
                    className={`h-full rounded-full ${c.key === 'velocity' ? 'bg-gradient-to-r from-badx to-warnx' : c.key === 'proximity' ? 'bg-gradient-to-r from-warnx to-cyanx' : 'bg-gradient-to-r from-cyanx to-violetx'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.share}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: i * 0.07 }}
                  />
                </div>
                <p className="mt-0.5 text-[10px] leading-relaxed text-faint">{c.note}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-edge bg-raise/40 p-4">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-faint">Model reasoning</div>
            <ul className="space-y-2">
              {pred.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-dim">
                  {pred.imminent && i === 0 ? <Flame size={12} className="mt-0.5 shrink-0 text-badx" /> : <Navigation size={12} className="mt-0.5 shrink-0 text-cyanx" />}
                  {r}
                </li>
              ))}
            </ul>
            <div className="mt-3 rounded-lg border border-warnx/25 bg-warnx/5 p-2.5 text-[10px] leading-relaxed text-dim">
              <Landmark size={11} className="mr-1 inline text-warnx" />
              Probabilistic model on synthetic data — not a certain forecast. Confidence ≠ ground truth; verify on ground before action.
            </div>
          </div>
        </div>
      </GlassCard>

      {pred.imminent && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-badx/40 bg-badx/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-badx">
            <span className="h-2 w-2 animate-pulse rounded-full bg-badx" /> Withdrawal-imminent signal · {minsAgo(pred.now, simNow) >= 0 ? 'trail still warm' : ''}
          </div>
          <button className="btn btn-danger" onClick={() => setView('alert')}><MapPin size={15} /> Go to live alert</button>
        </div>
      )}
    </div>
  );
}

function Row({ k, v, small }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-raise/60 px-3 py-2 ring-1 ring-edge">
      <span className="text-faint">{k}</span>
      <span className={`text-right font-medium text-ink ${small ? 'max-w-[60%] truncate' : ''}`}>{v}</span>
    </div>
  );
}

function heatColor(rel) {
  // 0 low -> cyan, moderate -> violet, high -> rose
  if (rel > 0.62) return `rgba(251,113,133,${0.16 + (rel - 0.62) * 1.1})`;
  if (rel > 0.32) return `rgba(167,139,250,${0.13 + ((rel - 0.32) / 0.3) * 0.16})`;
  return `rgba(34,211,238,${0.06 + rel * 0.2})`;
}

function confLabel(c) {
  if (c >= 0.75) return 'High confidence — still verify on ground';
  if (c >= 0.6) return 'Moderate–high confidence';
  if (c >= 0.45) return 'Moderate confidence';
  if (c >= 0.3) return 'Low–moderate confidence';
  return 'Low confidence — treat as hypothesis';
}