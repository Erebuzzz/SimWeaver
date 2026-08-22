import React, { useState } from 'react';
import {
  LayersLayoutIcon,
  BrainNeuralIcon,
  Cube3DIcon,
  Blueprint2DIcon,
  GaugeMetricIcon,
  CriticShieldIcon,
  ExportSheetIcon,
  RobotAgentIcon,
  SparkleTargetIcon,
  CheckSquareIcon,
  TerminalConsoleIcon,
} from './icons/EngineeringIcons';
import { MermaidRenderer } from './MermaidRenderer';

interface DocumentationPageProps {
  onNavigateToSimulator: () => void;
  isDarkMode: boolean;
}

export const DocumentationPage: React.FC<DocumentationPageProps> = ({
  onNavigateToSimulator,
  isDarkMode,
}) => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const navItems = [
    { id: 'overview', label: '1. System Overview' },
    { id: 'compile-flow', label: '2. The Compile Pipeline' },
    { id: 'agent-loop', label: '3. 7-Agent Reasoning Loop' },
    { id: 'cost-formulation', label: '4. Mathematical Cost J' },
    { id: 'physics-engine', label: '5. Kinematics & Planners' },
    { id: 'eir-schema', label: '6. EIR Schema Standard' },
    { id: 'critic-perturbations', label: '7. Adversarial Critic' },
    { id: 'export-targets', label: '8. Multi-Simulator Code Synthesis' },
    { id: 'benchmarks', label: '9. Industrial Benchmarks' },
    { id: 'deployment', label: '10. Cloud Deployment & MCP' },
  ];

  const overviewMermaid = `flowchart TD
    A["Human Operational Intent"] --> B["Requirement Agent"]
    B -->|"Formal Constraints"| C["Systems Architect Agent"]
    C -->|"Executable EIR Schema S_0"| D["Simulation Builder Agent"]
    D -->|"Continuous Physics ODE"| E["Physics Kinematics Engine"]
    E -->|"Trajectory Telemetry"| F["Evaluator Agent"]
    F -->|"Cost Function J"| G{"Meets All Constraints?"}
    G -->|"No: Violations Detected"| H["Failure Diagnosis Agent"]
    H -->|"Causal Root Cause"| I["Experiment Optimizer Agent"]
    I -->|"Parametric Intervention S_t+1"| D
    G -->|"Yes: Nominal Pass"| J["Adversarial Critic Agent"]
    J -->|"4D Perturbation Battery"| K{"Robust Under Shifts?"}
    K -->|"No: Fragile Overfit"| H
    K -->|"Yes: Verified Robust"| L["World Model Convergence"]
    L --> M["ROS2 / Webots / URDF / PyBullet Export"]`;

  const compileSequenceMermaid = `sequenceDiagram
    autonumber
    actor User as Engineer
    participant API as FastAPI Router
    participant Req as RequirementAgent
    participant Arch as SystemsArchitectAgent
    participant WM as WorldModel

    User->>API: POST /api/orchestrator/init { prompt }
    API->>Req: parse_requirements(human_prompt)
    Note over Req: Decomposes natural language into<br/>formal constraints:<br/>C_max=0, T_max<60s, D_min>0.30m
    Req-->>API: Formal Constraints & Success Metrics
    API->>Arch: design_architecture(eir)
    Note over Arch: Synthesizes baseline S_0:<br/>Morphology (r=0.28m, v=1.2m/s)<br/>Sensors (LiDAR 3.5m, 720 rays)<br/>Navigation (A* + DWA)
    Arch-->>API: Synthesized S_0 Design
    API->>WM: Register Active EIRSpec Schema
    API-->>User: HTTP 200 OK { eir, thoughts }`;

  const loopFlowMermaid = `flowchart LR
    subgraph Plan_Stage ["1. Plan & Architect"]
        RA["RequirementAgent"] --> SA["SystemsArchitectAgent"]
    end
    subgraph Build_Stage ["2. Build & Simulate"]
        SA --> SB["SimulationBuilderAgent"]
        SB --> ODE["Kinematic ODE dt=0.05s"]
    end
    subgraph Evaluate_Stage ["3. Evaluate & Critic"]
        ODE --> EV["EvaluatorAgent"]
        EV --> CR["CriticAgent"]
    end
    subgraph Diagnose_Stage ["4. Diagnose & Optimize"]
        EV -.->|"If Failed"| FD["FailureDiagnosisAgent"]
        CR -.->|"If Fragile"| FD
        FD --> EO["ExperimentOptimizerAgent"]
        EO -->|"Next Design S_t+1"| SB
    end`;

  return (
    <div className="w-full min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8">
        {/* Header Title */}
        <div className="border-b border-[var(--border-subtle)] pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-mono font-bold tracking-wide mb-2">
              <TerminalConsoleIcon className="w-3 h-3 text-orange-400" />
              <span>TECHNICAL REFERENCE SPECIFICATION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans">
              SimWeaver Documentation & Architecture
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-sans">
              Complete technical specification of the autonomous multi-agent robotics simulation,
              continuous kinematics engine, and multi-simulator export pipeline.
            </p>
          </div>

          <button
            onClick={onNavigateToSimulator}
            className="px-4 py-2 rounded-md text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm actuator-transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Cube3DIcon className="w-3.5 h-3.5 text-white" />
            <span>Open Simulator Studio</span>
          </button>
        </div>

        {/* Layout: Sticky Sidebar Navigation + Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar Table of Contents */}
          <aside className="lg:col-span-3 sticky top-4 liquid-glass-card p-3 rounded-lg border border-[var(--border-subtle)] space-y-1 text-xs font-mono">
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold px-2 py-1 border-b border-[var(--border-subtle)] mb-1">
              Table of Contents
            </div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  const el = document.getElementById(item.id);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md actuator-transition font-medium text-[11px] block truncate ${
                  activeSection === item.id
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </aside>

          {/* Right Main Content Body */}
          <main className="lg:col-span-9 space-y-12 text-sm leading-relaxed font-sans">
            {/* SECTION 1: System Overview */}
            <section id="overview" className="liquid-glass-card p-6 rounded-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                <LayersLayoutIcon className="w-4 h-4 text-blue-400" />
                <h2 className="text-lg font-bold font-mono text-[var(--text-primary)]">
                  1. System Overview & Architecture Design
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                SimWeaver is an autonomous simulation engineering system designed to bridge natural language
                human engineering intent and formal, physically verified robotics simulation environments.
                Traditional simulation setups require weeks of manual CAD preparation, URDF authoring,
                tuning obstacle avoidance parameters, and setting up ROS2 navigation stacks. SimWeaver
                automates this entire lifecycle into an auditable closed loop.
              </p>

              {/* Interactive Compiled Mermaid Diagram */}
              <div className="space-y-2 pt-2">
                <div className="text-[10px] font-mono text-orange-400 font-bold uppercase">
                  Compiled Architecture Diagram (Mermaid.js)
                </div>
                <MermaidRenderer chart={overviewMermaid} isDarkMode={isDarkMode} />
              </div>
            </section>

            {/* SECTION 2: What Happens on Compile */}
            <section id="compile-flow" className="liquid-glass-card p-6 rounded-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                <SparkleTargetIcon className="w-4 h-4 text-orange-400" />
                <h2 className="text-lg font-bold font-mono text-[var(--text-primary)]">
                  2. What Happens When You Press "Compile"
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                When a user enters natural language requirements and clicks <strong>"Compile EIR & Requirements"</strong>,
                the backend executes a deterministic two-stage compilation pipeline:
              </p>

              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-mono text-orange-400 font-bold uppercase">
                  Compilation Sequence Diagram (Mermaid.js)
                </div>
                <MermaidRenderer chart={compileSequenceMermaid} isDarkMode={isDarkMode} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans pt-2">
                <div className="bg-[var(--bg-main)] p-4 rounded-md border border-[var(--border-subtle)] space-y-2">
                  <div className="font-mono font-bold text-blue-400 text-xs">
                    Stage 1: Intent Extraction & Requirement Formulation
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    The backend invokes <code>RequirementAgent</code> to parse unstructured language into strict
                    mathematical constraints:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-mono text-[var(--text-primary)]">
                    <li>Max Allowed Collisions: <code>C_max = 0</code></li>
                    <li>Max Delivery Time: <code>T_max &lt; 60.0s</code></li>
                    <li>Min Safety Separation: <code>D_min &gt; 0.30m</code></li>
                    <li>Min Task Completion Rate: <code>Rate &ge; 95%</code></li>
                  </ul>
                </div>

                <div className="bg-[var(--bg-main)] p-4 rounded-md border border-[var(--border-subtle)] space-y-2">
                  <div className="font-mono font-bold text-indigo-400 text-xs">
                    Stage 2: Systems Architecture Synthesis (S_0)
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    The <code>SystemsArchitectAgent</code> synthesizes the initial baseline <code>EIRSpec</code> model:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-mono text-[var(--text-primary)]">
                    <li>Robot Morphology: <code>r = 0.28m, v_max = 1.2m/s, mass = 25kg</code></li>
                    <li>Sensor Suite: <code>LiDAR range = 3.5m, 720 rays, 20Hz</code></li>
                    <li>Navigation Stack: <code>A* Global + DWA Local Planner</code></li>
                    <li>Coordination Protocol: <code>decentralized_priority</code></li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-500/10 p-3 rounded-md border border-blue-500/30 text-xs text-blue-300 font-mono">
                <strong>Result:</strong> An authoritative, serializable Pydantic v2 <code>EIRSpec</code> object is
                instantiated in the <code>WorldModel</code>, ready for simulation execution or step-by-step debugging.
              </div>
            </section>

            {/* SECTION 3: The 7-Agent Reasoning Loop */}
            <section id="agent-loop" className="liquid-glass-card p-6 rounded-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                <BrainNeuralIcon className="w-4 h-4 text-purple-400" />
                <h2 className="text-lg font-bold font-mono text-[var(--text-primary)]">
                  3. The 7-Agent Autonomous Reasoning Loop
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                SimWeaver structures reasoning across 7 specialized agents, enforcing clear separation of concerns
                and rigorous validation:
              </p>

              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-mono text-orange-400 font-bold uppercase">
                  Closed-Loop Agent Lifecycle (Mermaid.js)
                </div>
                <MermaidRenderer chart={loopFlowMermaid} isDarkMode={isDarkMode} />
              </div>

              <div className="space-y-3 text-xs font-mono pt-2">
                <div className="p-3 bg-[var(--bg-main)] rounded-md border border-[var(--border-subtle)]">
                  <span className="font-bold text-blue-400">1. RequirementAgent:</span> Extracts formal constraint
                  boundaries and success metrics from user statements.
                </div>
                <div className="p-3 bg-[var(--bg-main)] rounded-md border border-[var(--border-subtle)]">
                  <span className="font-bold text-indigo-400">2. SystemsArchitectAgent:</span> Formulates kinematic
                  morphology, perception sensor suites, navigation stacks, and traffic coordination protocols.
                </div>
                <div className="p-3 bg-[var(--bg-main)] rounded-md border border-[var(--border-subtle)]">
                  <span className="font-bold text-amber-400">3. SimulationBuilderAgent:</span> Instantiates continuous
                  physics simulation environments from the EIR specification.
                </div>
                <div className="p-3 bg-[var(--bg-main)] rounded-md border border-[var(--border-subtle)]">
                  <span className="font-bold text-purple-400">4. EvaluatorAgent:</span> Evaluates run trajectories,
                  computes composite Cost J, and produces verification status tables.
                </div>
                <div className="p-3 bg-[var(--bg-main)] rounded-md border border-[var(--border-subtle)]">
                  <span className="font-bold text-rose-400">5. FailureDiagnosisAgent:</span> Analyzes telemetry to isolate
                  causal bottlenecks (such as intersection deadlocks or velocity oscillations).
                </div>
                <div className="p-3 bg-[var(--bg-main)] rounded-md border border-[var(--border-subtle)]">
                  <span className="font-bold text-orange-400">6. ExperimentOptimizerAgent:</span> Proposes ranked
                  parameter interventions to synthesize the next candidate design S_(t+1).
                </div>
                <div className="p-3 bg-[var(--bg-main)] rounded-md border border-[var(--border-subtle)]">
                  <span className="font-bold text-emerald-400">7. CriticAgent:</span> Subjects passing designs to
                  4-dimensional environmental shifts to ensure robustness against overfitting.
                </div>
              </div>
            </section>

            {/* SECTION 4: Cost Formulation */}
            <section id="cost-formulation" className="liquid-glass-card p-6 rounded-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                <GaugeMetricIcon className="w-4 h-4 text-orange-400" />
                <h2 className="text-lg font-bold font-mono text-[var(--text-primary)]">
                  4. Multi-Objective Cost Formulation J
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                The optimization engine guides architectural search by minimizing the composite multi-objective
                scalar cost function:
              </p>

              <div className="p-4 bg-[var(--bg-main)] rounded-md border border-[var(--border-subtle)] font-mono text-xs text-orange-400">
                <code>J(S_t) = w_c · C + w_t · T_avg + w_r · (1 - R) + w_s · max(0, d_safe - d_min)</code>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-[var(--bg-main)] p-2.5 rounded border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] block text-[10px]">COLLISION PENALTY</span>
                  <strong className="text-rose-400">w_c = 100.0</strong>
                  <p className="text-[9px] text-[var(--text-secondary)] mt-1 font-sans">Strict zero-collision gate.</p>
                </div>
                <div className="bg-[var(--bg-main)] p-2.5 rounded border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] block text-[10px]">DELIVERY TIME</span>
                  <strong className="text-blue-400">w_t = 0.05</strong>
                  <p className="text-[9px] text-[var(--text-secondary)] mt-1 font-sans">Minimizes mission duration.</p>
                </div>
                <div className="bg-[var(--bg-main)] p-2.5 rounded border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] block text-[10px]">COMPLETION RATE</span>
                  <strong className="text-indigo-400">w_r = 10.0</strong>
                  <p className="text-[9px] text-[var(--text-secondary)] mt-1 font-sans">Penalizes dropped missions.</p>
                </div>
                <div className="bg-[var(--bg-main)] p-2.5 rounded border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] block text-[10px]">SEPARATION BUFFER</span>
                  <strong className="text-orange-400">w_s = 20.0</strong>
                  <p className="text-[9px] text-[var(--text-secondary)] mt-1 font-sans">Penalizes near-misses.</p>
                </div>
              </div>
            </section>

            {/* SECTION 5: Kinematics & Physics */}
            <section id="physics-engine" className="liquid-glass-card p-6 rounded-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                <Cube3DIcon className="w-4 h-4 text-blue-400" />
                <h2 className="text-lg font-bold font-mono text-[var(--text-primary)]">
                  5. Kinematics, LiDAR Raycasting & Planners
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                The physics engine models differential-drive unicycle kinematics integrated via continuous
                differential equations at step size Δt = 0.05s:
              </p>

              <div className="p-3 bg-[var(--bg-main)] rounded-md border border-[var(--border-subtle)] font-mono text-xs text-cyan-400">
                <code>dx/dt = v · cos(θ),  dy/dt = v · sin(θ),  dθ/dt = ω</code>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-[var(--bg-main)] p-3 rounded border border-[var(--border-subtle)] space-y-1">
                  <span className="text-blue-400 font-bold">A* Global Planner:</span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                    Generates discrete grid paths with post-process line-of-sight waypoint smoothing.
                  </p>
                </div>
                <div className="bg-[var(--bg-main)] p-3 rounded border border-[var(--border-subtle)] space-y-1">
                  <span className="text-orange-400 font-bold">Dynamic Window (DWA):</span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                    Samples forward velocity pairs (v, ω) respecting acceleration and braking limits.
                  </p>
                </div>
                <div className="bg-[var(--bg-main)] p-3 rounded border border-[var(--border-subtle)] space-y-1">
                  <span className="text-emerald-400 font-bold">Intersection Manager:</span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                    Grants spatial-temporal reservations to resolve multi-robot intersection crossing conflicts.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 6: EIR Schema */}
            <section id="eir-schema" className="liquid-glass-card p-6 rounded-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                <Blueprint2DIcon className="w-4 h-4 text-cyan-400" />
                <h2 className="text-lg font-bold font-mono text-[var(--text-primary)]">
                  6. Executable Intermediate Representation (EIR) Standard
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                The EIR schema defines the single source of truth for robot geometry, sensors, planners,
                and environment layouts.
              </p>

              <div className="p-3 bg-[var(--bg-main)] rounded border border-[var(--border-subtle)] font-mono text-[11px] text-cyan-300 overflow-x-auto leading-relaxed">
                <pre>{`schema_version: "1.0.0"
id: "eir_warehouse_5_amr"
robot:
  type: "differential_drive"
  count: 5
  radius: 0.28
  max_linear_speed: 1.2
  max_angular_speed: 2.0
sensors:
  lidar_range: 3.5
  lidar_fov_deg: 360.0
  lidar_rays: 720
planner:
  global_planner: "a_star"
  local_planner: "dwa"
  safety_margin: 0.45
coordination:
  protocol: "intersection_reservation"
constraints:
  max_allowed_collisions: 0
  max_delivery_time_sec: 60.0
  min_separation_m: 0.30
  min_completion_rate: 0.95`}</pre>
              </div>
            </section>

            {/* SECTION 7: Adversarial Critic */}
            <section id="critic-perturbations" className="liquid-glass-card p-6 rounded-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                <CriticShieldIcon className="w-4 h-4 text-rose-400" />
                <h2 className="text-lg font-bold font-mono text-[var(--text-primary)]">
                  7. Adversarial Robustness Critic Battery
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                To prevent solutions from overfitting to nominal simulation conditions, the <code>CriticAgent</code>
                challenges candidate designs against 4 simultaneous stress vectors:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-[var(--bg-main)] rounded border border-[var(--border-subtle)] space-y-1">
                  <span className="text-orange-400 font-bold">1. Sensor Noise Surge:</span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                    Triples Gaussian measurement noise to stress-test obstacle detection reliability.
                  </p>
                </div>
                <div className="p-3 bg-[var(--bg-main)] rounded border border-[var(--border-subtle)] space-y-1">
                  <span className="text-rose-400 font-bold">2. Payload Mass Surge (+40%):</span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                    Increases inertia to test braking distances and deceleration thresholds.
                  </p>
                </div>
                <div className="p-3 bg-[var(--bg-main)] rounded border border-[var(--border-subtle)] space-y-1">
                  <span className="text-amber-400 font-bold">3. Wheel Drift Slip (+15%):</span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                    Injects odometry drift to test path tracking recovery.
                  </p>
                </div>
                <div className="p-3 bg-[var(--bg-main)] rounded border border-[var(--border-subtle)] space-y-1">
                  <span className="text-blue-400 font-bold">4. Task Volume Spike (+50%):</span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                    Spawns dense logistics transport demand to test intersection throughput.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 8: Multi-Simulator Export */}
            <section id="export-targets" className="liquid-glass-card p-6 rounded-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                <ExportSheetIcon className="w-4 h-4 text-emerald-400" />
                <h2 className="text-lg font-bold font-mono text-[var(--text-primary)]">
                  8. Multi-Simulator Code Synthesis
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Once a design converges, SimWeaver compiles the active EIR into 4 production simulation formats:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-[var(--bg-main)] rounded border border-[var(--border-subtle)]">
                  <span className="font-bold text-blue-400">ROS2 Nav2 Launch:</span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-sans mt-1">
                    Generates Python launch files and YAML parameter trees for ROS2 Humble.
                  </p>
                </div>
                <div className="p-3 bg-[var(--bg-main)] rounded border border-[var(--border-subtle)]">
                  <span className="font-bold text-indigo-400">Webots World (.wbt):</span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-sans mt-1">
                    Exports 3D warehouse environments with PBR materials and physical differential-drive robots.
                  </p>
                </div>
                <div className="p-3 bg-[var(--bg-main)] rounded border border-[var(--border-subtle)]">
                  <span className="font-bold text-purple-400">URDF XML Kinematics:</span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-sans mt-1">
                    Generates valid robot description XML with base links, wheel joints, and inertial tensors.
                  </p>
                </div>
                <div className="p-3 bg-[var(--bg-main)] rounded border border-[var(--border-subtle)]">
                  <span className="font-bold text-emerald-400">PyBullet Physics (.py):</span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-sans mt-1">
                    Standalone Python simulation script for headless continuous physics benchmarks.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 9: Benchmark Scenarios */}
            <section id="benchmarks" className="liquid-glass-card p-6 rounded-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                <RobotAgentIcon className="w-4 h-4 text-orange-400" />
                <h2 className="text-lg font-bold font-mono text-[var(--text-primary)]">
                  9. Industrial Benchmark Scenarios
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                SimWeaver includes 4 standardized industrial benchmark environments:
              </p>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 bg-[var(--bg-main)] rounded border border-[var(--border-subtle)] flex items-center justify-between">
                  <div>
                    <strong className="text-blue-400">01. Warehouse 5-AMR Traffic:</strong> Narrow aisles with high transport volume.
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">5 Robots | 24x16m</span>
                </div>
                <div className="p-2.5 bg-[var(--bg-main)] rounded border border-[var(--border-subtle)] flex items-center justify-between">
                  <div>
                    <strong className="text-indigo-400">02. Cross-Traffic 8-AMR:</strong> High-density 4-way intersection bottleneck.
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">8 Robots | 20x20m</span>
                </div>
                <div className="p-2.5 bg-[var(--bg-main)] rounded border border-[var(--border-subtle)] flex items-center justify-between">
                  <div>
                    <strong className="text-purple-400">03. Hospital Cleanroom:</strong> Ultra-strict separation and smooth acceleration.
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">4 Robots | 18x14m</span>
                </div>
                <div className="p-2.5 bg-[var(--bg-main)] rounded border border-[var(--border-subtle)] flex items-center justify-between">
                  <div>
                    <strong className="text-orange-400">04. Airport Baggage Hub:</strong> Continuous transport loop with dynamic priorities.
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">6 Robots | 30x18m</span>
                </div>
              </div>
            </section>

            {/* Section 10: Cloud Deployment & MCP Integration */}
            <section id="deployment" className="p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
                <ExportSheetIcon className="w-4 h-4 text-emerald-400" />
                10. Production Cloud Deployment & Model Context Protocol (MCP)
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                SimWeaver operates in production on a decoupled hybrid architecture: the React 18 / Three.js 3D viewport is distributed globally over Vercel Edge CDN, while the continuous kinematic ODE physics engine and live WebSocket gateway run on a dedicated Render web service.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-2">
                  <div className="text-xs font-bold text-blue-400">Production Endpoints</div>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Frontend:</span>
                      <a href="https://simweaver.vercel.app" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">simweaver.vercel.app</a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Backend API:</span>
                      <a href="https://simweaver-api.onrender.com" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">simweaver-api.onrender.com</a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Duplex WS:</span>
                      <span className="text-amber-400">wss://simweaver-api.onrender.com/ws</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-2">
                  <div className="text-xs font-bold text-purple-400">24/7 Keep-Alive Protection</div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    To eliminate Render free-tier idle shutdowns (15-min limit), SimWeaver uses a dual keep-alive loop: an internal FastAPI Lifespan self-ping every 10 minutes plus a GitHub Actions automated cron workflow.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-2">
                <div className="text-xs font-bold text-amber-400 font-mono">MCP Configuration (Gemini / Claude / Cursor)</div>
                <pre className="p-3 bg-[var(--bg-surface)] rounded text-[11px] font-mono text-[var(--text-secondary)] overflow-x-auto border border-[var(--border-subtle)]">
{`{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.vercel.com"]
    },
    "render": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.render.com/mcp", "--header", "Authorization: Bearer YOUR_RENDER_API_KEY"],
      "env": { "RENDER_API_KEY": "YOUR_RENDER_API_KEY" }
    }
  }
}`}
                </pre>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};
