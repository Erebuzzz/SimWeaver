"""
Continuous Kinematic and Dynamic Multi-Robot Simulation Engine for SimWeaver

Simulates multi-robot warehouse transport logistics with LiDAR perception,
kinematics, collision detection, motion planners, and traffic coordination.
"""

from __future__ import annotations
import math
import random
from typing import List, Dict, Any, Optional, Tuple
import numpy as np

from simweaver.core.eir_models import (
    EIRSpec,
    EnvironmentSpec,
    BoxObstacle,
    ZoneSpec,
    RobotMorphology,
    MetricsResult,
)
from simweaver.simulation.planners import (
    AStarPlanner,
    DWALocalPlanner,
    PurePursuitController,
    IntersectionReservationManager,
)
from simweaver.simulation.telemetry import (
    TelemetryRecorder,
    RobotTelemetrySnapshot,
    SimulationFrame,
)


class Task:
    """A shelf-to-bay logistics package transport assignment."""

    def __init__(
        self,
        task_id: str,
        pick_loc: Tuple[float, float],
        drop_loc: Tuple[float, float],
        created_at: float
    ):
        self.task_id = task_id
        self.pick_loc = pick_loc
        self.drop_loc = drop_loc
        self.created_at = created_at
        self.picked_at: Optional[float] = None
        self.completed_at: Optional[float] = None
        self.assigned_robot_id: Optional[str] = None
        self.status: str = "PENDING"  # PENDING, IN_PROGRESS, COMPLETED


class RobotState:
    """Active runtime state of a simulated autonomous mobile robot (AMR)."""

    def __init__(self, robot_id: str, x: float, y: float, theta: float, morphology: RobotMorphology, color: str):
        self.robot_id = robot_id
        self.x = x
        self.y = y
        self.theta = theta
        self.v: float = 0.0
        self.w: float = 0.0
        self.radius = morphology.radius
        self.wheel_base = morphology.wheel_base
        self.max_v = morphology.max_linear_speed
        self.max_w = morphology.max_angular_speed
        self.max_a_v = morphology.max_linear_accel
        self.max_a_w = morphology.max_angular_accel
        self.color = color

        self.state: str = "IDLE"  # IDLE, NAV_TO_PICK, PICKING, NAV_TO_DROP, DROPPING, YIELDING
        self.current_task: Optional[Task] = None
        self.dwell_timer: float = 0.0
        self.current_path: List[Tuple[float, float]] = []
        self.path_index: int = 0
        
        self.is_yielding: bool = False
        self.reservation_held: Optional[str] = None
        self.lidar_hits: List[List[float]] = []  # List of [x, y] points
        self.task_start_time: float = 0.0
        self.total_dist: float = 0.0
        self.total_energy: float = 0.0
        self.wait_time_counter: float = 0.0


