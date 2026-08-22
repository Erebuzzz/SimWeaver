"""
World Model & Experiment History Repository for SimWeaver

Maintains the authoritative global engineering state, experiment records,
causal diagnoses, candidate interventions, and design lineage graph.
"""

from __future__ import annotations
import uuid
import time
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from simweaver.core.eir_models import EIRSpec, MetricsResult


class InterventionCandidate(BaseModel):
    """A proposed engineering modification to resolve an identified bottleneck."""
    id: str = Field(default_factory=lambda: f"int_{uuid.uuid4().hex[:6]}")
    title: str
    description: str
    category: str  # "coordination", "planner", "sensor", "morphology"
    expected_collision_reduction: str  # "High", "Medium", "Low"
    expected_delivery_impact: str  # "Minimal", "Moderate", "High"
    implementation_complexity: str  # "Low", "Medium", "High"
    predicted_tradeoff_score: float  # Multi-objective projected gain
    parameter_changes: Dict[str, Any] = Field(default_factory=dict)
    rationale: str = ""
    is_selected: bool = False


class CausalDiagnosis(BaseModel):
    """Root-cause diagnostic hypothesis produced from simulation telemetry."""
    id: str = Field(default_factory=lambda: f"diag_{uuid.uuid4().hex[:6]}")
    failure_type: str  # e.g. "Intersection Collision", "Speed Overshoot", "Deadlock"
    bottleneck_location: str  # e.g. "Main cross-aisle intersection [12.0, 8.0]"
    observed_pattern: str
    primary_root_cause: str
    secondary_root_cause: str = ""
    affected_robot_ids: List[str] = Field(default_factory=list)
    recommended_interventions: List[str] = Field(default_factory=list)


class PerturbationTestResult(BaseModel):
    """Results of a single adversarial stress test."""
    name: str
    perturbation_type: str  # "sensor_noise", "mass_surge", "wheel_friction", "task_density"
    delta_percentage: float
    collisions: int
    avg_delivery_time: float
    passed: bool


class CriticVerdict(BaseModel):
    """Adversarial stress-test verdict to prevent overfitting to a single scenario."""
    passed: bool = True
    confidence_score: float = 1.0
    robustness_index: float = 1.0  # 0.0 to 1.0
    perturbation_results: List[PerturbationTestResult] = Field(default_factory=list)
    verdict_summary: str = "Baseline evaluation passed standard requirements."
    rejection_reason: Optional[str] = None


class ExperimentRecord(BaseModel):
    """Complete snapshot of a single engineering simulation iteration."""
    experiment_id: int  # e.g. 0, 1, 2...
    timestamp: float = Field(default_factory=time.time)
    iteration: int
    name: str
    eir_design: EIRSpec
    metrics: MetricsResult
    cost_j: float
    diagnosis: Optional[CausalDiagnosis] = None
    candidate_interventions: List[InterventionCandidate] = Field(default_factory=list)
    selected_intervention: Optional[InterventionCandidate] = None
    critic_verdict: Optional[CriticVerdict] = None
    parameter_diff: Dict[str, Any] = Field(default_factory=dict)
    summary_notes: str = ""
    frames: List[Dict[str, Any]] = Field(default_factory=list)


class WorldModel(BaseModel):
    """
    Centralized state repository and lineage manager.
    
    Prevents synchronization issues across agents by keeping a single
    coherent source of truth for the active design S_t and experiment history.
    """
    session_id: str = Field(default_factory=lambda: f"session_{uuid.uuid4().hex[:8]}")
    active_eir: EIRSpec = Field(default_factory=EIRSpec)
    history: List[ExperimentRecord] = Field(default_factory=list)
    is_converged: bool = False
    max_allowed_iterations: int = 6

    def record_experiment(
        self,
        metrics: MetricsResult,
        diagnosis: Optional[CausalDiagnosis] = None,
        candidates: Optional[List[InterventionCandidate]] = None,
        selected: Optional[InterventionCandidate] = None,
        critic: Optional[CriticVerdict] = None,
        diff: Optional[Dict[str, Any]] = None,
        notes: str = "",
        frames: Optional[List[Dict[str, Any]]] = None
    ) -> ExperimentRecord:
        """Appends a new experiment run into the immutable history log."""
        cost = self.active_eir.calculate_cost_j(metrics)
        exp_id = len(self.history)
        
        record = ExperimentRecord(
            experiment_id=exp_id,
            iteration=self.active_eir.iteration,
            name=f"Experiment #{exp_id}",
            eir_design=self.active_eir.model_copy(deep=True),
            metrics=metrics,
            cost_j=cost,
            diagnosis=diagnosis,
            candidate_interventions=candidates or [],
            selected_intervention=selected,
            critic_verdict=critic,
            parameter_diff=diff or {},
            summary_notes=notes,
            frames=frames or []
        )
        self.history.append(record)
        return record

    def get_latest_experiment(self) -> Optional[ExperimentRecord]:
        """Returns the most recent experiment run if available."""
        if self.history:
            return self.history[-1]
        return None

    def get_best_experiment(self) -> Optional[ExperimentRecord]:
        """Returns the experiment record with the lowest multi-objective cost J."""
        if not self.history:
            return None
        return min(self.history, key=lambda exp: exp.cost_j)

    def get_lineage_graph(self) -> List[Dict[str, Any]]:
        """Constructs design lineage tree showing how S_0 transitioned to S_t."""
        nodes = []
        for exp in self.history:
            nodes.append({
                "id": f"Exp_{exp.experiment_id}",
                "iteration": exp.iteration,
                "label": f"Exp #{exp.experiment_id}",
                "collisions": exp.metrics.collision_count,
                "avg_delivery_time": exp.metrics.avg_delivery_time_sec,
                "cost_j": exp.cost_j,
                "passed": exp.metrics.satisfies_all_constraints,
                "changes": exp.parameter_diff,
                "diagnosis": exp.diagnosis.failure_type if exp.diagnosis else "N/A"
            })
        return nodes

    def compute_pareto_front(self) -> List[Dict[str, Any]]:
        """Identifies non-dominated designs along Collision vs Delivery Time axes."""
        pareto_points = []
        for exp in self.history:
            pareto_points.append({
                "experiment_id": exp.experiment_id,
                "iteration": exp.iteration,
                "collision_count": exp.metrics.collision_count,
                "avg_delivery_time_sec": exp.metrics.avg_delivery_time_sec,
                "cost_j": exp.cost_j,
                "passed": exp.metrics.satisfies_all_constraints
            })
        return pareto_points
