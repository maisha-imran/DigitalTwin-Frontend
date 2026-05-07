export type RoadType = 'motorway' | 'trunk' | 'primary' | 'secondary' | 'tertiary' | 'residential';
export type Condition = 'Good' | 'Fair' | 'Moderate' | 'Poor' | 'Critical';
export type Urgency = 'None' | 'Low' | 'Medium' | 'High' | 'Immediate';
export type Strategy = 'worst_first' | 'cost_effective' | 'critical_only' | 'length_weighted';
export type ForecastMetric = 'health' | 'iri' | 'critical' | 'cost';

export interface Segment {
  edge_id: string;
  node_u: number;
  node_v: number;
  lat: number;
  lon: number;
  road_type: RoadType;
  road_type_id: number;
  lanes: number;
  traffic_volume: number;
  rainfall_mm: number;
  length_m: number;
  speed_limit: number;
  age_factor: number;
  iri_current: number;
  iri_future: number;
  iri_predicted: number;
  condition_current: Condition;
  condition_predicted: Condition;
  urgency_predicted: Urgency;
  repair_cost_usd: number;
  deterioration_delta: number;
  priority_score: number;
}

export interface NetworkHealth {
  health_score: string;
  health_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  total_roads: number;
  total_length_km: string;
  condition_breakdown: Record<Condition, number>;
  condition_pct: Record<Condition, string>;
  avg_iri_current: string;
  avg_iri_predicted: string;
  avg_iri_delta: string;
  critical_roads: number;
  poor_roads: number;
  actionable_roads: number;
  critical_length_km: string;
  total_repair_cost_usd: string;
  urgent_repair_cost_usd: string;
  urgency_breakdown: Record<Urgency, number>;
}

export interface ForecastYear {
  year: number;
  health_score: number;
  avg_iri: number;
  max_iri: number;
  critical_roads: number;
  total_repair_cost_usd: number;
  condition_breakdown: Record<Condition, number>;
}

export interface BudgetResult {
  selected: Segment[];
  totalCost: number;
  totalImprov: number;
  condCounts: Partial<Record<Condition, number>>;
  budget: number;
  utilized: number;
}

export interface TrainPoint {
  epoch: number;
  train: number;
  val: number;
  phys: number;
}
