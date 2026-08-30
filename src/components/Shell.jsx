import { AnimatePresence, motion } from 'framer-motion';
import { Database, Gauge, GitBranch, LayoutGrid, Map, Network, Radar, ShieldCheck, FileText } from 'lucide-react';
import { useApp } from '../state/AppContext.jsx';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import Toasts from './ui/Toasts.jsx';

import Dashboard from '../views/Dashboard.jsx';
import Intake from '../views/Intake.jsx';
import Trail from '../views/Trail.jsx';
import Heatmap from '../views/Heatmap.jsx';
import Risk from '../views/Risk.jsx';
import AlertSim from '../views/AlertSim.jsx';
import Audit from '../views/Audit.jsx';
import Reputation from '../views/Reputation.jsx';

export const NAV = [
  { key: 'dashboard', label: 'Command Dashboard', icon: LayoutGrid },
  { key: 'intake', label: 'Complaint Intake', icon: FileText },
  { key: 'trail', label: 'Money Trail Graph', icon: GitBranch },
  { key: 'heatmap', label: 'Cash-Out Heatmap', icon: Map },
  { key: 'risk', label: 'Risk Engine', icon: Gauge },
  { key: 'reputation', label: 'Reputation Network', icon: Network },
  { key: 'alert', label: 'Live Alert Stream', icon: Radar },
  { key: 'audit', label: 'Audit Chain', icon: ShieldCheck },
];

const VIEWS = { dashboard: Dashboard, intake: Intake, trail: Trail, heatmap: Heatmap, risk: Risk, reputation: Reputation, alert: AlertSim, audit: Audit };

export default function Shell() {
  const { view, drawerOpen, setDrawerOpen, loading } = useApp();
  const View = VIEWS[view] || Dashboard;

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="bg-grid absolute inset-0" />
        <div className="glow-blob -top-40 -left-40" style={{ background: 'radial-gradient(circle, #22d3ee, transparent 60%)' }} />
        <div className="glow-blob -right-40 top-1/3" style={{ background: 'radial-gradient(circle, #a78bfa, transparent 60%)', animationDelay: '-4s' }} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyanx/40 to-transparent" />
      </div>

      <div className="relative z-10 flex">
        <Sidebar />

        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
              />
              <motion.div
                className="fixed inset-y-0 left-0 z-50 w-[290px] max-w-[85vw] bg-void lg:hidden"
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              >
                <Sidebar mobile onClose={() => setDrawerOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1">
          <Topbar onMenu={() => setDrawerOpen(true)} />

          <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-5 sm:px-6">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              {loading ? <LoadingState /> : <View />}
            </motion.div>
          </main>
        </div>
      </div>

      <Toasts />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="scanline relative overflow-hidden rounded-2xl border border-edge bg-panel/40 p-8 sm:p-12">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="relative mx-auto h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-dashed border-cyanx/60" style={{ animationDuration: '2.5s' }} />
          <div className="absolute inset-2 grid place-items-center rounded-lg bg-cyanx/10 ring-1 ring-cyanx/40">
            <Database size={22} className="text-cyanx" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink">Mapping money trail…</h2>
          <p className="mt-1 text-sm text-dim">Triangulating suspect accounts, linking hops, warming predictive engine for TG-26184-0421.</p>
        </div>
        <div className="grid gap-2 text-left">
          {['Complaint intake & verification', 'UPI hops → mule accounts linked', 'Feeding risk engine & cash-out model'].map((s, i) => (
            <div key={s} className="flex items-center gap-2 text-xs text-dim">
              <span className="h-1.5 w-1.5 rounded-full bg-cyanx" style={{ animationDelay: `${i * 0.3}s` }} />
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}