import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import Panel from '../components/Panel';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import type { Segment, Condition } from '../types';
import { iriToCondition, CONDITION_COLORS, fmtCost } from '../engine';

const COND_ORDER: Condition[] = ['Critical', 'Poor', 'Moderate', 'Fair', 'Good'];

interface Props {
  segments: Segment[];
}

export default function MapView({ segments }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafMap = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);

  const [trafficScale, setTrafficScale] = useState(1.0);
  const [rainScale, setRainScale] = useState(1.0);
  const [filter, setFilter] = useState<Condition | 'All'>('All');
  const [selected, setSelected] = useState<Segment | null>(null);
  const [riskCounts, setRiskCounts] = useState<Partial<Record<Condition, number>>>({});

  useEffect(() => {
    if (!mapRef.current || leafMap.current) return;
    leafMap.current = L.map(mapRef.current, {
      center: [12.9716, 77.5946], zoom: 12,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CartoDB',
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(leafMap.current);
    markerLayer.current = L.layerGroup().addTo(leafMap.current);

    return () => {
      leafMap.current?.remove();
      leafMap.current = null;
    };
  }, []);

  useEffect(() => {
    if (!markerLayer.current) return;
    markerLayer.current.clearLayers();

    const scale = Math.sqrt((trafficScale + rainScale) / 2);
    const filtered = filter === 'All' ? segments : segments.filter(s => s.condition_predicted === filter);
    const step = filtered.length > 600 ? Math.ceil(filtered.length / 600) : 1;
    const toShow = filtered.filter((_, i) => i % step === 0);

    const counts: Partial<Record<Condition, number>> = {};
    toShow.forEach(seg => {
      const iri = Math.min(10, seg.iri_predicted * scale);
      const cond = iriToCondition(iri);
      counts[cond] = (counts[cond] ?? 0) + 1;
      const color = CONDITION_COLORS[cond];
      const radius = 4 + (iri / 10) * 5;
      const m = L.circleMarker([seg.lat, seg.lon], {
        radius, color, fillColor: color, fillOpacity: 0.75, weight: 1, opacity: 0.9,
      }).addTo(markerLayer.current!);
      m.on('click', () => setSelected(seg));
    });
    setRiskCounts(counts);
  }, [segments, trafficScale, rainScale, filter]);

  const scaledIRI = selected ? Math.min(10, selected.iri_predicted * Math.sqrt((trafficScale + rainScale) / 2)) : 0;
  const scaledCond = selected ? iriToCondition(scaledIRI) : null;

  // Scenario impact
  const scale = Math.sqrt((trafficScale + rainScale) / 2);
  const newAvgIRI = (segments.reduce((a, s) => a + Math.min(10, s.iri_predicted * scale), 0) / segments.length).toFixed(3);
  const newCritical = segments.filter(s => iriToCondition(Math.min(10, s.iri_predicted * scale)) === 'Critical').length;

  return (
    <div className="p-5 fade-up" style={{ height: 'calc(100vh - 52px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Map panel */}
        <div className="lg:col-span-2 flex flex-col" style={{ minHeight: 0 }}>
          <Panel title="Prediction Map — Bengaluru" noPad className="flex flex-col flex-1">
            {/* Controls */}
            <div className="px-4 py-3 space-y-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <span className="text-[11px] w-28 shrink-0" style={{ color: 'var(--text2)' }}>Traffic Scale</span>
                <input type="range" min={0.5} max={2.5} step={0.05} value={trafficScale}
                  onChange={e => setTrafficScale(parseFloat(e.target.value))} className="flex-1" />
                <span className="text-[11px] font-mono w-10 text-right" style={{ color: 'var(--accent)' }}>{trafficScale.toFixed(2)}×</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] w-28 shrink-0" style={{ color: 'var(--text2)' }}>Rainfall Scale</span>
                <input type="range" min={0.5} max={2.5} step={0.05} value={rainScale}
                  onChange={e => setRainScale(parseFloat(e.target.value))} className="flex-1" />
                <span className="text-[11px] font-mono w-10 text-right" style={{ color: 'var(--accent)' }}>{rainScale.toFixed(2)}×</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px]" style={{ color: 'var(--text3)' }}>Filter:</span>
                {(['All', ...COND_ORDER] as const).map(c => (
                  <Badge key={c}
                    variant={filter === c ? (c === 'All' ? 'blue' : c === 'Critical' ? 'red' : c === 'Poor' ? 'warn' : 'blue') : 'ghost'}
                    onClick={() => setFilter(c)}
                  >{c}</Badge>
                ))}
              </div>
            </div>
            {/* Map */}
            <div ref={mapRef} className="flex-1" style={{ minHeight: 320, borderRadius: '0 0 12px 12px' }} />
          </Panel>
        </div>

        {/* Side panels */}
        <div className="flex flex-col gap-3 overflow-y-auto">
          <Panel title="Network Risk">
            <div className="space-y-2.5">
              {COND_ORDER.map(c => {
                const n = riskCounts[c] ?? 0;
                const total = Object.values(riskCounts).reduce((a, b) => a + (b ?? 0), 0);
                const pct = total ? (n / total) * 100 : 0;
                return (
                  <div key={c} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CONDITION_COLORS[c] }} />
                    <span className="text-[11px] flex-1" style={{ color: 'var(--text2)' }}>{c}</span>
                    <ProgressBar pct={pct} color={CONDITION_COLORS[c]} height={5} />
                    <span className="text-[11px] font-mono w-6 text-right shrink-0" style={{ color: 'var(--text3)' }}>{n}</span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Segment Detail">
            {!selected ? (
              <p className="text-[12px] text-center py-5" style={{ color: 'var(--text3)' }}>Click a marker on the map</p>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{selected.edge_id}</span>
                  {scaledCond && (
                    <span className="text-[11px] px-2 py-0.5 rounded font-medium"
                      style={{ background: CONDITION_COLORS[scaledCond] + '22', color: CONDITION_COLORS[scaledCond] }}>
                      {scaledCond}
                    </span>
                  )}
                </div>
                <table className="w-full text-[11px]">
                  <tbody>
                    {[
                      ['Road Type', selected.road_type],
                      ['Lanes', selected.lanes],
                      ['Speed Limit', `${selected.speed_limit} km/h`],
                      ['Length', `${Math.round(selected.length_m)} m`],
                      ['Traffic Vol.', selected.traffic_volume.toLocaleString()],
                      ['Rainfall', `${selected.rainfall_mm} mm`],
                      ['Age Factor', selected.age_factor],
                      ['IRI Current', selected.iri_current.toFixed(3)],
                      ['IRI Predicted (scenario)', scaledIRI.toFixed(3)],
                      ['Δ IRI', `+${selected.deterioration_delta}`],
                      ['Urgency', selected.urgency_predicted],
                      ['Repair Cost', fmtCost(selected.repair_cost_usd)],
                      ['Priority Score', selected.priority_score],
                    ].map(([k, v]) => (
                      <tr key={String(k)}>
                        <td className="py-1" style={{ color: 'var(--text3)' }}>{k}</td>
                        <td className="py-1 text-right font-mono" style={{ color: 'var(--text2)' }}>{String(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Scenario Impact">
            <div className="space-y-2.5">
              {[
                ['Avg IRI (scenario)', newAvgIRI, 'var(--warn)'],
                ['Critical Roads', String(newCritical), 'var(--danger)'],
                ['Traffic Scale', `${trafficScale.toFixed(2)}×`, 'var(--text2)'],
                ['Rainfall Scale', `${rainScale.toFixed(2)}×`, 'var(--text2)'],
              ].map(([k, v, col]) => (
                <div key={k} className="flex justify-between text-[12px]">
                  <span style={{ color: 'var(--text3)' }}>{k}</span>
                  <span className="font-mono" style={{ color: col }}>{v}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
