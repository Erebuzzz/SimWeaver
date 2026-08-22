"""
Experiment and Repair (Optimizer) Agent for SimWeaver

Generates candidate engineering interventions, ranks them using multi-objective
trade-off prediction, selects the highest-scoring candidate, and compiles S_{t+1}.
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional, Tuple
from simweaver.core.eir_models import EIRSpec
from simweaver.core.world_model import InterventionCandidate, CausalDiagnosis, WorldModel
from simweaver.agents.llm_client import LLMClient


class ExperimentOptimizerAgent:
    """
    Search and optimization agent driving design iteration.
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm = llm_client or LLMClient()

    async def propose_interventions(
        self,
        eir: EIRSpec,
        diagnosis: CausalDiagnosis,
        world_model: WorldModel
    ) -> Tuple[List[InterventionCandidate], Optional[InterventionCandidate], EIRSpec]:
        """
        Generates candidate interventions, ranks them, selects the best, and produces updated EIR.
        """
        context = {
            "iteration": eir.iteration,
            "diagnosis": diagnosis.model_dump(),
            "current_eir": eir.model_dump(),
            "history_length": len(world_model.history)
        }

        result = await self.llm.generate_reasoning(
            agent_name="ExperimentOptimizerAgent",
            prompt="Propose candidate engineering interventions",
            context=context
        )

        candidates_raw = result.get("candidates", [])
        candidates: List[InterventionCandidate] = []
        
        for item in candidates_raw:
            candidate = InterventionCandidate(
                title=item.get("title", "Engineering Intervention"),
                description=item.get("description", ""),
                category=item.get("category", "coordination"),
                expected_collision_reduction=item.get("expected_collision_reduction", "Medium"),
                expected_delivery_impact=item.get("expected_delivery_impact", "Low"),
                implementation_complexity=item.get("implementation_complexity", "Low"),
                predicted_tradeoff_score=item.get("predicted_tradeoff_score", 0.0),
                parameter_changes=item.get("parameter_changes", {}),
                rationale=item.get("rationale", "")
            )
            candidates.append(candidate)

        # Sort by predicted trade-off score descending
        candidates.sort(key=lambda c: c.predicted_tradeoff_score, reverse=True)

        selected: Optional[InterventionCandidate] = None
        new_eir = eir.model_copy(deep=True)
        new_eir.iteration = eir.iteration + 1
        new_eir.id = f"eir_iter_{new_eir.iteration}"

        if candidates:
            selected = candidates[0]
            selected.is_selected = True
            
            # Apply parameter changes to new EIR
            self._apply_diff_to_eir(new_eir, selected.parameter_changes)
            new_eir.design_rationale = f"Iteration {new_eir.iteration}: {selected.title} - {selected.rationale}"

        return candidates, selected, new_eir

    def _apply_diff_to_eir(self, eir: EIRSpec, diff: Dict[str, Any]):
        """Mutates nested EIR fields based on dot-separated keys."""
        for key_path, val in diff.items():
            parts = key_path.split(".")
            target_obj = eir
            for part in parts[:-1]:
                if hasattr(target_obj, part):
                    target_obj = getattr(target_obj, part)
            leaf_attr = parts[-1]
            if hasattr(target_obj, leaf_attr):
                setattr(target_obj, leaf_attr, val)
