"""
Failure Diagnosis Agent for SimWeaver

Examines robot trajectories, collision events, sensor traces, planner decisions,
and controller telemetry to produce an explanatory causal diagnosis hypothesis.
"""

from __future__ import annotations
from typing import Dict, Any, Optional, List
from simweaver.core.eir_models import EIRSpec, MetricsResult
from simweaver.core.world_model import CausalDiagnosis
from simweaver.simulation.telemetry import TelemetryRecorder
from simweaver.agents.llm_client import LLMClient


class FailureDiagnosisAgent:
    """
    Diagnoses failure causes from raw simulation traces.
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm = llm_client or LLMClient()

    async def diagnose(
        self,
        eir: EIRSpec,
        metrics: MetricsResult,
        telemetry: TelemetryRecorder,
        iteration: int
    ) -> CausalDiagnosis:
        """
        Analyzes collision clusters and timing bottlenecks to generate a CausalDiagnosis.
        """
        # Collect affected robot IDs and collision locations from telemetry
        affected_robots: List[str] = []
        loc_summary = "None"
        
        if telemetry.collision_events:
            for col in telemetry.collision_events:
                if col.robot_id_a and col.robot_id_a not in affected_robots:
                    affected_robots.append(col.robot_id_a)
                if col.robot_id_b and col.robot_id_b not in affected_robots:
                    affected_robots.append(col.robot_id_b)
            
            # Find average collision coordinate
            avg_cx = sum(c.location[0] for c in telemetry.collision_events) / len(telemetry.collision_events)
            avg_cy = sum(c.location[1] for c in telemetry.collision_events) / len(telemetry.collision_events)
            loc_summary = f"Aisle crossing near [{avg_cx:.1f}m, {avg_cy:.1f}m]"

        context = {
            "iteration": iteration,
            "metrics": metrics.model_dump(),
            "collision_count": metrics.collision_count,
            "avg_delivery_time": metrics.avg_delivery_time_sec,
            "location_summary": loc_summary,
            "affected_robots": affected_robots
        }

        result = await self.llm.generate_reasoning(
            agent_name="FailureDiagnosisAgent",
            prompt="Diagnose simulation failures based on telemetry",
            context=context
        )

        diagnosis = CausalDiagnosis(
            failure_type=result.get("failure_type", "Operational Inefficiency"),
            bottleneck_location=result.get("bottleneck_location", loc_summary),
            observed_pattern=result.get("observed_pattern", "Multiple AMRs converging simultaneously."),
            primary_root_cause=result.get("primary_root_cause", "Uncoordinated intersection access."),
            secondary_root_cause=result.get("secondary_root_cause", "Suboptimal local clearance horizon."),
            affected_robot_ids=affected_robots,
            recommended_interventions=result.get("recommended_interventions", [])
        )
        return diagnosis
