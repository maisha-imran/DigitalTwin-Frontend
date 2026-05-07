import type { Segment, NetworkHealth, ForecastYear, BudgetResult, Condition, Urgency, RoadType, Strategy, TrainPoint } from './types';

export const ROAD_TYPES: RoadType[] = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential'];

const ROAD_TYPE_IDS: Record<RoadType, number> = { motorway: 0, trunk: 1, primary: 2, secondary: 3, tertiary: 4, residential: 5 };
const ROAD_DET_MULT: Record<RoadType, number> = { motorway: 0.55, trunk: 0.70, primary: 0.85, secondary: 1.00, tertiary: 1.20, residential: 1.40 };
const ROAD_IRI_BASE: Record<RoadType, number> = { motorway: 1.0, trunk: 1.5, primary: 2.0, secondary: 2.8, tertiary: 3.5, residential: 4.2 };
const ROAD_TYPE_TRAFFIC: Record<RoadType, [number, number]> = { motorway: [30000, 80000], trunk: [15000, 40000], primary: [8000, 20000], secondary: [3000, 10000], tertiary: [1000, 5000], residential: [100, 1500] };
const ROAD_TYPE_LANES: Record<RoadType, [number, number]> = { motorway: [4, 8], trunk: [2, 4], primary: [2, 4], secondary: [2, 2], tertiary: [1, 2], residential: [1, 2] };
const ROAD_TYPE_SPEED: Record<RoadType, [number, number]> = { motorway: [80, 120], trunk: [60, 80], primary: [40, 60], secondary: [30, 50], tertiary: [20, 40], residential: [10, 30] };
const ROAD_TYPE_PROBS = [0.05, 0.13, 0.28, 0.48, 0.70, 1.00];

