import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpDown, ArrowUpRight, FlaskConical, Network, Search, Share2 } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard.jsx';
import ReputationBadge from '../components/ui/ReputationBadge.jsx';
import { buildCorpus, computeReputation } from '../lib/reputation.js';
import { inrCompact, inrFull, shortDate, timeAgo } from '../lib/format.js';
import { useApp } from '../state/AppContext.jsx';

const TIER_DOT = {
  CLEAN: '#34d399',
  WATCH: '#22d3ee',
  FLAGGED: '#fbbf24',
  CONFIRMED: '#fb7185',
};

export default function Reputation() {
  const { simNow } = useApp();
  const accounts = useMemo(() => buildCorpus(Date.now()).map(computeReputation).sort((a, b) => b.score - a.score), []);
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState('score');
  const [dir, setDir] = useState('desc');
  const [open, setOpen] = useState(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = term
      ? accounts.filter((a) => [a.holder, a.ifsc, a.bankCode, a.accountMask, ...a.appearances.map((x) => x.caseId)].join(' ').toLowerCase().includes(term))
      : accounts;
    const mult = dir === 'desc' ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const av = sortKey === 'cases' ? a.cases : sortKey === 'flow' ? a.totalFlow : a.score;
      const bv = sortKey === 'cases' ? b.cases : sortKey === 'flow' ? b.totalFlow : b.score;
      return (av - bv) * mult;
    });
  }, [accounts, q, sortKey, dir]);

  const flagged = accounts.filter((a) => a.tier === 'FLAGGED' || a.tier === 'CONFIRMED').length;

  const toggleSort = (key) => {
    if (sortKey === key) setDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortKey(key);
      setDir('desc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Network size={18} className="text-cyanx" /> Mule reputation network
          </h2>
          <p className="mt-0.5 text-xs text-dim">
            Same account/IFSC combinations that recur across sample complaints — a pattern map, not a named-person list.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px]">
          <span className="chip border-edge text-faint">{accounts.length} known accounts</span>
          <span className="chip border-warnx/40 bg-warnx/10 text-warnx">{flagged} flagged / confirmed by pattern</span>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-warnx/30 bg-warnx/5 p-3.5 text-xs leading-relaxed text-dim">
        <FlaskConical size={14} className="mt-0.5 shrink-0 text-warnx" />
        <p>
          <strong className="text-warnx">Pattern-based flag — requires investigative verification.</strong> Scores are derived from
          overlapping sample records only. This is not verified law-enforcement intelligence, and a reputation score alone is never
          grounds for action against an account holder.
        </p>
      </div>

      {/* Search + sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-edge bg-panel px-3 py-2 sm:w-72">
          <Search size={14} className="shrink-0 text-faint" />
          <input
            className="w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-faint"
            placeholder="Search account, IFSC, holder, case…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {[
            { key: 'score', label: 'Reputation score' },
            { key: 'cases', label: 'Linked cases' },
            { key: 'flow', label: 'Total flow' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => toggleSort(s.key)}
              className={`chip border transition-colors ${sortKey === s.key ? 'border-cyanx/40 bg-cyanx/10 text-cyanx' : 'border-edge text-faint hover:text-dim'}`}
            >
              {s.label}{' '}
              {sortKey === s.key ? (dir === 'desc' ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />) : <ArrowUpDown size={10} />}
            </button>
          ))}
        </div>
      </div>

      {/* Account table */}
      <GlassCard pad="p-0" className="overflow-hidden">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-edge text-[10px] uppercase tracking-widest text-faint">
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">IFSC</th>
                <th className="px-4 py-3 font-medium">Reputation</th>
                <th className="px-4 py-3 font-medium">Linked cases</th>
                <th className="px-4 py-3 font-medium">Lifetime flow</th>
                <th className="px-4 py-3 font-medium">Avg cash-out</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.ifsc} className="border-b border-edge-soft last:border-0 hover:bg-raise/50">
                  <td className="px-4 py-3">
                    <div className="text-xs font-semibold text-ink">{a.holder}</div>
                    <div className="font-mono text-[10px] text-faint">{a.bankCode} · {a.accountMask}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-dim">{a.ifsc}</td>
                  <td className="px-4 py-3"><ReputationBadge tier={a.tier} score={a.score} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-ink">{a.cases}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink">{inrCompact(a.totalFlow)}</td>
                  <td className="px-4 py-3 text-xs text-dim">{a.avgSpeedMin != null ? `${Math.round(a.avgSpeedMin)} min` : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setOpen(open === a.ifsc ? null : a.ifsc)} className="chip border-cyanx/40 bg-cyanx/10 text-cyanx hover:bg-cyanx/20">
                      <Share2 size={10} /> {open === a.ifsc ? 'Hide graph' : 'View Network Graph'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="space-y-2 p-3 md:hidden">
          {rows.map((a) => (
            <div key={a.ifsc} className="glass rounded-xl p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-ink">{a.holder}</div>
                  <div className="truncate font-mono text-[10px] text-faint">{a.bankCode} · {a.accountMask} · {a.ifsc}</div>
                </div>
                <ReputationBadge tier={a.tier} score={a.score} compact />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-dim">
                <span className="rounded bg-panel px-1.5 py-0.5 ring-1 ring-edge">{a.cases} linked case{a.cases === 1 ? '' : 's'}</span>
                <span className="rounded bg-panel px-1.5 py-0.5 ring-1 ring-edge">{inrCompact(a.totalFlow)} flow</span>
                <span className="rounded bg-panel px-1.5 py-0.5 ring-1 ring-edge">
                  {a.avgSpeedMin != null ? `${Math.round(a.avgSpeedMin)} min avg cash-out` : 'no cash-out seen'}
                </span>
              </div>
              <button onClick={() => setOpen(open === a.ifsc ? null : a.ifsc)} className="mt-2 w-full rounded-lg border border-cyanx/40 bg-cyanx/10 px-3 py-1.5 text-[11px] font-semibold text-cyanx">
                <Share2 size={11} className="mr-1 inline" /> {open === a.ifsc ? 'Hide Network Graph' : 'View Network Graph'}
              </button>
            </div>
          ))}
          {rows.length === 0 && <div className="p-6 text-center text-sm text-faint">No accounts match “{q}”.</div>}
        </div>
      </GlassCard>

      {/* Network graph */}
      <AnimatePresence mode="wait">
        {open && <GraphPanel key="graph" ifsc={open} onClose={() => setOpen(null)} simNow={simNow} />}
      </AnimatePresence>
    </div>
  );
}

