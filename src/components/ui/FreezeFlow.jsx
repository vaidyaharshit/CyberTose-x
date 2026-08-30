import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, Lock, ShieldCheck, Send } from 'lucide-react';
import { useApp } from '../../state/AppContext.jsx';
import { inrFull } from '../../lib/format.js';

const STAGES = [
  { key: 'sent', label: 'Request sent', sub: 'Officer action signed & queued to bank/NPCI freeze API' },
  { key: 'received', label: 'Bank system received', sub: 'Acknowledged by bank core-banking gateway' },
  { key: 'review', label: 'Account under review', sub: 'Bank compliance reviewing hold eligibility' },
  { key: 'frozen', label: 'Account frozen', sub: 'Withdrawals blocked — funds under bank hold' },
];

const STEP_DELAY = 1500;

export default function FreezeFlow({ mule, caseId }) {
  const { requestFreeze } = useApp();
  const [running, setRunning] = useState(false);
  const [idx, setIdx] = useState(0); // number of completed stages
  const [frozen, setFrozen] = useState({ done: false, ms: 0 });
  const timers = useRef([]);

  const amount = mule.balance || 0;

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => reset, []);

  const start = () => {
    if (running || frozen.done) return;
    reset();
    setRunning(true);
    setIdx(1); // stage 0 completed immediately
    const startAt = Date.now();
    const timings = [STEP_DELAY, STEP_DELAY * 2, STEP_DELAY * 3];
    timings.forEach((t, i) => {
      timers.current.push(
        setTimeout(() => {
          setIdx(i + 2);
          if (i === timings.length - 1) {
            const ms = Date.now() - startAt;
            setFrozen({ done: true, ms });
            setRunning(false);
            requestFreeze(caseId, mule, { frozenMs: ms });
          }
        }, t)
      );
    });
  };

  const done = frozen.done || mule.frozen === true;
  const finalMs = frozen.ms || mule.frozenMs || 0;

  const frozenAmount = amount > 0 ? amount : null;

  return (
    <div className="rounded-xl border border-edge bg-raise/40 p-3">
      {!done ? (
        <>
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-faint">Auto-freeze request</div>
              <div className="mt-0.5 truncate text-xs font-semibold text-ink">
                {mule.id} · {mule.bankCode}
              </div>
            </div>
            {!running && (
              <button
                onClick={start}
                className="btn btn-danger px-3 py-1.5 text-xs"
              >
                <Send size={13} /> Send Freeze Request to Bank
              </button>
            )}
          </div>

          <ol className="relative space-y-1.5 border-t border-edge pt-2.5">
            {STAGES.map((s, i) => {
              const complete = i < idx;
              const active = i === idx && running;
              return (
                <motion.li
                  key={s.key}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-center gap-2.5 text-[11px]"
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center">
                    {complete ? (
                      <CheckCircle2 size={14} className="text-goodx" />
                    ) : active ? (
                      <Loader2 size={14} className="animate-spin text-cyanx" />
                    ) : (
                      <span className="h-2 w-2 rounded-full border border-edge bg-panel" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <span className={complete ? 'font-semibold text-ink' : active ? 'font-semibold text-cyanx' : 'text-dim'}>
                      {i + 1}. {s.label}
                    </span>
                    {active && <span className="ml-2 text-faint">{s.sub}</span>}
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key="frozen" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-goodx/40 bg-goodx/10 text-goodx">
                <ShieldCheck size={17} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  Account frozen <CheckCircle2 size={13} className="text-goodx" />
                </div>
                <div className="truncate font-mono text-[10px] text-faint">{mule.id} · {mule.account} · {mule.bankCode}{mule.freezeRef ? ` · ref ${mule.freezeRef}` : ''}</div>
              </div>
            </div>
            <p className="text-[11px] leading-snug text-dim">
              Frozen in <span className="font-mono text-goodx">{(finalMs / 1000).toFixed(1)}s</span> — well within the golden window.
              {frozenAmount != null && ` ${inrFull(frozenAmount)} of live float secured under bank hold.`}
            </p>
            <div className="rounded-lg border border-warnx/25 bg-warnx/5 p-2.5 text-[10px] leading-relaxed text-dim">
              <Lock size={10} className="mr-1 inline text-warnx" />
              Simulated for demo purposes — represents integration with bank/NPCI freeze APIs and the 1930 cybercrime helpline mechanism in a real deployment.
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}