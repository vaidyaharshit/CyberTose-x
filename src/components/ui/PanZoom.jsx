import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minus, Plus, Scan } from 'lucide-react';

// Generic pan + zoom wrapper. Click vs drag is disambiguated by movement threshold.
export default function PanZoom({ children, bounds = { w: 1000, h: 620 }, className = '', minScale = 0.35, maxScale = 3, controls = true }) {
  const ref = useRef(null);
  const [view, setView] = useState({ x: 0, y: 0, s: 1 });
  const drag = useRef({ active: false, engaged: false, moved: 0, px: 0, py: 0, sx: 0, sy: 0 });

  const fit = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const s = Math.max(minScale, Math.min(Math.min(r.width / bounds.w, r.height / bounds.h) * 0.94, 1.1));
    setView({
      s,
      x: (bounds.w * s - r.width) / 2,
      y: (bounds.h * s - r.height) / 2,
    });
  };

  useEffect(() => {
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds.w, bounds.h]);

  const onPointerDown = (e) => {
    drag.current = { active: true, engaged: false, moved: 0, px: e.clientX, py: e.clientY, sx: view.x, sy: view.y };
  };
  const onPointerMove = (e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    drag.current.moved = Math.max(drag.current.moved, Math.hypot(dx, dy));
    if (drag.current.moved > 5) {
      if (!drag.current.engaged) {
        drag.current.engaged = true;
        drag.current._pid = e.pointerId;
        ref.current.setPointerCapture(e.pointerId);
      }
      setView((v) => ({ ...v, x: drag.current.sx + dx, y: drag.current.sy + dy }));
    }
  };
  const onPointerUp = () => {
    if (drag.current.engaged) {
      try {
        ref.current.releasePointerCapture(drag.current._pid);
      } catch {
        /* already released */
      }
    }
    drag.current.active = false;
    drag.current.engaged = false;
  };
  const onPointerLeave = () => {
    onPointerUp();
  };
  const onPointerCancel = onPointerUp;

  const zoomAt = (factor, cx, cy) => {
    setView((v) => {
      const ns = Math.min(maxScale, Math.max(minScale, v.s * factor));
      const k = ns / v.s;
      return {
        s: ns,
        x: cx - (cx - v.x) * k,
        y: cy - (cy - v.y) * k,
      };
    });
  };
  const onWheel = (e) => {
    const r = ref.current.getBoundingClientRect();
    zoomAt(Math.exp(-e.deltaY * 0.0012), e.clientX - r.left, e.clientY - r.top);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        ref={ref}
        className="grid-paper relative h-full w-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerCancel}
        onWheel={onWheel}
        style={{ cursor: drag.current.active ? 'grabbing' : 'grab' }}
      >
        <div
          className="absolute left-0 top-0"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`, transformOrigin: '0 0' }}
        >
          {children}
        </div>
      </div>
      {controls && (
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          <button onClick={() => zoomAt(1.25, 0 + 24, 0 + 24)} className="glass grid h-8 w-8 place-items-center rounded-lg text-dim hover:text-cyanx" aria-label="Zoom in">
            <Plus size={15} />
          </button>
          <button onClick={() => zoomAt(0.8, 0 + 24, 0 + 24)} className="glass grid h-8 w-8 place-items-center rounded-lg text-dim hover:text-cyanx" aria-label="Zoom out">
            <Minus size={15} />
          </button>
          <button onClick={fit} className="glass grid h-8 w-8 place-items-center rounded-lg text-dim hover:text-cyanx" aria-label="Fit to view">
            <Scan size={15} />
          </button>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-2 left-3 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-faint">
        <Maximize2 size={11} className="hidden sm:block" /> drag to pan · wheel / pinch to zoom
      </div>
    </div>
  );
}