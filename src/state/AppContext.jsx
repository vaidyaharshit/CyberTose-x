import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { buildDemoCase, buildHistoricCases, buildIntakeCase, makeSessionNow } from '../lib/cases.js';
import { startChain, appendEntry } from '../lib/hashchain.js';
import { buildSeedReviews, computeAccuracy } from '../lib/feedback.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const SIM_TICK_MS = 1000;     // real time per tick
const SIM_ACCEL = 15;         // simulated seconds per real second

let toastSeq = 0;

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('tg-theme') || 'dark';
    } catch {
      return 'dark';
    }
  });
  const [view, setViewRaw] = useState('dashboard');
  const [cases, setCases] = useState(() => buildHistoricCases(makeSessionNow()));
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [simNow, setSimNow] = useState(() => makeSessionNow());
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState(() =>
    startChain([
      { ts: makeSessionNow() - 864e5, actor: 'SYSTEM', action: 'CHAIN_INIT', subject: 'tracegrid-ai', detail: 'Audit chain initialised on synthetic console.' },
      { ts: makeSessionNow() - 864e5 + 1200, actor: 'Officer R. Deshmukh', action: 'CASE_LOGGED', subject: 'TG-26184-0409', detail: 'Historic sample case (resolved) imported for dashboard conditioning.' },
      { ts: makeSessionNow() - 864e5 + 3600, actor: 'Officer R. Deshmukh', action: 'ALERT_ACTION', subject: 'TG-26184-0409', detail: 'Intervention at branch; withdrawal intercepted — sample record.' },
    ])
  );
  const [alerts, setAlerts] = useState([]);
  const [prevented, setPrevented] = useState([
    { caseId: 'TG-26184-0409', amount: 230000, at: makeSessionNow() - 864e5 + 3600, station: 'Cyber Crime Cell, Indira Chowk', branch: 'Surya City Bank — HQ branch', outcome: 'Cash-out intercepted before completion' },
  ]);
  const [toasts, setToasts] = useState([]);
  const [tamperSeq, setTamperSeq] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [intakeDraft, setIntakeDraft] = useState(null);
  const [feedback, setFeedback] = useState(() => buildSeedReviews(makeSessionNow()));
  const serialRef = useRef(43);

  const pushToast = useCallback((msg, kind = 'info') => {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const logAudit = useCallback(({ actor, action, subject, detail }) => {
    setAudit((chain) => appendEntry(chain, { ts: Date.now(), actor, action, subject, detail }));
  }, []);

  const logCaseAction = useCallback((caseId, actor, action, note) => {
    setCases((cs) =>
      cs.map((c) =>
        c.id === caseId
          ? { ...c, actionLog: [...(c.actionLog || []), { at: Date.now(), actor, action, note }] }
          : c
      )
    );
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') root.classList.add('light');
    else root.classList.remove('light');
    try {
      localStorage.setItem('tg-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    const id = setInterval(() => {
      setSimNow((prev) => prev + Math.round(SIM_ACCEL * SIM_TICK_MS));
    }, SIM_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const setView = useCallback(
    (v) => {
      setDrawerOpen(false);
      setViewRaw(v);
    },
    []
  );

  const loadDemo = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      try {
        const demo = buildDemoCase(Date.now());
        setCases((cs) => {
          const exists = cs.some((c) => c.id === demo.id);
          return exists ? cs : [demo, ...cs];
        });
        setActiveCaseId(demo.id);
        setAudit((chain) =>
          appendEntry(chain, {
            ts: Date.now(),
            actor: 'Officer R. Deshmukh',
            action: 'CASE_LOADED',
            subject: demo.id,
            detail: 'Judge demo case loaded from synthetic dataset (₹4.80L UPI fraud, 3-hop chain). No real data.',
          })
        );
        setLoading(false);
        setViewRaw('trail');
        pushToast('Demo case TG-26184-0421 loaded — 3-hop mule chain mapped.', 'success');
      } catch (err) {
        console.error('loadDemo failed', err);
        setLoading(false);
        pushToast('Demo load failed: ' + err.message, 'error');
      }
    }, 1400);
  }, [pushToast]);

  const submitIntake = useCallback(
    (payload) => {
      const serial = serialRef.current++;
      const created = buildIntakeCase(payload, Date.now(), serial);
      setCases((cs) => [created, ...cs]);
      setActiveCaseId(created.id);
      setAudit((chain) =>
        appendEntry(chain, {
          ts: Date.now(),
          actor: 'Officer R. Deshmukh',
          action: 'COMPLAINT_LOGGED',
          subject: created.id,
          detail: `Intake registered: "${created.title}" — ₹${created.claimedAmount.toLocaleString('en-IN')}. Synthetic data.`,
        })
      );
      setViewRaw('trail');
      pushToast(`Case ${created.id} opened — money trail mapped across ${created.mules.length} suspect account(s).`, 'success');
      return created;
    },
    [pushToast]
  );

  const refreshPrediction = useCallback(
    (caseId) => {
      logAudit({ actor: 'Officer R. Deshmukh', action: 'PREDICTION_REFRESH', subject: caseId, detail: 'Cash-out model recomputed against latest simulated clock (deterministic weights).' });
      pushToast('Prediction recomputed against live simulated clock.', 'info');
    },
    [logAudit, pushToast]
  );

  const closeCase = useCallback(() => {
    setActiveCaseId(null);
    setViewRaw('dashboard');
  }, []);

  const selectCase = useCallback(
    (id) => {
      setActiveCaseId(id);
      const c = cases.find((x) => x.id === id);
      if (c) {
        setView('trail');
        logAudit({ actor: 'Officer R. Deshmukh', action: 'CASE_OPENED', subject: id, detail: `Working view switched to ${c.title}.` });
      }
    },
    [cases, setView, logAudit]
  );

  const caseAction = useCallback(
    (id, action, note, opts = {}) => {
      logCaseAction(id, 'Officer R. Deshmukh', action, note);
      logAudit({ actor: 'Officer R. Deshmukh', action, subject: id, detail: note });
      if (opts.status) {
        setCases((cs) => cs.map((c) => (c.id === id ? { ...c, status: opts.status } : c)));
      }
      pushToast(opts.toast || `${action} recorded on ${id}.`, opts.toastKind || 'success');
    },
    [logCaseAction, logAudit, pushToast]
  );

  const pushAlert = useCallback((alert) => {
    setAlerts((a) => [alert, ...a]);
    setAudit((chain) =>
      appendEntry(chain, {
        ts: Date.now(),
        actor: 'SYSTEM',
        action: 'ALERT_RAISED',
        subject: alert.caseId,
        detail: `Priority-${alert.priority} withdrawal-imminent signal for ${alert.station} — ${alert.potentialAmount.toLocaleString('en-IN')} INR at risk.`,
      })
    );
  }, []);

  const advanceAlert = useCallback(
    (alertId, stage, extra = {}) => {
      setAlerts((a) =>
        a.map((al) => {
          if (al.id !== alertId) return al;
          const nowAt = Date.now();
          const stages = al.stages.map((s) => (s.key === stage ? { ...s, at: nowAt, done: true } : s));
          return { ...al, stages, timeline: [...(al.timeline || []), { at: nowAt, label: extra.msg || stage }] };
        })
      );
      const al = alerts.find((x) => x.id === alertId);
      if (al) {
        logAudit({
          actor: extra.actor || 'SYSTEM',
          action: stage,
          subject: al.caseId,
          detail: extra.msg || (`Alert ${stage} for ${al.station}`),
        });
      }
    },
    [alerts, logAudit]
  );

  const preventAlert = useCallback(
    (alertId) => {
      const al = alerts.find((x) => x.id === alertId);
      if (!al) return;
      setAlerts((a) => a.map((x) => (x.id === alertId ? { ...x, prevented: true, resolvedAt: Date.now() } : x)));
      setPrevented((p) => [
        ...p,
        { caseId: al.caseId, amount: al.potentialAmount, at: Date.now(), station: al.station, branch: al.branch, outcome: 'Preemptive hold — no cash-out', source: 'prediction' },
      ]);
      setCases((cs) =>
        cs.map((c) => (c.id === al.caseId ? { ...c, status: 'Resolved', actionLog: [...(c.actionLog || []), { at: Date.now(), actor: 'Officer R. Deshmukh', action: 'CASH_OUT_PREVENTED', note: `₹${al.potentialAmount.toLocaleString('en-IN')} held before withdrawal at ${al.station}.` }] } : c))
      );
      logAudit({
        actor: 'Officer R. Deshmukh',
        action: 'CASH_OUT_PREVENTED',
        subject: al.caseId,
        detail: `Preemptive hold at ${al.branch} — ${al.potentialAmount.toLocaleString('en-IN')} INR protected. Prediction materialised into action.`,
      });
      pushToast(`Cash-out prevented — ₹${al.potentialAmount.toLocaleString('en-IN')} held at ${al.branch}.`, 'success');
    },
    [alerts, logAudit, pushToast]
  );

  const toggleTamper = useCallback(() => {
    if (tamperSeq) {
      setAudit((chain) => chain.map((e) => (e.seq === tamperSeq ? { ...e, detail: e._orig } : e)));
      setTamperSeq(null);
      pushToast('Tamper demo reverted — chain integrity restored.', 'info');
      return;
    }
    const target = Math.max(2, Math.floor(audit.length / 2));
    setAudit((chain) =>
      chain.map((e) =>
        e.seq === target
          ? { ...e, _orig: e.detail, detail: '⛔ INJECTED: withdrawal limit overridden to ₹10,00,000 WITHOUT verification' }
          : e
      )
    );
    setTamperSeq(target);
    pushToast('Simulated tamper injected into an audit entry.', 'warn');
  }, [audit, tamperSeq, pushToast]);

  const requestFreeze = useCallback(
    (caseId, mule, meta = {}) => {
      const ref = meta.ref || `FRZ-${Date.now().toString(36).toUpperCase()}`;
      const frozenMs = meta.frozenMs != null ? meta.frozenMs : 4200;
      setCases((cs) =>
        cs.map((c) =>
          c.id === caseId
            ? {
                ...c,
                actionLog: [
                  ...(c.actionLog || []),
                  { at: Date.now(), actor: 'Officer R. Deshmukh', action: 'FREEZE_REQUESTED', note: `Freeze request ${ref} sent for ${mule.id} (${mule.account}) @ ${mule.bankCode} — approved via bank/NPCI freeze API simulation.` },
                ],
                mules: c.mules.map((m) => (m.id === mule.id ? { ...m, frozen: true, frozenAt: Date.now(), frozenMs, freezeRef: ref } : m)),
              }
            : c
        )
      );
      setAudit((chain) =>
        appendEntry(chain, {
          ts: Date.now(),
          actor: 'Officer R. Deshmukh',
          action: 'ACCOUNT_FROZEN',
          subject: caseId,
          detail: `Mule ${mule.id} (${mule.account}, ${mule.bankCode}) frozen in ${(frozenMs / 1000).toFixed(1)}s via bank freeze API (ref ${ref}). ₹${(mule.balance || 0).toLocaleString('en-IN')} at risk protected.`,
        })
      );
      pushToast(`Freeze confirmed — ₹${(mule.balance || 0).toLocaleString('en-IN')} protected on ${mule.id}.`, 'success');
      return ref;
    },
    [logAudit, pushToast]
  );

  const recordFeedback = useCallback(
    (caseId, accurate) => {
      setFeedback((f) => {
        const rest = f.filter((x) => x.caseId !== caseId);
        return [...rest, { caseId, accurate, at: Date.now(), source: 'officer' }];
      });
      setAudit((chain) =>
        appendEntry(chain, {
          ts: Date.now(),
          actor: 'Officer R. Deshmukh',
          action: accurate ? 'PREDICTION_TRUE' : 'PREDICTION_FALSE',
          subject: caseId,
          detail: accurate
            ? 'Officer marked the predicted cash-out as accurate after review (verified on ground).'
            : 'Officer marked the predicted cash-out as a false alarm after review.',
        })
      );
      pushToast(accurate ? 'Feedback logged — prediction confirmed by review.' : 'Feedback logged — false alarm flagged.', accurate ? 'success' : 'info');
    },
    [pushToast]
  );

  const activeCase = cases.find((c) => c.id === activeCaseId) || null;

  const accuracy = useMemo(() => computeAccuracy(feedback), [feedback]);

  const metrics = useMemo(() => {
    const demoSaved = prevented.reduce((a, p) => a + p.amount, 0);
    const totalTracked = cases.length;
    const active = cases.filter((c) => c.status === 'Active' || c.status === 'Escalated');
    const atRisk = active.reduce((a, c) => a + (Number(c.atRisk) || 0), 0);
    return {
      totalTracked,
      activeCount: active.length,
      atRisk,
      amountSaved: demoSaved,
      preventedCount: prevented.length,
    };
  }, [cases, prevented]);

  const value = {
    theme, setTheme,
    view, setView,
    cases, activeCase, activeCaseId, setActiveCaseId: selectCase,
    simNow, loading,
    audit, tamperSeq,
    alerts, prevented, metrics,
    toasts,
    feedback, accuracy, recordFeedback,
    pushToast, loadDemo, submitIntake, closeCase, refreshPrediction,
    pushAlert, advanceAlert, preventAlert,
    requestFreeze,
    caseAction,
    logAudit,
    toggleTamper,
    drawerOpen, setDrawerOpen,
    intakeDraft, setIntakeDraft,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}