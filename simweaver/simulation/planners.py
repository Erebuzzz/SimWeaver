"""
Motion Planning and Multi-Robot Coordination Algorithms for SimWeaver

Includes:
1. AStarPlanner: Discretized 8-connected grid planner with line-of-sight smoothing.
2. DWALocalPlanner: Dynamic Window Approach searching linear and angular velocity spaces.
3. PurePursuitController: Geometric path tracker.
4. IntersectionReservationManager: Spatial-temporal conflict resolution for multi-robot intersections.
"""

from __future__ import annotations
import math
import heapq
from typing import List, Tuple, Dict, Optional, Set
import numpy as np
from simweaver.core.eir_models import EnvironmentSpec, BoxObstacle, PlannerSpec, CoordinationSpec


class AStarPlanner:
    """
    Global 2D grid-based path planner with inflation margin and waypoint smoothing.
    """

    def __init__(self, env: EnvironmentSpec, inflation_radius: float = 0.40):
        self.width = env.width
        self.height = env.height
        self.resolution = env.grid_resolution
        self.inflation_radius = inflation_radius
        
        self.grid_w = int(math.ceil(self.width / self.resolution))
        self.grid_h = int(math.ceil(self.height / self.resolution))
        
        # 0 = free, 1 = obstacle / inflated
        self.grid = np.zeros((self.grid_w, self.grid_h), dtype=np.uint8)
        self._build_grid(env.obstacles)

    def _world_to_grid(self, x: float, y: float) -> Tuple[int, int]:
        gx = int(np.clip(x / self.resolution, 0, self.grid_w - 1))
        gy = int(np.clip(y / self.resolution, 0, self.grid_h - 1))
        return (gx, gy)

    def _grid_to_world(self, gx: int, gy: int) -> Tuple[float, float]:
        x = (gx + 0.5) * self.resolution
        y = (gy + 0.5) * self.resolution
        return (x, y)

    def _build_grid(self, obstacles: List[BoxObstacle]):
        """Bakes obstacles and inflates boundaries by robot radius + safety margin."""
        inflation_cells = int(math.ceil(self.inflation_radius / self.resolution))
        
        for obs in obstacles:
            # Obstacle bounds in grid coordinates
            min_x = max(0, int((obs.x - obs.width / 2.0) / self.resolution) - inflation_cells)
            max_x = min(self.grid_w - 1, int((obs.x + obs.width / 2.0) / self.resolution) + inflation_cells)
            min_y = max(0, int((obs.y - obs.height / 2.0) / self.resolution) - inflation_cells)
            max_y = min(self.grid_h - 1, int((obs.y + obs.height / 2.0) / self.resolution) + inflation_cells)
            
            self.grid[min_x:max_x + 1, min_y:max_y + 1] = 1

        # Inflate world outer boundaries
        boundary_cells = max(1, inflation_cells)
        self.grid[:boundary_cells, :] = 1
        self.grid[self.grid_w - boundary_cells:, :] = 1
        self.grid[:, :boundary_cells] = 1
        self.grid[:, self.grid_h - boundary_cells:] = 1

    def is_free(self, x: float, y: float) -> bool:
        """Checks if a continuous world coordinate is traversable."""
        gx, gy = self._world_to_grid(x, y)
        return bool(self.grid[gx, gy] == 0)

    def plan_path(self, start: Tuple[float, float], goal: Tuple[float, float]) -> List[Tuple[float, float]]:
        """
        Plans an optimal A* path between start and goal in continuous coordinates.
        Returns a smoothed list of waypoints.
        """
        start_g = self._world_to_grid(start[0], start[1])
        goal_g = self._world_to_grid(goal[0], goal[1])

        # If goal is inside obstacle due to strict inflation, find closest free cell
        if self.grid[goal_g[0], goal_g[1]] != 0:
            goal_g = self._find_nearest_free_cell(goal_g)

        if self.grid[start_g[0], start_g[1]] != 0:
            start_g = self._find_nearest_free_cell(start_g)

        # Priority queue for A*
        open_set: List[Tuple[float, float, int, int]] = []  # (f_score, g_score, gx, gy)
        heapq.heappush(open_set, (0.0, 0.0, start_g[0], start_g[1]))
        
        came_from: Dict[Tuple[int, int], Tuple[int, int]] = {}
        g_scores: Dict[Tuple[int, int], float] = {start_g: 0.0}

        # 8-connected neighbors with costs
        neighbors = [
            (1, 0, 1.0), (-1, 0, 1.0), (0, 1, 1.0), (0, -1, 1.0),
            (1, 1, 1.414), (1, -1, 1.414), (-1, 1, 1.414), (-1, -1, 1.414)
        ]

        found = False
        while open_set:
            _, current_g, cx, cy = heapq.heappop(open_set)
            
            if (cx, cy) == goal_g:
                found = True
                break

            if current_g > g_scores.get((cx, cy), float('inf')):
                continue

            for dx, dy, cost in neighbors:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < self.grid_w and 0 <= ny < self.grid_h:
                    if self.grid[nx, ny] != 0:
                        continue
                    
                    # Prevent diagonal corner cutting
                    if dx != 0 and dy != 0:
                        if self.grid[cx + dx, cy] != 0 or self.grid[cx, cy + dy] != 0:
                            continue

                    tentative_g = current_g + cost
                    if tentative_g < g_scores.get((nx, ny), float('inf')):
                        g_scores[(nx, ny)] = tentative_g
                        # Euclidean distance heuristic
                        h = math.hypot(nx - goal_g[0], ny - goal_g[1])
                        came_from[(nx, ny)] = (cx, cy)
                        heapq.heappush(open_set, (tentative_g + h, tentative_g, nx, ny))

        if not found:
            # Fallback: return direct straight line
            return [start, goal]

        # Reconstruct path
        path_g = [goal_g]
        curr = goal_g
        while curr in came_from:
            curr = came_from[curr]
            path_g.append(curr)
        path_g.reverse()

        # Convert to world coordinates
        world_path = [self._grid_to_world(gx, gy) for gx, gy in path_g]
        world_path[0] = start
        world_path[-1] = goal

        # Smooth waypoints using line-of-sight shortcutting
        return self._smooth_path(world_path)

    def _find_nearest_free_cell(self, cell: Tuple[int, int]) -> Tuple[int, int]:
        cx, cy = cell
        for radius in range(1, 20):
            for dx in range(-radius, radius + 1):
                for dy in range(-radius, radius + 1):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < self.grid_w and 0 <= ny < self.grid_h:
                        if self.grid[nx, ny] == 0:
                            return (nx, ny)
        return cell

    def _smooth_path(self, path: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
        """Removes redundant intermediate waypoints via line-of-sight ray checks."""
        if len(path) <= 2:
            return path

        smoothed = [path[0]]
        current_idx = 0

        while current_idx < len(path) - 1:
            next_idx = len(path) - 1
            while next_idx > current_idx + 1:
                if self._line_of_sight(smoothed[-1], path[next_idx]):
                    break
                next_idx -= 1
            
            smoothed.append(path[next_idx])
            current_idx = next_idx

        return smoothed

    def _line_of_sight(self, p1: Tuple[float, float], p2: Tuple[float, float]) -> bool:
        """Tests if direct line segment between p1 and p2 is collision-free."""
        dist = math.hypot(p2[0] - p1[0], p2[1] - p1[1])
        steps = max(2, int(dist / (self.resolution * 0.5)))
        for i in range(steps + 1):
            t = i / steps
            x = p1[0] + t * (p2[0] - p1[0])
            y = p1[1] + t * (p2[1] - p1[1])
            gx, gy = self._world_to_grid(x, y)
            if self.grid[gx, gy] != 0:
                return False
        return True


class DWALocalPlanner:
    """
    Dynamic Window Approach (DWA) for local reactive velocity selection and obstacle avoidance.
    """

    def __init__(self, planner_spec: PlannerSpec, max_linear_speed: float = 1.2, max_angular_speed: float = 2.0):
        self.spec = planner_spec
        self.max_v = max_linear_speed
        self.max_w = max_angular_speed
        self.max_a_v = 1.8  # linear acceleration limit m/s^2
        self.max_a_w = 3.2  # angular acceleration limit rad/s^2

    def compute_velocity(
        self,
        current_pose: Tuple[float, float, float],  # (x, y, theta)
        current_vel: Tuple[float, float],  # (v, w)
        target_waypoint: Tuple[float, float],  # (target_x, target_y)
        obstacles: List[Tuple[float, float, float]],  # list of (x, y, radius) of other robots/obstacles
        dt: float = 0.10,
        safety_margin: float = 0.30
    ) -> Tuple[float, float]:
        """
        Evaluates candidate (v, w) trajectories and selects the one maximizing objective score.
        """
        x, y, theta = current_pose
        v_curr, w_curr = current_vel

        # 1. Compute dynamic window bounds
        v_min = max(0.0, v_curr - self.max_a_v * dt)
        v_max = min(self.max_v, v_curr + self.max_a_v * dt)
        
        w_min = max(-self.max_w, w_curr - self.max_a_w * dt)
        w_max = min(self.max_w, w_curr + self.max_a_w * dt)

        # 2. Sample velocity candidate pairs
        v_samples = np.linspace(v_min, v_max, 7)
        w_samples = np.linspace(w_min, w_max, 11)

        best_score = -float('inf')
        best_v = 0.0
        best_w = 0.0

        target_dist = math.hypot(target_waypoint[0] - x, target_waypoint[1] - y)
        if target_dist < self.spec.goal_tolerance:
            return (0.0, 0.0)

        for v in v_samples:
            for w in w_samples:
                # Integrate trajectory over prediction horizon
                traj_x, traj_y, traj_theta, min_clearance = self._predict_trajectory(
                    x, y, theta, v, w, obstacles, self.spec.dwa_sim_time, self.spec.dwa_dt
                )

                # If predicted clearance breaches minimum threshold, reject trajectory
                effective_safety = safety_margin + 0.10
                if min_clearance < effective_safety and v > 0.05:
                    continue

                # Heading score: difference between trajectory endpoint heading and goal angle
                angle_to_goal = math.atan2(target_waypoint[1] - traj_y, target_waypoint[0] - traj_x)
                heading_diff = abs(self._normalize_angle(angle_to_goal - traj_theta))
                heading_score = math.pi - heading_diff  # Higher is better

                # Clearance score: distance to nearest obstacle
                clearance_score = min(min_clearance, 3.0)

                # Velocity score: encourages forward progress
                velocity_score = v / max(self.max_v, 0.01)

                # Total weighted score
                score = (
                    self.spec.dwa_heading_weight * heading_score +
                    self.spec.dwa_clearance_weight * clearance_score +
                    self.spec.dwa_velocity_weight * velocity_score
                )

                if score > best_score:
                    best_score = score
                    best_v = float(v)
                    best_w = float(w)

        return (best_v, best_w)

    def _predict_trajectory(
        self,
        x: float,
        y: float,
        theta: float,
        v: float,
        w: float,
        obstacles: List[Tuple[float, float, float]],
        sim_time: float,
        dt: float
    ) -> Tuple[float, float, float, float]:
        """Forward simulates robot state and monitors minimum distance to obstacles."""
        steps = int(sim_time / dt)
        min_clearance = float('inf')
        
        curr_x, curr_y, curr_theta = x, y, theta
        for _ in range(steps):
            curr_x += v * math.cos(curr_theta) * dt
            curr_y += v * math.sin(curr_theta) * dt
            curr_theta += w * dt
            
            for ox, oy, orad in obstacles:
                d = math.hypot(curr_x - ox, curr_y - oy) - orad
                if d < min_clearance:
                    min_clearance = d

        return (curr_x, curr_y, curr_theta, min_clearance)

    @staticmethod
    def _normalize_angle(angle: float) -> float:
        """Wraps angle into [-pi, pi]."""
        while angle > math.pi:
            angle -= 2.0 * math.pi
        while angle < -math.pi:
            angle += 2.0 * math.pi
        return angle


class PurePursuitController:
    """Geometric path tracking controller."""

    def __init__(self, lookahead_dist: float = 0.6, max_v: float = 1.2, max_w: float = 2.0):
        self.lookahead_dist = lookahead_dist
        self.max_v = max_v
        self.max_w = max_w

    def compute_command(
        self,
        pose: Tuple[float, float, float],
        path: List[Tuple[float, float]],
        current_index: int
    ) -> Tuple[float, float, int]:
        """Computes (v, w) to track path and updates target waypoint index."""
        x, y, theta = pose
        if not path or current_index >= len(path):
            return (0.0, 0.0, current_index)

        # Find waypoint at or ahead of lookahead distance
        target_idx = current_index
        for i in range(current_index, len(path)):
            dist = math.hypot(path[i][0] - x, path[i][1] - y)
            if dist >= self.lookahead_dist:
                target_idx = i
                break
        else:
            target_idx = len(path) - 1

        target_x, target_y = path[target_idx]
        angle_to_target = math.atan2(target_y - y, target_x - x)
        alpha = self._normalize_angle(angle_to_target - theta)

        # Curvature formula kappa = 2 * sin(alpha) / Ld
        ld = max(math.hypot(target_x - x, target_y - y), 0.1)
        curvature = (2.0 * math.sin(alpha)) / ld

        # Scale speed based on turning sharpness
        v = self.max_v * max(0.2, math.cos(alpha))
        w = float(np.clip(v * curvature, -self.max_w, self.max_w))

        # Check if arrived at final goal
        final_dist = math.hypot(path[-1][0] - x, path[-1][1] - y)
        if final_dist < 0.25:
            return (0.0, 0.0, len(path))

        return (v, w, target_idx)

    @staticmethod
    def _normalize_angle(angle: float) -> float:
        while angle > math.pi:
            angle -= 2.0 * math.pi
        while angle < -math.pi:
            angle += 2.0 * math.pi
        return angle


class IntersectionReservationManager:
    """
    Spatial-temporal reservation and token management for warehouse intersections.
    
    Prevents simultaneous entry into shared intersection zones, eliminating
    deadlocks and crossing collisions.
    """

    def __init__(self, coordination_spec: CoordinationSpec, env_spec: EnvironmentSpec):
        self.spec = coordination_spec
        self.env = env_spec
        # Map of intersection zone_id -> holding robot_id
        self.active_reservations: Dict[str, str] = {}
        # Queue of waiting robots: zone_id -> list of robot_ids
        self.waiting_queues: Dict[str, List[str]] = {}
        # Extract intersection zones from environment or generate main aisle nodes
        self.intersections = self._identify_intersections()

    def _identify_intersections(self) -> List[Dict[str, Any]]:
        """Identifies key corridor crossing points in the warehouse layout."""
        intersections = []
        # Check predefined zones
        for zone in self.env.zones:
            if zone.zone_type == "intersection":
                intersections.append({
                    "id": zone.id,
                    "x": zone.x,
                    "y": zone.y,
                    "radius": self.spec.intersection_reservation_radius
                })
        
        # Default intersection centers if none explicitly marked
        if not intersections:
            # Common warehouse aisle crossings
            default_points = [
                ("int_center_1", 12.0, 8.0),
                ("int_west_1", 6.0, 8.0),
                ("int_east_1", 18.0, 8.0),
                ("int_center_north", 12.0, 12.5),
                ("int_center_south", 12.0, 3.5),
            ]
            for i_id, ix, iy in default_points:
                intersections.append({
                    "id": i_id,
                    "x": ix,
                    "y": iy,
                    "radius": self.spec.intersection_reservation_radius
                })
        return intersections

    def request_access(self, robot_id: str, x: float, y: float) -> Tuple[bool, Optional[str]]:
        """
        Checks if robot is approaching an intersection zone.
        Returns (is_granted, zone_id_if_relevant).
        """
        if self.spec.protocol == "decentralized_reactive":
            # Reservation disabled: free-for-all entry (causes baseline conflicts)
            return (True, None)

        for intersection in self.intersections:
            dist = math.hypot(x - intersection["x"], y - intersection["y"])
            if dist <= intersection["radius"]:
                z_id = intersection["id"]
                current_holder = self.active_reservations.get(z_id)
                
                if current_holder is None or current_holder == robot_id:
                    # Grant reservation
                    self.active_reservations[z_id] = robot_id
                    return (True, z_id)
                else:
                    # Occupied: add to waiting queue
                    if z_id not in self.waiting_queues:
                        self.waiting_queues[z_id] = []
                    if robot_id not in self.waiting_queues[z_id]:
                        self.waiting_queues[z_id].append(robot_id)
                    return (False, z_id)

        return (True, None)

    def release_access(self, robot_id: str, x: float, y: float):
        """Releases intersection token once robot has cleared the zone radius."""
        for intersection in self.intersections:
            z_id = intersection["id"]
            if self.active_reservations.get(z_id) == robot_id:
                dist = math.hypot(x - intersection["x"], y - intersection["y"])
                if dist > intersection["radius"] * 1.15:
                    # Robot has exited intersection zone
                    del self.active_reservations[z_id]
                    # Grant to next robot in queue if any
                    queue = self.waiting_queues.get(z_id, [])
                    if queue:
                        next_robot = queue.pop(0)
                        self.active_reservations[z_id] = next_robot
