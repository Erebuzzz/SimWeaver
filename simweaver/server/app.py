"""
FastAPI Server and Live WebSocket Telemetry Streamer for SimWeaver

Exposes REST APIs for multi-agent optimization, EIR export (YAML, ROS2, Markdown),
and WebSocket streaming for real-time simulation canvas visualization.
"""

from __future__ import annotations
import os
import json
import random
import asyncio
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from simweaver.core.eir_models import EIRSpec
from simweaver.agents.orchestrator import AgenticOrchestrator
from simweaver.simulation.engine import SimulationEngine
from simweaver.adapters.urdf_exporter import generate_urdf
from simweaver.adapters.webots_exporter import generate_webots_world
from simweaver.adapters.pybullet_exporter import generate_pybullet_script
from simweaver.simulation.environments import get_preset_environment


app = FastAPI(
    title="SimWeaver API",
    description="Agentic Robotics Simulation Engineer API",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global orchestrator singleton
orchestrator = AgenticOrchestrator()


class PromptRequest(BaseModel):
    prompt: str = Field(
        default=(
            "Create a warehouse with 5 autonomous mobile robots. "
            "Robots must transport packages between shelves and a loading area. "
            "They should avoid collisions, maintain at least 30 cm separation, "
            "and achieve an average delivery time below 60 seconds."
        )
    )
    api_key: Optional[str] = None


class PresetRequest(BaseModel):
    preset_id: str  # "warehouse_5_amr", "dense_cross_traffic", "cleanroom_medical"


class ConnectionManager:
    """Manages active WebSocket connections for live simulation streaming."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)


ws_manager = ConnectionManager()


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "service": "SimWeaver Agentic Robotics Simulation Engineer",
        "version": "0.1.0"
    }


@app.post("/api/orchestrator/init")
async def init_orchestrator(req: PromptRequest):
    """Initializes a new engineering optimization session from a natural language prompt."""
    if req.api_key:
        orchestrator.llm.api_key = req.api_key

    eir = await orchestrator.initialize_from_prompt(req.prompt)
    
    # Broadcast initial thought to connected WebSockets
    await ws_manager.broadcast({
        "type": "INIT_COMPLETE",
        "eir": eir.model_dump(),
        "phase": orchestrator.current_phase,
        "thoughts": orchestrator.thought_stream
    })
    
    return {
        "status": "INITIALIZED",
        "eir": eir.model_dump(),
        "phase": orchestrator.current_phase,
        "thoughts": orchestrator.thought_stream
    }


@app.post("/api/orchestrator/step")
async def step_orchestrator():
    """Executes a single step in the multi-agent engineering loop."""
    result = await orchestrator.step_single_iteration()
    
    # Broadcast step result
    await ws_manager.broadcast({
        "type": "STEP_COMPLETE",
        "result": result,
        "phase": orchestrator.current_phase,
        "thoughts": orchestrator.thought_stream,
        "history": [rec.model_dump() for rec in orchestrator.world_model.history]
    })
    
    return {
        "status": result.get("status"),
        "iteration": result.get("iteration"),
        "phase": orchestrator.current_phase,
        "record": result.get("record"),
        "thoughts": orchestrator.thought_stream,
        "history": [rec.model_dump() for rec in orchestrator.world_model.history]
    }


@app.post("/api/orchestrator/run_all")
async def run_all(req: PromptRequest):
    """Runs autonomous loop until convergence."""
    if req.api_key:
        orchestrator.llm.api_key = req.api_key

    wm = await orchestrator.run_full_autonomous_loop(req.prompt, max_iterations=5)
    
    await ws_manager.broadcast({
        "type": "RUN_ALL_COMPLETE",
        "converged": wm.is_converged,
        "phase": orchestrator.current_phase,
        "history": [rec.model_dump() for rec in wm.history]
    })

    return {
        "status": "CONVERGED" if wm.is_converged else "MAX_ITERATIONS_REACHED",
        "converged": wm.is_converged,
        "history": [rec.model_dump() for rec in wm.history],
        "thoughts": orchestrator.thought_stream
    }


@app.get("/api/orchestrator/state")
async def get_state():
    """Returns current orchestrator state, active EIR, thoughts, and experiment history."""
    return {
        "phase": orchestrator.current_phase,
        "is_running": orchestrator.is_running,
        "active_eir": orchestrator.world_model.active_eir.model_dump(),
        "is_converged": orchestrator.world_model.is_converged,
        "history": [rec.model_dump() for rec in orchestrator.world_model.history],
        "thoughts": orchestrator.thought_stream,
        "lineage": orchestrator.world_model.get_lineage_graph(),
        "pareto": orchestrator.world_model.compute_pareto_front()
    }


@app.get("/api/world_model/history")
async def get_history():
    return {
        "history": [rec.model_dump() for rec in orchestrator.world_model.history],
        "is_converged": orchestrator.world_model.is_converged
    }


@app.get("/api/world_model/lineage")
async def get_lineage():
    return {"nodes": orchestrator.world_model.get_lineage_graph()}


@app.get("/api/world_model/pareto")
async def get_pareto():
    return {"points": orchestrator.world_model.compute_pareto_front()}


@app.post("/api/critic/perturb")
async def run_critic_perturbation():
    """Runs adversarial stress test directly on active design."""
    eir = orchestrator.world_model.active_eir
    latest = orchestrator.world_model.get_latest_experiment()
    baseline_metrics = latest.metrics if latest else None
    
    if not baseline_metrics:
        # Run a quick baseline run first
        eng = SimulationEngine(eir)
        baseline_metrics, _ = eng.run_full_simulation(max_sim_time=40.0)

    verdict = await orchestrator.critic.verify_robustness(eir, baseline_metrics)
    
    await ws_manager.broadcast({
        "type": "CRITIC_VERDICT",
        "verdict": verdict.model_dump()
    })

    return {"verdict": verdict.model_dump()}


@app.get("/api/export/yaml")
async def export_yaml():
    """Exports active EIR as clean YAML."""
    yaml_content = orchestrator.world_model.active_eir.to_yaml()
    return {"yaml": yaml_content}


@app.get("/api/export/ros2")
async def export_ros2():
    """Generates ROS2 launch file and Nav2 controller parameters from EIR."""
    eir = orchestrator.world_model.active_eir
    
    launch_py = f'''"""
ROS2 Launch Configuration generated by SimWeaver
Design ID: {eir.id} (Iteration {eir.iteration})
Coordination: {eir.coordination.protocol}
"""
import os
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    ld = LaunchDescription()
    
    # Spawn {eir.robot.count} AMRs with DWA and {eir.sensors.lidar_range}m LiDAR
    for i in range(1, {eir.robot.count + 1}):
        robot_node = Node(
            package="simweaver_navigation",
            executable="amr_controller",
            name=f"amr_{{i}}",
            parameters=[{{
                "robot_radius": {eir.robot.radius},
                "max_linear_speed": {eir.robot.max_linear_speed},
                "max_angular_speed": {eir.robot.max_angular_speed},
                "safety_margin": {eir.planner.safety_margin},
                "coordination_protocol": "{eir.coordination.protocol}",
                "lidar_range": {eir.sensors.lidar_range},
            }}]
        )
        ld.add_action(robot_node)
        
    return ld
'''
    return {
        "launch_file_content": launch_py,
        "package_name": "simweaver_ros2_generated"
    }


@app.get("/api/export/report")
async def export_report():
    """Generates a complete Engineering Experiment and Design Report."""
    wm = orchestrator.world_model
    eir = wm.active_eir
    
    lines = [
        f"# SimWeaver Autonomous Engineering Report",
        f"\n**Objective:** {eir.human_intent}",
        f"\n**Design Status:** {'CONVERGED' if wm.is_converged else 'IN PROGRESS'}",
        f"**Total Experiments Conducted:** {len(wm.history)}",
        f"\n## Design Lineage & Iteration History\n",
        "| Experiment | Protocol | Safety Margin | LiDAR Range | Collisions | Avg Delivery | Status |",
        "|---|---|---|---|---:|---:|---|"
    ]
    
    for exp in wm.history:
        d = exp.eir_design
        m = exp.metrics
        status = "PASS" if m.satisfies_all_constraints else "FAIL"
        lines.append(
            f"| Exp #{exp.experiment_id} | {d.coordination.protocol} | {d.planner.safety_margin}m | {d.sensors.lidar_range}m | {m.collision_count} | {m.avg_delivery_time_sec:.1f}s | **{status}** |"
        )
        
    lines.append("\n## Final Architecture (S_final)")
    lines.append(f"```yaml\n{eir.to_yaml()}\n```")
    
    return {"markdown_report": "\n".join(lines)}


@app.get("/api/export/urdf")
async def export_urdf():
    """Generates standard URDF XML for the active AMR design."""
    urdf_content = generate_urdf(orchestrator.world_model.active_eir)
    return {"urdf": urdf_content, "filename": "simweaver_amr.urdf"}


@app.get("/api/export/webots")
async def export_webots():
    """Generates Webots .wbt simulation world file for the active environment and robots."""
    wbt_content = generate_webots_world(orchestrator.world_model.active_eir)
    return {"webots_world": wbt_content, "filename": "simweaver_warehouse.wbt"}


@app.get("/api/export/pybullet")
async def export_pybullet():
    """Generates standalone Python PyBullet simulation script."""
    pybullet_code = generate_pybullet_script(orchestrator.world_model.active_eir)
    return {"pybullet_script": pybullet_code, "filename": "simulate_pybullet.py"}


@app.post("/api/presets/load")
async def load_preset(req: Optional[PresetRequest] = None, preset_name: Optional[str] = None, preset_id: Optional[str] = None):
    """Loads a benchmark scenario preset layout and initializes orchestrator."""
    target_id = (req.preset_id if req else None) or preset_id or preset_name or "warehouse_5_amr"
    env, robot_count, default_intent = get_preset_environment(target_id)
    
    eir = await orchestrator.initialize_from_prompt(default_intent)
    eir.environment = env
    eir.robot.count = robot_count
    orchestrator.world_model.active_eir = eir
    
    await ws_manager.broadcast({
        "type": "PRESET_LOADED",
        "preset_id": target_id,
        "eir": eir.model_dump(),
        "phase": orchestrator.current_phase,
        "thoughts": orchestrator.thought_stream
    })
    
    return {
        "status": "PRESET_LOADED",
        "preset_id": target_id,
        "eir": eir.model_dump(),
        "phase": orchestrator.current_phase,
        "thoughts": orchestrator.thought_stream
    }


@app.get("/api/experiments/{exp_id}/frames")
async def get_experiment_frames(exp_id: int):
    """Retrieves stored telemetry playback frames for scrubbing any previous iteration."""
    wm = orchestrator.world_model
    for exp in wm.history:
        if exp.experiment_id == exp_id:
            return {
                "experiment_id": exp_id,
                "iteration": exp.iteration,
                "metrics": exp.metrics.model_dump(),
                "frames": exp.frames
            }
    raise HTTPException(status_code=404, detail="Experiment record not found")


@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for high-frequency simulation canvas frame streaming
    and real-time agent thought event streaming.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            action = msg.get("action")

            if action == "run_live_simulation":
                # Run live simulation step-by-step and stream frames to WebSocket
                eir = orchestrator.world_model.active_eir
                engine = SimulationEngine(eir, seed=random.randint(1, 1000))
                speed = msg.get("speed", 1.0)
                dt = 0.05
                
                # Stream 300 ticks (~15 seconds simulated time)
                for step in range(300):
                    engine.step(dt)
                    if step % 2 == 0:
                        # Grab latest frame
                        if engine.telemetry.frames:
                            latest_frame = engine.telemetry.frames[-1]
                            await websocket.send_json({
                                "type": "FRAME_TICK",
                                "frame": latest_frame.model_dump()
                            })
                    await asyncio.sleep(max(0.01, (dt / speed) * 0.4))

            elif action == "step":
                result = await orchestrator.step_single_iteration()
                await websocket.send_json({
                    "type": "STEP_COMPLETE",
                    "result": result
                })

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        ws_manager.disconnect(websocket)
