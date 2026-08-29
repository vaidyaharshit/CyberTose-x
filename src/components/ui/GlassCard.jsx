import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', glow, soft, pad = 'p-4 sm:p-5', ...rest }) {
  return (
    <motion.div
      layout
      className={`glass rounded-xl ${pad} ${glow ? 'shadow-glow' : 'shadow-card'} ${soft ? 'glass-soft' : ''} ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}