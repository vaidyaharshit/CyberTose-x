import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { useApp } from '../../state/AppContext.jsx';

const KIND = {
  success: { icon: CheckCircle2, cls: 'text-goodx', ring: 'border-goodx/30' },
  info: { icon: Info, cls: 'text-cyanx', ring: 'border-cyanx/30' },
  warn: { icon: TriangleAlert, cls: 'text-warnx', ring: 'border-warnx/30' },
  error: { icon: TriangleAlert, cls: 'text-badx', ring: 'border-badx/30' },
};

export default function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const k = KIND[t.kind] || KIND.info;
          const Icon = k.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className={`glass pointer-events-auto flex items-start gap-3 rounded-xl border ${k.ring} px-4 py-3 shadow-card`}
            >
              <Icon size={18} className={`mt-0.5 shrink-0 ${k.cls}`} />
              <p className="text-sm leading-snug text-ink">{t.msg}</p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}