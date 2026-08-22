"""
Telemetry and Micro-Event Recording Engine for SimWeaver

Captures high-resolution trajectory traces, sensor hits, collision events,
near-misses, intersection wait times, and evaluates final KPI metrics.
"""

from __future__ import annotations
import math
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field
from simweaver.core.eir_models import EIRSpec, MetricsResult, RequirementStatusItem


class RobotTelemetrySnapshot(BaseModel):
    """Instantaneous telemetry for a single robot."""
    robot_id: str
    x: float
    y: float
    theta: float
    v: float
    w: float
    state: str
    task_id: Optional[str] = None
    target_x: Optional[float] = None
    target_y: Optional[float] = None
    is_yielding: bool = False
    reservation_held: Optional[str] = None
    lidar_hits: List[List[float]] = Field(default_factory=list)  # [[x, y], ...]


class CollisionEvent(BaseModel):
    """Detailed collision incidence report."""
    timestamp: float
    robot_id_a: str
    robot_id_b: Optional[str] = None  # None if collided with static obstacle
    obstacle_type: str = "robot"  # "robot" or "shelf" or "wall"
    location: Tuple[float, float]
    impact_speed: float
    cause_category: str = "intersection_conflict"


class NearMissEvent(BaseModel):
    """Near-miss safety alert (separation violated below threshold)."""
    timestamp: float
    robot_id_a: str
    robot_id_b: str
    min_distance: float
    location: Tuple[float, float]


class TaskEvent(BaseModel):
    """Logistics task lifecycle event."""
    timestamp: float
    task_id: str
    robot_id: str
    event_type: str  # "DISPATCHED", "PICKED", "COMPLETED"
    duration_sec: Optional[float] = None


class SimulationFrame(BaseModel):
    """Time-indexed simulation snapshot for WebSocket playback and live visualizer."""
    sim_time: float
    step_index: int
    robots: List[RobotTelemetrySnapshot]
    active_reservations: Dict[str, str] = Field(default_factory=dict)
    collision_count_so_far: int = 0
    completed_tasks_so_far: int = 0


