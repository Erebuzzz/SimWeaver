"""
Evaluation Agent for SimWeaver

Calculates deterministic KPI metrics from simulation telemetry and compares
observed performance against the strict engineering specification.
"""

from __future__ import annotations
from typing import Tuple
from simweaver.core.eir_models import EIRSpec, MetricsResult
from simweaver.simulation.engine import SimulationEngine
from simweaver.simulation.telemetry import TelemetryRecorder


class EvaluatorAgent:
    """
    Evaluates simulation runs against requirements.
    """

    def __init__(self):
        pass

    def evaluate_run(
        self,
        engine: SimulationEngine,
        max_sim_time: float = 70.0,
        dt: float = 0.05,
        robustness_score: float = 1.0
    ) -> Tuple[MetricsResult, TelemetryRecorder]:
        """
        Executes the simulation run and produces the synthesized metrics evaluation.
        """
        metrics, telemetry = engine.run_full_simulation(
            max_sim_time=max_sim_time,
            dt=dt,
            robustness_score=robustness_score
        )
        return metrics, telemetry
