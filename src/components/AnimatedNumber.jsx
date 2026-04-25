import { useEffect, useState, useRef } from 'react';

export default function AnimatedNumber({ value = 0, duration = 1400, suffix = '', className }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    cancelAnimationFrame(frameRef.current);
    startRef.current = null;
    const target = Number(value) || 0;
    const start = display;
    const delta = target - start;
    if (delta === 0) return;

    function tick(ts) {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(start + delta * eased));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span className={className}>{display}{suffix}</span>;
}