class TelemetryRecorder:
    """
    In-memory high-throughput telemetry collector and metrics synthesizer.
    """

    def __init__(self, eir: EIRSpec):
        self.eir = eir
        self.frames: List[SimulationFrame] = []
        self.collision_events: List[CollisionEvent] = []
        self.near_miss_events: List[NearMissEvent] = []
        self.task_events: List[TaskEvent] = []
        
        # Aggregate accumulators
        self.total_distance_traveled: float = 0.0
        self.task_durations: List[float] = []
        self.min_separation_observed: float = float('inf')
        self.total_energy_accumulated: float = 0.0

    def record_frame(
        self,
        sim_time: float,
        step_index: int,
        robot_snapshots: List[RobotTelemetrySnapshot],
        active_reservations: Dict[str, str],
        completed_count: int
    ):
        """Records a simulation tick frame."""
        frame = SimulationFrame(
            sim_time=round(sim_time, 2),
            step_index=step_index,
            robots=robot_snapshots,
            active_reservations=dict(active_reservations),
            collision_count_so_far=len(self.collision_events),
            completed_tasks_so_far=completed_count
        )
        self.frames.append(frame)

    def record_collision(
        self,
        sim_time: float,
        r1_id: str,
        r2_id: Optional[str],
        obs_type: str,
        loc: Tuple[float, float],
        speed: float,
        cause: str = "intersection_conflict"
    ):
        """Logs a collision incident."""
        event = CollisionEvent(
            timestamp=round(sim_time, 2),
            robot_id_a=r1_id,
            robot_id_b=r2_id,
            obstacle_type=obs_type,
            location=(round(loc[0], 2), round(loc[1], 2)),
            impact_speed=round(speed, 2),
            cause_category=cause
        )
        self.collision_events.append(event)

    def record_near_miss(
        self,
        sim_time: float,
        r1_id: str,
        r2_id: str,
        dist: float,
        loc: Tuple[float, float]
    ):
        """Logs a near-miss separation breach."""
        if dist < self.min_separation_observed:
            self.min_separation_observed = dist

        event = NearMissEvent(
            timestamp=round(sim_time, 2),
            robot_id_a=r1_id,
            robot_id_b=r2_id,
            min_distance=round(dist, 3),
            location=(round(loc[0], 2), round(loc[1], 2))
        )
        self.near_miss_events.append(event)

    def record_task_completed(self, task_id: str, robot_id: str, duration: float, sim_time: float):
        """Logs completion of a transport order."""
        self.task_durations.append(duration)
        self.task_events.append(
            TaskEvent(
                timestamp=round(sim_time, 2),
                task_id=task_id,
                robot_id=robot_id,
                event_type="COMPLETED",
                duration_sec=round(duration, 2)
            )
        )

    def finalize_metrics(self, total_tasks_assigned: int, robustness_score: float = 1.0) -> MetricsResult:
        """
        Synthesizes raw telemetry into final performance MetricsResult and requirement status table.
        """
        completed = len(self.task_durations)
        completion_rate = completed / max(1, total_tasks_assigned)
        avg_delivery_time = float(sum(self.task_durations) / max(1, completed)) if completed > 0 else 999.0
        collision_count = len(self.collision_events)
        near_miss_count = len(self.near_miss_events)
        min_sep = self.min_separation_observed if self.min_separation_observed != float('inf') else 2.0

        constraints = self.eir.constraints
        
        # Build requirement verification table
        req_table: List[RequirementStatusItem] = []

        # 1. Collision count
        col_status = "PASS" if collision_count <= constraints.max_allowed_collisions else "FAIL"
        req_table.append(
            RequirementStatusItem(
                name="Collision Count",
                target=f"<= {constraints.max_allowed_collisions}",
                actual=f"{collision_count}",
                status=col_status
            )
        )

        # 2. Average delivery time
        time_status = "PASS" if avg_delivery_time <= constraints.max_delivery_time_sec and completed > 0 else "FAIL"
        req_table.append(
            RequirementStatusItem(
                name="Avg Delivery Time",
                target=f"< {constraints.max_delivery_time_sec:.1f}s",
                actual=f"{avg_delivery_time:.1f}s",
                status=time_status
            )
        )

        # 3. Minimum separation distance
        sep_status = "PASS" if min_sep >= constraints.min_separation_m and collision_count == 0 else "FAIL"
        req_table.append(
            RequirementStatusItem(
                name="Min Separation",
                target=f"> {constraints.min_separation_m:.2f}m",
                actual=f"{min_sep:.2f}m",
                status=sep_status
            )
        )

        # 4. Completion rate
        comp_status = "PASS" if completion_rate >= constraints.min_completion_rate else "FAIL"
        req_table.append(
            RequirementStatusItem(
                name="Completion Rate",
                target=f">= {int(constraints.min_completion_rate * 100)}%",
                actual=f"{int(completion_rate * 100)}%",
                status=comp_status
            )
        )

        satisfies_all = all(item.status == "PASS" for item in req_table)

        metrics = MetricsResult(
            total_tasks_assigned=total_tasks_assigned,
            total_tasks_completed=completed,
            completion_rate=round(completion_rate, 3),
            avg_delivery_time_sec=round(avg_delivery_time, 2),
            collision_count=collision_count,
            near_miss_count=near_miss_count,
            min_separation_observed_m=round(min_sep, 3),
            total_distance_traveled_m=round(self.total_distance_traveled, 2),
            avg_speed_m_s=round(self.total_distance_traveled / max(1.0, len(self.frames) * 0.05), 2),
            energy_score=round(self.total_energy_accumulated, 2),
            robustness_score=round(robustness_score, 2),
            satisfies_all_constraints=satisfies_all,
            requirement_table=req_table
        )
        
        metrics.multi_objective_score = self.eir.calculate_cost_j(metrics)
        return metrics
