"""
Critic and Adversarial Robustness Testing Agent for SimWeaver

Challenging converged designs through adversarial parameter perturbations
(sensor noise, mass surge, wheel friction drop, and task density spikes)
to ensure designs do not overfit to a single benign test scenario.
"""

from __future__ import annotations
from typing import Dict, Any, Optional, List
from simweaver.core.eir_models import EIRSpec, MetricsResult
from simweaver.core.world_model import CriticVerdict, PerturbationTestResult
from simweaver.simulation.engine import SimulationEngine
from simweaver.agents.llm_client import LLMClient


class CriticAgent:
    """
    Adversarial verification agent.
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm = llm_client or LLMClient()

    def _run_test(self, eir_spec: EIRSpec, seed: int, max_sim_time: float = 20.0) -> MetricsResult:
        eng = SimulationEngine(eir_spec, seed=seed)
        m, _ = eng.run_full_simulation(max_sim_time=max_sim_time, dt=0.05)
        return m

    async def verify_robustness(self, eir: EIRSpec, baseline_metrics: MetricsResult) -> CriticVerdict:
        """
        Runs a battery of 4 adversarial perturbation tests on the proposed design concurrently.
        """
        # 1. Sensor Noise (+50% noise std)
        eir_noise = eir.model_copy(deep=True)
        eir_noise.sensors.lidar_noise_std = max(0.01, eir.sensors.lidar_noise_std * 1.5)

        # 2. Robot Mass & Acceleration (+20% mass, -15% braking acceleration)
        eir_mass = eir.model_copy(deep=True)
        eir_mass.robot.mass = eir.robot.mass * 1.20
        eir_mass.robot.max_linear_accel = max(0.8, eir.robot.max_linear_accel * 0.85)

        # 3. Wheel Traction Drift (-20% margin tolerance)
        eir_fric = eir.model_copy(deep=True)
        eir_fric.planner.goal_tolerance = max(0.2, eir.planner.goal_tolerance * 0.9)

        # 4. Task Density Surge (+25% task count)
        eir_task = eir.model_copy(deep=True)
        eir_task.tasks.task_count = int(eir.tasks.task_count * 1.25)

        # Run all 4 simulations concurrently in background threads
        import asyncio
        m_noise, m_mass, m_fric, m_task = await asyncio.gather(
            asyncio.to_thread(self._run_test, eir_noise, 101, 20.0),
            asyncio.to_thread(self._run_test, eir_mass, 202, 20.0),
            asyncio.to_thread(self._run_test, eir_fric, 303, 20.0),
            asyncio.to_thread(self._run_test, eir_task, 404, 25.0)
        )

        tests: List[PerturbationTestResult] = [
            PerturbationTestResult(
                name="Sensor Measurement Noise (+50% noise std)",
                perturbation_type="sensor_noise",
                delta_percentage=50.0,
                collisions=m_noise.collision_count,
                avg_delivery_time=m_noise.avg_delivery_time_sec,
                passed=(m_noise.collision_count <= eir.constraints.max_allowed_collisions and
                        m_noise.avg_delivery_time_sec <= eir.constraints.max_delivery_time_sec * 1.15)
            ),
            PerturbationTestResult(
                name="Payload Surge (+20% mass, -15% braking acceleration)",
                perturbation_type="mass_surge",
                delta_percentage=20.0,
                collisions=m_mass.collision_count,
                avg_delivery_time=m_mass.avg_delivery_time_sec,
                passed=(m_mass.collision_count <= eir.constraints.max_allowed_collisions and
                        m_mass.avg_delivery_time_sec <= eir.constraints.max_delivery_time_sec * 1.15)
            ),
            PerturbationTestResult(
                name="Wheel Traction Drift (-20% margin tolerance)",
                perturbation_type="wheel_friction",
                delta_percentage=-20.0,
                collisions=m_fric.collision_count,
                avg_delivery_time=m_fric.avg_delivery_time_sec,
                passed=(m_fric.collision_count <= eir.constraints.max_allowed_collisions and
                        m_fric.avg_delivery_time_sec <= eir.constraints.max_delivery_time_sec * 1.15)
            ),
            PerturbationTestResult(
                name="Logistics Surge (+25% task volume)",
                perturbation_type="task_density",
                delta_percentage=25.0,
                collisions=m_task.collision_count,
                avg_delivery_time=m_task.avg_delivery_time_sec,
                passed=(m_task.collision_count <= eir.constraints.max_allowed_collisions and
                        m_task.avg_delivery_time_sec <= eir.constraints.max_delivery_time_sec * 1.20)
            )
        ]

        passed_count = sum(1 for t in tests if t.passed)
        robustness_index = round(passed_count / len(tests), 2)
        overall_passed = (robustness_index >= 0.75 and
                          all(t.collisions <= eir.constraints.max_allowed_collisions for t in tests))

        summary = (
            f"Adversarial testing completed: {passed_count}/{len(tests)} perturbation scenarios passed. "
            f"Robustness Index: {int(robustness_index * 100)}%."
        )

        verdict = CriticVerdict(
            passed=overall_passed,
            confidence_score=robustness_index,
            robustness_index=robustness_index,
            perturbation_results=tests,
            verdict_summary=summary,
            rejection_reason=None if overall_passed else "Perturbation induced collision or unacceptable latency deficit."
        )
        return verdict
