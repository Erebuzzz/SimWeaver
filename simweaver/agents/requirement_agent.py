"""
Requirement Agent for SimWeaver

Translates vague natural language objectives into quantifiable engineering specifications,
constraints, objectives, and metric targets.
"""

from __future__ import annotations
from typing import Dict, Any, Optional
from simweaver.core.eir_models import EIRSpec, ConstraintSpec
from simweaver.agents.llm_client import LLMClient


class RequirementAgent:
    """
    Agent responsible for extracting requirements from natural language human intent.
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm = llm_client or LLMClient()

    async def parse_requirements(self, human_intent: str) -> Dict[str, Any]:
        """
        Parses human intent into a structured specification.
        """
        result = await self.llm.generate_reasoning(
            agent_name="RequirementAgent",
            prompt=human_intent,
            context={"intent": human_intent}
        )
        return result

    def apply_to_eir(self, eir: EIRSpec, parsed: Dict[str, Any]) -> EIRSpec:
        """
        Populates EIR with extracted requirements.
        """
        eir.human_intent = parsed.get("rationale", eir.human_intent)
        if "robot_count" in parsed:
            eir.robot.count = parsed["robot_count"]
        if "objectives" in parsed:
            eir.objectives = parsed["objectives"]
        if "constraints" in parsed:
            c = parsed["constraints"]
            eir.constraints = ConstraintSpec(
                max_allowed_collisions=c.get("max_allowed_collisions", 0),
                max_delivery_time_sec=c.get("max_delivery_time_sec", 60.0),
                min_separation_m=c.get("min_separation_m", 0.30),
                min_completion_rate=c.get("min_completion_rate", 0.95),
                max_near_misses=c.get("max_near_misses", 5)
            )
        return eir
