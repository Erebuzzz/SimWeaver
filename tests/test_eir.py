"""
Unit tests for EIR models and WorldModel
"""
import pytest
from simweaver.core.eir_models import (
    EIRSpec,
    EnvironmentSpec,
    BoxObstacle,
    MetricsResult,
    RequirementStatusItem,
)
from simweaver.core.world_model import WorldModel, CausalDiagnosis


def test_eir_serialization():
    eir = EIRSpec(
        name="Test Warehouse",
        human_intent="Transport 10 items without collisions."
    )
    eir.environment.obstacles.append(
        BoxObstacle(x=5.0, y=5.0, width=2.0, height=2.0, label="Shelf A")
    )
    yaml_str = eir.to_yaml()
    assert "Test Warehouse" in yaml_str
    assert "Shelf A" in yaml_str
    
    restored = EIRSpec.from_yaml(yaml_str)
    assert restored.name == eir.name
    assert len(restored.environment.obstacles) == 1
    assert restored.environment.obstacles[0].x == 5.0


def test_cost_calculation():
    eir = EIRSpec()
    metrics_pass = MetricsResult(
        total_tasks_assigned=20,
        total_tasks_completed=20,
        completion_rate=1.0,
        avg_delivery_time_sec=52.0,
        collision_count=0,
        near_miss_count=1,
        robustness_score=0.95,
        satisfies_all_constraints=True
    )
    metrics_fail = MetricsResult(
        total_tasks_assigned=20,
        total_tasks_completed=15,
        completion_rate=0.75,
        avg_delivery_time_sec=84.0,
        collision_count=6,
        near_miss_count=8,
        robustness_score=0.60,
        satisfies_all_constraints=False
    )
    
    cost_pass = eir.calculate_cost_j(metrics_pass)
    cost_fail = eir.calculate_cost_j(metrics_fail)
    
    assert cost_pass < cost_fail
    assert cost_pass > 0.0


def test_world_model_history():
    wm = WorldModel()
    metrics = MetricsResult(
        total_tasks_assigned=10,
        total_tasks_completed=10,
        avg_delivery_time_sec=55.0,
        collision_count=2,
        satisfies_all_constraints=False
    )
    diag = CausalDiagnosis(
        failure_type="Intersection Collision",
        bottleneck_location="Main Corridor",
        observed_pattern="Simultaneous approach",
        primary_root_cause="Lack of reservation protocol"
    )
    record = wm.record_experiment(metrics=metrics, diagnosis=diag)
    assert len(wm.history) == 1
    assert wm.get_latest_experiment().experiment_id == 0
    assert record.diagnosis.failure_type == "Intersection Collision"
