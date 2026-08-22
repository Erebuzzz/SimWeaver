import React, { useState } from 'react';
import { 
  ExportSheetIcon, 
  SettingsSlidersIcon, 
  SparkleTargetIcon, 
  CheckSquareIcon, 
  CriticShieldIcon, 
  LidarSweepIcon, 
  RobotAgentIcon, 
  CompassGizmoIcon, 
  Blueprint2DIcon,
} from './icons/EngineeringIcons';
import { EIRSpec, RequirementStatusItem } from '../types';

interface ObjectivePanelProps {
  eir: EIRSpec | null;
  humanPrompt: string;
  onUpdatePrompt: (prompt: string) => void;
  onInitialize: () => void;
  isLoading: boolean;
  reqTable: RequirementStatusItem[];
}

export const ObjectivePanel: React.FC<ObjectivePanelProps> = ({
  eir,
  humanPrompt,
  onUpdatePrompt,
  onInitialize,
  isLoading,
  reqTable,
}) => {
  const [activeTab, setActiveTab] = useState<'intent' | 'eir' | 'arch'>('intent');
  const [copied, setCopied] = useState(false);

  const handleCopyYaml = () => {
    if (!eir) return;
    const yamlStr = JSON.stringify(eir, null, 2);
    navigator.clipboard.writeText(yamlStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-[310px] xl:w-[340px] shrink-0 h-full liquid-glass-panel border-r border-[var(--border-subtle)] flex flex-col text-[var(--text-primary)] transition-colors overflow-hidden">
      {/* Symmetrical Top Tab Switcher */}
      <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 gap-1 text-[11px] font-mono shrink-0">
        <button
          onClick={() => setActiveTab('intent')}
          className={`flex-1 py-1.5 rounded-md actuator-transition flex items-center justify-center gap-1 font-medium ${
            activeTab === 'intent'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <SparkleTargetIcon className="w-3 h-3 text-orange-400" />
          <span>Intent</span>
        </button>

        <button
          onClick={() => setActiveTab('eir')}
          className={`flex-1 py-1.5 rounded-md actuator-transition flex items-center justify-center gap-1 font-medium ${
            activeTab === 'eir'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Blueprint2DIcon className="w-3 h-3 text-blue-400" />
          <span>EIR Spec</span>
        </button>

        <button
          onClick={() => setActiveTab('arch')}
          className={`flex-1 py-1.5 rounded-md actuator-transition flex items-center justify-center gap-1 font-medium ${
            activeTab === 'arch'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <SettingsSlidersIcon className="w-3 h-3 text-indigo-400" />
          <span>Arch</span>
        </button>
      </div>

      {/* Scrollable Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'intent' && (
          <div className="space-y-3">
            {/* Natural Language Intent Editor */}
            <div className="liquid-glass-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono font-bold tracking-wider text-blue-400 flex items-center gap-1.5">
                  <SparkleTargetIcon className="w-3 h-3 text-orange-400" />
                  <span>ENGINEERING INTENT</span>
                </label>
                <span className="text-[9px] font-mono text-[var(--text-muted)]">Natural Language</span>
              </div>
              <textarea
                value={humanPrompt}
                onChange={(e) => onUpdatePrompt(e.target.value)}
                disabled={isLoading}
                rows={3}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-subtle)] rounded-md p-2 text-xs text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500/60 leading-relaxed resize-none font-sans"
                placeholder="Describe your robotics requirements..."
              />
              <button
                onClick={onInitialize}
                disabled={isLoading || !humanPrompt.trim()}
                className="w-full py-1.5 px-3 rounded-md text-[11px] font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm actuator-transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <SparkleTargetIcon className="w-3 h-3 text-white" />
                <span>{isLoading ? 'Compiling...' : 'Compile EIR & Requirements'}</span>
              </button>
            </div>

            {/* Extracted Constraints & Requirement Verification Table */}
            {eir && (
              <div className="liquid-glass-card p-3 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1.5">
                  <h4 className="text-[11px] font-mono font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <CriticShieldIcon className="w-3 h-3 text-orange-400" />
                    <span>FORMAL CONSTRAINTS</span>
                  </h4>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-500/10 text-[var(--text-secondary)]">
                    Target Specs
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="flex items-center justify-between py-0.5 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-secondary)]">Max Delivery Time:</span>
                    <strong className="text-[var(--text-primary)]">&lt; {eir.constraints.max_delivery_time_sec}s</strong>
                  </div>
                  <div className="flex items-center justify-between py-0.5 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-secondary)]">Max Collisions:</span>
                    <strong className="text-emerald-400 font-bold">{eir.constraints.max_allowed_collisions}</strong>
                  </div>
                  <div className="flex items-center justify-between py-0.5 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-secondary)]">Min Separation:</span>
                    <strong className="text-orange-400 font-bold">&gt; {eir.constraints.min_separation_m}m</strong>
                  </div>
                  <div className="flex items-center justify-between py-0.5 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-secondary)]">Min Completion:</span>
                    <strong className="text-[var(--text-primary)]">&gt; {intPercent(eir.constraints.min_completion_rate)}%</strong>
                  </div>
                </div>

                {/* Live Requirement Status Table */}
                {reqTable && reqTable.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1">
                    <div className="text-[10px] font-mono text-[var(--text-secondary)] font-semibold">
                      Verification Status:
                    </div>
                    {reqTable.map((req, i) => (
                      <div
                        key={i}
                        className={`p-1.5 rounded-md border text-[10px] font-mono flex items-center justify-between ${
                          req.status === 'PASS'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{req.name}</div>
                          <div className="text-[9px] opacity-80">
                            Target: {req.target} | Actual: {req.actual}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase">{req.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'eir' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                Design Schema ({eir?.id || 'Uninitialized'})
              </span>
              <button
                onClick={handleCopyYaml}
                className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center gap-1 actuator-transition"
              >
                {copied ? <CheckSquareIcon className="w-3 h-3 text-emerald-400" /> : <ExportSheetIcon className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="liquid-glass-card p-2.5 overflow-x-auto">
              <pre className="text-[10px] font-mono text-cyan-300 whitespace-pre-wrap leading-relaxed">
                {eir ? JSON.stringify(eir, null, 2) : '// No active EIR compiled yet.\n// Click "Compile EIR & Requirements" to start.'}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'arch' && eir && (
          <div className="space-y-2.5">
            {/* Robot Fleet */}
            <div className="liquid-glass-card p-2.5 space-y-1.5">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1">
                <span className="text-[11px] font-mono font-bold text-blue-400 flex items-center gap-1">
                  <RobotAgentIcon className="w-3 h-3" />
                  <span>ROBOT FLEET</span>
                </span>
                <span className="text-[9px] font-mono text-[var(--text-muted)]">{eir.robot.type}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                <div>
                  <span className="text-[var(--text-muted)]">Fleet Count:</span>
                  <strong className="text-[var(--text-primary)] block font-bold">{eir.robot.count} AMRs</strong>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Radius:</span>
                  <strong className="text-[var(--text-primary)] block">{eir.robot.radius} m</strong>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Max Speed:</span>
                  <strong className="text-emerald-400 block font-bold">{eir.robot.max_linear_speed} m/s</strong>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Mass:</span>
                  <strong className="text-[var(--text-primary)] block">{eir.robot.mass} kg</strong>
                </div>
              </div>
            </div>

            {/* Perception Sensor Suite */}
            <div className="liquid-glass-card p-2.5 space-y-1.5">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1">
                <span className="text-[11px] font-mono font-bold text-indigo-400 flex items-center gap-1">
                  <LidarSweepIcon className="w-3 h-3" />
                  <span>PERCEPTION</span>
                </span>
                <span className="text-[9px] font-mono text-[var(--text-muted)]">2D LiDAR</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                <div>
                  <span className="text-[var(--text-muted)]">Range:</span>
                  <strong className="text-blue-400 block font-bold">{eir.sensors.lidar_range} m</strong>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">FOV:</span>
                  <strong className="text-[var(--text-primary)] block">{eir.sensors.lidar_fov_deg}°</strong>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Rays:</span>
                  <strong className="text-[var(--text-primary)] block">{eir.sensors.lidar_rays} beams</strong>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Noise Std:</span>
                  <strong className="text-[var(--text-primary)] block">{eir.sensors.lidar_noise_std} m</strong>
                </div>
              </div>
            </div>

            {/* Navigation & Traffic Coordination */}
            <div className="liquid-glass-card p-2.5 space-y-1.5">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1">
                <span className="text-[11px] font-mono font-bold text-orange-400 flex items-center gap-1">
                  <CompassGizmoIcon className="w-3 h-3" />
                  <span>TRAFFIC & NAV</span>
                </span>
                <span className="text-[9px] font-mono text-[var(--text-muted)]">Planner</span>
              </div>
              <div className="space-y-1 text-[10px] font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Global:</span>
                  <strong className="text-[var(--text-primary)] uppercase">{eir.planner.global_planner}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Local:</span>
                  <strong className="text-[var(--text-primary)] uppercase">{eir.planner.local_planner}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Safety Margin:</span>
                  <strong className="text-blue-400 font-bold">{eir.planner.safety_margin} m</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Coordination:</span>
                  <strong className="text-orange-400 font-bold uppercase">{eir.coordination.protocol}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

function intPercent(val: number): number {
  return Math.round(val * 100);
}
