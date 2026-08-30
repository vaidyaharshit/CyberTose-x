import { Hexagon, Lock, ShieldAlert, X } from 'lucide-react';
import { useApp } from '../state/AppContext.jsx';
import { NAV } from './Shell.jsx';

export default function Sidebar({ mobile = false, onClose }) {
  const { view, setView, activeCase, metrics } = useApp();

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-edge px-5 py-4">
        <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 ring-1 ring-cyanx/40">
          <Hexagon size={22} className="text-cyanx" strokeWidth={1.6} />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-cyanx shadow-glow" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold tracking-wide text-ink">
            TraceGrid <span className="text-cyanx">AI</span>
          </div>
          <div className="truncate text-[10px] uppercase tracking-widest text-faint">MHA · SIH-26184</div>
        </div>
        {mobile && (
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-dim hover:text-ink" aria-label="Close menu">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="scroll-thin flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = view === item.key;
          const demoOnly = item.key !== 'dashboard' && item.key !== 'intake' && item.key !== 'reputation';
          return (
            <button
              key={item.key}
              onClick={() => {
                setView(item.key);
                if (mobile && onClose) onClose();
              }}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                active ? 'text-ink' : 'text-dim hover:text-ink'
              }`}
            >
              {active && (
                <span className="absolute inset-0 rounded-lg border border-cyanx/30 bg-cyanx/10" />
              )}
              <Icon size={17} className={`relative shrink-0 ${active ? 'text-cyanx' : 'text-faint group-hover:text-dim'}`} strokeWidth={1.8} />
              <span className="relative">{item.label}</span>
              {demoOnly && !activeCase && (
                <span className="relative ml-auto text-[9px] uppercase tracking-wider text-faint">locked</span>
              )}
              {item.key === 'alert' && activeCase && metrics.atRisk > 0 && (
                <span className="relative ml-auto flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-badx">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-badx" />
                  live
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-edge px-5 py-4">
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-edge bg-panel px-3 py-2.5">
          <ShieldAlert size={15} className="shrink-0 text-warnx" />
          <p className="text-[10px] leading-snug text-dim">
            Synthetic demo environment. All cases, accounts &amp; persons are fictional sample data.
          </p>
        </div>
        <div className="flex items-center justify-between text-[10px] text-faint">
          <span className="flex items-center gap-1.5">
            <Lock size={11} /> SHA-256 chained audit
          </span>
          <span>v1.0-demo</span>
        </div>
      </div>
    </div>
  );

  if (mobile) {
    return content;
  }
  return <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-edge lg:block">{content}</aside>;
}