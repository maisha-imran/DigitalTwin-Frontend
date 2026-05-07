import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import type { NetworkHealth, Segment, TrainPoint } from '../types';
import { CONDITION_COLORS, URGENCY_COLORS, ROAD_TYPES, fmtCost } from '../engine';

Chart.register(...registerables);

const CONDITION_ORDER = ['Critical', 'Poor', 'Moderate', 'Fair', 'Good'] as const;
const URGENCY_ORDER = ['Immediate', 'High', 'Medium', 'Low', 'None'] as const;

interface Props {
  health: NetworkHealth;
  segments: Segment[];
  trainHistory: TrainPoint[];
}

const KPICard = ({ label, value, sub, delta, accent }: { label: string; value: string | number; sub?: string; delta?: string; accent?: string }) => (
  <div style={{
    background: '#fff',
    borderRadius: 20,
    padding: '20px 24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid #f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  }}>
    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af', fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
    <span style={{ fontSize: 28, fontWeight: 700, color: accent || '#111827', fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{value}</span>
    {sub && <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'DM Sans, sans-serif' }}>{sub}</span>}
    {delta && <span style={{ fontSize: 11, color: '#f97316', fontFamily: 'DM Sans, sans-serif' }}>{delta}</span>}
  </div>
);

export default function Dashboard({ health, segments, trainHistory }: Props) {
  const lossRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<HTMLCanvasElement>(null);
  const lossChart = useRef<Chart | null>(null);

  useEffect(() => { drawRing(parseFloat(health.health_score)); }, [health.health_score]);

  useEffect(() => {
    if (!lossRef.current || trainHistory.length === 0) return;
    if (lossChart.current) lossChart.current.destroy();
    lossChart.current = new Chart(lossRef.current.getContext('2d')!, {
      type: 'line',
      data: {
        labels: trainHistory.map(h => h.epoch),
        datasets: [
          { label: 'Train Loss', data: trainHistory.map(h => h.train), borderColor: '#6366f1', borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true, backgroundColor: 'rgba(99,102,241,0.06)' },
          { label: 'Val Loss', data: trainHistory.map(h => h.val), borderColor: '#22c55e', borderWidth: 2, pointRadius: 0, tension: 0.4, borderDash: [5, 4] },
          { label: 'Physics Loss', data: trainHistory.map(h => h.phys), borderColor: '#f97316', borderWidth: 2, pointRadius: 0, tension: 0.4, borderDash: [2, 4] },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 600 },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: '#9ca3af', font: { size: 11, family: 'DM Sans' }, boxWidth: 14, padding: 16 } },
        },
        scales: {
          x: { ticks: { color: '#d1d5db', font: { size: 10 }, maxTicksLimit: 8 }, grid: { color: 'rgba(0,0,0,0.04)' }, border: { display: false } },
          y: { ticks: { color: '#d1d5db', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.04)' }, border: { display: false }, min: 0 },
        },
      },
    });
    return () => { lossChart.current?.destroy(); };
  }, [trainHistory]);

  function drawRing(score: number) {
    const canvas = ringRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const cx = 70, cy = 70, r = 56, lw = 10;
    ctx.clearRect(0, 0, 140, 140);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = '#f3f4f6'; ctx.lineWidth = lw; ctx.stroke();
    const grad = ctx.createLinearGradient(0, 0, 140, 140);
    const color = score >= 80 ? ['#22c55e', '#16a34a'] : score >= 50 ? ['#f97316', '#ea580c'] : ['#ef4444', '#dc2626'];
    grad.addColorStop(0, color[0]); grad.addColorStop(1, color[1]);
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * (score / 100));
    ctx.strokeStyle = grad; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke();
  }

  const gradeColor = { A: '#22c55e', B: '#6366f1', C: '#f97316', D: '#eab308', F: '#ef4444' }[health.health_grade] ?? '#9ca3af';

  const rtCounts: Record<string, number> = {};
  const rtIRI: Record<string, number[]> = {};
  segments.forEach(s => {
    rtCounts[s.road_type] = (rtCounts[s.road_type] ?? 0) + 1;
    if (!rtIRI[s.road_type]) rtIRI[s.road_type] = [];
    rtIRI[s.road_type].push(s.iri_predicted);
  });
  const maxRtCount = Math.max(...Object.values(rtCounts), 1);

  const conditionPillColors: Record<string, string> = {
    Critical: '#ef4444', Poor: '#f97316', Moderate: '#eab308', Fair: '#6366f1', Good: '#22c55e'
  };

  return (
    <div style={{ padding: '28px 32px', background: '#f8f9fb', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>Network Overview</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0', fontFamily: 'DM Sans, sans-serif' }}>Bengaluru Road Health Intelligence · Physics-Informed GNN</p>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard label="Health Score" value={health.health_score} sub={`Grade ${health.health_grade}`} accent={gradeColor} />
        <KPICard label="Avg IRI Predicted" value={health.avg_iri_predicted} delta={`↑ ${health.avg_iri_delta} from current`} />
        <KPICard label="Critical Roads" value={health.critical_roads} sub={`${health.actionable_roads} actionable`} accent="#ef4444" />
        <KPICard label="Total Repair Cost" value={fmtCost(parseFloat(health.total_repair_cost_usd))} sub={`${fmtCost(parseFloat(health.urgent_repair_cost_usd))} urgent`} />
        <KPICard label="Total Segments" value={health.total_roads} sub={`${health.total_length_km} km network`} />
        <KPICard label="Poor Roads" value={health.poor_roads} sub={`${health.critical_length_km} km critical`} accent="#f97316" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>
        {/* Condition Distribution */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Condition Distribution</h3>
            <span style={{ fontSize: 12, color: '#9ca3af', background: '#f3f4f6', padding: '4px 12px', borderRadius: 20 }}>{health.total_roads} roads</span>
          </div>

          {/* Stacked bar */}
          <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', height: 12, marginBottom: 16 }}>
            {CONDITION_ORDER.map(c => {
              const pct = parseFloat(health.condition_pct[c] ?? '0');
              if (!pct) return null;
              return <div key={c} style={{ width: `${pct}%`, background: CONDITION_COLORS[c], transition: 'all 0.5s' }} title={`${c}: ${pct}%`} />;
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            {CONDITION_ORDER.map(c => {
              const pct = health.condition_pct[c] ?? '0';
              const count = health.condition_breakdown[c] ?? 0;
              if (!count) return null;
              return (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: CONDITION_COLORS[c], display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: '#374151' }}>{c}</span>
                  <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'DM Mono, monospace' }}>{pct}%</span>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#d1d5db', marginBottom: 14, fontWeight: 600 }}>By Road Type</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ROAD_TYPES.map(rt => {
              const n = rtCounts[rt] ?? 0;
              const avgIRI = rtIRI[rt]?.length ? (rtIRI[rt].reduce((a, b) => a + b, 0) / rtIRI[rt].length).toFixed(2) : '—';
              const pct = (n / maxRtCount) * 100;
              return (
                <div key={rt} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, width: 100, flexShrink: 0, color: '#6b7280' }}>{rt}</span>
                  <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#6366f1,#818cf8)', borderRadius: 6, transition: 'width 0.6s ease' }} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#374151', width: 24, textAlign: 'right' }}>{n}</span>
                  <span style={{ fontSize: 10, color: '#9ca3af', width: 52, textAlign: 'right' }}>IRI {avgIRI}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Health Ring */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 20px' }}>Network Health</h3>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ position: 'relative' }}>
              <canvas ref={ringRef} width={140} height={140} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: gradeColor, lineHeight: 1, fontFamily: 'DM Sans, sans-serif' }}>{health.health_grade}</span>
                <span style={{ fontSize: 12, color: '#9ca3af', marginTop: 2, fontFamily: 'DM Mono, monospace' }}>{health.health_score}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {URGENCY_ORDER.map(u => {
              const cnt = health.urgency_breakdown[u] ?? 0;
              const pct = cnt ? (cnt / health.total_roads) * 100 : 0;
              return (
                <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, width: 70, flexShrink: 0, color: URGENCY_COLORS[u], fontWeight: 600 }}>{u}</span>
                  <div style={{ flex: 1, height: 5, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: URGENCY_COLORS[u], borderRadius: 6, opacity: 0.8 }} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#6b7280', width: 20, textAlign: 'right' }}>{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loss Curves */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Model Loss Curves</h3>
          <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>Physics-Informed GNN</span>
        </div>
        <div style={{ position: 'relative', height: 200 }}>
          <canvas ref={lossRef} />
        </div>
      </div>
    </div>
  );
}