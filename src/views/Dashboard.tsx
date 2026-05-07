import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import StatCard from '../components/StatCard';
import Panel from '../components/Panel';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
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

export default function Dashboard({ health, segments, trainHistory }: Props) {
  const lossRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<HTMLCanvasElement>(null);
  const lossChart = useRef<Chart | null>(null);

  useEffect(() => {
    drawRing(parseFloat(health.health_score));
  }, [health.health_score]);

  useEffect(() => {
    if (!lossRef.current || trainHistory.length === 0) return;
    if (lossChart.current) lossChart.current.destroy();
    const ctx = lossRef.current.getContext('2d')!;
    lossChart.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trainHistory.map(h => h.epoch),
        datasets: [
          { label: 'Train Loss', data: trainHistory.map(h => h.train), borderColor: '#3b82f6', borderWidth: 1.5, pointRadius: 0, tension: 0.3 },
          { label: 'Val Loss', data: trainHistory.map(h => h.val), borderColor: '#22c55e', borderWidth: 1.5, pointRadius: 0, tension: 0.3, borderDash: [4, 3] },
          { label: 'Physics Loss', data: trainHistory.map(h => h.phys), borderColor: '#f97316', borderWidth: 1.5, pointRadius: 0, tension: 0.3, borderDash: [2, 4] },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
        plugins: {
          legend: {
            display: true, position: 'top',
            labels: { color: '#8b93a8', font: { size: 10 }, boxWidth: 12, padding: 12 },
          },
        },
        scales: {
          x: { ticks: { color: '#555e72', font: { size: 10 }, maxTicksLimit: 10 }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#555e72', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' }, min: 0 },
        },
      },
    });
    return () => { lossChart.current?.destroy(); };
  }, [trainHistory]);

  function drawRing(score: number) {
    const canvas = ringRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const cx = 56, cy = 56, r = 44, lw = 8;
    ctx.clearRect(0, 0, 112, 112);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = lw; ctx.stroke();
    const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f97316' : '#ef4444';
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * (score / 100));
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke();
  }

  const gradeColor = { A: '#22c55e', B: '#3b82f6', C: '#f97316', D: '#eab308', F: '#ef4444' }[health.health_grade] ?? '#8b93a8';

  const rtCounts: Record<string, number> = {};
  const rtIRI: Record<string, number[]> = {};
  segments.forEach(s => {
    rtCounts[s.road_type] = (rtCounts[s.road_type] ?? 0) + 1;
    if (!rtIRI[s.road_type]) rtIRI[s.road_type] = [];
    rtIRI[s.road_type].push(s.iri_predicted);
  });
  const maxRtCount = Math.max(...Object.values(rtCounts));

  return (
    <div className="p-5 space-y-4 fade-up">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Health Score" value={health.health_score} sub={`Grade ${health.health_grade}`} />
        <StatCard label="Avg Predicted IRI" value={health.avg_iri_predicted}
          delta={`+${health.avg_iri_delta} from current`} deltaDir="up" />
        <StatCard label="Critical Roads" value={health.critical_roads}
          sub={`${health.actionable_roads} actionable`} valueColor="var(--danger)" />
        <StatCard label="Total Repair Cost" value={fmtCost(parseFloat(health.total_repair_cost_usd))}
          sub={`${fmtCost(parseFloat(health.urgent_repair_cost_usd))} urgent`} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Total Segments" value={health.total_roads} sub={`${health.total_length_km} km network`} />
        <StatCard label="Avg IRI Current" value={health.avg_iri_current} sub="m/km scale" />
        <StatCard label="Poor Roads" value={health.poor_roads}
          sub={`${health.critical_length_km} km critical`} valueColor="var(--warn)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Condition distribution */}
        <div className="lg:col-span-2">
          <Panel title="Condition Distribution" badge={<Badge variant="blue">{health.total_roads} roads</Badge>}>
            {/* Stacked bar */}
            <div className="flex rounded-md overflow-hidden h-3 mb-4">
              {CONDITION_ORDER.map(c => {
                const pct = parseFloat(health.condition_pct[c] ?? '0');
                if (!pct) return null;
                return (
                  <div key={c} style={{ width: `${pct}%`, background: CONDITION_COLORS[c] }}
                    title={`${c}: ${pct}%`} className="transition-all duration-500" />
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-5">
              {CONDITION_ORDER.map(c => {
                const pct = health.condition_pct[c] ?? '0';
                const count = health.condition_breakdown[c] ?? 0;
                if (!count) return null;
                return (
                  <div key={c} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: CONDITION_COLORS[c] }} />
                    <span className="text-[11px]" style={{ color: 'var(--text2)' }}>{c}</span>
                    <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{pct}%</span>
                  </div>
                );
              })}
            </div>

            {/* Road type bars */}
            <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>By Road Type</div>
            <div className="space-y-2.5">
              {ROAD_TYPES.map(rt => {
                const n = rtCounts[rt] ?? 0;
                const avgIRI = rtIRI[rt]?.length ? (rtIRI[rt].reduce((a, b) => a + b, 0) / rtIRI[rt].length).toFixed(2) : '—';
                const pct = (n / maxRtCount) * 100;
                return (
                  <div key={rt} className="flex items-center gap-2">
                    <span className="text-[11px] w-24 shrink-0" style={{ color: 'var(--text3)' }}>{rt}</span>
                    <ProgressBar pct={pct} color="var(--accent)" height={5} />
                    <span className="text-[11px] font-mono w-6 text-right shrink-0" style={{ color: 'var(--text2)' }}>{n}</span>
                    <span className="text-[10px] w-14 text-right shrink-0" style={{ color: 'var(--text3)' }}>IRI {avgIRI}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Health ring + urgency */}
        <Panel title="Network Health">
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="relative shrink-0">
              <canvas ref={ringRef} width={112} height={112} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold leading-none" style={{ color: gradeColor }}>{health.health_grade}</span>
                <span className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>{health.health_score}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {URGENCY_ORDER.map(u => {
                const cnt = health.urgency_breakdown[u] ?? 0;
                const pct = cnt ? (cnt / health.total_roads) * 100 : 0;
                return (
                  <div key={u} className="flex items-center gap-2">
                    <span className="text-[11px] w-20 shrink-0" style={{ color: URGENCY_COLORS[u] }}>{u}</span>
                    <ProgressBar pct={pct} color={URGENCY_COLORS[u]} height={5} />
                    <span className="text-[11px] font-mono w-6 text-right shrink-0" style={{ color: 'var(--text3)' }}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      </div>

      {/* Loss curves */}
      <Panel title="Model Loss Curves"
        badge={<Badge variant="green">Physics-Informed GNN</Badge>}>
        <div className="relative h-48">
          <canvas ref={lossRef} />
        </div>
      </Panel>
    </div>
  );
}