class SimulationEngine:
    """
    High-performance 2D continuous simulation engine.
    """

    # Distinct visual colors for multi-robot visualization
    ROBOT_COLORS = [
        "#3B82F6",  # Blue
        "#10B981",  # Emerald Green
        "#F59E0B",  # Amber
        "#8B5CF6",  # Violet
        "#EC4899",  # Pink
        "#06B6D4",  # Cyan
        "#F97316",  # Orange
        "#84CC16",  # Lime
    ]

    def __init__(self, eir: EIRSpec, seed: Optional[int] = 42):
        self.eir = eir
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)

        self._ensure_environment_layout()
        
        # Instantiate navigation stack and traffic managers
        self.global_planner = AStarPlanner(self.eir.environment, inflation_radius=self.eir.robot.radius + 0.15)
        self.dwa_planner = DWALocalPlanner(self.eir.planner, self.eir.robot.max_linear_speed, self.eir.robot.max_angular_speed)
        self.pure_pursuit = PurePursuitController(self.eir.planner.path_lookahead_dist, self.eir.robot.max_linear_speed, self.eir.robot.max_angular_speed)
        self.reservation_mgr = IntersectionReservationManager(self.eir.coordination, self.eir.environment)
        self.telemetry = TelemetryRecorder(self.eir)

        # Simulation clock and state
        self.sim_time: float = 0.0
        self.step_index: int = 0
        self.robots: List[RobotState] = []
        self.tasks_pending: List[Task] = []
        self.tasks_completed: List[Task] = []
        
        self._init_robots()
        self._init_tasks()

    def _ensure_environment_layout(self):
        """Builds standard structured warehouse layout if obstacles are not yet defined."""
        env = self.eir.environment
        if not env.obstacles:
            # 4 dual-sided shelf storage racks
            shelves = [
                # Top-left rack
                BoxObstacle(id="shelf_tl", x=6.0, y=12.0, width=6.0, height=2.2, label="Storage Rack 1"),
                # Top-right rack
                BoxObstacle(id="shelf_tr", x=18.0, y=12.0, width=6.0, height=2.2, label="Storage Rack 2"),
                # Bottom-left rack
                BoxObstacle(id="shelf_bl", x=6.0, y=4.0, width=6.0, height=2.2, label="Storage Rack 3"),
                # Bottom-right rack
                BoxObstacle(id="shelf_br", x=18.0, y=4.0, width=6.0, height=2.2, label="Storage Rack 4"),
            ]
            env.obstacles.extend(shelves)

        if not env.zones:
            # Pick areas around shelves
            zones = [
                ZoneSpec(id="pick_1", name="Pick Zone Shelf 1", x=6.0, y=10.0, width=5.0, height=1.0, zone_type="pick"),
                ZoneSpec(id="pick_2", name="Pick Zone Shelf 2", x=18.0, y=10.0, width=5.0, height=1.0, zone_type="pick"),
                ZoneSpec(id="pick_3", name="Pick Zone Shelf 3", x=6.0, y=6.0, width=5.0, height=1.0, zone_type="pick"),
                ZoneSpec(id="pick_4", name="Pick Zone Shelf 4", x=18.0, y=6.0, width=5.0, height=1.0, zone_type="pick"),
                # Drop delivery loading bays along west and east walls
                ZoneSpec(id="bay_west", name="Loading Bay West", x=2.0, y=8.0, width=1.5, height=4.0, zone_type="drop"),
                ZoneSpec(id="bay_east", name="Loading Bay East", x=22.0, y=8.0, width=1.5, height=4.0, zone_type="drop"),
                # Main Central Intersection
                ZoneSpec(id="int_main", name="Central Intersection", x=12.0, y=8.0, width=3.6, height=3.6, zone_type="intersection"),
            ]
            env.zones.extend(zones)

    def _init_robots(self):
        """Places initial robots at non-overlapping staging locations."""
        count = self.eir.robot.count
        staging_positions = [
            (2.5, 2.0, 0.0),
            (21.5, 2.0, math.pi),
            (2.5, 14.0, 0.0),
            (21.5, 14.0, math.pi),
            (12.0, 2.0, math.pi / 2.0),
            (12.0, 14.0, -math.pi / 2.0),
            (6.0, 8.0, 0.0),
            (18.0, 8.0, math.pi),
        ]
        
        for i in range(count):
            pos = staging_positions[i % len(staging_positions)]
            color = self.ROBOT_COLORS[i % len(self.ROBOT_COLORS)]
            robot = RobotState(
                robot_id=f"amr_{i+1}",
                x=pos[0],
                y=pos[1],
                theta=pos[2],
                morphology=self.eir.robot,
                color=color
            )
            self.robots.append(robot)

    def _init_tasks(self):
        """Generates realistic shelf-to-delivery logistics transport orders."""
        pick_zones = [z for z in self.eir.environment.zones if z.zone_type == "pick"]
        drop_zones = [z for z in self.eir.environment.zones if z.zone_type == "drop"]
        
        total_tasks = self.eir.tasks.task_count
        for i in range(total_tasks):
            pz = random.choice(pick_zones) if pick_zones else self.eir.environment.zones[0]
            dz = random.choice(drop_zones) if drop_zones else self.eir.environment.zones[-1]
            
            # Generate random coordinate within target pick zone
            px = pz.x + random.uniform(-pz.width * 0.35, pz.width * 0.35)
            py = pz.y + random.uniform(-pz.height * 0.35, pz.height * 0.35)
            
            # Generate random coordinate within target delivery bay
            dx = dz.x + random.uniform(-dz.width * 0.25, dz.width * 0.25)
            dy = dz.y + random.uniform(-dz.height * 0.25, dz.height * 0.25)
            
            task = Task(
                task_id=f"task_{i+1:03d}",
                pick_loc=(px, py),
                drop_loc=(dx, dy),
                created_at=0.0
            )
            self.tasks_pending.append(task)

    def step(self, dt: float = 0.05):
        """Executes a single simulation tick (dt seconds)."""
        self.sim_time += dt
        self.step_index += 1

        # 1. Update task assignments and navigation states
        for robot in self.robots:
            self._update_robot_task_state(robot, dt)

        # 2. Simulate sensors (LiDAR raycasting against obstacles & other robots)
        if self.eir.sensors.lidar_enabled:
            for robot in self.robots:
                self._simulate_lidar(robot)

        # 3. Intersection reservation checks and traffic coordination
        for robot in self.robots:
            granted, z_id = self.reservation_mgr.request_access(robot.robot_id, robot.x, robot.y)
            if not granted:
                robot.is_yielding = True
                robot.wait_time_counter += dt
            else:
                robot.is_yielding = False
                if z_id:
                    robot.reservation_held = z_id
            
            # If robot held reservation and has moved away, release it
            if robot.reservation_held:
                self.reservation_mgr.release_access(robot.robot_id, robot.x, robot.y)
                # Check if still holding
                if self.reservation_mgr.active_reservations.get(robot.reservation_held) != robot.robot_id:
                    robot.reservation_held = None

        # 4. Motion planning and control velocity selection
        for robot in self.robots:
            if robot.state in ["PICKING", "DROPPING"]:
                # Station dwell: stationary
                robot.v = 0.0
                robot.w = 0.0
                continue

            if robot.is_yielding:
                # Yielding: decelerate smoothly to stop before intersection
                robot.v = max(0.0, robot.v - robot.max_a_v * dt * 2.0)
                robot.w = 0.0
                continue

            if not robot.current_path or robot.path_index >= len(robot.current_path):
                robot.v = 0.0
                robot.w = 0.0
                continue

            target_point = robot.current_path[min(robot.path_index, len(robot.current_path) - 1)]

            # Check if waypoint reached
            dist_to_waypoint = math.hypot(target_point[0] - robot.x, target_point[1] - robot.y)
            if dist_to_waypoint < self.eir.planner.goal_tolerance:
                robot.path_index += 1
                if robot.path_index < len(robot.current_path):
                    target_point = robot.current_path[robot.path_index]

            # Dynamic obstacle list for local controller (positions and radii of other robots)
            obstacles: List[Tuple[float, float, float]] = []
            for other in self.robots:
                if other.robot_id != robot.robot_id:
                    obstacles.append((other.x, other.y, other.radius))

            # Dynamic safety margin expansion if enabled
            safety_margin = self.eir.planner.safety_margin
            if self.eir.coordination.dynamic_safety_radius:
                safety_margin += 0.15 * (robot.v / max(robot.max_v, 0.1))

            if self.eir.planner.local_planner == "dwa":
                cmd_v, cmd_w = self.dwa_planner.compute_velocity(
                    current_pose=(robot.x, robot.y, robot.theta),
                    current_vel=(robot.v, robot.w),
                    target_waypoint=target_point,
                    obstacles=obstacles,
                    dt=dt,
                    safety_margin=safety_margin
                )
                robot.v = cmd_v
                robot.w = cmd_w
            else:
                cmd_v, cmd_w, next_idx = self.pure_pursuit.compute_command(
                    pose=(robot.x, robot.y, robot.theta),
                    path=robot.current_path,
                    current_index=robot.path_index
                )
                robot.v = cmd_v
                robot.w = cmd_w
                robot.path_index = next_idx

        # 5. Kinematic integration and position update
        for robot in self.robots:
            robot.x += robot.v * math.cos(robot.theta) * dt
            robot.y += robot.v * math.sin(robot.theta) * dt
            robot.theta += robot.w * dt
            
            # Wrap theta into [-pi, pi]
            while robot.theta > math.pi:
                robot.theta -= 2.0 * math.pi
            while robot.theta < -math.pi:
                robot.theta += 2.0 * math.pi

            # Boundary clamping
            robot.x = float(np.clip(robot.x, robot.radius, self.eir.environment.width - robot.radius))
            robot.y = float(np.clip(robot.y, robot.radius, self.eir.environment.height - robot.radius))

            # Track distance and energy consumption
            step_dist = robot.v * dt
            robot.total_dist += step_dist
            self.telemetry.total_distance_traveled += step_dist
            # Energy cost formula: mechanical power integral
            energy_step = (0.5 * robot.v**2 + 0.1 * abs(robot.w)) * dt
            robot.total_energy += energy_step
            self.telemetry.total_energy_accumulated += energy_step

        # 6. Continuous collision and near-miss detection
        self._check_collisions(dt)

        # 7. Record telemetry snapshot periodically (every 0.1s / 2 ticks)
        if self.step_index % 2 == 0:
            snapshots = []
            for r in self.robots:
                target_x, target_y = None, None
                if r.current_path and r.path_index < len(r.current_path):
                    target_x, target_y = r.current_path[r.path_index]

                snapshots.append(
                    RobotTelemetrySnapshot(
                        robot_id=r.robot_id,
                        x=round(r.x, 3),
                        y=round(r.y, 3),
                        theta=round(r.theta, 3),
                        v=round(r.v, 2),
                        w=round(r.w, 2),
                        state=r.state,
                        task_id=r.current_task.task_id if r.current_task else None,
                        target_x=round(target_x, 2) if target_x is not None else None,
                        target_y=round(target_y, 2) if target_y is not None else None,
                        is_yielding=r.is_yielding,
                        reservation_held=r.reservation_held,
                        lidar_hits=[[round(pt[0], 2), round(pt[1], 2)] for pt in r.lidar_hits[:16]]  # Downsample for stream
                    )
                )
            self.telemetry.record_frame(
                sim_time=self.sim_time,
                step_index=self.step_index,
                robot_snapshots=snapshots,
                active_reservations=self.reservation_mgr.active_reservations,
                completed_count=len(self.tasks_completed)
            )

    def _update_robot_task_state(self, robot: RobotState, dt: float):
        """State machine managing logistics workflow transitions."""
        if robot.state == "IDLE":
            if self.tasks_pending:
                task = self.tasks_pending.pop(0)
                task.status = "IN_PROGRESS"
                task.assigned_robot_id = robot.robot_id
                robot.current_task = task
                robot.task_start_time = self.sim_time
                robot.state = "NAV_TO_PICK"
                robot.current_path = self.global_planner.plan_path((robot.x, robot.y), task.pick_loc)
                robot.path_index = 0

        elif robot.state == "NAV_TO_PICK":
            dist = math.hypot(robot.x - robot.current_task.pick_loc[0], robot.y - robot.current_task.pick_loc[1])
            if dist <= self.eir.planner.goal_tolerance or robot.path_index >= len(robot.current_path):
                robot.state = "PICKING"
                robot.dwell_timer = self.eir.tasks.shelf_pick_time_sec

        elif robot.state == "PICKING":
            robot.dwell_timer -= dt
            if robot.dwell_timer <= 0.0:
                robot.current_task.picked_at = self.sim_time
                robot.state = "NAV_TO_DROP"
                robot.current_path = self.global_planner.plan_path((robot.x, robot.y), robot.current_task.drop_loc)
                robot.path_index = 0

        elif robot.state == "NAV_TO_DROP":
            dist = math.hypot(robot.x - robot.current_task.drop_loc[0], robot.y - robot.current_task.drop_loc[1])
            if dist <= self.eir.planner.goal_tolerance or robot.path_index >= len(robot.current_path):
                robot.state = "DROPPING"
                robot.dwell_timer = self.eir.tasks.bay_drop_time_sec

        elif robot.state == "DROPPING":
            robot.dwell_timer -= dt
            if robot.dwell_timer <= 0.0:
                task = robot.current_task
                task.completed_at = self.sim_time
                task.status = "COMPLETED"
                duration = self.sim_time - robot.task_start_time
                
                self.telemetry.record_task_completed(task.task_id, robot.robot_id, duration, self.sim_time)
                self.tasks_completed.append(task)
                
                robot.current_task = None
                robot.state = "IDLE"
                robot.current_path = []
                robot.path_index = 0

    def _simulate_lidar(self, robot: RobotState):
        """Raycasts 2D LiDAR beams against environment obstacles and other robots."""
        spec = self.eir.sensors
        fov_rad = math.radians(spec.lidar_fov_deg)
        rays = min(spec.lidar_rays, 36)  # 36 sampled rays for simulation efficiency
        max_range = spec.lidar_range
        
        start_angle = robot.theta - fov_rad / 2.0
        angle_step = fov_rad / max(1, rays - 1)
        
        hit_points: List[List[float]] = []

        for i in range(rays):
            ray_angle = start_angle + i * angle_step
            cos_a = math.cos(ray_angle)
            sin_a = math.sin(ray_angle)

            # Test ray against static obstacles
            closest_hit_dist = max_range
            for obs in self.eir.environment.obstacles:
                # Bounding box ray intersection
                min_x = obs.x - obs.width / 2.0
                max_x = obs.x + obs.width / 2.0
                min_y = obs.y - obs.height / 2.0
                max_y = obs.y + obs.height / 2.0
                
                dist = self._ray_aabb_intersection(robot.x, robot.y, cos_a, sin_a, min_x, max_x, min_y, max_y)
                if dist is not None and 0.0 < dist < closest_hit_dist:
                    closest_hit_dist = dist

            # Test ray against other dynamic robots (circle intersection)
            for other in self.robots:
                if other.robot_id == robot.robot_id:
                    continue
                dist = self._ray_circle_intersection(robot.x, robot.y, cos_a, sin_a, other.x, other.y, other.radius)
                if dist is not None and 0.0 < dist < closest_hit_dist:
                    closest_hit_dist = dist

            if closest_hit_dist < max_range:
                # Add Gaussian noise
                noisy_dist = max(0.1, closest_hit_dist + random.gauss(0.0, spec.lidar_noise_std))
                hx = robot.x + noisy_dist * cos_a
                hy = robot.y + noisy_dist * sin_a
                hit_points.append([hx, hy])

        robot.lidar_hits = hit_points

    @staticmethod
    def _ray_aabb_intersection(
        rx: float, ry: float, dx: float, dy: float,
        min_x: float, max_x: float, min_y: float, max_y: float
    ) -> Optional[float]:
        """Slab method for ray vs axis-aligned bounding box."""
        tx1 = (min_x - rx) / (dx + 1e-9)
        tx2 = (max_x - rx) / (dx + 1e-9)
        tmin = min(tx1, tx2)
        tmax = max(tx1, tx2)

        ty1 = (min_y - ry) / (dy + 1e-9)
        ty2 = (max_y - ry) / (dy + 1e-9)
        tmin = max(tmin, min(ty1, ty2))
        tmax = min(tmax, max(ty1, ty2))

        if tmax >= tmin and tmax > 0:
            return max(0.0, tmin)
        return None

    @staticmethod
    def _ray_circle_intersection(
        rx: float, ry: float, dx: float, dy: float,
        cx: float, cy: float, radius: float
    ) -> Optional[float]:
        """Ray vs 2D circle intersection."""
        fx = rx - cx
        fy = ry - cy
        
        b = 2.0 * (fx * dx + fy * dy)
        c = (fx * fx + fy * fy) - radius * radius
        discriminant = b * b - 4.0 * c
        
        if discriminant >= 0:
            sqrt_d = math.sqrt(discriminant)
            t1 = (-b - sqrt_d) / 2.0
            if t1 > 0:
                return t1
        return None

    def _check_collisions(self, dt: float):
        """Continuous collision and near-miss detector."""
        num_robots = len(self.robots)
        
        for i in range(num_robots):
            r1 = self.robots[i]
            
            # Robot-to-Robot pairwise check
            for j in range(i + 1, num_robots):
                r2 = self.robots[j]
                dist = math.hypot(r1.x - r2.x, r1.y - r2.y)
                collision_threshold = r1.radius + r2.radius
                near_miss_threshold = collision_threshold + 0.15

                if dist < collision_threshold:
                    # Collision detected!
                    relative_speed = math.hypot(r1.v * math.cos(r1.theta) - r2.v * math.cos(r2.theta),
                                                r1.v * math.sin(r1.theta) - r2.v * math.sin(r2.theta))
                    
                    loc = ((r1.x + r2.x) / 2.0, (r1.y + r2.y) / 2.0)
                    cause = "intersection_conflict" if (r1.is_yielding is False and r2.is_yielding is False and
                                                       math.hypot(loc[0] - 12.0, loc[1] - 8.0) < 4.0) else "local_avoidance_failure"
                    
                    self.telemetry.record_collision(
                        sim_time=self.sim_time,
                        r1_id=r1.robot_id,
                        r2_id=r2.robot_id,
                        obs_type="robot",
                        loc=loc,
                        speed=relative_speed,
                        cause=cause
                    )
                elif dist < near_miss_threshold:
                    loc = ((r1.x + r2.x) / 2.0, (r1.y + r2.y) / 2.0)
                    self.telemetry.record_near_miss(self.sim_time, r1.robot_id, r2.robot_id, dist, loc)

            # Robot-to-Obstacle check
            for obs in self.eir.environment.obstacles:
                min_x = obs.x - obs.width / 2.0
                max_x = obs.x + obs.width / 2.0
                min_y = obs.y - obs.height / 2.0
                max_y = obs.y + obs.height / 2.0
                
                # Closest point on box to robot center
                closest_x = float(np.clip(r1.x, min_x, max_x))
                closest_y = float(np.clip(r1.y, min_y, max_y))
                obs_dist = math.hypot(r1.x - closest_x, r1.y - closest_y)
                
                if obs_dist < r1.radius:
                    self.telemetry.record_collision(
                        sim_time=self.sim_time,
                        r1_id=r1.robot_id,
                        r2_id=None,
                        obs_type=obs.label,
                        loc=(closest_x, closest_y),
                        speed=r1.v,
                        cause="obstacle_clearance_violation"
                    )

    def run_full_simulation(self, max_sim_time: float = 70.0, dt: float = 0.05, robustness_score: float = 1.0) -> Tuple[MetricsResult, TelemetryRecorder]:
        """Runs the complete simulation headless until tasks finish or max time elapsed."""
        total_steps = int(max_sim_time / dt)
        target_tasks = self.eir.tasks.task_count

        for _ in range(total_steps):
            if len(self.tasks_completed) >= target_tasks:
                break
            self.step(dt)

        metrics = self.telemetry.finalize_metrics(
            total_tasks_assigned=target_tasks,
            robustness_score=robustness_score
        )
        return metrics, self.telemetry
