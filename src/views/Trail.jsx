import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Banknote, User, Wallet, ExternalLink, GitBranch, Landmark, ShieldAlert, CircleDot, ChevronRight } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard.jsx';
import PanZoom from '../components/ui/PanZoom.jsx';
import TierBadge from '../components/ui/TierBadge.jsx';
import { useApp } from '../state/AppContext.jsx';
import { buildGraph, graphSummary } from '../lib/graph.js';
import { inrFull, shortTime, timeAgo, inrCompact } from '../lib/format.js';
import { zoneById } from '../lib/dataset.js';
import { predictCashOut } from '../lib/predictor.js';

const W = 1000;
const H = 620;

const NODE_STYLE = {
  victim: { ring: 'ring-cyanx/50', bg: 'from-cyan-500/25 to-sky-600/10', text: 'text-cyanx', icon: 'text-cyanx' },
  mule_high: { ring: 'ring-badx/60', bg: 'from-rose-500/25 to-rose-900/10', text: 'text-badx', icon: 'text-badx' },
  mule_med: { ring: 'ring-warnx/50', bg: 'from-amber-500/25 to-amber-900/10', text: 'text-warnx', icon: 'text-warnx' },
  mule_low: { ring: 'ring-goodx/50', bg: 'from-emerald-500/25 to-emerald-900/10', text: 'text-goodx', icon: 'text-goodx' },
  atm: { ring: 'ring-violetx/50', bg: 'from-violet-500/25 to-violet-900/10', text: 'text-violetx', icon: 'text-violetx' },
  zone: { ring: 'ring-warnx/60', bg: 'from-warnx/25 to-warnx/5', text: 'text-warnx', icon: 'text-warnx' },
};

