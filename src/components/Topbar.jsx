import { Activity, Menu, Moon, Sun } from 'lucide-react';
import { useApp } from '../state/AppContext.jsx';
import { NAV } from './Shell.jsx';
import { shortTime } from '../lib/format.js';

export default function Topbar({ onMenu }) {
  const { view, setView, simNow, theme, setTheme, activeCase } = useApp();
  const item = NAV.find((n) => n.key === view) || NAV[0];

  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-void/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2.5 sm:px-6">
        <button
          onClick={onMenu}
          className="rounded-lg border border-edge p-2 text-dim hover:text-ink lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <item.icon size={15} className="text-cyanx" />
            <h1 className="truncate text-sm font-semibold text-ink sm:text-base">{item.label}</h1>
          </div>
          {activeCase && (
            <button
              onClick={() => setView('trail')}
              className="mt-0.5 hidden max-w-full items-center gap-1.5 truncate text-[10px] text-faint hover:text-cyanx sm:flex"
            >
              <Activity size={10} /> {activeCase.id} · {activeCase.title}
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-edge bg-panel px-3 py-1 font-mono text-[11px] text-dim sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyanx" />
            {shortTime(simNow)}
          </span>

          <span className="flex items-center gap-1.5 rounded-full border border-warnx/40 bg-warnx/10 px-3 py-1 text-[9px] font-semibold uppercase tracking-widest text-warnx">
            <span className="h-1.5 w-1.5 rounded-full bg-warnx" />
            Simulated data
          </span>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg border border-edge p-2 text-dim transition-colors hover:border-cyanx/50 hover:text-cyanx"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}