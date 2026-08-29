import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, animate } from 'framer-motion';

// Animated number that counts up when it scrolls into view.
export default function Counter({ value, format = (v) => v.toLocaleString('en-IN'), className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) {
      const controls = animate(mv, value, {
        duration: 1.1,
        ease: 'easeOut',
        onUpdate: (v) => setDisplay(Math.round(v)),
      });
      return controls.stop;
    }
  }, [inView, value, mv]);

  useEffect(() => {
    if (!inView) setDisplay(0);
  }, [inView, value]);

  return (
    <span ref={ref} className={`metric-num ${className}`}>
      {format(display)}
    </span>
  );
}