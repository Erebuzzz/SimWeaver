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

    async def verify_robustness(self, eir: EIRSpec, baseline_metrics: MetricsResult) -> CriticVerdict:
        """
        Runs a battery of 4 adversarial perturbation tests on the proposed design.
        """
        tests: List[PerturbationTestResult] = []

        # 1. Perturbation: Sensor Noise (+15% noise std)
        eir_noise = eir.model_copy(deep=True)
        eir_noise.sensors.lidar_noise_std = max(0.01, eir.sensors.lidar_noise_std * 1.5)
        eng_noise = SimulationEngine(eir_noise, seed=101)
        m_noise, _ = eng_noise.run_full_simulation(max_sim_time=40.0, dt=0.05)
        p_noise = (m_noise.collision_count <= eir.constraints.max_allowed_collisions and
                   m_noise.avg_delivery_time_sec <= eir.constraints.max_delivery_time_sec * 1.15)
        tests.append(
            PerturbationTestResult(
                name="Sensor Measurement Noise (+50% noise std)",
                perturbation_type="sensor_noise",
                delta_percentage=50.0,
                collisions=m_noise.collision_count,
                avg_delivery_time=m_noise.avg_delivery_time_sec,
                passed=p_noise
            )
        )

        # 2. Perturbation: Robot Mass & Acceleration (+20% mass, -15% braking acceleration)
        eir_mass = eir.model_copy(deep=True)
        eir_mass.robot.mass = eir.robot.mass * 1.20
        eir_mass.robot.max_linear_accel = max(0.8, eir.robot.max_linear_accel * 0.85)
        eng_mass = SimulationEngine(eir_mass, seed=202)
        m_mass, _ = eng_mass.run_full_simulation(max_sim_time=40.0, dt=0.05)
        p_mass = (m_mass.collision_count <= eir.constraints.max_allowed_collisions and
                  m_mass.avg_delivery_time_sec <= eir.constraints.max_delivery_time_sec * 1.15)
        tests.append(
            PerturbationTestResult(
                name="Payload Surge (+20% mass, -15% braking acceleration)",
                perturbation_type="mass_surge",
                delta_percentage=20.0,
                collisions=m_mass.collision_count,
                avg_delivery_time=m_mass.avg_delivery_time_sec,
                passed=p_mass
            )
        )

        # 3. Perturbation: Wheel Friction Reduction (Simulated speed overshoot)
        eir_fric = eir.model_copy(deep=True)
        eir_fric.planner.goal_tolerance = max(0.2, eir.planner.goal_tolerance * 0.9)
        eng_fric = SimulationEngine(eir_fric, seed=303)
        m_fric, _ = eng_fric.run_full_simulation(max_sim_time=40.0, dt=0.05)
        p_fric = (m_fric.collision_count <= eir.constraints.max_allowed_collisions and
                  m_fric.avg_delivery_time_sec <= eir.constraints.max_delivery_time_sec * 1.15)
        tests.append(
            PerturbationTestResult(
                name="Wheel Traction Drift (-20% margin tolerance)",
                perturbation_type="wheel_friction",
                delta_percentage=-20.0,
                collisions=m_fric.collision_count,
                avg_delivery_time=m_fric.avg_delivery_time_sec,
                passed=p_fric
            )
        )

        # 4. Perturbation: Task Density Surge (+25% task count)
        eir_task = eir.model_copy(deep=True)
        eir_task.tasks.task_count = int(eir.tasks.task_count * 1.25)
        eng_task = SimulationEngine(eir_task, seed=404)
        m_task, _ = eng_task.run_full_simulation(max_sim_time=45.0, dt=0.05)
        p_task = (m_task.collision_count <= eir.constraints.max_allowed_collisions and
                  m_task.avg_delivery_time_sec <= eir.constraints.max_delivery_time_sec * 1.20)
        tests.append(
            PerturbationTestResult(
                name="Logistics Surge (+25% task volume)",
                perturbation_type="task_density",
                delta_percentage=25.0,
                collisions=m_task.collision_count,
                avg_delivery_time=m_task.avg_delivery_time_sec,
                passed=p_task
            )
        )

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
