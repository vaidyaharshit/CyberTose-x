import { motion } from 'framer-motion';

export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-lg bg-current opacity-10 ${className}`} />
  );
}

export default function SkeletonBlock({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-lg bg-ink/10 dark:bg-slate-200/10"
          style={{ height: i === 0 ? 22 : i === lines - 1 ? 14 : 16, width: `${100 - i * 9}%` }}
        />
      ))}
      <Skeleton className="h-28 w-full bg-ink/5 dark:bg-slate-200/5" />
    </div>
  );
}