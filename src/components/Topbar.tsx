import { useEffect, useState } from 'react';
import Badge from './Badge';
import type { View } from './Sidebar';

const TITLES: Record<View, string> = {
  dashboard: 'System Dashboard',
  map: 'Prediction Map',
  evaluation: 'Model Evaluation',
  maintenance: 'Maintenance Planner',
  forecast: 'Network Forecast',
  budget: 'Budget Optimizer',
};

interface Props {
  view: View;
  totalSegments: number;
}

export default function Topbar({ view, totalSegments }: Props) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-3 px-5"
      style={{ height: 52, background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}
    >
      <span className="w-2 h-2 rounded-full shrink-0 animate-pulse-slow" style={{ background: 'var(--accent2)' }} />
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold leading-none mb-0.5">{TITLES[view]}</div>
        <div className="text-[11px]" style={{ color: 'var(--text3)' }}>Road Digital Twin · Bengaluru Metropolitan Network</div>
      </div>
      <Badge variant="green">Live Model</Badge>
      <Badge variant="blue">{totalSegments} segments</Badge>
      <span className="text-[11px] font-mono hidden sm:inline" style={{ color: 'var(--text3)' }}>{time}</span>
    </header>
  );
}
