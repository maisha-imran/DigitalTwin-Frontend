import { useState, useMemo } from 'react';
import type { Segment, Urgency } from '../types';
import { CONDITION_COLORS, URGENCY_COLORS, fmtCost } from '../engine';

const URGENCY_ORDER: Urgency[] = ['Immediate', 'High', 'Medium', 'Low', 'None'];

const urgencyBg: Record<Urgency, string> = {
  Immediate: 'rgba(239,68,68,0.1)', High: 'rgba(249,115,22,0.1)',
  Medium: 'rgba(99,102,241,0.1)', Low: 'rgba(34,197,94,0.1)', None: 'rgba(156,163,175,0.1)',
};

interface Props { segments: Segment[]; }

export default function Maintenance({ segments }: Props) {
  const [search, setSearch] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<Urgency | 'all'>('all');

  const ranked = useMemo(() => [...segments].sort((a, b) => b.iri_predicted - a.iri_predicted), [segments]);

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

  const summaryCards = [
    { label: 'Immediate Action', urgency: 'Immediate' as Urgency, color: '#ef4444' },
    { label: 'High Priority', urgency: 'High' as Urgency, color: '#f97316' },
    { label: 'Medium Priority', urgency: 'Medium' as Urgency, color: '#6366f1' },
    { label: 'Total Budget', urgency: null, color: '#111827' },
  ];

  return (
    <div style={{ padding: '28px 32px', background: '#f8f9fb', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Maintenance Plan</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>Priority-ranked road repair schedule</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {summaryCards.map(({ label, urgency, color }) => {
          const data = urgency ? summaries[urgency] : null;
          return (
            <div key={label} style={{ background: '#fff', borderRadius: 18, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>
                {data ? data.count : fmtCost(totalCost)}
              </div>
              {data && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>{fmtCost(data.cost)} estimated</div>}
            </div>
          );
        })}
      </div>

      {/* Table Panel */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Priority Ranking</h3>
            <span style={{ fontSize: 12, color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '3px 12px', borderRadius: 20, fontWeight: 600 }}>{filtered.length} roads</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              style={{ borderRadius: 10, padding: '9px 14px', fontSize: 13, border: '1px solid #f0f0f0', background: '#f9fafb', color: '#374151', outline: 'none', width: 220 }}
              placeholder="Search segment or road type…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
            <select
              style={{ borderRadius: 10, padding: '9px 14px', fontSize: 13, border: '1px solid #f0f0f0', background: '#f9fafb', color: '#6b7280', outline: 'none' }}
              value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value as Urgency | 'all')}
            >
              <option value="all">All Urgency</option>
              {URGENCY_ORDER.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <button onClick={exportCSV} style={{
              borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600,
              border: '1px solid #6366f1', background: 'rgba(99,102,241,0.08)', color: '#6366f1', cursor: 'pointer',
            }}>↓ Export CSV</button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowY: 'auto', maxHeight: 460, borderRadius: 12, border: '1px solid #f0f0f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#fafafa', zIndex: 1 }}>
              <tr>
                {['#', 'Segment', 'Type', 'Pred IRI', 'Curr IRI', 'Δ IRI', 'Condition', 'Urgency', 'Repair Cost', 'Priority'].map(h => (
                  <th key={h} style={{ padding: '12px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', borderBottom: '1px solid #f0f0f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '40px 0', textAlign: 'center', color: '#d1d5db', fontSize: 13 }}>
                    No segments match this filter
                  </td>
                </tr>
              ) : filtered.map((s, i) => {
                const col = CONDITION_COLORS[s.condition_predicted];
                const urgCol = URGENCY_COLORS[s.urgency_predicted];
                return (
                  <tr key={s.edge_id} style={{ borderBottom: '1px solid #f9fafb', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px', color: '#d1d5db', fontFamily: 'DM Mono, monospace' }}>{i + 1}</td>
                    <td style={{ padding: '10px', fontFamily: 'DM Mono, monospace', color: '#374151', fontSize: 11 }}>{s.edge_id}</td>
                    <td style={{ padding: '10px', color: '#6b7280' }}>{s.road_type}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 8px', borderRadius: 8, background: col + '18', color: col, fontSize: 11, fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>{s.iri_predicted.toFixed(2)}</span>
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'DM Mono, monospace', color: '#9ca3af' }}>{s.iri_current.toFixed(2)}</td>
                    <td style={{ padding: '10px', fontFamily: 'DM Mono, monospace', color: '#ef4444', fontWeight: 600 }}>+{s.deterioration_delta.toFixed(3)}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: col + '18', color: col, fontWeight: 600 }}>{s.condition_predicted}</span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: urgencyBg[s.urgency_predicted], color: urgCol, fontWeight: 600 }}>{s.urgency_predicted}</span>
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'DM Mono, monospace', color: '#6b7280', fontSize: 11 }}>{fmtCost(s.repair_cost_usd)}</td>
                    <td style={{ padding: '10px', minWidth: 100 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 5, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${s.priority_score * 100}%`, background: col, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#9ca3af', width: 28, textAlign: 'right' }}>{(s.priority_score * 100).toFixed(0)}%</span>
                      </div>
                    </td>
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