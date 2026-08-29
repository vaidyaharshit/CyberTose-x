import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Bell, Building2, CheckCircle2, Crosshair, Flame, Landmark, Radar, Send, ShieldCheck, Timer, Zap } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard.jsx';
import { useApp } from '../state/AppContext.jsx';
import { predictCashOut } from '../lib/predictor.js';
import { bankName } from '../lib/dataset.js';
import { inrCompact, shortTime, timeAgo } from '../lib/format.js';

const STAGES = [
  { key: 'detected', label: 'Withdrawal-imminent signal detected', icon: Radar, hint: 'Predictive engine flags high exposure + warm trail.' },
  { key: 'dispatched', label: 'Alert dispatched to nearest PS + bank branch', icon: Send, hint: 'Push notification + branch hold-instruction raised.' },
  { key: 'acknowledged', label: 'Acknowledged by station officer / bank', icon: CheckCircle2, hint: 'Response team confirms receipt.' },
  { key: 'action', label: 'Action taken — preemptive hold / interception', icon: ShieldCheck, hint: 'Cash-out prevented; float secured.' },
];

export default function AlertSim() {
  const { activeCase, simNow, pushAlert, advanceAlert, preventAlert, logAudit } = useApp();
  const pred = useMemo(() => (activeCase ? predictCashOut(activeCase, simNow) : null), [activeCase, simNow]);
  const [runId, setRunId] = useState(null);
  const [stages, setStages] = useState(() => STAGES.map((s) => ({ ...s, at: null, done: false })));
  const [dispatchedAt, setDispatchedAt] = useState(null);
  const timers = useRef([]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  if (!activeCase || !pred) return null;

  const zone = pred.top?.zone;
  const branch = zone ? `${bankName(zone.atms[0].split('-')[1])} — ${zone.name} branch` : '—';
  const priority = pred.imminent ? 1 : 2;
  const potential = pred.exposure;
  const signals = [
    { label: 'Live float exposed', value: inrCompact(pred.atRisk), rule: 'over ₹50K threshold' },
    { label: 'Last movement', value: `${pred.minsSinceLast} min ago`, rule: pred.minsSinceLast < 150 ? 'within action window' : 'trail cooling' },
    { label: 'Flow velocity', value: `${Math.round(pred.velocityPerHr / 1000)}K/hr`, rule: pred.velocityPerHr > 60000 ? 'above PRIORITY trigger' : 'below trigger' },
    { label: 'Model confidence', value: `${pred.confidencePct}%`, rule: 'probabilistic — verify on ground' },
  ];
  const triggeredSignals = signals.filter((s, i) => (i === 0 || i === 1 || i === 2) && (pred.atRisk > 50000 || pred.minsSinceLast < 150 || pred.velocityPerHr > 60000));

  function run() {
    if (runId) return;
    const id = `ALT-${String(Date.now()).slice(-6)}`;
    const ts = Date.now();
    setRunId(id);
    setDispatchedAt(null);
    setStages(STAGES.map((s, i) => ({ ...s, at: i === 0 ? ts : null, done: i === 0 })));
    pushAlert({
      id,
      caseId: activeCase.id,
      station: zone.station,
      branch,
      priority,
      potentialAmount: potential,
      stages: [],
      timeline: [{ at: ts, label: 'Signal detected' }],
    });
    logAudit({ actor: 'SYSTEM', action: 'SIGNAL_FLAGGED', subject: activeCase.id, detail: `PRIORITY-${priority} withdrawal-imminent heuristic triggered: \u20B9${(potential / 1000).toFixed(0)}K float, ${pred.minsSinceLast}m since last movement.` });

    timers.current.push(
      setTimeout(() => {
        setStages((st) => {
          const next = st.map((s) => (s.key === 'dispatched' ? { ...s, at: Date.now(), done: true } : s));
          return next;
        });
        setDispatchedAt(Date.now());
        advanceAlert(id, 'dispatched', { msg: `Dispatch opened to ${zone.station} and ${branch}.` });
      }, 1800),
      setTimeout(() => {
        setStages((st) => st.map((s) => (s.key === 'acknowledged' ? { ...s, at: Date.now(), done: true } : s)));
        advanceAlert(id, 'acknowledged', { actor: 'Officer K. Shetty (duty)', msg: `Acknowledged by ${zone.station} — ${zone.respMin} min estimated ETA.` });
      }, 3800)
    );
  }

  function finish(asPrevented) {
    if (!runId) return;
    setStages((st) => st.map((s) => (s.key === 'action' ? { ...s, at: Date.now(), done: true } : s)));
    if (asPrevented) {
      advanceAlert(runId, 'action', { actor: 'Officer R. Deshmukh', msg: `Intervention confirmed at ${branch}; hold placed on float.` });
      preventAlert(runId);
    } else {
      advanceAlert(runId, 'action', { actor: 'Officer R. Deshmukh', msg: 'Verified on ground — precautionary check only; no interception needed.' });
      logAudit({ actor: 'Officer R. Deshmukh', action: 'ALERT_CLOSED_NO_ACTION', subject: activeCase.id, detail: 'False-positive / precautionary close after field check (sample).' });
    }
  }

  const actionDone = stages.find((s) => s.key === 'action').done;
  const runStarted = !!runId;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Bell size={18} className={priority === 1 ? 'text-badx' : 'text-cyanx'} /> Live alert stream · {activeCase.id}
          </h2>
          <p className="mt-0.5 text-xs text-dim">
            Nearest station & list of actions {priority === 1 ? ' — withdrawal-imminent' : ''} · <span className="font-mono">{pred.lastZone}</span> neighbourhood
          </p>
        </div>
        {!runStarted && (
          <button className="btn btn-primary" onClick={run} disabled={!triggeredSignals.length}>
            <Zap size={15} /> {triggeredSignals.length ? 'Run alert simulation' : 'Awaiting signals'}
          </button>
        )}
      </div>

      {/* Dispatch targets */}
      <div className="grid gap-3 sm:grid-cols-2">
        <GlassCard pad="p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-panel ring-1 ring-cyanx/40">
              <Landmark size={18} className="text-cyanx" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-faint">Dispatch target · police</div>
              <div className="truncate text-sm font-semibold text-ink">{zone.station}</div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-dim"><Timer size={11} /> est. response {zone.respMin} min · {zone.name}</div>
            </div>
          </div>
        </GlassCard>
        <GlassCard pad="p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-panel ring-1 ring-violetx/40">
              <Building2 size={18} className="text-violetx" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-faint">Dispatch target · bank</div>
              <div className="truncate text-sm font-semibold text-ink">{branch}</div>
              <div className="mt-0.5 text-[11px] text-dim">hold-instruction on {inrCompact(potential)} exposed float</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Signals */}
      <GlassCard pad="p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <Crosshair size={15} className="text-warnx" /> Trigger signals
          <span className={`chip ${priority === 1 ? 'border-badx/40 bg-badx/10 text-badx' : 'border-edge text-dim'}`}>
            {priority === 1 ? 'PRIORITY-1 · withdrawal imminent' : 'PRIORITY-2 · monitored'}
          </span>
        </h3>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {signals.map((s, i) => (
            <div key={i} className={`rounded-lg p-3 ring-1 ${s.rule.includes('trigger') || s.rule.includes('window') ? 'bg-badx/5 ring-badx/30' : s.rule.includes('cooling') || s.rule.includes('below') ? 'bg-panel ring-edge' : 'bg-panel ring-edge'}`}>
              <div className="text-[9px] uppercase tracking-widest text-faint">{s.label}</div>
              <div className={`mt-1 text-base font-black ${s.rule.includes('trigger') || s.rule.includes('window') ? 'text-badx' : 'text-ink'}`}>{s.value}</div>
              <div className="mt-0.5 text-[9px] text-faint">{s.rule}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Timeline */}
      <GlassCard pad="p-5">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
          <Radar size={15} className="text-cyanx" /> Response timeline
        </h3>
        <p className="mb-4 text-[11px] text-dim">
          {runStarted ? 'Simulating dispatch in real time…' : 'Press “Run alert simulation” to dispatch to targets.'}
        </p>
        <div className="relative space-y-0">
          <div className="absolute bottom-3 left-[15px] top-3 w-px bg-edge" />
          {stages.map((s, i) => (
            <motion.div key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
              <motion.span
                className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${s.done ? 'border-cyanx/50 bg-cyanx/15 text-cyanx' : 'border-edge bg-raise text-faint'}`}
                animate={s.done ? { scale: [1, 1.12, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                <s.icon size={14} />
                {s.key === 'detected' && s.done && !actionDone && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-badx" />
                )}
              </motion.span>
              <div className="min-w-0 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-semibold ${s.done ? 'text-ink' : 'text-faint'}`}>{s.label}</span>
                  {s.at && <span className="font-mono text-[10px] text-faint">{shortTime(s.at)} · {timeAgo(s.at, simNow)}</span>}
                  {s.key === 'action' && s.done && (
                    <span className={`chip ${preventAlert ? '' : ''} border-goodx/40 bg-goodx/10 text-goodx`}>{s.hint.split(';')[0]}</span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-dim">{s.hint}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action controls */}
        <div className="mt-5 border-t border-edge pt-4">
          {!runStarted ? (
            <div className="flex items-start gap-2 rounded-lg border border-warnx/25 bg-warnx/5 p-3 text-[11px] text-dim">
              <AlertTriangle size={13} className="mt-0.5 shrink-0 text-warnx" />
              <span>The simulator demonstrates the full response loop. After the run, confirm the intervention outcome — both paths (intercepted
              / precautionary check) are recorded to the SHA-256 audit chain.</span>
            </div>
          ) : actionDone ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-goodx">
              <CheckCircle2 size={16} /> Response loop complete — recorded to audit chain.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" onClick={() => finish(true)} disabled={!stages.every((s) => s.done || s.key === 'action')}>
                <ShieldCheck size={15} /> Confirm interception · save {inrCompact(potential)}
              </button>
              <button className="btn btn-ghost" onClick={() => finish(false)}>
                <CheckCircle2 size={15} /> Precautionary check only
              </button>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Monitoring footer */}
      {!runStarted && pred.imminent && (
        <div className="flex items-center gap-2 rounded-xl border border-badx/40 bg-badx/10 px-4 py-3 text-sm font-semibold text-badx">
          <Flame size={16} className="animate-pulse" /> Engine read: withdrawal-imminent within ~{pred.windowMinutes} min — dispatch recommended now.
        </div>
      )}
    </div>
  );
}