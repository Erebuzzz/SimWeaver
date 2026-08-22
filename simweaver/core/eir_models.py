"""
Engineering Intermediate Representation (EIR) Models for SimWeaver

Defines the simulator-independent schemas for robotics environments,
robot morphology, sensor suites, planners, controllers, coordination protocols,
objectives, constraints, and metrics evaluation results.
"""

from __future__ import annotations
import uuid
from typing import List, Dict, Any, Optional, Tuple, Literal
from pydantic import BaseModel, Field
import yaml


class BoxObstacle(BaseModel):
    """Rectangular static obstacle (e.g. shelf rack, pillar, wall)."""
    id: str = Field(default_factory=lambda: f"obs_{uuid.uuid4().hex[:6]}")
    x: float  # Center x (meters)
    y: float  # Center y (meters)
    width: float  # Width along x axis (meters)
    height: float  # Height along y axis (meters)
    label: str = "obstacle"


class ZoneSpec(BaseModel):
    """Named area in the environment (e.g. loading dock, charging pad, shelf pick area)."""
    id: str = Field(default_factory=lambda: f"zone_{uuid.uuid4().hex[:6]}")
    name: str
    x: float  # Center x
    y: float  # Center y
    width: float
    height: float
    zone_type: Literal["pick", "drop", "charging", "intersection", "parking"] = "pick"


class EnvironmentSpec(BaseModel):
    """Topological and geometric world configuration."""
    name: str = "Warehouse Standard"
    width: float = 24.0  # meters
    height: float = 16.0  # meters
    grid_resolution: float = 0.25  # meters per grid cell
    obstacles: List[BoxObstacle] = Field(default_factory=list)
    zones: List[ZoneSpec] = Field(default_factory=list)
    aisle_width: float = 2.0  # meters


class RobotMorphology(BaseModel):
    """Physical morphology and kinematic capabilities of mobile robots."""
    type: Literal["differential_drive", "omni", "ackermann"] = "differential_drive"
    count: int = 5
    radius: float = 0.28  # Robot bounding radius (meters)
    wheel_base: float = 0.40  # meters
    mass: float = 25.0  # kg
    max_linear_speed: float = 1.2  # m/s
    max_angular_speed: float = 2.0  # rad/s
    max_linear_accel: float = 1.5  # m/s^2
    max_angular_accel: float = 3.0  # rad/s^2


class SensorSpec(BaseModel):
    """On-board perceptual sensor suite."""
    lidar_enabled: bool = True
    lidar_range: float = 5.0  # meters
    lidar_fov_deg: float = 360.0  # degrees (e.g. 180, 270, 360)
    lidar_rays: int = 180  # number of angular beams
    lidar_noise_std: float = 0.01  # Gaussian measurement noise (meters)
    ultrasonic_enabled: bool = False
    ultrasonic_range: float = 2.0  # meters
    odometry_drift_rate: float = 0.005  # fraction per meter traveled


class PlannerSpec(BaseModel):
    """Navigation stack: global path planner and local reactive controller."""
    global_planner: Literal["astar", "dijkstra", "rrt", "topological"] = "astar"
    local_planner: Literal["dwa", "pure_pursuit", "velocity_obstacle", "pid"] = "dwa"
    
    # Dynamic Window Approach (DWA) parameters
    dwa_sim_time: float = 1.5  # Forward simulation horizon (seconds)
    dwa_dt: float = 0.15  # Simulation step inside DWA
    dwa_heading_weight: float = 0.4  # Weight for progress toward target
    dwa_clearance_weight: float = 0.4  # Weight for obstacle clearance
    dwa_velocity_weight: float = 0.2  # Weight for maintaining high velocity
    
    # Path tracking and margins
    path_lookahead_dist: float = 0.6  # Lookahead distance for path following (meters)
    safety_margin: float = 0.30  # Minimum safety bubble around robot (meters)
    goal_tolerance: float = 0.35  # Distance threshold to consider waypoint reached


class CoordinationSpec(BaseModel):
    """Multi-robot traffic coordination and conflict resolution protocol."""
    protocol: Literal[
        "decentralized_reactive",
        "intersection_reservation",
        "priority_token",
        "dynamic_safety_bubble"
    ] = "decentralized_reactive"
    
    intersection_reservation_radius: float = 1.8  # Radius of reservation zone (meters)
    yield_timeout_sec: float = 2.0  # Max waiting time before deadlock recovery action
    dynamic_safety_radius: bool = False  # Dynamically expand safety margin with speed
    speed_in_intersection: float = 0.6  # Speed cap inside intersections (m/s)


