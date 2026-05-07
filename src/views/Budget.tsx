import { useEffect, useRef, useState, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import Panel from '../components/Panel';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';
import type { Segment, Strategy } from '../types';
import { optimizeBudget, CONDITION_COLORS, ROAD_TYPES, fmtCost } from '../engine';

Chart.register(...registerables);

const STRATEGIES: { id: Strategy; label: string }[] = [
  { id: 'worst_first', label: 'Worst First' },
  { id: 'cost_effective', label: 'Cost Effective' },
  { id: 'critical_only', label: 'Critical Only' },
  { id: 'length_weighted', label: 'Length Weighted' },
];

const COND_ORDER = ['Critical', 'Poor', 'Moderate', 'Fair', 'Good'] as const;

interface Props {
  segments: Segment[];
}

export default function Budget({ segments }: Props) {
  const [budget, setBudget] = useState(1500000);
  const [strategy, setStrategy] = useState<Strategy>('worst_first');
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<Chart | null>(null);

  const result = useMemo(() => optimizeBudget(segments, budget, strategy), [segments, budget, strategy]);

  useEffect(() => {
    if (!chartRef.current || result.selected.length === 0) return;
    if (chartInst.current) chartInst.current.destroy();

    const rtImprov: Record<string, number> = {};
    result.selected.forEach(s => {
      rtImprov[s.road_type] = (rtImprov[s.road_type] ?? 0) + (s.iri_predicted - 2.0);
    });
    const labels = ROAD_TYPES.filter(rt => rtImprov[rt]);
    const data = labels.map(rt => parseFloat(rtImprov[rt].toFixed(1)));

    chartInst.current = new Chart(chartRef.current.getContext('2d')!, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'IRI Improvement',
          data,
          backgroundColor: 'rgba(59,130,246,0.55)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#555e72', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#555e72', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        },
      },
    });
    return () => { chartInst.current?.destroy(); };
  }, [result]);

  return (
    <div className="p-5 space-y-4 fade-up">
      {/* Controls */}
      <Panel title="Budget Parameters">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] w-28 shrink-0" style={{ color: 'var(--text2)' }}>Budget (USD)</span>
          <input type="range" min={100000} max={5000000} step={50000} value={budget}
            onChange={e => setBudget(parseInt(e.target.value))} className="flex-1" />
          <span className="text-[12px] font-mono w-16 text-right" style={{ color: 'var(--accent)' }}>{fmtCost(budget)}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px]" style={{ color: 'var(--text3)' }}>Strategy:</span>
          {STRATEGIES.map(s => (
            <button key={s.id}
              onClick={() => setStrategy(s.id)}
              className="text-[11px] px-3 py-1 rounded font-medium transition-all"
              style={{
                background: strategy === s.id ? 'rgba(59,130,246,0.2)' : 'var(--bg3)',
                color: strategy === s.id ? 'var(--accent)' : 'var(--text3)',
                border: strategy === s.id ? '1px solid var(--accent)' : '1px solid var(--border)',
              }}>
              {s.label}{strategy === s.id ? ' ✓' : ''}
            </button>
          ))}
        </div>
      </Panel>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Roads Selected" value={result.selected.length} sub="to repair" valueColor="var(--accent2)" />
        <StatCard label="Cost Used" value={fmtCost(result.totalCost)} sub={`${result.utilized.toFixed(1)}% utilized`} />
        <StatCard label="IRI Improvement" value={result.totalImprov.toFixed(1)} sub="total reduction" valueColor="var(--accent)" />
        <StatCard label="Remaining" value={fmtCost(budget - result.totalCost)} sub="budget left" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Budget Allocation by Condition">
          <div className="space-y-3">
            {COND_ORDER.map(c => {
              const n = result.condCounts[c] ?? 0;
              if (!n) return null;
              const total = result.selected.length || 1;
              const pct = (n / total) * 100;
              const cost = result.selected.filter(s => s.condition_predicted === c).reduce((a, s) => a + s.repair_cost_usd, 0);
              return (
                <div key={c} className="flex items-center gap-2">
                  <span className="text-[11px] w-20 shrink-0" style={{ color: 'var(--text2)' }}>{c}</span>
                  <ProgressBar pct={pct} color={CONDITION_COLORS[c]} height={6} />
                  <span className="text-[11px] font-mono w-16 text-right shrink-0" style={{ color: 'var(--text2)' }}>{fmtCost(cost)}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="IRI Improvement by Road Type">
          <div className="relative h-60">
            <canvas ref={chartRef} />
          </div>
        </Panel>
      </div>
    </div>
  );
}
