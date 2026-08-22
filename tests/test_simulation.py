"""
Tests for Robotics Simulation Engine and Planners
"""
import pytest
from simweaver.core.eir_models import EIRSpec, BoxObstacle, CoordinationSpec
from simweaver.simulation.engine import SimulationEngine
from simweaver.simulation.planners import AStarPlanner, DWALocalPlanner, IntersectionReservationManager


def test_astar_planner():
    eir = EIRSpec()
    planner = AStarPlanner(eir.environment)
    
    start = (2.0, 2.0)
    goal = (20.0, 14.0)
    path = planner.plan_path(start, goal)
    
    assert len(path) >= 2
    assert path[0] == start
    assert path[-1] == goal
    assert planner.is_free(2.0, 2.0) is True


def test_dwa_velocity():
    eir = EIRSpec()
    dwa = DWALocalPlanner(eir.planner)
    
    pose = (5.0, 5.0, 0.0)
    vel = (0.5, 0.0)
    target = (10.0, 5.0)
    obstacles = [(7.0, 5.0, 0.3)]  # Obstacle directly ahead
    
    v, w = dwa.compute_velocity(pose, vel, target, obstacles, dt=0.1)
    assert isinstance(v, float)
    assert isinstance(w, float)


def test_intersection_reservation():
    coord_spec = CoordinationSpec(protocol="intersection_reservation")
    eir = EIRSpec(coordination=coord_spec)
    mgr = IntersectionReservationManager(coord_spec, eir.environment)
    
    # AMR 1 requests center intersection
    granted1, zid1 = mgr.request_access("amr_1", 12.0, 8.0)
    assert granted1 is True
    assert zid1 is not None
    
    # AMR 2 requests same intersection
    granted2, zid2 = mgr.request_access("amr_2", 12.0, 8.0)
    assert granted2 is False
    assert zid2 == zid1
    
    # AMR 1 moves away and releases
    mgr.release_access("amr_1", 16.0, 8.0)
    # Now AMR 2 is granted
    granted3, zid3 = mgr.request_access("amr_2", 12.0, 8.0)
    assert granted3 is True


def test_full_simulation_run():
    eir = EIRSpec()
    eir.tasks.task_count = 5  # Small quick run
    engine = SimulationEngine(eir, seed=42)
    
    metrics, telemetry = engine.run_full_simulation(max_sim_time=25.0, dt=0.05)
    
    assert metrics.total_tasks_assigned == 5
    assert len(telemetry.frames) > 0
    assert len(metrics.requirement_table) == 4
    print(f"Simulation completed with {metrics.collision_count} collisions, {metrics.total_tasks_completed} tasks completed.")
