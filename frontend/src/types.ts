export interface BoxObstacle {
  id: string;
  x: float;
  y: float;
  width: float;
  height: float;
  label: string;
}

export type float = number;

export interface ZoneSpec {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zone_type: 'pick' | 'drop' | 'charging' | 'intersection' | 'parking';
}

export interface EnvironmentSpec {
  name: string;
  width: number;
  height: number;
  grid_resolution: number;
  obstacles: BoxObstacle[];
  zones: ZoneSpec[];
  aisle_width: number;
}

export interface RobotMorphology {
  type: string;
  count: number;
  radius: number;
  wheel_base: number;
  mass: number;
  max_linear_speed: number;
  max_angular_speed: number;
  max_linear_accel: number;
  max_angular_accel: number;
}

export interface SensorSpec {
  lidar_enabled: boolean;
  lidar_range: number;
  lidar_fov_deg: number;
  lidar_rays: number;
  lidar_noise_std: number;
  ultrasonic_enabled: boolean;
  ultrasonic_range: number;
}

export interface PlannerSpec {
  global_planner: string;
  local_planner: string;
  dwa_sim_time: number;
  dwa_heading_weight: number;
  dwa_clearance_weight: number;
  dwa_velocity_weight: number;
  path_lookahead_dist: number;
  safety_margin: number;
  goal_tolerance: number;
}

export interface CoordinationSpec {
  protocol: 'decentralized_reactive' | 'intersection_reservation' | 'priority_token' | 'dynamic_safety_bubble';
  intersection_reservation_radius: number;
  yield_timeout_sec: number;
  dynamic_safety_radius: boolean;
  speed_in_intersection: number;
}

export interface ConstraintSpec {
  max_allowed_collisions: number;
  max_delivery_time_sec: number;
  min_separation_m: number;
  min_completion_rate: number;
  max_near_misses: number;
}

export interface EIRSpec {
  id: string;
  version: string;
  iteration: number;
  name: string;
  human_intent: string;
  environment: EnvironmentSpec;
  robot: RobotMorphology;
  sensors: SensorSpec;
  planner: PlannerSpec;
  coordination: CoordinationSpec;
  objectives: string[];
  constraints: ConstraintSpec;
  design_rationale: string;
}

export interface RequirementStatusItem {
  name: string;
  target: string;
  actual: string;
  status: 'PASS' | 'FAIL';
  margin?: number;
}

export interface MetricsResult {
  total_tasks_assigned: number;
  total_tasks_completed: number;
  completion_rate: number;
  avg_delivery_time_sec: number;
  collision_count: number;
  near_miss_count: number;
  min_separation_observed_m: number;
  total_distance_traveled_m: number;
  avg_speed_m_s: number;
  energy_score: number;
  robustness_score: number;
  multi_objective_score: number;
  satisfies_all_constraints: boolean;
  requirement_table: RequirementStatusItem[];
}

export interface InterventionCandidate {
  id: string;
  title: string;
  description: string;
  category: string;
  expected_collision_reduction: string;
  expected_delivery_impact: string;
  implementation_complexity: string;
  predicted_tradeoff_score: number;
  parameter_changes: Record<string, any>;
  rationale: string;
  is_selected: boolean;
}

export interface CausalDiagnosis {
  id: string;
  failure_type: string;
  bottleneck_location: string;
  observed_pattern: string;
  primary_root_cause: string;
  secondary_root_cause: string;
  affected_robot_ids: string[];
  recommended_interventions: string[];
}

export interface PerturbationTestResult {
  name: string;
  perturbation_type: string;
  delta_percentage: number;
  collisions: number;
  avg_delivery_time: number;
  passed: boolean;
}

export interface CriticVerdict {
  passed: boolean;
  confidence_score: number;
  robustness_index: number;
  perturbation_results: PerturbationTestResult[];
  verdict_summary: string;
  rejection_reason?: string;
}

export interface ExperimentRecord {
  experiment_id: number;
  timestamp: number;
  iteration: number;
  name: string;
  eir_design: EIRSpec;
  metrics: MetricsResult;
  cost_j: number;
  diagnosis?: CausalDiagnosis;
  candidate_interventions: InterventionCandidate[];
  selected_intervention?: InterventionCandidate;
  critic_verdict?: CriticVerdict;
  parameter_diff: Record<string, any>;
  summary_notes: string;
}

export interface RobotTelemetrySnapshot {
  robot_id: string;
  x: number;
  y: number;
  theta: number;
  v: number;
  w: number;
  state: string;
  task_id?: string;
  target_x?: number;
  target_y?: number;
  is_yielding: boolean;
  reservation_held?: string;
  lidar_hits: [number, number][];
}

export interface SimulationFrame {
  sim_time: number;
  step_index: number;
  robots: RobotTelemetrySnapshot[];
  active_reservations: Record<string, string>;
  collision_count_so_far: number;
  completed_tasks_so_far: number;
}

export interface ThoughtEvent {
  timestamp: number;
  agent: string;
  stage: string;
  title: string;
  content: string;
  payload?: Record<string, any>;
}
