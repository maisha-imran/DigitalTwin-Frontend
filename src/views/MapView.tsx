import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Segment, Condition } from '../types';
import { iriToCondition, CONDITION_COLORS, fmtCost } from '../engine';

const COND_ORDER: Condition[] = ['Critical', 'Poor', 'Moderate', 'Fair', 'Good'];

interface Props { segments: Segment[]; }

const SliderControl = ({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <span style={{ fontSize: 12, color: '#6b7280', width: 110, flexShrink: 0, fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
    <div style={{ flex: 1, position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
      <div style={{ height: 6, background: '#f3f4f6', borderRadius: 6, width: '100%', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${((value - min) / (max - min)) * 100}%`, background: 'linear-gradient(90deg,#6366f1,#818cf8)', borderRadius: 6, transition: 'width 0.1s' }} />
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
    </div>
    <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: '#6366f1', width: 40, textAlign: 'right', fontWeight: 600 }}>{value.toFixed(2)}×</span>
  </div>
);

const DetailRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f9fafb' }}>
    <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
    <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: color || '#374151', fontWeight: 500 }}>{value}</span>
  </div>
);

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
    leafMap.current = L.map(mapRef.current, { center: [12.9716, 77.5946], zoom: 12, zoomControl: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CartoDB', subdomains: 'abcd', maxZoom: 19,
    }).addTo(leafMap.current);
    markerLayer.current = L.layerGroup().addTo(leafMap.current);
    return () => { leafMap.current?.remove(); leafMap.current = null; };
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
      const m = L.circleMarker([seg.lat, seg.lon], { radius, color, fillColor: color, fillOpacity: 0.75, weight: 1.5, opacity: 1 }).addTo(markerLayer.current!);
      m.on('click', () => setSelected(seg));
    });
    setRiskCounts(counts);
  }, [segments, trafficScale, rainScale, filter]);

  const scaledIRI = selected ? Math.min(10, selected.iri_predicted * Math.sqrt((trafficScale + rainScale) / 2)) : 0;
  const scaledCond = selected ? iriToCondition(scaledIRI) : null;
  const scale = Math.sqrt((trafficScale + rainScale) / 2);
  const newAvgIRI = (segments.reduce((a, s) => a + Math.min(10, s.iri_predicted * scale), 0) / segments.length).toFixed(3);
  const newCritical = segments.filter(s => iriToCondition(Math.min(10, s.iri_predicted * scale)) === 'Critical').length;
  const total = Object.values(riskCounts).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <div style={{ padding: '28px 32px', background: '#f8f9fb', height: 'calc(100vh - 52px)', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Prediction Map</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>Bengaluru road network · Click markers for details</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, flex: 1, minHeight: 0 }}>
        {/* Map */}
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Controls */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SliderControl label="Traffic Scale" value={trafficScale} min={0.5} max={2.5} step={0.05} onChange={setTrafficScale} />
            <SliderControl label="Rainfall Scale" value={rainScale} min={0.5} max={2.5} step={0.05} onChange={setRainScale} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter:</span>
              {(['All', ...COND_ORDER] as const).map(c => {
                const active = filter === c;
                const col = c === 'All' ? '#6366f1' : CONDITION_COLORS[c];
                return (
                  <button key={c} onClick={() => setFilter(c)} style={{
                    padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    border: active ? `1.5px solid ${col}` : '1.5px solid #f0f0f0',
                    background: active ? col + '14' : '#fafafa',
                    color: active ? col : '#9ca3af', cursor: 'pointer', transition: 'all 0.15s',
                  }}>{c}</button>
                );
              })}
            </div>
          </div>
          <div ref={mapRef} style={{ flex: 1, minHeight: 0 }} />
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          {/* Risk Panel */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 16px' }}>Network Risk</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {COND_ORDER.map(c => {
                const n = riskCounts[c] ?? 0;
                const pct = total ? (n / total) * 100 : 0;
                return (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: CONDITION_COLORS[c], flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 12, flex: 1, color: '#374151' }}>{c}</span>
                    <div style={{ width: 80, height: 5, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: CONDITION_COLORS[c], borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: '#9ca3af', width: 22, textAlign: 'right' }}>{n}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Segment Detail */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 14px' }}>Segment Detail</h3>
            {!selected ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#d1d5db', fontSize: 13 }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>📍</div>
                Click a marker on the map
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: 'DM Mono, monospace' }}>{selected.edge_id}</span>
                  {scaledCond && (
                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: CONDITION_COLORS[scaledCond] + '18', color: CONDITION_COLORS[scaledCond], fontWeight: 700 }}>{scaledCond}</span>
                  )}
                </div>
                {[
                  ['Road Type', selected.road_type],
                  ['Lanes', String(selected.lanes)],
                  ['Speed Limit', `${selected.speed_limit} km/h`],
                  ['Length', `${Math.round(selected.length_m)} m`],
                  ['Traffic Vol.', selected.traffic_volume.toLocaleString()],
                  ['Rainfall', `${selected.rainfall_mm} mm`],
                  ['IRI Current', selected.iri_current.toFixed(3)],
                  ['IRI Predicted', scaledIRI.toFixed(3)],
                  ['Δ IRI', `+${selected.deterioration_delta}`],
                  ['Repair Cost', fmtCost(selected.repair_cost_usd)],
                ].map(([k, v]) => <DetailRow key={String(k)} label={String(k)} value={String(v)} color={k === 'Δ IRI' ? '#ef4444' : k === 'Repair Cost' ? '#6366f1' : undefined} />)}
              </div>
            )}
          </div>

          {/* Scenario Impact */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 14px' }}>Scenario Impact</h3>
            {[
              ['Avg IRI (scenario)', newAvgIRI, '#f97316'],
              ['Critical Roads', String(newCritical), '#ef4444'],
              ['Traffic Scale', `${trafficScale.toFixed(2)}×`, '#6366f1'],
              ['Rainfall Scale', `${rainScale.toFixed(2)}×`, '#6366f1'],
            ].map(([k, v, c]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f9fafb' }}>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{k}</span>
                <span style={{ fontSize: 13, fontFamily: 'DM Mono, monospace', color: c, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}