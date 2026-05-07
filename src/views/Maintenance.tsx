import { useState, useMemo } from 'react';
import Panel from '../components/Panel';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import ProgressBar from '../components/ProgressBar';
import type { Segment, Urgency } from '../types';
import { CONDITION_COLORS, URGENCY_COLORS, fmtCost } from '../engine';

const URGENCY_ORDER: Urgency[] = ['Immediate', 'High', 'Medium', 'Low', 'None'];

interface Props {
  segments: Segment[];
}

export default function Maintenance({ segments }: Props) {
  const [search, setSearch] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<Urgency | 'all'>('all');

  const ranked = useMemo(
    () => [...segments].sort((a, b) => b.iri_predicted - a.iri_predicted),
    [segments]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ranked.filter(s => {
      const matchQ = !q || s.edge_id.toLowerCase().includes(q) || s.road_type.includes(q);
      const matchF = urgencyFilter === 'all' || s.urgency_predicted === urgencyFilter;
      return matchQ && matchF;
    }).slice(0, 120);
  }, [ranked, search, urgencyFilter]);

  const summaries = useMemo(() => {
    const res: Record<Urgency, { count: number; cost: number }> = {
      Immediate: { count: 0, cost: 0 }, High: { count: 0, cost: 0 },
      Medium: { count: 0, cost: 0 }, Low: { count: 0, cost: 0 }, None: { count: 0, cost: 0 },
    };
    segments.forEach(s => {
      res[s.urgency_predicted].count++;
      res[s.urgency_predicted].cost += s.repair_cost_usd;
    });
    return res;
  }, [segments]);

  const totalCost = segments.reduce((a, s) => a + s.repair_cost_usd, 0);

  function exportCSV() {
    const cols: (keyof Segment)[] = ['edge_id', 'road_type', 'lat', 'lon', 'iri_current', 'iri_predicted', 'deterioration_delta', 'condition_predicted', 'urgency_predicted', 'repair_cost_usd', 'priority_score'];
    const header = cols.join(',');
    const rows = ranked.map(s => cols.map(c => s[c]).join(','));
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'road_maintenance_plan.csv';
    a.click();
  }

  return (
    <div className="p-5 space-y-4 fade-up">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Immediate Action" value={summaries.Immediate.count}
          sub={fmtCost(summaries.Immediate.cost)} valueColor="var(--danger)" />
        <StatCard label="High Priority" value={summaries.High.count}
          sub={fmtCost(summaries.High.cost)} valueColor="var(--accent3)" />
        <StatCard label="Medium Priority" value={summaries.Medium.count}
          sub={fmtCost(summaries.Medium.cost)} valueColor="var(--accent)" />
        <StatCard label="Total Budget Needed" value={fmtCost(totalCost)} sub="estimated repair" />
      </div>

      <Panel
        title="Priority Ranking"
        badge={<Badge variant="blue">{filtered.length} roads</Badge>}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              className="rounded-lg px-3 py-1.5 text-[12px] outline-none"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', width: 220 }}
              placeholder="Search segment ID or road type…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="rounded-lg px-3 py-1.5 text-[12px] outline-none"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)' }}
              value={urgencyFilter}
              onChange={e => setUrgencyFilter(e.target.value as Urgency | 'all')}
            >
              <option value="all">All Urgency</option>
              {URGENCY_ORDER.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <button
            onClick={exportCSV}
            className="text-[12px] px-3 py-1.5 rounded-lg font-medium transition-colors"
            style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
          >
            ↓ Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Segment', 'Type', 'Pred IRI', 'Curr IRI', 'Δ IRI', 'Condition', 'Urgency', 'Repair Cost', 'Priority'].map(h => (
                    <th key={h} className="py-2 px-2 text-left font-medium uppercase tracking-wider"
                      style={{ color: 'var(--text3)', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const col = CONDITION_COLORS[s.condition_predicted];
                  return (
                    <tr key={s.edge_id} className="transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="py-2 px-2" style={{ color: 'var(--text3)' }}>{i + 1}</td>
                      <td className="py-2 px-2 font-mono" style={{ color: 'var(--text2)', fontSize: 10 }}>{s.edge_id}</td>
                      <td className="py-2 px-2" style={{ color: 'var(--text2)' }}>{s.road_type}</td>
                      <td className="py-2 px-2">
                        <span className="inline-flex items-center justify-center w-12 h-5 rounded text-[10px] font-semibold font-mono"
                          style={{ background: col + '22', color: col }}>{s.iri_predicted.toFixed(2)}</span>
                      </td>
                      <td className="py-2 px-2 font-mono" style={{ color: 'var(--text3)' }}>{s.iri_current.toFixed(2)}</td>
                      <td className="py-2 px-2 font-mono" style={{ color: 'var(--danger)' }}>+{s.deterioration_delta.toFixed(3)}</td>
                      <td className="py-2 px-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: col + '22', color: col }}>{s.condition_predicted}</span>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: URGENCY_COLORS[s.urgency_predicted] + '22', color: URGENCY_COLORS[s.urgency_predicted] }}>
                          {s.urgency_predicted}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-mono" style={{ color: 'var(--text2)', fontSize: 10 }}>{fmtCost(s.repair_cost_usd)}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1.5">
                          <ProgressBar pct={s.priority_score * 100} color={col} height={5} />
                          <span className="font-mono w-7 text-right shrink-0" style={{ color: 'var(--text3)', fontSize: 10 }}>
                            {(s.priority_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>
    </div>
  );
}
