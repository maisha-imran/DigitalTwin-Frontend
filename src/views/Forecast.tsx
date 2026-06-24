import { useEffect, useRef, useState, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import type { Segment, ForecastYear, ForecastMetric } from '../types';
import { computeForecast, fmtCost } from '../engine';

Chart.register(...registerables);

interface Props { segments: Segment[]; }

const METRIC_CONFIG: Record<ForecastMetric, { label: string; color: string; grad: string[]; format: (v: number) => string }> = {
  health: { label: 'Health Score', color: '#22c55e', grad: ['#22c55e', '#16a34a'], format: v => v.toFixed(1) },
  iri: { label: 'Avg IRI', color: '#f97316', grad: ['#f97316', '#ea580c'], format: v => v.toFixed(3) },
  critical: { label: 'Critical Roads', color: '#ef4444', grad: ['#ef4444', '#dc2626'], format: v => String(Math.round(v)) },
  cost: { label: 'Cost (₹ Cr)', color: '#6366f1', grad: ['#6366f1', '#4f46e5'], format: v => `₹${v.toFixed(2)} Cr` },
};

const trendColor = (metric: ForecastMetric, d: ForecastYear) => {
  if (metric === 'health') return d.health_score >= 65 ? '#22c55e' : d.health_score >= 40 ? '#f97316' : '#ef4444';
  return '#6366f1';
};

export default function Forecast({ segments }: Props) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<Chart | null>(null);
  const [metric, setMetric] = useState<ForecastMetric>('health');

  const data: ForecastYear[] = useMemo(() => computeForecast(segments, 5), [segments]);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;
    if (chartInst.current) chartInst.current.destroy();
    const cfg = METRIC_CONFIG[metric];
    const raw = data.map(d => {
      if (metric === 'health') return d.health_score;
      if (metric === 'iri') return d.avg_iri;
      if (metric === 'critical') return d.critical_roads;
      return d.total_repair_cost_usd / 1e7;
    });

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, cfg.color + '28');
    gradient.addColorStop(1, cfg.color + '04');

    chartInst.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => `Year ${d.year}`),
        datasets: [{
          label: cfg.label,
          data: raw,
          borderColor: cfg.color,
          borderWidth: 3,
          pointRadius: 7,
          pointBackgroundColor: cfg.color,
          pointBorderColor: '#fff',
          pointBorderWidth: 3,
          tension: 0.3,
          fill: true,
          backgroundColor: gradient,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1f2937', titleColor: '#f9fafb', bodyColor: '#d1d5db',
            borderColor: '#374151', borderWidth: 1, padding: 12, cornerRadius: 10,
            callbacks: {
              label: ctx => {
                const value = ctx.parsed.y ?? 0;
                return `${cfg.label}: ${cfg.format(value)}`;
              },
            },
          },
        },
        scales: {
          x: { ticks: { color: '#9ca3af', font: { size: 12, family: 'DM Sans' } }, grid: { color: 'rgba(0,0,0,0.04)' }, border: { display: false } },
          y: { ticks: { color: '#d1d5db', font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' }, border: { display: false } },
        },
      },
    });
    return () => { chartInst.current?.destroy(); };
  }, [data, metric]);

  const metricKeys: ForecastMetric[] = ['health', 'iri', 'critical', 'cost'];

  return (
    <div style={{ padding: '28px 32px', background: '#f8f9fb', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>5-Year Forecast</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>Network deterioration projection without intervention</p>
      </div>

      {/* Metric Selector */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {metricKeys.map(m => {
          const cfg = METRIC_CONFIG[m];
          const active = metric === m;
          return (
            <button key={m} onClick={() => setMetric(m)} style={{
              padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              border: active ? `2px solid ${cfg.color}` : '2px solid #f0f0f0',
              background: active ? cfg.color + '12' : '#fff',
              color: active ? cfg.color : '#9ca3af',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: active ? `0 0 0 3px ${cfg.color}18` : 'none',
            }}>{cfg.label}</button>
          );
        })}
      </div>

      {/* Main Chart */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: 20 }}>
        <div style={{ position: 'relative', height: 280 }}>
          <canvas ref={chartRef} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Year cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.slice(1).map(d => {
            const col = d.health_score >= 65 ? '#22c55e' : d.health_score >= 40 ? '#f97316' : '#ef4444';
            return (
              <div key={d.year} style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Year {d.year}</span>
                  <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: col, fontWeight: 700, background: col + '14', padding: '2px 10px', borderRadius: 20 }}>Health {d.health_score}</span>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[['IRI', String(d.avg_iri), '#6b7280'], ['Critical', String(d.critical_roads), '#ef4444'], ['Cost', fmtCost(d.total_repair_cost_usd), '#6b7280']].map(([k, v, c]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: c, fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Table */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 20px' }}>Year-by-Year Breakdown</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                {['Year', 'Health Score', 'Avg IRI', 'Max IRI', 'Critical', 'Repair Cost'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => {
                const hCol = d.health_score >= 65 ? '#22c55e' : d.health_score >= 40 ? '#f97316' : '#ef4444';
                return (
                  <tr key={d.year} style={{ borderBottom: '1px solid #f9fafb', background: i % 2 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '12px', fontFamily: 'DM Mono, monospace', color: '#374151', fontWeight: 700 }}>Y{d.year}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontFamily: 'DM Mono, monospace', color: hCol, fontWeight: 700, background: hCol + '12', padding: '2px 10px', borderRadius: 20 }}>{d.health_score}</span>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'DM Mono, monospace', color: '#6b7280' }}>{d.avg_iri}</td>
                    <td style={{ padding: '12px', fontFamily: 'DM Mono, monospace', color: '#9ca3af' }}>{d.max_iri}</td>
                    <td style={{ padding: '12px', fontFamily: 'DM Mono, monospace', color: '#ef4444', fontWeight: 600 }}>{d.critical_roads}</td>
                    <td style={{ padding: '12px', fontFamily: 'DM Mono, monospace', color: '#374151' }}>{fmtCost(d.total_repair_cost_usd)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}