function seededRng(seed: number) {
  let s = seed % 2147483647;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

export function iriToCondition(v: number): Condition {
  if (v < 2.0) return 'Good';
  if (v < 3.5) return 'Fair';
  if (v < 5.0) return 'Moderate';
  if (v < 7.0) return 'Poor';
  return 'Critical';
}

export function condToUrgency(c: Condition): Urgency {
  const map: Record<Condition, Urgency> = { Good: 'None', Fair: 'Low', Moderate: 'Medium', Poor: 'High', Critical: 'Immediate' };
  return map[c];
}

export function repairCost(iri: number, lenM: number, rt: RoadType): number {
  const base: Record<RoadType, number> = { motorway: 120000, trunk: 90000, primary: 60000, secondary: 40000, tertiary: 25000, residential: 15000 };
  return Math.max(0, (iri - 2.0) / 10.0) * base[rt] * (lenM / 1000);
}

export function deteriorationRate(s: Segment): number {
  return Math.min(1.5, Math.max(0.05,
    (0.35 * (s.traffic_volume / 30000) +
      0.25 * (s.rainfall_mm / 2500) +
      0.15 * (s.age_factor - 1.0) +
      0.10 * Math.min(s.length_m / 5000, 1) +
      0.05 * ROAD_DET_MULT[s.road_type]) * 1.5
  ));
}

export function generateSegments(): Segment[] {
  const N = 500;
  const CENTER = { lat: 12.9716, lon: 77.5946 };
  const rng = seededRng(42);
  const lats: number[] = [], lons: number[] = [];

  for (let i = 0; i < N; i++) {
    lats.push(CENTER.lat + (rng() - 0.5) * 0.24);
    lons.push(CENTER.lon + (rng() - 0.5) * 0.28);
  }

  const edgeSet = new Set<string>();
  for (let i = 0; i < N; i++) {
    const dists = lats.map((la, j) => ({ j, d: (la - lats[i]) ** 2 + (lons[j] - lons[i]) ** 2 }));
    dists.sort((a, b) => a.d - b.d);
    for (let k = 1; k <= 4; k++) {
      const j = dists[k].j;
      edgeSet.add(`${Math.min(i, j)}_${Math.max(i, j)}`);
    }
  }
  for (let k = 0; k < Math.floor(N / 3); k++) {
    const i = Math.floor(rng() * N), j = Math.floor(rng() * N);
    if (i !== j) edgeSet.add(`${Math.min(i, j)}_${Math.max(i, j)}`);
  }

  const pickRoadType = (): RoadType => {
    const v = rng();
    for (let i = 0; i < ROAD_TYPE_PROBS.length; i++) if (v <= ROAD_TYPE_PROBS[i]) return ROAD_TYPES[i];
    return 'residential';
  };

  const segments: Segment[] = [];
  edgeSet.forEach(key => {
    const [u, v] = key.split('_').map(Number);
    const rt = pickRoadType();
    const dlat = (lats[v] - lats[u]) * 111000;
    const dlon = (lons[v] - lons[u]) * 111000 * Math.cos((lats[u] + lats[v]) / 2 * Math.PI / 180);
    const length = Math.max(50, Math.sqrt(dlat ** 2 + dlon ** 2));
    const [tl, th] = ROAD_TYPE_TRAFFIC[rt];
    const traffic = tl + rng() * (th - tl);
    const rainfall = 400 + rng() * 2100;
    const [ll, lh] = ROAD_TYPE_LANES[rt];
    const lanes = ll + Math.floor(rng() * (lh - ll + 1));
    const [sl, sh] = ROAD_TYPE_SPEED[rt];
    const speed = sl + Math.floor(rng() * (sh - sl + 1));
    const age = 1.0 + rng() * 1.5;

    const base = ROAD_IRI_BASE[rt];
    const iri_c = Math.min(10, Math.max(0.5,
      base + 1.5 * (traffic / 80000) + 0.8 * (rainfall / 2500) +
      0.4 * Math.min(length / 5000, 1) + age * ROAD_DET_MULT[rt] + (rng() - 0.5) * 0.5
    ));
    const dr = (0.35 * (traffic / 30000) + 0.25 * (rainfall / 2500) + 0.15 * (age - 1) +
      0.10 * Math.min(length / 5000, 1) + 0.05 * ROAD_DET_MULT[rt]) * 1.5;
    const det = Math.min(1.5, Math.max(0.05, dr));
    const iri_p = Math.min(10, Math.max(iri_c + 0.02, iri_c + det + (rng() - 0.5) * 0.1));
    const delta = iri_p - iri_c;
    const priority = Math.min(1, 0.7 * (iri_p - 0.5) / 9.5 + 0.3 * (delta / Math.max(delta, 0.01)));

    segments.push({
      edge_id: `${u}_${v}`, node_u: u, node_v: v,
      lat: (lats[u] + lats[v]) / 2, lon: (lons[u] + lons[v]) / 2,
      road_type: rt, road_type_id: ROAD_TYPE_IDS[rt],
      lanes, traffic_volume: Math.round(traffic), rainfall_mm: Math.round(rainfall),
      length_m: Math.round(length), speed_limit: speed, age_factor: parseFloat(age.toFixed(2)),
      iri_current: parseFloat(iri_c.toFixed(3)), iri_future: parseFloat(iri_p.toFixed(3)),
      iri_predicted: parseFloat(iri_p.toFixed(3)),
      condition_current: iriToCondition(iri_c), condition_predicted: iriToCondition(iri_p),
      urgency_predicted: condToUrgency(iriToCondition(iri_p)),
      repair_cost_usd: parseFloat(repairCost(iri_p, length, rt).toFixed(2)),
      deterioration_delta: parseFloat(delta.toFixed(4)),
      priority_score: parseFloat(priority.toFixed(4)),
    });
  });
  return segments;
}

const COND_SCORE: Record<Condition, number> = { Good: 100, Fair: 75, Moderate: 50, Poor: 25, Critical: 0 };

export function computeNetworkHealth(segs: Segment[]): NetworkHealth {
  const counts: Partial<Record<Condition, number>> = {};
  const urgCounts: Partial<Record<Urgency, number>> = {};
  segs.forEach(s => {
    counts[s.condition_predicted] = (counts[s.condition_predicted] ?? 0) + 1;
    urgCounts[s.urgency_predicted] = (urgCounts[s.urgency_predicted] ?? 0) + 1;
  });
  const score = Object.entries(counts).reduce((acc, [c, n]) => acc + (COND_SCORE[c as Condition] ?? 50) * (n ?? 0), 0) / segs.length;
  const grade = score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : score >= 35 ? 'D' : 'F';
  const totalLen = segs.reduce((a, s) => a + s.length_m, 0) / 1000;
  const criticals = segs.filter(s => s.condition_predicted === 'Critical');
  const poors = segs.filter(s => s.condition_predicted === 'Poor');
  const totalCost = segs.reduce((a, s) => a + s.repair_cost_usd, 0);
  const urgentCost = [...criticals, ...poors].reduce((a, s) => a + s.repair_cost_usd, 0);
  const avgIriCur = segs.reduce((a, s) => a + s.iri_current, 0) / segs.length;
  const avgIriPred = segs.reduce((a, s) => a + s.iri_predicted, 0) / segs.length;

  return {
    health_score: score.toFixed(1),
    health_grade: grade as NetworkHealth['health_grade'],
    total_roads: segs.length,
    total_length_km: totalLen.toFixed(1),
    condition_breakdown: counts as Record<Condition, number>,
    condition_pct: Object.fromEntries(Object.entries(counts).map(([c, n]) => [c, ((n ?? 0) / segs.length * 100).toFixed(1)])) as Record<Condition, string>,
    avg_iri_current: avgIriCur.toFixed(3),
    avg_iri_predicted: avgIriPred.toFixed(3),
    avg_iri_delta: (avgIriPred - avgIriCur).toFixed(3),
    critical_roads: criticals.length,
    poor_roads: poors.length,
    actionable_roads: criticals.length + poors.length,
    critical_length_km: (criticals.reduce((a, s) => a + s.length_m, 0) / 1000).toFixed(1),
    total_repair_cost_usd: totalCost.toFixed(0),
    urgent_repair_cost_usd: urgentCost.toFixed(0),
    urgency_breakdown: urgCounts as Record<Urgency, number>,
  };
}

export function computeForecast(segs: Segment[], years = 5): ForecastYear[] {
  const summaries: ForecastYear[] = [];
  for (let yr = 0; yr <= years; yr++) {
    let totalIRI = 0, totalCost = 0, critCount = 0;
    const condCounts: Partial<Record<Condition, number>> = {};
    segs.forEach(s => {
      const dr = deteriorationRate(s);
      const iri = Math.min(10, s.iri_predicted + dr * yr);
      const cond = iriToCondition(iri);
      totalIRI += iri;
      totalCost += repairCost(iri, s.length_m, s.road_type);
      if (cond === 'Critical') critCount++;
      condCounts[cond] = (condCounts[cond] ?? 0) + 1;
    });
    const score = Object.entries(condCounts).reduce((acc, [c, n]) => acc + (COND_SCORE[c as Condition] ?? 50) * (n ?? 0), 0) / segs.length;
    summaries.push({
      year: yr, health_score: parseFloat(score.toFixed(1)),
      avg_iri: parseFloat((totalIRI / segs.length).toFixed(3)),
      max_iri: 10, critical_roads: critCount,
      total_repair_cost_usd: parseFloat(totalCost.toFixed(0)),
      condition_breakdown: condCounts as Record<Condition, number>,
    });
  }
  return summaries;
}

export function optimizeBudget(segs: Segment[], budget: number, strategy: Strategy): BudgetResult {
  let candidates = segs.filter(s => s.iri_predicted > 2.0);
  if (strategy === 'cost_effective') {
    candidates.sort((a, b) => (b.iri_predicted - 2) / (b.repair_cost_usd + 1) - (a.iri_predicted - 2) / (a.repair_cost_usd + 1));
  } else if (strategy === 'critical_only') {
    candidates = candidates.filter(s => s.condition_predicted === 'Critical' || s.condition_predicted === 'Poor')
      .sort((a, b) => b.iri_predicted - a.iri_predicted);
  } else if (strategy === 'length_weighted') {
    candidates.sort((a, b) => b.iri_predicted * (b.length_m / 1000) - a.iri_predicted * (a.length_m / 1000));
  } else {
    candidates.sort((a, b) => b.iri_predicted - a.iri_predicted);
  }
  const selected: Segment[] = [];
  const condCounts: Partial<Record<Condition, number>> = {};
  let totalCost = 0, totalImprov = 0;
  for (const s of candidates) {
    if (totalCost + s.repair_cost_usd <= budget) {
      selected.push(s);
      totalCost += s.repair_cost_usd;
      totalImprov += s.iri_predicted - 2.0;
      condCounts[s.condition_predicted] = (condCounts[s.condition_predicted] ?? 0) + 1;
    }
  }
  return { selected, totalCost, totalImprov, condCounts, budget, utilized: totalCost / budget * 100 };
}

export function generateTrainHistory(epochs: number): TrainPoint[] {
  const h: TrainPoint[] = [];
  let trainLoss = 2.8, valLoss = 3.1, physLoss = 0.45;
  const r = seededRng(7);
  for (let e = 0; e <= epochs; e++) {
    const progress = e / epochs;
    const decay = Math.exp(-3 * progress);
    trainLoss = Math.max(0.18, trainLoss - 0.025 * (1 - decay) * epochs / 80 + (r() - 0.5) * 0.08 * decay);
    valLoss = Math.max(0.22, valLoss - 0.022 * (1 - decay) * epochs / 80 + (r() - 0.5) * 0.12 * decay);
    physLoss = Math.max(0.04, physLoss * Math.exp(-0.03) + (r() - 0.5) * 0.01);
    h.push({ epoch: e, train: trainLoss, val: valLoss, phys: physLoss });
  }
  return h;
}

export const CONDITION_COLORS: Record<Condition, string> = {
  Critical: '#ef4444', Poor: '#f97316', Moderate: '#eab308', Fair: '#3b82f6', Good: '#22c55e',
};

export const URGENCY_COLORS: Record<Urgency, string> = {
  Immediate: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#3b82f6', None: '#6b7280',
};

export function fmtCost(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}
