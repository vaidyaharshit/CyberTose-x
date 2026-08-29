import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, Copy, Fingerprint, Link2, Lock, RotateCcw, Search, ShieldAlert, Unlock } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard.jsx';
import { useApp } from '../state/AppContext.jsx';
import { verifyChain, blockLinks } from '../lib/hashchain.js';
import { fullDate, hashShort, timeAgo } from '../lib/format.js';

export default function Audit() {
  const { audit, tamperSeq, toggleTamper, pushToast } = useApp();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [check, setCheck] = useState(null);

  const verify = useMemo(() => verifyChain(audit), [audit]);
  const links = useMemo(() => blockLinks(audit), [audit]);
  const tampered = !!tamperSeq;

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return links;
    return links.filter(({ entry }) =>
      [entry.action, entry.actor, entry.subject, entry.detail].join(' ').toLowerCase().includes(term)
    );
  }, [links, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Lock size={18} className="text-cyanx" /> Blockchain-backed audit trail
          </h2>
          <p className="mt-0.5 text-xs text-dim">
            Each record carries <span className="font-mono text-[10px]">SHA-256(seq | ts | actor | action | subject | detail | prevHash)</span>, chained so any edit breaks every later block.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-primary"
            onClick={() => {
              setCheck({ at: Date.now() });
              pushToast(verify.ok ? `Integrity verified — ${verify.checked} blocks re-hashed clean.` : `Tamper detected at block #${verify.firstBrokenSeq}.`, verify.ok ? 'success' : 'error');
            }}
          >
            <Fingerprint size={15} /> Verify chain
          </button>
          <button className={`btn ${tampered ? 'btn-danger' : 'btn-ghost'}`} onClick={toggleTamper}>
            {tampered ? <Unlock size={15} /> : <ShieldAlert size={15} />}
            {tampered ? 'Restore chain' : 'Simulate tamper'}
          </button>
        </div>
      </div>

      <div className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${verify.ok ? 'border-goodx/30 bg-goodx/5' : 'border-badx/40 bg-badx/10'}`}>
        {verify.ok ? <CheckCircle2 size={17} className="text-goodx" /> : <ShieldAlert size={17} className="animate-pulse text-badx" />}
        <div className="text-sm font-semibold text-ink">
          {verify.ok ? `Chain intact — ${verify.checked} blocks verified` : `Chain integrity broken at block #${verify.firstBrokenSeq}`}
        </div>
        <span className="ml-auto font-mono text-[11px] text-faint">{audit.length} blocks · {audit.length - 1} records{check ? ` · last check ${timeAgo(check.at)}` : ''}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <GlassCard pad="p-0" className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-edge px-4 py-3">
            <Search size={14} className="shrink-0 text-faint" />
            <input className="w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-faint" placeholder="Filter by action, actor, case…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="scroll-thin max-h-[680px] overflow-y-auto">
            {rows.map(({ entry, prev, linksPrev, selfValid }) => {
              const sel = entry.seq === open;
              const broken = !linksPrev || !selfValid || (tampered && entry.seq >= tamperSeq);
              return (
                <div key={entry.seq} className={`border-b border-edge-soft last:border-0 ${broken ? 'bg-badx/[0.04]' : ''}`}>
                  <button onClick={() => setOpen(sel ? null : entry.seq)} className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-raise/50">
                    <div className="flex flex-col items-center pt-1">
                      <span className={`font-mono text-[10px] ${broken ? 'text-badx' : 'text-cyanx'}`}>#{entry.seq}</span>
                      <ChevronDown size={12} className={`mt-0.5 text-faint transition-transform ${sel ? 'rotate-180' : ''}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className={`text-xs font-bold ${broken ? 'text-badx' : 'text-ink'}`}>{entry.action}</span>
                        <span className="text-[10px] text-faint">{entry.actor}</span>
                        {entry.subject && <span className="rounded bg-panel px-1 py-0.5 font-mono text-[9px] text-dim ring-1 ring-edge">{entry.subject}</span>}
                      </div>
                      <p className="mt-0.5 break-words text-[11px] leading-snug text-dim">{entry.detail}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[9px] text-faint">
                        <span>{timeAgo(entry.ts)}</span>
                        <span className="flex items-center gap-0.5"><Link2 size={9} /> prev {hashShort(entry.prevHash)}</span>
                        <span>hash {hashShort(entry.hash)}</span>
                      </div>
                    </div>
                    <span className={`mt-1 shrink-0 chip ${broken ? 'border-badx/50 bg-badx/10 text-badx' : 'border-edge text-faint'}`}>
                      {broken ? '⚠ broken' : 'linked'}
                    </span>
                  </button>
                  {sel && <EntryDetail entry={entry} prev={prev} linksPrev={linksPrev} selfValid={selfValid} />}
                </div>
              );
            })}
            {rows.length === 0 && <div className="p-8 text-center text-sm text-faint">No records match “{q}”.</div>}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard pad="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <Lock size={15} className="text-cyanx" /> How the linking works
            </h3>
            <div className="rounded-lg border border-edge bg-raise/40 p-3 font-mono text-[10px] leading-relaxed text-dim">
              <span className="text-faint">hash</span> = SHA-256(seq | ts | actor | action<br />
              <span className="pl-4">| subject | detail | <span className="text-cyanx">prevHash</span>)</span>
              <div className="mt-2 flex items-center gap-1.5 text-cyanx">
                <Link2 size={11} /> block[n].hash == block[n+1].prevHash
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-dim">
              Editing any single field invalidates that block’s own hash and — because the next block stores it as <span className="font-mono text-cyanx">prevHash</span> — every later block too. Tampering becomes visible at a glance.
            </p>
          </GlassCard>

          <GlassCard pad="p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <ShieldAlert size={15} className={tampered ? 'text-badx' : 'text-warnx'} />
              {tampered ? 'Tamper demo active' : 'Try the tamper demo'}
            </h3>
            <p className="text-[11px] leading-relaxed text-dim">
              {tampered
                ? `A forged record was written into block #${tamperSeq}. Press “Verify chain” — the integrity check will fail at that block and everywhere downstream.`
                : 'Click “Simulate tamper” to forge an audit record, then “Verify chain” to watch the hash chain catch it. This demonstrates immutability without a real blockchain network.'}
            </p>
            {tampered && (
              <button className="btn btn-ghost mt-3 w-full" onClick={toggleTamper}>
                <RotateCcw size={14} /> Restore original record
              </button>
            )}
          </GlassCard>

          <div className="rounded-lg border border-warnx/25 bg-warnx/5 p-3 text-[10px] leading-relaxed text-dim">
            Demo environment: all records above are synthetic session events that prove the audit mechanism — not real case history.
          </div>
        </div>
      </div>
    </div>
  );
}

function EntryDetail({ entry, prev, linksPrev, selfValid }) {
  const broken = !linksPrev || !selfValid;
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
      <div className={`mx-4 mb-3 rounded-lg border ${broken ? 'border-badx/40 bg-badx/5' : 'border-edge bg-raise/50'} p-3`}>
        <div className="space-y-1.5 text-[10px]">
          <Row l="Record time" v={fullDate(entry.ts)} />
          <Row l="Block seq" v={String(entry.seq)} mono />
          <Row l="Actor" v={entry.actor} />
          <Row l="Subject" v={entry.subject || '—'} />
          <Row l="Action" v={entry.action} />
          <Row l="Detail" v={entry.detail} />
          <Row l="prevHash" v={entry.prevHash} mono />
          <Row l="hash (SHA-256)" v={entry.hash} mono />
        </div>
        <div className="mt-2 flex items-center gap-2 border-t border-edge pt-2 font-mono text-[10px]">
          <span className={`chip ${linksPrev ? 'border-goodx/40 bg-goodx/10 text-goodx' : 'border-badx/40 bg-badx/10 text-badx'}`}>
            {linksPrev ? 'links to prev ✓' : 'prev link broken'}
          </span>
          <span className={`chip ${selfValid ? 'border-goodx/40 bg-goodx/10 text-goodx' : 'border-badx/40 bg-badx/10 text-badx'}`}>
            {selfValid ? 'own hash valid ✓' : 'own hash broken'}
          </span>
          <button onClick={() => navigator.clipboard && navigator.clipboard.writeText(entry.hash).catch(() => {})} className="ml-auto flex items-center gap-1 text-faint hover:text-cyanx">
            <Copy size={11} /> copy
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Row({ l, v, mono }) {
  return (
    <div className="flex gap-2 font-mono">
      <span className="w-24 shrink-0 uppercase tracking-wider text-faint">{l}</span>
      <span className="min-w-0 break-all text-ink">{v}</span>
    </div>
  );
}