export default function Trail() {
  const { activeCase, simNow, setView } = useApp();
  const graph = useMemo(() => buildGraph(activeCase), [activeCase]);
  const summary = useMemo(() => graphSummary(activeCase), [activeCase]);
  const pred = useMemo(() => (activeCase ? predictCashOut(activeCase, simNow) : null), [activeCase, simNow]);
  const [sel, setSel] = useState(null);

  if (!activeCase) return <NoCase />;

  const selNode = graph.nodes.find((n) => n.id === sel);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <GitBranch size={18} className="text-cyanx" /> Money trail · {activeCase.id}
          </h2>
          <p className="mt-0.5 text-xs text-dim">
            {summary.hopCount} mule hop{summary.hopCount > 1 ? 's' : ''} · {summary.txCount} transactions · inflow {inrCompact(summary.totalIn)} · tracked float {inrCompact(activeCase.atRisk)}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setView('heatmap')}>
          Predict cash-out <ChevronRight size={15} />
        </button>
      </div>

      <GlassCard pad="p-0" className="overflow-hidden">
        <PanZoom bounds={{ w: W, h: H }} className="h-[420px] sm:h-[520px]">
          <svg width={W} height={H} className="absolute">
            {graph.edges.map((e, i) => {
              const a = graph.nodes.find((n) => n.id === e.from);
              const b = graph.nodes.find((n) => n.id === e.to);
              if (!a || !b) return null;
              const selected = sel && (sel === a.id || sel === b.id);
              const midX = (a.x + b.x) / 2;
              const midY = (a.y + b.y) / 2 + 6;
              const cx = a.x + (b.x - a.x) / 2;
              const cy = a.y > b.y ? a.y + 30 : a.y + 70;
              return (
                <g key={i}>
                  <path
                    d={`M${a.x} ${a.y + 26} Q${cx} ${cy} ${b.x} ${b.y - 26}`}
                    fill="none"
                    stroke={e.status === 'confirmed' ? '#22d3ee' : '#fbbf24'}
                    strokeOpacity={selected ? 0.95 : e.status === 'confirmed' ? 0.5 : 0.55}
                    strokeWidth={selected ? 2.4 : 1.4}
                    strokeDasharray={e.status === 'confirmed' ? '0' : '7 5'}
                  />
                  <circle cx={midX} cy={midY - 6} r={3} fill={e.status === 'confirmed' ? '#22d3ee' : '#fbbf24'} opacity={0.9}>
                    {selected && (
                      <animate attributeName="r" values="3;5" dur="1s" repeatCount="indefinite" />
                    )}
                  </circle>
                </g>
              );
            })}
          </svg>

          {graph.edges.map((e, i) => {
            const a = graph.nodes.find((n) => n.id === e.from);
            const b = graph.nodes.find((n) => n.id === e.to);
            if (!a || !b) return null;
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            return (
              <div
                key={`l${i}`}
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-md border border-edge bg-void/95 px-1.5 py-0.5 font-mono text-[10px] text-dim backdrop-blur"
                style={{ left: midX, top: midY + 4, transform: 'translate(-50%, -50%)' }}
              >
                <span className="text-cyanx">{inrCompact(e.amount)}</span> · {shortTime(e.at)}
                {e.status === 'suspected' && <span className="ml-1 text-warnx">?</span>}
              </div>
            );
          })}

          {graph.nodes.map((n) => {
            const style = nodeStyle(n);
            const isSel = sel === n.id;
            return (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * graph.nodes.indexOf(n), type: 'spring', stiffness: 260, damping: 20 }}
                whileHover={{ scale: 1.08 }}
                onClick={() => setSel(isSel ? null : n.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border text-center"
                style={{ left: n.x, top: n.y, zIndex: isSel ? 20 : 10 }}
              >
                <span
                  className={`flex flex-col items-center justify-center rounded-xl bg-gradient-to-br ring-1 ${style.ring} ${style.bg} px-2 py-1.5`}
                  style={{ minWidth: n.size + 12, minHeight: n.size + 6 }}
                >
                  <NodeIcon n={n} cls={style.icon} />
                  <span className={`mt-1 max-w-[96px] truncate text-[10px] font-semibold ${style.text}`}>{n.label}</span>
                  <span className="max-w-[96px] truncate font-mono text-[8px] text-faint">{n.sub}</span>
                </span>
                {isSel && (
                  <motion.span
                    className="pointer-events-none absolute inset-0 -m-1 rounded-2xl ring-2 ring-cyanx/60"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                )}
                {n.type === 'zone' && (
                  <span className="absolute inset-0 -m-2 rounded-2xl border border-warnx/50 animate-ping" style={{ animationDuration: '2.2s' }} />
                )}
              </motion.button>
            );
          })}
        </PanZoom>
      </GlassCard>

      {/* Legend + detail */}
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard pad="p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-faint">Legend</h3>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-dim sm:grid-cols-4">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyanx/70" /> Complainant</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-badx/70" /> High-risk mule</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warnx/70" /> Medium-risk mule</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-violetx/70" /> Cash point</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-dim">
            <span className="flex items-center gap-1.5"><span className="h-px w-5 bg-cyanx/70" /> confirmed</span>
            <span className="flex items-center gap-1.5"><span className="h-px w-5 border-t border-dashed border-warnx/70" /> suspected / requires verification</span>
          </div>
        </GlassCard>

        <div className="min-h-[120px]">
          <AnimatePresence mode="wait">
            {selNode ? (
              <motion.div key={selNode.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <NodeDetail node={selNode} />
              </motion.div>
            ) : (
              <GlassCard pad="p-4" className="h-full">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                  <CircleDot size={15} className="text-faint" /> Click any node
                </h3>
                <p className="text-xs leading-relaxed text-dim">
                  Select the victim, a mule account or a cash point to inspect account details, balances, risk and open "{'requires verification'}" items. Edge labels show amount + local time.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="chip border-edge text-faint">Victim → {summary.hopCount} hop chain</span>
                  <span className="chip border-edge text-faint">Inflow {inrCompact(summary.totalIn)}</span>
                  {pred?.top && <span className="chip border-warnx/40 bg-warnx/10 text-warnx">Next zone guess: {pred.top.zone.name}</span>}
                </div>
              </GlassCard>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function nodeStyle(n) {
  if (n.type === 'victim') return NODE_STYLE.victim;
  if (n.type === 'atm') return NODE_STYLE.atm;
  if (n.type === 'zone') return NODE_STYLE.zone;
  return NODE_STYLE[`mule_${(n.risk && n.risk.tier || 'LOW').toLowerCase()}`] || NODE_STYLE.mule_low;
}

function NodeIcon({ n, cls }) {
  if (n.type === 'victim') return <User size={16} className={cls} />;
  if (n.type === 'atm') return <Landmark size={16} className={cls} />;
  if (n.type === 'zone') return <ShieldAlert size={16} className={cls} />;
  return <Wallet size={16} className={cls} />;
}

function NodeDetail({ node }) {
  if (node.type === 'victim') {
    return (
      <GlassCard pad="p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <User size={15} className="text-cyanx" /> Complainant — {node.label}
        </h3>
        <p className="mt-1 text-xs text-dim">{node.sub}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-raise/60 p-2.5 ring-1 ring-edge">
            <div className="text-[10px] uppercase tracking-wider text-faint">Claimed loss</div>
            <div className="mt-0.5 font-bold text-ink">{inrFull(node.amount)}</div>
          </div>
        </div>
      </GlassCard>
    );
  }
  if (node.type === 'atm') {
    const zone = zoneById(node.sub.split(' · ')[0]);
    return (
      <GlassCard pad="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Landmark size={15} className="text-violetx" /> {node.label}
          </h3>
          <span className={`chip ${node.status === 'confirmed' ? 'border-goodx/40 bg-goodx/10 text-goodx' : 'border-warnx/40 bg-warnx/10 text-warnx'}`}>
            {node.status === 'confirmed' ? 'confirmed' : 'requires verification'}
          </span>
        </div>
        <p className="mt-1 text-xs text-dim">{zone ? `${zone.name} · ${zone.atms.join(', ')}` : node.sub}</p>
        <div className="mt-3 grid gap-2 text-xs">
          <div className="flex justify-between rounded-lg bg-raise/60 p-2.5 ring-1 ring-edge">
            <span className="text-faint">Attempted cash-out</span>
            <span className="font-bold text-ink">{inrFull(node.amount)}</span>
          </div>
          {zone && (
            <div className="flex justify-between rounded-lg bg-raise/60 p-2.5 ring-1 ring-edge">
              <span className="text-faint">Nearest PS</span>
              <span className="text-dim">{zone.station} ({zone.respMin} min)</span>
            </div>
          )}
        </div>
      </GlassCard>
    );
  }
  return (
    <GlassCard pad="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Wallet size={15} className="text-badx" /> {node.label} <span className="font-mono text-[10px] text-faint">· {node.id}</span>
        </h3>
        {node.risk && <TierBadge tier={node.risk.tier} label={node.risk.tierLabel} />}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-raise/60 p-2.5 ring-1 ring-edge">
          <div className="text-[10px] uppercase tracking-wider text-faint">Bank</div>
          <div className="mt-0.5 font-semibold text-ink">{node.sub}</div>
        </div>
        <div className="rounded-lg bg-raise/60 p-2.5 ring-1 ring-edge">
          <div className="text-[10px] uppercase tracking-wider text-faint">IFSC</div>
          <div className="mt-0.5 font-mono text-ink">{node.ifsc}</div>
        </div>
        <div className="rounded-lg bg-raise/60 p-2.5 ring-1 ring-edge">
          <div className="text-[10px] uppercase tracking-wider text-faint">Live balance</div>
          <div className="mt-0.5 font-bold text-ink">{inrFull(node.amount || 0)}</div>
        </div>
        <div className="rounded-lg bg-raise/60 p-2.5 ring-1 ring-edge">
          <div className="text-[10px] uppercase tracking-wider text-faint">Opened</div>
          <div className="mt-0.5 text-ink">{node.openedDaysAgo} days ago</div>
        </div>
      </div>
      {node.note && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-warnx/25 bg-warnx/5 p-2.5 text-[11px] leading-relaxed text-dim">
          <ShieldAlert size={13} className="mt-0.5 shrink-0 text-warnx" /> {node.note}
        </p>
      )}
      {node.risk && (
        <div className="mt-3 rounded-lg border border-edge bg-raise/40 p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-faint">Why this score · {node.risk.score}/100</div>
          <ul className="mt-1.5 space-y-1">
            {node.risk.factors.slice(0, 3).map((f, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-dim">
                <ExternalLink size={10} className="mt-0.5 shrink-0 text-cyanx" /> {f.note}
              </li>
            ))}
            {node.risk.factors.length > 3 && (
              <li className="text-[10px] text-faint">+ {node.risk.factors.length - 3} more indicators — see Risk Engine</li>
            )}
          </ul>
        </div>
      )}
    </GlassCard>
  );
}

function NoCase() {
  const { setView } = useApp();
  return (
    <GlassCard pad="p-10" className="text-center">
      <Banknote size={34} className="mx-auto text-faint" />
      <h2 className="mt-3 text-lg font-semibold text-ink">No active case</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-dim">Load the judge demo case or open a complaint to build a live money trail.</p>
      <button className="btn btn-primary mt-4" onClick={() => setView('intake')}>Open intake</button>
    </GlassCard>
  );
}