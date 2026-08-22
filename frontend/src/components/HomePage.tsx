import React from 'react';
import {
  SimWeaverLogoIcon,
  RobotAgentIcon,
  BrainNeuralIcon,
  LidarSweepIcon,
  GaugeMetricIcon,
  CriticShieldIcon,
  ExportSheetIcon,
  Cube3DIcon,
  Blueprint2DIcon,
  ArrowRightIcon,
  PlaySolidIcon,
  ZapLoopIcon,
  SettingsSlidersIcon,
  LayersLayoutIcon,
  CheckSquareIcon,
  CrosshairIcon
} from './icons/EngineeringIcons';
import { Hero3DViewer } from './Hero3DViewer';

interface HomePageProps {
  onLaunchSimulator: () => void;
  isDarkMode: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ onLaunchSimulator, isDarkMode }) => {
  return (
    <div className="w-full min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors overflow-x-hidden">
      {/* Container with strict aspect ratio and boundary controls */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 space-y-20">
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span>AGENTIC ROBOTICS SIMULATION PLATFORM</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] font-sans">
              Autonomous Robotics{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-orange-400 bg-clip-text text-transparent">
                Design & Synthesis
              </span>{' '}
              Engine
            </h1>

            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl font-sans">
              SimWeaver compiles natural language robotics intent into formal executable
              specifications, runs continuous 2D/3D kinematic simulations, isolates causal
              bottlenecks through a 7-agent loop, and exports production-grade ROS2, Webots, URDF,
              and PyBullet configurations.
            </p>

            {/* CTA Buttons (Squircle Geometry with Blue to Orange Gradient) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onLaunchSimulator}
                className="px-6 py-3 rounded-md text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm actuator-transition flex items-center gap-2 cursor-pointer"
              >
                <PlaySolidIcon className="w-3.5 h-3.5 text-white" />
                <span>Launch Simulator Studio</span>
                <ArrowRightIcon className="w-3.5 h-3.5 text-white ml-1" />
              </button>

              <a
                href="#architecture"
                className="px-5 py-3 rounded-md text-xs font-mono font-semibold bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] actuator-transition flex items-center gap-2 shadow-sm"
              >
                <LayersLayoutIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>System Architecture</span>
              </a>
            </div>

            {/* Quick Spec Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-5 border-t border-[var(--border-subtle)] text-xs font-mono">
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">
                  Reasoning Agents
                </span>
                <strong className="text-blue-400 text-base font-bold">7 Autonomous</strong>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">
                  Continuous Physics
                </span>
                <strong className="text-emerald-400 text-base font-bold">Δt = 0.05s ODE</strong>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">
                  Export Targets
                </span>
                <strong className="text-orange-400 text-base font-bold">4 Simulators</strong>
              </div>
            </div>
          </div>

          {/* Right Hero 3D Hardware Viewport */}
          <div className="lg:col-span-5 h-[380px] sm:h-[440px] w-full">
            <Hero3DViewer isDarkMode={isDarkMode} />
          </div>
        </section>

        {/* CORE CAPABILITIES GRID (6 Precision Pillars) */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-orange-400 font-bold uppercase tracking-wider">
              <ZapLoopIcon className="w-3 h-3" />
              <span>Core System Capabilities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-sans">
              Engineered for Rigorous Autonomous Robotics Synthesis
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Bridging the gap between human engineering intent and mathematically verified
              simulation environments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Capability 1 */}
            <div className="liquid-glass-card p-5 space-y-2.5 rounded-lg">
              <div className="w-8 h-8 rounded-md bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <BrainNeuralIcon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-sans">7-Agent Closed-Loop Reasoning</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Decomposes tasks across Requirement, Systems Architect, Simulation Builder,
                Evaluator, Diagnostician, Optimizer, and Adversarial Critic agents.
              </p>
            </div>

            {/* Capability 2 */}
            <div className="liquid-glass-card p-5 space-y-2.5 rounded-lg">
              <div className="w-8 h-8 rounded-md bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Cube3DIcon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-sans">High-Fidelity 3D/2D Kinematics</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Custom physics engine featuring differential-drive kinematics, raycasted 2D
                LiDAR with Gaussian noise, A* global smoothing, and dynamic window local planning.
              </p>
            </div>

            {/* Capability 3 */}
            <div className="liquid-glass-card p-5 space-y-2.5 rounded-lg">
              <div className="w-8 h-8 rounded-md bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Blueprint2DIcon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-sans">Executable Intermediate Schema</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Authoritative EIR format standardizes morphology, sensor parameters, traffic
                coordination policies, and formal constraints across all simulators.
              </p>
            </div>

            {/* Capability 4 */}
            <div className="liquid-glass-card p-5 space-y-2.5 rounded-lg">
              <div className="w-8 h-8 rounded-md bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <GaugeMetricIcon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-sans">Multi-Objective Cost Formulation</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Computes composite score J balancing zero collisions, minimal delivery duration,
                maximum throughput rate, and minimum safety separation tolerances.
              </p>
            </div>

            {/* Capability 5 */}
            <div className="liquid-glass-card p-5 space-y-2.5 rounded-lg">
              <div className="w-8 h-8 rounded-md bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <CriticShieldIcon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-sans">Adversarial Robustness Critic</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Subject designs to 4-dimensional environmental shifts: sensor noise surges, robot
                mass increases, wheel drift, and task volume spikes to prevent overfitting.
              </p>
            </div>

            {/* Capability 6 */}
            <div className="liquid-glass-card p-5 space-y-2.5 rounded-lg">
              <div className="w-8 h-8 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ExportSheetIcon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-sans">Multi-Simulator Code Synthesis</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                One-click export directly to ROS2 Nav2 launch configurations, Webots 3D world
                descriptions, URDF XML robot kinematics, and standalone PyBullet scripts.
              </p>
            </div>
          </div>
        </section>

        {/* WORKFLOW PIPELINE ARCHITECTURE */}
        <section id="architecture" className="space-y-6 pt-2">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
              <LayersLayoutIcon className="w-3 h-3" />
              <span>Closed-Loop Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-sans">
              How SimWeaver Synthesizes Robotics Systems
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              An auditable, self-correcting optimization loop with full state lineage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Step 1 */}
            <div className="liquid-glass-card p-4 rounded-md space-y-2">
              <div className="text-[10px] font-mono font-bold text-blue-400">PHASE 1</div>
              <h4 className="font-bold text-xs font-mono">Intent & EIR Compilation</h4>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">
                Parses human operational requirements into mathematical constraints and structured
                robotics topologies.
              </p>
            </div>

            {/* Step 2 */}
            <div className="liquid-glass-card p-4 rounded-md space-y-2">
              <div className="text-[10px] font-mono font-bold text-indigo-400">PHASE 2</div>
              <h4 className="font-bold text-xs font-mono">Kinematic Simulation</h4>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">
                Executes continuous physics with obstacle raycasting and spatial-temporal traffic
                coordination.
              </p>
            </div>

            {/* Step 3 */}
            <div className="liquid-glass-card p-4 rounded-md space-y-2">
              <div className="text-[10px] font-mono font-bold text-rose-400">PHASE 3</div>
              <h4 className="font-bold text-xs font-mono">Causal Failure Diagnosis</h4>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">
                Isolates intersection deadlocks, velocity bottlenecks, and sensor blindspots with
                actionable interventions.
              </p>
            </div>

            {/* Step 4 */}
            <div className="liquid-glass-card p-4 rounded-md space-y-2">
              <div className="text-[10px] font-mono font-bold text-orange-400">PHASE 4</div>
              <h4 className="font-bold text-xs font-mono">Critic & Multi-Export</h4>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">
                Verifies perturbation robustness and generates production simulator launch
                artifacts.
              </p>
            </div>
          </div>
        </section>

        {/* BENCHMARK SCENARIO ENVIRONMENTS */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-orange-400 font-bold uppercase tracking-wider">
              <RobotAgentIcon className="w-3 h-3" />
              <span>Benchmark Environments</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-sans">
              Industrial Benchmark Scenarios
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Validate your fleet across four diverse physical layouts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="liquid-glass-card p-4 rounded-md space-y-1.5">
              <div className="text-xs font-mono font-bold text-blue-400">01. Warehouse 5-AMR</div>
              <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                Narrow aisles with high package transport volume and dynamic crossing bottlenecks.
              </p>
            </div>

            <div className="liquid-glass-card p-4 rounded-md space-y-1.5">
              <div className="text-xs font-mono font-bold text-indigo-400">02. Cross-Traffic 8-AMR</div>
              <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                High-density 4-way intersection requiring spatial-temporal yield reservations.
              </p>
            </div>

            <div className="liquid-glass-card p-4 rounded-md space-y-1.5">
              <div className="text-xs font-mono font-bold text-purple-400">03. Hospital Cleanroom</div>
              <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                Strict separation constraints, ultra-smooth acceleration limits, and zero collisions.
              </p>
            </div>

            <div className="liquid-glass-card p-4 rounded-md space-y-1.5">
              <div className="text-xs font-mono font-bold text-orange-400">04. Airport Baggage Hub</div>
              <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                Continuous loop transport with dynamic payload distribution and priority routing.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION BANNER */}
        <section className="liquid-glass-card p-8 rounded-xl text-center space-y-4 border border-orange-500/30 bg-gradient-to-b from-blue-500/5 via-indigo-500/5 to-orange-500/10">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/30 border border-amber-300/40">
            <SimWeaverLogoIcon className="w-5 h-5" />
          </div>

          <div className="max-w-xl mx-auto space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-extrabold font-sans">
              Ready to simulate and synthesize your robotics fleet?
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
              Step through autonomous optimization cycles or test your own natural language
              engineering intent in real time.
            </p>
          </div>

          <button
            onClick={onLaunchSimulator}
            className="px-6 py-3 rounded-md text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm actuator-transition inline-flex items-center gap-2 cursor-pointer"
          >
            <PlaySolidIcon className="w-3.5 h-3.5 text-white" />
            <span>Open Simulator Studio</span>
            <ArrowRightIcon className="w-3.5 h-3.5 text-white" />
          </button>
        </section>
      </div>
    </div>
  );
};
