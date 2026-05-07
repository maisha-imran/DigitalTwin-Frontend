import { useEffect, useRef, useState, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import Panel from '../components/Panel';
import type { Segment, ForecastYear, ForecastMetric } from '../types';
import { computeForecast, fmtCost } from '../engine';

Chart.register(...registerables);

interface Props {
  segments: Segment[];
}

const METRIC_CONFIG: Record<ForecastMetric, { label: string; color: string; format: (v: number) => string }> = {
  health: { label: 'Health Score', color: '#22c55e', format: v => v.toFixed(1) },
  iri: { label: 'Avg IRI', color: '#f97316', format: v => v.toFixed(3) },
  critical: { label: 'Critical Roads', color: '#ef4444', format: v => String(Math.round(v)) },
  cost: { label: 'Cost ($M)', color: '#3b82f6', format: v => `$${v.toFixed(2)}M` },
};

export default function Forecast({ segments }: Props) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<Chart | null>(null);
  const [metric, setMetric] = useState<ForecastMetric>('health');

  const data: ForecastYear[] = useMemo(() => computeForecast(segments, 5), [segments]);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;
    if (chartInst.current) chartInst.current.destroy();
    const { label, color, format } = METRIC_CONFIG[metric];
    const raw = data.map(d => {
      if (metric === 'health') return d.health_score;
      if (metric === 'iri') return d.avg_iri;
      if (metric === 'critical') return d.critical_roads;
      return d.total_repair_cost_usd / 1e6;
    });
    chartInst.current = new Chart(chartRef.current.getContext('2d')!, {
      type: 'line',
      data: {
        labels: data.map(d => `Y${d.year}`),
        datasets: [{
          label,
          data: raw,
          borderColor: color,
          borderWidth: 2.5,
          pointRadius: 6,
          pointBackgroundColor: color,
          pointBorderColor: 'var(--panel)',
          pointBorderWidth: 2,
          tension: 0.25,
          fill: true,
          backgroundColor: color + '14',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'var(--panel2)',
            titleColor: 'var(--text)',
            bodyColor: 'var(--text2)',
            borderColor: 'var(--border2)',
            borderWidth: 1,
            callbacks: { label: ctx => `${label}: ${format(ctx.parsed.y)}` },
          },
        },
        scales: {
          x: { ticks: { color: '#555e72', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#555e72', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        },
      },
    });
    return () => { chartInst.current?.destroy(); };
  }, [data, metric]);

  return (
    <div className="p-5 space-y-4 fade-up">
      <Panel
        title="5-Year Network Deterioration Forecast"
        badge={
          <select
            className="text-[11px] rounded px-2 py-1 outline-none"
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)' }}
            value={metric}
            onChange={e => setMetric(e.target.value as ForecastMetric)}
          >
            <option value="health">Health Score</option>
            <option value="iri">Avg IRI</option>
            <option value="critical">Critical Roads</option>
            <option value="cost">Repair Cost</option>
          </select>
        }
      >
        <div className="relative h-64">
          <canvas ref={chartRef} />
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Year cards */}
        <div className="space-y-2">
          {data.slice(1).map(d => (
            <div key={d.year} className="rounded-xl p-3" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold" style={{ color: 'var(--text2)' }}>Year {d.year}</span>
                <span className="text-[11px] font-mono"
                  style={{ color: d.health_score >= 65 ? 'var(--accent2)' : d.health_score >= 40 ? 'var(--accent3)' : 'var(--danger)' }}>
                  Health {d.health_score}
                </span>
              </div>
              <div className="flex gap-4 text-[10px]" style={{ color: 'var(--text3)' }}>
                <span>IRI: <span className="font-mono" style={{ color: 'var(--text2)' }}>{d.avg_iri}</span></span>
                <span>Critical: <span className="font-mono" style={{ color: 'var(--danger)' }}>{d.critical_roads}</span></span>
                <span>Cost: <span className="font-mono" style={{ color: 'var(--text2)' }}>{fmtCost(d.total_repair_cost_usd)}</span></span>
              </div>
            </div>
          ))}
        </div>

        {/* Full table */}
        <div className="lg:col-span-2">
          <Panel title="Year-by-Year Breakdown">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Year', 'Health Score', 'Avg IRI', 'Max IRI', 'Critical', 'Repair Cost'].map(h => (
                      <th key={h} className="py-2 px-2 text-left font-medium uppercase tracking-wider"
                        style={{ color: 'var(--text3)', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map(d => (
                    <tr key={d.year} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-2 px-2 font-mono" style={{ color: 'var(--text2)' }}>Y{d.year}</td>
                      <td className="py-2 px-2 font-mono"
                        style={{ color: d.health_score >= 65 ? 'var(--accent2)' : d.health_score >= 40 ? 'var(--accent3)' : 'var(--danger)' }}>
                        {d.health_score}
                      </td>
                      <td className="py-2 px-2 font-mono" style={{ color: 'var(--text2)' }}>{d.avg_iri}</td>
                      <td className="py-2 px-2 font-mono" style={{ color: 'var(--text3)' }}>{d.max_iri}</td>
                      <td className="py-2 px-2 font-mono" style={{ color: 'var(--danger)' }}>{d.critical_roads}</td>
                      <td className="py-2 px-2 font-mono" style={{ color: 'var(--text2)' }}>{fmtCost(d.total_repair_cost_usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
