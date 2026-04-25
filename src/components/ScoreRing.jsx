import { useEffect, useState } from 'react';
import AnimatedNumber from './AnimatedNumber';
import './ScoreRing.css';

export default function ScoreRing({ value = 0, label, size = 220, stroke = 12 }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setProgress(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, progress)) / 100) * circumference;

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff3d8a" />
            <stop offset="50%" stopColor="#c668d9" />
            <stop offset="100%" stopColor="#6b8df5" />
          </linearGradient>
          <filter id="scoreGlow">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
          filter="url(#scoreGlow)"
        />
      </svg>
      <div className="score-ring__inner">
        <span className="score-ring__value">
          <AnimatedNumber value={value} duration={1400} suffix="%" />
        </span>
        {label && <span className="score-ring__label">{label}</span>}
      </div>
    </div>
  );
}
