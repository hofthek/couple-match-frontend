import { useEffect, useState } from 'react';
import './RadarChart.css';

/**
 * Pure-SVG radar chart.
 * data: [{ label, value }] — value 0..100
 */
export default function RadarChart({ data = [], size = 280, levels = 4 }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!data.length) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const N = data.length;

  function point(i, value) {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    const r = (value / 100) * radius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  function labelPos(i) {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    const r = radius + 22;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle), angle];
  }

  const polygonPoints = data.map((d, i) => {
    const v = animated ? Math.max(0, Math.min(100, d.value || 0)) : 0;
    return point(i, v).join(',');
  }).join(' ');

  return (
    <div className="radar">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Radar des piliers">
        <defs>
          <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff3d8a" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#6b8df5" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* grille */}
        {Array.from({ length: levels }).map((_, l) => {
          const r = (radius * (l + 1)) / levels;
          const pts = Array.from({ length: N }).map((__, i) => {
            const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
          }).join(' ');
          return (
            <polygon
              key={l}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          );
        })}

        {/* axes */}
        {data.map((_, i) => {
          const [x, y] = point(i, 100);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}

        {/* polygone des valeurs */}
        <polygon
          points={polygonPoints}
          fill="url(#radarFill)"
          stroke="#ff3d8a"
          strokeWidth="1.5"
          style={{ transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />

        {/* points */}
        {data.map((d, i) => {
          const v = animated ? Math.max(0, Math.min(100, d.value || 0)) : 0;
          const [x, y] = point(i, v);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill="#fff"
              stroke="#ff3d8a"
              strokeWidth="2"
              style={{ transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          );
        })}

        {/* labels */}
        {data.map((d, i) => {
          const [x, y] = labelPos(i);
          let anchor = 'middle';
          if (x < cx - 5) anchor = 'end';
          else if (x > cx + 5) anchor = 'start';
          return (
            <g key={`label-${i}`}>
              <text
                x={x}
                y={y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="radar__label"
              >
                {d.label}
              </text>
              <text
                x={x}
                y={y + 14}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="radar__pct"
              >
                {Math.round(d.value)}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
