"""
Tests for Multi-Agent Loop and Orchestrator
"""
import pytest
import asyncio
from simweaver.agents.orchestrator import AgenticOrchestrator


def test_agentic_loop():
    async def _run():
        orchestrator = AgenticOrchestrator()
        prompt = (
            "Create a warehouse with 5 autonomous mobile robots. "
            "Robots must transport packages between shelves and a loading area. "
            "They should avoid collisions, maintain at least 30 cm separation, "
            "and achieve an average delivery time below 60 seconds."
        )
        
        # Initialize
        eir = await orchestrator.initialize_from_prompt(prompt)
        assert eir.robot.count == 5
        assert len(orchestrator.thought_stream) >= 2
        
        # Step 1: Baseline run (iteration 0)
        res1 = await orchestrator.step_single_iteration()
        assert res1["status"] in ["ITERATING", "CONVERGED"]
        assert len(orchestrator.world_model.history) == 1
        
        # Step 2: Iteration 1
        res2 = await orchestrator.step_single_iteration()
        assert len(orchestrator.world_model.history) == 2
        
        print(f"Agentic loop verified: {len(orchestrator.world_model.history)} experiments recorded.")
        print(f"Active phase: {orchestrator.current_phase}")

    asyncio.run(_run())


if __name__ == "__main__":
    test_agentic_loop()
