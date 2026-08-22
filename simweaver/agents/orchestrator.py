"""
Agentic Engineering Loop Orchestrator for SimWeaver

Manages the autonomous lifecycle:
Plan (Requirements/Architecture) -> Build -> Run -> Measure (Evaluate) ->
Diagnose -> Propose & Select Intervention -> Perturb & Verify (Critic) -> Repeat.
"""

from __future__ import annotations
import asyncio
from typing import Dict, Any, Optional, Callable, List
from simweaver.core.eir_models import EIRSpec, MetricsResult
from simweaver.core.world_model import WorldModel, ExperimentRecord
from simweaver.agents.llm_client import LLMClient
from simweaver.agents.requirement_agent import RequirementAgent
from simweaver.agents.systems_architect import SystemsArchitectAgent
from simweaver.agents.simulation_builder import SimulationBuilderAgent
from simweaver.agents.evaluator import EvaluatorAgent
from simweaver.agents.diagnostician import FailureDiagnosisAgent
from simweaver.agents.optimizer import ExperimentOptimizerAgent
from simweaver.agents.critic import CriticAgent


class AgenticOrchestrator:
    """
    Coordinates the multi-agent reasoning and engineering optimization loop.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.llm = LLMClient(api_key=api_key)
        self.requirement_agent = RequirementAgent(self.llm)
        self.systems_architect = SystemsArchitectAgent(self.llm)
        self.simulation_builder = SimulationBuilderAgent()
        self.evaluator = EvaluatorAgent()
        self.diagnostician = FailureDiagnosisAgent(self.llm)
        self.optimizer = ExperimentOptimizerAgent(self.llm)
        self.critic = CriticAgent(self.llm)
        
        self.world_model = WorldModel()
        self.is_running: bool = False
        self.is_paused: bool = False
        self.current_phase: str = "IDLE"  # IDLE, REQUIREMENTS, ARCHITECTURE, SIMULATING, EVALUATING, DIAGNOSING, OPTIMIZING, CRITIC, CONVERGED
        
        # In-memory log of streaming thought events for frontend UI
        self.thought_stream: List[Dict[str, Any]] = []

    def log_thought(self, agent_name: str, stage: str, title: str, content: str, payload: Optional[Dict[str, Any]] = None):
        """Appends a structured thought card to the live UI thought stream."""
        event = {
            "timestamp": round(float(asyncio.get_event_loop().time()), 2) if asyncio.get_event_loop().is_running() else 0.0,
            "agent": agent_name,
            "stage": stage,
            "title": title,
            "content": content,
            "payload": payload or {}
        }
        self.thought_stream.append(event)
        return event

    async def initialize_from_prompt(self, human_prompt: str) -> EIRSpec:
        """
        Runs initial Requirements and Systems Architecture phases for a new problem prompt.
        """
        self.thought_stream.clear()
        self.world_model = WorldModel()

        # 1. Requirement Agent
        self.current_phase = "REQUIREMENTS"
        self.log_thought(
            agent_name="RequirementAgent",
            stage="Requirements Analysis",
            title="Analyzing Human Intent",
            content=f"Deconstructing natural language objective: '{human_prompt}' into formal engineering constraints."
        )
        req_data = await self.requirement_agent.parse_requirements(human_prompt)
        
        eir = EIRSpec()
        eir = self.requirement_agent.apply_to_eir(eir, req_data)
        
        self.log_thought(
            agent_name="RequirementAgent",
            stage="Requirements Specification",
            title="Extracted Engineering Constraints",
            content=req_data.get("rationale", "Formal specifications generated."),
            payload={
                "constraints": eir.constraints.model_dump(),
                "objectives": eir.objectives,
                "robot_count": eir.robot.count
            }
        )

        # 2. Systems Architecture Agent
        self.current_phase = "ARCHITECTURE"
        self.log_thought(
            agent_name="SystemsArchitectAgent",
            stage="System Architecture",
            title="Synthesizing Baseline Architecture (S_0)",
            content="Formulating baseline morphology, sensor suite (LiDAR), path planner (A* + DWA), and coordination protocol."
        )
        arch_data = await self.systems_architect.design_architecture(eir)
        eir = self.systems_architect.apply_to_eir(eir, arch_data)
        
        self.log_thought(
            agent_name="SystemsArchitectAgent",
            stage="Architecture Formulated",
            title="Baseline Design S_0 Ready",
            content=arch_data.get("rationale", "Baseline architecture initialized."),
            payload={
                "morphology": eir.robot.model_dump(),
                "sensors": eir.sensors.model_dump(),
                "planner": eir.planner.model_dump(),
                "coordination": eir.coordination.model_dump()
            }
        )

        self.world_model.active_eir = eir
        self.current_phase = "READY"
        return eir

    async def step_single_iteration(self) -> Dict[str, Any]:
        """
        Executes one full iteration cycle:
        Simulation -> Evaluation -> (Critic or Diagnosis + Optimization) -> S_{t+1}.
        """
        eir = self.world_model.active_eir
        iter_num = eir.iteration

        # 1. Build Simulation
        self.current_phase = "SIMULATING"
        self.log_thought(
            agent_name="SimulationBuilderAgent",
            stage="Simulation Execution",
            title=f"Building & Launching Experiment #{iter_num}",
            content=f"Compiling EIR into physics simulation. Running 5 AMRs under {eir.coordination.protocol} protocol."
        )
        engine = self.simulation_builder.build_simulation(eir, seed=42 + iter_num)

        # 2. Run and Evaluate
        self.current_phase = "EVALUATING"
        metrics, telemetry = self.evaluator.evaluate_run(engine, max_sim_time=65.0, dt=0.05)
        
        pass_status = "PASSED" if metrics.satisfies_all_constraints else "FAILED"
        self.log_thought(
            agent_name="EvaluatorAgent",
            stage="Performance Evaluation",
            title=f"Experiment #{iter_num} Evaluation: {pass_status}",
            content=(
                f"Collisions: {metrics.collision_count} (Target: <= {eir.constraints.max_allowed_collisions}), "
                f"Avg Delivery: {metrics.avg_delivery_time_sec:.1f}s (Target: < {eir.constraints.max_delivery_time_sec:.1f}s), "
                f"Completion: {int(metrics.completion_rate * 100)}%."
            ),
            payload={
                "metrics": metrics.model_dump(),
                "cost_j": eir.calculate_cost_j(metrics)
            }
        )

        # 3. Branch: If nominal metrics passed, invoke Critic for Adversarial Verification
        if metrics.satisfies_all_constraints:
            self.current_phase = "CRITIC"
            self.log_thought(
                agent_name="CriticAgent",
                stage="Adversarial Verification",
                title=f"Stress-Testing Design #{iter_num}",
                content="Challenging solution against 4 environmental perturbations: sensor noise, mass surge, wheel slip, task spike."
            )
            critic_verdict = await self.critic.verify_robustness(eir, metrics)
            metrics.robustness_score = critic_verdict.robustness_index

            if critic_verdict.passed:
                self.current_phase = "CONVERGED"
                self.world_model.is_converged = True
                
                self.log_thought(
                    agent_name="CriticAgent",
                    stage="Robustness Verified",
                    title="Design Convergence Achieved!",
                    content=critic_verdict.verdict_summary,
                    payload={"critic_verdict": critic_verdict.model_dump()}
                )

                record = self.world_model.record_experiment(
                    metrics=metrics,
                    critic=critic_verdict,
                    notes="Design fully satisfies all nominal and perturbed constraints.",
                    frames=[f.model_dump() for f in telemetry.frames[::2]]
                )

                return {
                    "status": "CONVERGED",
                    "iteration": iter_num,
                    "record": record.model_dump(),
                    "latest_frame_sample": [f.model_dump() for f in telemetry.frames[-20:]]
                }
            else:
                self.log_thought(
                    agent_name="CriticAgent",
                    stage="Adversarial Rejection",
                    title="Overfitting Detected by Critic",
                    content=f"Design failed under perturbation: {critic_verdict.rejection_reason}. Triggering repair cycle.",
                    payload={"critic_verdict": critic_verdict.model_dump()}
                )

        # 4. Failure Diagnosis
        self.current_phase = "DIAGNOSING"
        self.log_thought(
            agent_name="FailureDiagnosisAgent",
            stage="Causal Diagnosis",
            title=f"Diagnosing Failures in Exp #{iter_num}",
            content="Analyzing spatial-temporal collision heatmaps, velocity curves, and bottleneck zones."
        )
        diagnosis = await self.diagnostician.diagnose(eir, metrics, telemetry, iter_num)
        
        self.log_thought(
            agent_name="FailureDiagnosisAgent",
            stage="Hypothesis Formulated",
            title=f"Identified Cause: {diagnosis.failure_type}",
            content=f"Root Cause: {diagnosis.primary_root_cause} (Location: {diagnosis.bottleneck_location})",
            payload={"diagnosis": diagnosis.model_dump()}
        )

        # 5. Propose and Rank Interventions
        self.current_phase = "OPTIMIZING"
        self.log_thought(
            agent_name="ExperimentOptimizerAgent",
            stage="Intervention Generation",
            title="Formulating Candidate Interventions",
            content="Generating candidate design modifications and evaluating multi-objective cost trade-offs."
        )
        candidates, selected, next_eir = await self.optimizer.propose_interventions(
            eir, diagnosis, self.world_model
        )

        if selected:
            self.log_thought(
                agent_name="ExperimentOptimizerAgent",
                stage="Intervention Selected",
                title=f"Selected: {selected.title}",
                content=f"Applying parameter modifications to produce Design S_{iter_num + 1}. Rationale: {selected.rationale}",
                payload={
                    "candidates": [c.model_dump() for c in candidates],
                    "selected": selected.model_dump()
                }
            )

        # Record experiment in history
        record = self.world_model.record_experiment(
            metrics=metrics,
            diagnosis=diagnosis,
            candidates=candidates,
            selected=selected,
            diff=selected.parameter_changes if selected else {},
            notes=f"Iteration {iter_num} analyzed.",
            frames=[f.model_dump() for f in telemetry.frames[::2]]
        )

        # Update active design
        self.world_model.active_eir = next_eir

        return {
            "status": "ITERATING",
            "iteration": iter_num,
            "record": record.model_dump(),
            "next_eir": next_eir.model_dump(),
            "latest_frame_sample": [f.model_dump() for f in telemetry.frames[-20:]]
        }

    async def run_full_autonomous_loop(self, human_prompt: str, max_iterations: int = 5) -> WorldModel:
        """
        Executes end-to-end multi-agent optimization loop until convergence or iteration budget exhausted.
        """
        self.is_running = True
        await self.initialize_from_prompt(human_prompt)

        for _ in range(max_iterations):
            if not self.is_running:
                break
            
            result = await self.step_single_iteration()
            if result.get("status") == "CONVERGED":
                break

        self.is_running = False
        return self.world_model
