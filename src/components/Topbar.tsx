import { useEffect, useState } from 'react';
import Badge from './Badge';
import type { View } from './Sidebar';

const TITLES: Record<View, string> = {
  dashboard:   'System Dashboard',
  map:         'Prediction Map',
  evaluation:  'Model Evaluation',
  maintenance: 'Maintenance Planner',
  forecast:    'Network Forecast',
  budget:      'Budget Optimizer',
};

const SUBTITLES: Record<View, string> = {
  dashboard:   'Network health at a glance',
  map:         'Geospatial condition overlay',
  evaluation:  'Model performance diagnostics',
  maintenance: 'Priority-ranked repair schedule',
  forecast:    '5-year deterioration projection',
  budget:      'Strategic allocation optimizer',
};

interface Props {
  view: View;
  totalSegments: number;
}

export default function Topbar({ view, totalSegments }: Props) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: 60,
        background: '#ffffff',
        borderBottom: '1px solid #f0f0f0',
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 24px',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      {/* Live pulse */}
      <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
        <span
          style={{
            display: 'block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#22c55e',
          }}
        />
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: '#22c55e',
            opacity: 0.4,
            animation: 'topbar-pulse 2s ease-in-out infinite',
          }}
        />
        <style>{`
          @keyframes topbar-pulse {
            0%, 100% { transform: scale(1); opacity: 0.4; }
            50% { transform: scale(2.2); opacity: 0; }
          }
        `}</style>
      </div>

      {/* Title block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{TITLES[view]}</div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, fontWeight: 500 }}>
          {SUBTITLES[view]} · Bengaluru Metropolitan Network
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Badge variant="green">Live Model</Badge>
        <Badge variant="blue">{totalSegments} segments</Badge>

        {/* Time */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#f9fafb',
            border: '1px solid #f0f0f0',
            borderRadius: 10,
            padding: '5px 12px',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" style={{ width: 12, height: 12, flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          <span
            style={{
              fontSize: 12,
              fontFamily: 'DM Mono, monospace',
              color: '#6b7280',
              fontWeight: 500,
            }}
          >
            {time}
          </span>
        </div>
      </div>
    </header>
  );
}