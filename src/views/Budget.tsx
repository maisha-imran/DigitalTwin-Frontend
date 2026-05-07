import { useEffect, useRef, useState, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import type { Segment, Strategy } from '../types';
import { optimizeBudget, CONDITION_COLORS, ROAD_TYPES, fmtCost } from '../engine';

Chart.register(...registerables);

const STRATEGIES: { id: Strategy; label: string; icon: string }[] = [
  { id: 'worst_first', label: 'Worst First', icon: '🔴' },
  { id: 'cost_effective', label: 'Cost Effective', icon: '💡' },
  { id: 'critical_only', label: 'Critical Only', icon: '⚡' },
  { id: 'length_weighted', label: 'Length Weighted', icon: '📏' },
];

const COND_ORDER = ['Critical', 'Poor', 'Moderate', 'Fair', 'Good'] as const;

interface Props { segments: Segment[]; }

const StatPill = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) => (
  <div style={{ background: '#fff', borderRadius: 18, padding: '18px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || '#111827', fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>{sub}</div>}
  </div>
);

export default function Budget({ segments }: Props) {
  const [budget, setBudget] = useState(1500000);
  const [strategy, setStrategy] = useState<Strategy>('worst_first');
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<Chart | null>(null);

  const result = useMemo(() => optimizeBudget(segments, budget, strategy), [segments, budget, strategy]);

  const budgetPct = ((budget - 100000) / (5000000 - 100000)) * 100;

  useEffect(() => {
    if (!chartRef.current || result.selected.length === 0) return;
    if (chartInst.current) chartInst.current.destroy();

    const rtImprov: Record<string, number> = {};
    result.selected.forEach(s => { rtImprov[s.road_type] = (rtImprov[s.road_type] ?? 0) + (s.iri_predicted - 2.0); });
    const labels = ROAD_TYPES.filter(rt => rtImprov[rt]);
    const data = labels.map(rt => parseFloat(rtImprov[rt].toFixed(1)));

    chartInst.current = new Chart(chartRef.current.getContext('2d')!, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'IRI Improvement',
          data,
          backgroundColor: labels.map((_, i) => `hsla(${220 + i * 20},80%,65%,0.85)`),
          borderRadius: 8,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#9ca3af', font: { size: 10, family: 'DM Sans' } }, grid: { display: false }, border: { display: false } },
          y: { ticks: { color: '#d1d5db', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.04)' }, border: { display: false } },
        },
      },
    });
    return () => { chartInst.current?.destroy(); };
  }, [result]);

  const utilizationPct = result.utilized;

  return (
    <div style={{ padding: '28px 32px', background: '#f8f9fb', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Budget Optimizer</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>Allocate repair budget across road segments strategically</p>
      </div>

      {/* Budget Control Card */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 20px' }}>Budget Parameters</h3>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Budget Allocation</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#6366f1', fontFamily: 'DM Mono, monospace' }}>{fmtCost(budget)}</span>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ height: 8, background: '#f3f4f6', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${budgetPct}%`, background: 'linear-gradient(90deg,#6366f1,#818cf8)', borderRadius: 8, transition: 'width 0.2s ease' }} />
            </div>
            <input type="range" min={100000} max={5000000} step={50000} value={budget}
              onChange={e => setBudget(parseInt(e.target.value))}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: '#d1d5db' }}>$100K</span>
            <span style={{ fontSize: 11, color: '#d1d5db' }}>$5M</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12, fontWeight: 500 }}>Optimization Strategy</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {STRATEGIES.map(s => (
              <button key={s.id} onClick={() => setStrategy(s.id)}
                style={{
                  padding: '10px 18px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                  border: strategy === s.id ? '2px solid #6366f1' : '2px solid #f3f4f6',
                  background: strategy === s.id ? 'rgba(99,102,241,0.08)' : '#fafafa',
                  color: strategy === s.id ? '#6366f1' : '#6b7280',
                  cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                <span>{s.icon}</span>{s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
        <StatPill label="Roads Selected" value={result.selected.length} sub="segments to repair" color="#6366f1" />
        <StatPill label="Cost Used" value={fmtCost(result.totalCost)} sub={`${result.utilized.toFixed(1)}% utilized`} />
        <StatPill label="IRI Improvement" value={result.totalImprov.toFixed(1)} sub="total reduction" color="#22c55e" />
        <StatPill label="Remaining Budget" value={fmtCost(budget - result.totalCost)} sub="unallocated" />
      </div>

      {/* Utilization bar */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Budget Utilization</span>
          <span style={{ fontSize: 13, fontFamily: 'DM Mono, monospace', color: utilizationPct > 90 ? '#22c55e' : '#f97316', fontWeight: 600 }}>{utilizationPct.toFixed(1)}%</span>
        </div>
        <div style={{ height: 10, background: '#f3f4f6', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${utilizationPct}%`,
            background: utilizationPct > 90 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#f97316,#ea580c)',
            borderRadius: 10, transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Condition Breakdown */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 20px' }}>Allocation by Condition</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {COND_ORDER.map(c => {
              const n = result.condCounts[c] ?? 0;
              if (!n) return null;
              const total = result.selected.length || 1;
              const pct = (n / total) * 100;
              const cost = result.selected.filter(s => s.condition_predicted === c).reduce((a, s) => a + s.repair_cost_usd, 0);
              const col = CONDITION_COLORS[c];
              return (
                <div key={c}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: col, display: 'inline-block' }} />
                      <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{c}</span>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{n} roads</span>
                    </div>
                    <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: '#6b7280' }}>{fmtCost(cost)}</span>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 6, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 20px' }}>IRI Improvement by Road Type</h3>
          <div style={{ position: 'relative', height: 240 }}>
            <canvas ref={chartRef} />
          </div>
        </div>
      </div>
    </div>
  );
}