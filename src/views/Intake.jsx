import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CheckCircle2, FileText, Landmark, Plus, Sparkles, Trash2, User, Watch, X } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard.jsx';
import { useApp } from '../state/AppContext.jsx';
import { inrCompact } from '../lib/format.js';

const EMPTY_MULE = { holder: '', bankCode: '', account: '', ifsc: '', openedDays: '' };

export default function Intake() {
  const { submitIntake, loadDemo, pushToast } = useApp();
  const [form, setForm] = useState({
    victimName: '',
    victimAge: '',
    city: 'Ranagiri',
    phone: '',
    type: 'UPI fraud',
    mode: 'UPI',
    amount: '',
    incidentAt: '',
    narrative: '',
  });
  const [mules, setMules] = useState([{ ...EMPTY_MULE }]);
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setMule = (i, k) => (e) => setMules((ms) => ms.map((m, j) => (j === i ? { ...m, [k]: e.target.value } : m)));
  const addMule = () => setMules((ms) => [...ms, { ...EMPTY_MULE }]);
  const removeMule = (i) => setMules((ms) => ms.filter((_, j) => j !== i));

  const preview = useMemo(() => {
    const amt = Math.max(0, Number(form.amount) || 0);
    const hops = mules.filter((m) => m.holder || m.account).length;
    const spread = hops > 0 ? Math.round(amt * (1 - Math.min(0.6, hops * 0.22))) : 0;
    return { amount: amt, hops: Math.max(1, hops), entryHold: amt - spread };
  }, [form.amount, mules]);

  const valid =
    form.victimName.trim().length > 1 &&
    preview.amount >= 1000 &&
    (form.incidentAt || true) &&
    mules.filter((m) => m.holder || m.account).length >= 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (preview.amount < 1000) {
      pushToast('Claimed amount must be at least ₹1,000.', 'warn');
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    const ts = form.incidentAt ? new Date(form.incidentAt).getTime() : Date.now();
    submitIntake({
      victimName: form.victimName.trim(),
      victimAge: form.victimAge || 0,
      city: form.city,
      phone: form.phone || '',
      type: form.type,
      mode: form.mode,
      amount: String(preview.amount),
      narrative: form.narrative.trim() || undefined,
      incidentAt: ts,
      muleAccounts: mules.map((m) => ({
        holder: m.holder.trim() || undefined,
        bankCode: m.bankCode.trim() || undefined,
        account: m.account.trim() || undefined,
        ifsc: m.ifsc.trim() || undefined,
        openedDays: m.openedDays || undefined,
      })),
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <GlassCard pad="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <FileText size={18} className="text-cyanx" /> Log a complaint
            </h2>
            <p className="mt-1 text-xs text-dim">
              Officer intake form. All entries are treated as sample/synthetic data — no real PII is ever captured.
            </p>
          </div>
          <button className="btn btn-violet" onClick={loadDemo}>
            <Sparkles size={15} /> Load demo case instead
          </button>
        </div>
      </GlassCard>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Victim */}
        <GlassCard pad="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
            <User size={15} className="text-cyanx" /> Complainant details
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-faint">Full name *</label>
              <input className="field" placeholder="e.g. Priya Menon" value={form.victimName} onChange={set('victimName')} />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-faint">Age</label>
              <input type="number" min="10" max="99" className="field" placeholder="34" value={form.victimAge} onChange={set('victimAge')} />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-faint">City / district</label>
              <input className="field" placeholder="Ranagiri" value={form.city} onChange={set('city')} />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-faint">Phone (masked ok)</label>
              <input className="field" placeholder="••••••1234" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
        </GlassCard>

        {/* Incident */}
        <GlassCard pad="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
            <Watch size={15} className="text-cyanx" /> Incident
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-faint">Fraud type</label>
              <select className="field" value={form.type} onChange={set('type')}>
                {['UPI fraud', 'Refund / reversal scam', 'KYC update fraud', 'SIM-swap banking fraud', 'Investment/loan fraud', 'Other fraud'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-faint">Payment mode</label>
              <select className="field" value={form.mode} onChange={set('mode')}>
                {['UPI', 'Netbanking', 'IMPS', 'NEFT', 'Card', 'Other'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-faint">Claimed amount (INR) *</label>
              <input type="number" min="1000" className="field" placeholder="480000" value={form.amount} onChange={set('amount')} />
            </div>
            <div>
              <label className="mb-1.5 block gap-1 text-[11px] uppercase tracking-wider text-faint">
                <Calendar size={10} className="mr-1 inline" /> Incident time
              </label>
              <input type="datetime-local" className="field" value={form.incidentAt} onChange={set('incidentAt')} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-faint">Narrative</label>
              <textarea className="field min-h-[84px] resize-y" placeholder="Victim received a call… amount moved via UPI…" value={form.narrative} onChange={set('narrative')} />
            </div>
          </div>
        </GlassCard>

        {/* Mules */}
        <GlassCard pad="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Landmark size={15} className="text-cyanx" /> Suspected receiving accounts
            </h3>
            <button type="button" onClick={addMule} className="btn btn-ghost px-3 py-1.5 text-xs">
              <Plus size={13} /> Add hop
            </button>
          </div>
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {mules.map((m, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="rounded-xl border border-edge bg-raise/40 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-faint">
                      Hop {i + 1} {i === 0 ? '· suspected entry account' : ''}
                    </span>
                    {mules.length > 1 && (
                      <button type="button" onClick={() => removeMule(i)} className="rounded p-1 text-faint hover:text-badx">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className="field" placeholder="Holder name (fictional)" value={m.holder} onChange={setMule(i, 'holder')} />
                    <input className="field" placeholder="Bank code e.g. VNB / MCB" value={m.bankCode} onChange={setMule(i, 'bankCode')} />
                    <input className="field font-mono" placeholder="Account no." value={m.account} onChange={setMule(i, 'account')} />
                    <input className="field font-mono" placeholder="IFSC" value={m.ifsc} onChange={setMule(i, 'ifsc')} />
                    <input type="number" className="field" placeholder="Opened (days ago)" value={m.openedDays} onChange={setMule(i, 'openedDays')} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-faint">
            Officer-declared accounts are unverified — the engine will flag them with “requires verification” and give them
            limited geo-confidence until a transaction is confirmed.
          </p>
        </GlassCard>

        {/* Live preview */}
        {preview.amount > 0 && (
          <GlassCard pad="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <CheckCircle2 size={15} className="text-goodx" /> Engine preview
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-raise/60 p-3 ring-1 ring-edge">
                <div className="text-[10px] uppercase tracking-wider text-faint">Claimed</div>
                <div className="mt-1 text-sm font-bold text-ink">{inrCompact(preview.amount)}</div>
              </div>
              <div className="rounded-lg bg-raise/60 p-3 ring-1 ring-edge">
                <div className="text-[10px] uppercase tracking-wider text-faint">Chain depth</div>
                <div className="mt-1 text-sm font-bold text-cyanx">{preview.hops} hop{preview.hops > 1 ? 's' : ''}</div>
              </div>
              <div className="rounded-lg bg-raise/60 p-3 ring-1 ring-edge">
                <div className="text-[10px] uppercase tracking-wider text-faint">Entry hold est.</div>
                <div className="mt-1 text-sm font-bold text-warnx">{inrCompact(preview.entryHold)}</div>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-faint">
              Preview computed from claimed amount split across accepted hops — re-runs through the same predictive pipeline as intake.
            </p>
          </GlassCard>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn btn-ghost order-2 sm:order-none"
            onClick={() => setForm({ victimName: '', victimAge: '', city: 'Ranagiri', phone: '', type: 'UPI fraud', mode: 'UPI', amount: '', incidentAt: '', narrative: '' })}
          >
            <Trash2 size={15} /> Clear
          </button>
          <button type="submit" disabled={submitting || !valid} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/20 border-t-slate-900" /> Opening case…</>
            ) : (
              <><FileText size={15} /> Open case &amp; map trail</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}