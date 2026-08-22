"""
Systems Architecture Agent for SimWeaver

Selects robot morphology, sensor suite, global planner, local controller,
and initial coordination protocol, while recording engineering rationales.
"""

from __future__ import annotations
from typing import Dict, Any, Optional
from simweaver.core.eir_models import EIRSpec
from simweaver.agents.llm_client import LLMClient


class SystemsArchitectAgent:
    """
    Formulates initial system architecture S_0 from extracted requirements.
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm = llm_client or LLMClient()

    async def design_architecture(self, eir: EIRSpec) -> Dict[str, Any]:
        """
        Synthesizes morphology, sensor selection, and navigation configuration.
        """
        result = await self.llm.generate_reasoning(
            agent_name="SystemsArchitectAgent",
            prompt=f"Design architecture for {eir.human_intent}",
            context={"eir": eir.model_dump(), "iteration": eir.iteration}
        )
        return result

    def apply_to_eir(self, eir: EIRSpec, design: Dict[str, Any]) -> EIRSpec:
        """
        Applies architectural choices to EIR.
        """
        eir.design_rationale = design.get("rationale", eir.design_rationale)
        
        if "morphology" in design:
            m = design["morphology"]
            eir.robot.type = m.get("type", eir.robot.type)
            eir.robot.count = m.get("count", eir.robot.count)
            eir.robot.radius = m.get("radius", eir.robot.radius)
            eir.robot.max_linear_speed = m.get("max_linear_speed", eir.robot.max_linear_speed)
            eir.robot.max_angular_speed = m.get("max_angular_speed", eir.robot.max_angular_speed)

        if "sensors" in design:
            s = design["sensors"]
            eir.sensors.lidar_range = s.get("lidar_range", eir.sensors.lidar_range)
            eir.sensors.lidar_fov_deg = s.get("lidar_fov_deg", eir.sensors.lidar_fov_deg)
            eir.sensors.lidar_rays = s.get("lidar_rays", eir.sensors.lidar_rays)
            eir.sensors.lidar_noise_std = s.get("lidar_noise_std", eir.sensors.lidar_noise_std)

        if "planner" in design:
            p = design["planner"]
            eir.planner.global_planner = p.get("global_planner", eir.planner.global_planner)
            eir.planner.local_planner = p.get("local_planner", eir.planner.local_planner)
            eir.planner.safety_margin = p.get("safety_margin", eir.planner.safety_margin)

        if "coordination" in design:
            c = design["coordination"]
            eir.coordination.protocol = c.get("protocol", eir.coordination.protocol)

        return eir