class TaskSpec(BaseModel):
    """Workload generation and transport logistics parameters."""
    task_count: int = 20  # Total packages to transport
    task_generation_rate: float = 12.0  # Tasks dispatched per simulated minute
    shelf_pick_time_sec: float = 2.0  # Duration robot dwells at shelf
    bay_drop_time_sec: float = 1.5  # Duration robot dwells at delivery bay


class ConstraintSpec(BaseModel):
    """Engineering thresholds that the simulation must strictly satisfy."""
    max_allowed_collisions: int = 0
    max_delivery_time_sec: float = 60.0
    min_separation_m: float = 0.30
    min_completion_rate: float = 0.95  # 95% of dispatched orders completed
    max_near_misses: int = 5  # Instances where robots came within < 0.35m without collision


class RequirementStatusItem(BaseModel):
    """Row in the requirement verification table."""
    name: str
    target: str
    actual: str
    status: Literal["PASS", "FAIL"]
    margin: Optional[float] = None  # Positive is better, negative is deficit


class MetricsResult(BaseModel):
    """Comprehensive performance telemetry and verification output."""
    total_tasks_assigned: int = 0
    total_tasks_completed: int = 0
    completion_rate: float = 0.0
    avg_delivery_time_sec: float = 0.0
    collision_count: int = 0
    near_miss_count: int = 0
    min_separation_observed_m: float = 0.0
    total_distance_traveled_m: float = 0.0
    avg_speed_m_s: float = 0.0
    energy_score: float = 0.0
    robustness_score: float = 1.0
    multi_objective_score: float = 0.0
    satisfies_all_constraints: bool = False
    requirement_table: List[RequirementStatusItem] = Field(default_factory=list)


class ObjectiveWeights(BaseModel):
    """Weights for the composite multi-objective evaluation cost J."""
    delivery_time_weight: float = 0.35
    collision_weight: float = 0.45
    energy_weight: float = 0.10
    robustness_weight: float = 0.10


class EIRSpec(BaseModel):
    """
    Complete Engineering Intermediate Representation (EIR).
    
    The central artifact exchanged between human intent, reasoning agents,
    simulation compilers, and optimization engines.
    """
    id: str = Field(default_factory=lambda: f"eir_{uuid.uuid4().hex[:8]}")
    version: str = "1.0.0"
    iteration: int = 0
    name: str = "SimWeaver Warehouse System Design"
    human_intent: str = "Warehouse multi-robot delivery with zero collisions and high throughput."
    
    environment: EnvironmentSpec = Field(default_factory=EnvironmentSpec)
    robot: RobotMorphology = Field(default_factory=RobotMorphology)
    sensors: SensorSpec = Field(default_factory=SensorSpec)
    planner: PlannerSpec = Field(default_factory=PlannerSpec)
    coordination: CoordinationSpec = Field(default_factory=CoordinationSpec)
    tasks: TaskSpec = Field(default_factory=TaskSpec)
    
    objectives: List[str] = Field(
        default_factory=lambda: [
            "minimize_delivery_time",
            "avoid_collision",
            "maintain_robot_separation",
            "maximize_throughput",
        ]
    )
    constraints: ConstraintSpec = Field(default_factory=ConstraintSpec)
    weights: ObjectiveWeights = Field(default_factory=ObjectiveWeights)
    
    design_rationale: str = "Initial baseline architecture generated from requirement analysis."

    def to_yaml(self) -> str:
        """Serializes EIR to clean YAML format."""
        return yaml.dump(self.model_dump(), sort_keys=False, default_flow_style=False)

    @classmethod
    def from_yaml(cls, yaml_str: str) -> EIRSpec:
        """Parses EIR instance from YAML string."""
        data = yaml.safe_load(yaml_str)
        return cls.model_validate(data)

    def calculate_cost_j(self, metrics: MetricsResult) -> float:
        """
        Computes the composite multi-objective cost J:
        J = w_T * T_norm + w_C * C_norm + w_E * E_norm + w_R * (1 - R)
        Lower J indicates superior engineering trade-off performance.
        """
        w = self.weights
        
        # Delivery time normalized against 60s constraint
        t_norm = min(metrics.avg_delivery_time_sec / max(self.constraints.max_delivery_time_sec, 1.0), 3.0)
        # Collision penalty (heavy step penalty for non-zero collisions)
        c_norm = 1.0 * metrics.collision_count + (0.05 * metrics.near_miss_count)
        # Energy normalized (based on average speed and distance)
        e_norm = min(metrics.energy_score / 100.0, 2.0)
        # Robustness penalty
        r_penalty = 1.0 - metrics.robustness_score
        
        cost = (
            w.delivery_time_weight * t_norm +
            w.collision_weight * c_norm +
            w.energy_weight * e_norm +
            w.robustness_weight * r_penalty
        )
        return round(float(cost), 4)