function GraphPanel({ ifsc, onClose, simNow }) {
  const acct = computeReputation(buildCorpus(Date.now()).find((a) => a.ifsc === ifsc) || { ifsc, holder: 'Unknown', bankCode: ifsc.slice(0, 3), accountMask: '••••••••', appearances: [] });
  const n = acct.appearances.length;
  const cx = 280;
  const cy = 120;
  const R = 92;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard pad="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Share2 size={15} className="text-cyanx" /> Network graph · {acct.holder} · {acct.ifsc}
          </h3>
          <ReputationBadge tier={acct.tier} score={acct.score} />
        </div>
        <p className="mt-0.5 text-[11px] text-dim">
          This account has appeared in <strong className="text-ink">{n} prior case{n === 1 ? '' : 's'}</strong> within the sample corpus
          ({shortDate(acct.appearances[0]?.at)} → {shortDate(acct.appearances[n - 1]?.at)}).
        </p>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <svg viewBox="0 0 560 260" className="mt-2 w-full" style={{ minHeight: 240 }}>
            <defs>
              <filter id="repglow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="10" />
              </filter>
            </defs>
            {acct.appearances.map((app, i) => {
              const ang = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
              const px = cx + Math.cos(ang) * R;
              const py = cy + Math.sin(ang) * R;
              return (
                <g key={app.caseId}>
                  <line x1={cx} y1={cy} x2={px} y2={py} stroke="var(--color-cyanx)" strokeOpacity={0.35} strokeWidth={1.2} />
                  <circle cx={(cx + px) / 2} cy={(cy + py) / 2} r={3} fill="var(--color-cyanx)" opacity={0.85} />
                  <circle cx={px} cy={py} r={17} fill="var(--color-panel)" stroke="#22d3ee" strokeWidth={1.5} />
                  <text x={px} y={py + 4} textAnchor="middle" fontSize={9} fill="var(--color-cyanx)" fontFamily="monospace">
                    {app.caseId.slice(-4)}
                  </text>
                </g>
              );
            })}
            <circle cx={cx} cy={cy} r={30} fill="var(--color-void)" stroke={TIER_DOT[acct.tier]} strokeWidth={2} filter="url(#repglow)" opacity={0.9} />
            <circle cx={cx} cy={cy} r={30} fill="var(--color-panel)" stroke={TIER_DOT[acct.tier]} strokeWidth={1.5} />
            <text x={cx} y={cy - 2} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--color-text)">
              {acct.holder.split(' ').map((w) => w[0]).join('')}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize={8} fill="var(--color-faint)" fontFamily="monospace">
              {acct.tier.toLowerCase()}
            </text>
          </svg>

          <div className="mt-2 min-w-0">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-faint">Prior appearances</div>
            <ul className="space-y-2">
              {acct.appearances.map((app) => (
                <li key={app.caseId} className="rounded-lg border border-edge bg-raise/50 p-2.5 text-[11px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-cyanx">{app.caseId}</span>
                    <span className="text-faint">· {shortDate(app.at)}</span>
                    <span className="ml-auto font-mono text-ink">{inrCompact(app.amount)}</span>
                  </div>
                  <div className="mt-0.5 text-dim">Victim: {app.victim} · cash-out ~{app.speedMin} min</div>
                  <div className={`mt-0.5 ${app.outcome.includes('no loss') ? 'text-goodx' : 'text-warnx'}`}>{app.outcome}</div>
                </li>
              ))}
              {acct.appearances.length === 0 && <li className="text-xs text-dim">No linked sample complaints on file yet.</li>}
            </ul>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] leading-relaxed text-dim">
            Edges = the exact account/IFSC combination intercepted in each sample complaint. Graph is a pattern visualisation over synthetic data — verify each linkage before any investigative step.
          </p>
          <button onClick={onClose} className="btn btn-ghost px-3 py-1.5 text-xs">Close graph</button>
        </div>
      </GlassCard>
    </motion.div>
  );
}