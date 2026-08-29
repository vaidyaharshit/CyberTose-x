import { useMemo } from 'react';
import {
  Activity, AlertTriangle, ArrowRight, Banknote, CheckCircle2, FileText, Flame,
  GitBranch, Layers, LayoutGrid, Lock, Map, Radar, ShieldAlert, Sparkles, TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard.jsx';
import Counter from '../components/ui/Counter.jsx';
import { useApp } from '../state/AppContext.jsx';
import { predictCashOut } from '../lib/predictor.js';
import { inrFull, inrCompact, timeAgo, shortDate } from '../lib/format.js';
import { ZONES } from '../lib/dataset.js';

export default function Dashboard() {
  const app = useApp();
  const { metrics, activeCase, cases, simNow, view: _, ...rest } = app;
  const { setView, loadDemo } = rest;

  const pred = useMemo(() => (activeCase ? predictCashOut(activeCase, simNow) : null), [activeCase, simNow]);

  if (!activeCase) {
    return <EmptyState />;
  }

  const hotZones = pred.ranked.slice(0, 3);
  const recentLog = [...(activeCase.actionLog || [])].reverse().slice(0, 4);

  return (
    <div className="space-y-5">
      {/* Header */}
      <GlassCard glow className="hairline-top">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip border-cyanx/40 bg-cyanx/10 text-cyanx">
                <Activity size={10} /> {activeCase.status}
              </span>
              <span className="chip border-edge text-faint">{activeCase.id}</span>
              <span className="chip border-edge text-faint">sample data</span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-ink sm:text-2xl">{activeCase.title}</h2>
            <p className="mt-1 text-sm text-dim">
              {activeCase.intake.victim.name} · {activeCase.intake.incident.paymentMode} · reported {timeAgo(activeCase.createdAt, simNow)}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => setView('heatmap')}>
              <Map size={15} /> Predict cash-out
            </button>
            <button className="btn btn-ghost" onClick={() => setView('trail')}>
              <GitBranch size={15} /> Money trail
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Cases tracked" icon={Layers} tone="cyan" value={metrics.totalTracked} />
        <Stat label="Active now" icon={Activity} tone="violet" value={metrics.activeCount} />
        <Stat label="At risk (float)" icon={Flame} tone="warn" value={metrics.atRisk} format={inrCompact} pulse />
        <Stat label="Amount protected" icon={CheckCircle2} tone="good" value={metrics.amountSaved} format={inrCompact} />
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickNav icon={GitBranch} title="Money trail" body={`${activeCase.mules.length} suspect hops mapped`} stats={`${activeCase.transactions.length} transactions`} onClick={() => setView('trail')} />
        <QuickNav icon={Map} title="Predicted cash-out" body={pred.top ? pred.top.zone.name : '—'} stats={`${pred.confidencePct}% confidence`} tone={pred.imminent ? 'warn' : 'cyan'} onClick={() => setView('heatmap')} />
        <QuickNav icon={ShieldAlert} title="Risk engine" body={`${activeCase.mules.filter((m) => m.balance > 0).length} live-float accounts`} stats="per-account breakdown" onClick={() => setView('risk')} />
        <QuickNav icon={Radar} title="Live alert" body={pred.imminent ? 'Withdrawal-imminent signal' : 'Monitored, not imminent'} stats={`${pred.exposure ? inrCompact(pred.exposure) : '—'} exposed`} tone={pred.imminent ? 'bad' : 'good'} onClick={() => setView('alert')} />
      </div>

      {/* Two column: actions + prediction summary */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <GlassCard pad="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <FileText size={15} className="text-cyanx" /> Case activity
            </h3>
            <button onClick={() => setView('audit')} className="flex items-center gap-1 text-[11px] text-faint hover:text-cyanx">
              Full audit chain <ArrowRight size={11} />
            </button>
          </div>
          <div className="space-y-3">
            {recentLog.map((l, i) => (
              <motion.div
                key={`${l.at}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 rounded-lg border border-edge-soft bg-raise/60 p-3"
              >
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${l.action === 'COMPLAINT_LOGGED' || l.action === 'SYSTEM' ? '' : ''}`}>
                  <Lock size={13} className="text-faint" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] uppercase text-cyanx">{l.action}</span>
                    <span className="text-[10px] text-faint">{timeAgo(l.at, simNow)}</span>
                  </div>
                  <p className="mt-0.5 text-xs leading-snug text-dim">{l.note}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn btn-ghost text-xs" onClick={() => viewAction('RESOLVE')}>Mark resolved</button>
            <button className="btn btn-ghost text-xs" onClick={() => viewAction('ESCALATE')}>Escalate</button>
          </div>
        </GlassCard>

        <GlassCard pad="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <TrendingUp size={15} className="text-violetx" /> Predicted hot zones
            </h3>
            <span className="chip border-violetx/40 bg-violetx/10 text-violetx">
              <Sparkles size={10} /> recomputed live
            </span>
          </div>
          <div className="space-y-3">
            {hotZones.map((r, i) => (
              <div key={r.zone.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-dim">
                    <span className="mr-1.5 font-mono text-cyanx">{i + 1}</span>
                    {r.zone.name}
                  </span>
                  <span className="font-mono text-ink">{(r.prob * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyanx to-violetx"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(r.prob * 100 / (hotZones[0].prob * 100) * 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-warnx/25 bg-warnx/5 p-3 text-xs leading-relaxed text-dim">
            <AlertTriangle size={13} className="mr-1 inline text-warnx" />
            Predictions are probabilistic. Field verification by the nearest PS/bank is required before any enforcement action.
          </div>
        </GlassCard>
      </div>

      {/* Case list */}
      <CaseTable />
    </div>
  );

  function viewAction(kind) {
    const note = kind === 'RESOLVE' ? 'Case marked resolved after officer review.' : 'Case escalated to cybercrime circle office for deeper investigation.';
    app.caseAction(activeCase.id, kind, note, { status: kind === 'RESOLVE' ? 'Resolved' : 'Escalated' });
  }
}

function Stat({ label, value, icon: Icon, tone = 'cyan', format = (v) => v.toLocaleString('en-IN'), pulse }) {
  const tones = {
    cyan: { icon: 'text-cyanx', glow: 'shadow-glow', bar: 'from-cyanx to-sky-400' },
    violet: { icon: 'text-violetx', glow: 'shadow-glow-violet', bar: 'from-violetx to-indigo-400' },
    warn: { icon: 'text-warnx', glow: '', bar: 'from-warnx to-amber-400' },
    good: { icon: 'text-goodx', glow: '', bar: 'from-goodx to-emerald-400' },
  };
  const t = tones[tone] || tones.cyan;
  return (
    <GlassCard pad="p-4" className={`relative overflow-hidden ${pulse ? '' : ''}`}>
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${t.bar}`} />
      <div className="flex items-center gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-panel ring-1 ring-edge ${t.icon}`}>
          <Icon size={17} />
        </span>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-faint">{label}</div>
          <div className="flex items-center gap-2">
            <Counter value={value} format={format} className="text-lg font-bold text-ink sm:text-xl" />
            {pulse && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warnx" />}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function QuickNav({ icon: Icon, title, body, stats, tone = 'cyan', onClick }) {
  const tones = { cyan: 'text-cyanx', violet: 'text-violetx', warn: 'text-warnx', bad: 'text-badx', good: 'text-goodx' };
  return (
    <motion.button whileHover={{ y: -3 }} onClick={onClick} className="glass group rounded-xl p-4 text-left shadow-card transition-shadow hover:shadow-glow">
      <div className="flex items-start justify-between">
        <span className={`grid h-9 w-9 place-items-center rounded-lg bg-panel ring-1 ring-edge ${tones[tone]}`}>
          <Icon size={17} />
        </span>
        <ArrowRight size={15} className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-cyanx" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-0.5 text-xs text-dim">{body}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-faint">{stats}</p>
    </motion.button>
  );
}

function EmptyState() {
  const { loadDemo, setView } = useApp();
  const baseline = ZONES.map((z) => z.heatBase).reduce((a, b) => a + b, 0) / ZONES.length;
  const topZone = [...ZONES].sort((a, b) => b.heatBase - a.heatBase)[0];

  return (
    <div className="space-y-6">
      <motion.div
        className="scanline hairline-top glass relative overflow-hidden rounded-2xl p-6 sm:p-10"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-cyanx">
              <Sparkles size={13} /> Smart India Hackathon · MHA SIH-26184
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl lg:text-5xl">
              Stop the cash-out<br />
              <span className="bg-gradient-to-r from-cyanx to-violetx bg-clip-text text-transparent">before it happens.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-dim sm:text-base">
              TraceGrid AI maps cybercrime money trails to mule accounts in real time and forecasts the most
              probable <em>cash withdrawal zones</em>, so local police and banks can intervene before the float
              turns into cash.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="btn btn-primary" onClick={loadDemo}>
                <Sparkles size={16} /> Load demo case (₹4.8L UPI fraud)
              </button>
              <button className="btn btn-ghost" onClick={() => setView('intake')}>
                <FileText size={16} /> New complaint intake
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Demo case" big="$4.8L" sub="3-hop mule chain" icon={Banknote} tone="cyan" />
            <MiniStat label="Top hotspot" big={topZone.name.split(' ')[0]} sub={`${topZone.heatBase}/100 baseline`} icon={Flame} tone="violet" />
            <MiniStat label="Baseline activity" big={`${Math.round(baseline)}`} sub="avg zone index" icon={Activity} tone="warn" />
            <MiniStat label="Engine" big="SHA-256" sub="chained audit log" icon={Lock} tone="good" />
          </div>
        </div>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: LayoutGrid, t: 'Command dashboard', d: 'Case list, statuses, prevented metrics' },
          { icon: FileText, t: 'Complaint intake', d: 'Log victim + account details' },
          { icon: GitBranch, t: 'Money trail graph', d: 'Victim → mules → cash points' },
          { icon: Map, t: 'Heatmap prediction', d: 'Feature-weighted next cash-out zone' },
        ].map((f) => (
          <GlassCard key={f.t} pad="p-4">
            <f.icon size={17} className="text-cyanx" />
            <h3 className="mt-2 text-sm font-semibold text-ink">{f.t}</h3>
            <p className="mt-0.5 text-xs text-dim">{f.d}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, big, sub, icon: Icon, tone }) {
  const tones = { cyan: 'text-cyanx', violet: 'text-violetx', warn: 'text-warnx', good: 'text-goodx' };
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-faint">{label}</span>
        <Icon size={14} className={tones[tone]} />
      </div>
      <div className={`mt-2 text-2xl font-black ${tones[tone]}`}>{big}</div>
      <div className="mt-0.5 text-[10px] text-dim">{sub}</div>
    </div>
  );
}

function CaseTable() {
  const { cases, setActiveCaseId, setView } = useApp();
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Case registry <span className="text-faint">· sample corpus</span></h3>
        <span className="chip border-edge text-faint">{cases.length} cases</span>
      </div>

      {/* Mobile stacked cards */}
      <div className="space-y-3 md:hidden">
        {cases.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCaseId(c.id, setView)}
            className="glass block w-full rounded-xl p-4 text-left"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-cyanx">{c.id}</span>
              <StatusChip status={c.status} />
            </div>
            <h4 className="mt-1.5 text-sm font-semibold text-ink">{c.title}</h4>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-dim">
              <span className="rounded bg-panel px-1.5 py-0.5 ring-1 ring-edge">{inrCompact(c.claimedAmount || 0)}</span>
              <span className="rounded bg-panel px-1.5 py-0.5 ring-1 ring-edge">{c.transactions.length} txs</span>
              <span className="rounded bg-panel px-1.5 py-0.5 ring-1 ring-edge">{shortDate(c.createdAt)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <GlassCard pad="p-0" className="hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-edge text-[10px] uppercase tracking-widest text-faint">
              <th className="px-4 py-3 font-medium">Case</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Claimed</th>
              <th className="px-4 py-3 font-medium">Hops</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Raised</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} className="border-b border-edge-soft transition-colors last:border-0 hover:bg-raise/60">
                <td className="px-4 py-3">
                  <div className="font-mono text-[11px] text-cyanx">{c.id}</div>
                  <div className="max-w-[220px] truncate text-xs text-dim">{c.title}</div>
                </td>
                <td className="px-4 py-3 text-xs text-dim">{c.intake?.incident?.type}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink">{inrCompact(c.claimedAmount)}</td>
                <td className="px-4 py-3 font-mono text-xs text-dim">{c.mules.length}</td>
                <td className="px-4 py-3"><StatusChip status={c.status} /></td>
                <td className="px-4 py-3 text-xs text-dim">{shortDate(c.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setActiveCaseId(c.id, setView)} className="chip border-cyanx/40 bg-cyanx/10 text-cyanx hover:bg-cyanx/20">
                    Open <ArrowRight size={10} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

export function StatusChip({ status }) {
  const map = {
    Active: 'border-cyanx/40 bg-cyanx/10 text-cyanx',
    Resolved: 'border-goodx/40 bg-goodx/10 text-goodx',
    Escalated: 'border-warnx/40 bg-warnx/10 text-warnx',
  };
  const cls = map[status] || 'border-edge text-dim';
  return <span className={`chip ${cls}`}>{status}</span>;
}