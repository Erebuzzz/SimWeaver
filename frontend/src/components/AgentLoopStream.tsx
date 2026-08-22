import React, { useRef, useEffect } from 'react';
import { 
  RobotAgentIcon, 
  BrainNeuralIcon, 
  LidarSweepIcon, 
  GaugeMetricIcon, 
  CriticShieldIcon, 
  TerminalConsoleIcon,
  CheckSquareIcon,
  SparkleTargetIcon
} from './icons/EngineeringIcons';
import { ThoughtEvent } from '../types';

interface AgentLoopStreamProps {
  thoughts: ThoughtEvent[];
  isConverged: boolean;
}

export const AgentLoopStream: React.FC<AgentLoopStreamProps> = ({ thoughts, isConverged }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts]);

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'RequirementAgent':
        return <BrainNeuralIcon className="w-3 h-3 text-blue-400" />;
      case 'SystemsArchitectAgent':
        return <RobotAgentIcon className="w-3 h-3 text-indigo-400" />;
      case 'SimulationBuilderAgent':
        return <LidarSweepIcon className="w-3 h-3 text-amber-400" />;
      case 'EvaluatorAgent':
        return <GaugeMetricIcon className="w-3 h-3 text-purple-400" />;
      case 'FailureDiagnosisAgent':
        return <SparkleTargetIcon className="w-3 h-3 text-rose-400" />;
      case 'ExperimentOptimizerAgent':
        return <BrainNeuralIcon className="w-3 h-3 text-orange-400" />;
      case 'CriticAgent':
        return <CriticShieldIcon className="w-3 h-3 text-orange-400" />;
      default:
        return <RobotAgentIcon className="w-3 h-3 text-[var(--text-muted)]" />;
    }
  };

  const getAgentBadgeColor = (agent: string) => {
    switch (agent) {
      case 'RequirementAgent':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'SystemsArchitectAgent':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'SimulationBuilderAgent':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'EvaluatorAgent':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'FailureDiagnosisAgent':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'ExperimentOptimizerAgent':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'CriticAgent':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      default:
        return 'bg-slate-800/40 text-[var(--text-secondary)] border-[var(--border-subtle)]';
    }
  };

  return (
    <aside className="w-[310px] xl:w-[340px] shrink-0 h-full liquid-glass-panel border-l border-[var(--border-subtle)] flex flex-col text-[var(--text-primary)] transition-colors overflow-hidden">
      {/* Symmetrical Header matching Left Panel */}
      <div className="h-10 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <TerminalConsoleIcon className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-[var(--text-primary)]">
            AGENTIC STREAM
          </span>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
          {thoughts.length} Events
        </span>
      </div>

      {/* Stream List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {thoughts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[var(--text-muted)] space-y-2 font-mono">
            <RobotAgentIcon className="w-7 h-7 opacity-30 animate-pulse text-blue-400" />
            <p className="text-xs font-semibold">Ready for autonomous loop.</p>
            <p className="text-[10px] opacity-70">
              Click 'Step' or 'Run Loop' to execute multi-agent reasoning.
            </p>
          </div>
        ) : (
          thoughts.map((item, idx) => (
            <div
              key={idx}
              className="liquid-glass-card p-2.5 space-y-1.5 text-xs"
            >
              {/* Agent Title Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-mono font-semibold border ${getAgentBadgeColor(
                    item.agent
                  )}`}
                >
                  {getAgentIcon(item.agent)}
                  {item.agent.replace('Agent', '')}
                </span>
                <span className="text-[9px] font-mono text-[var(--text-muted)]">
                  {item.stage}
                </span>
              </div>

              {/* Title */}
              <h4 className="text-[11px] font-bold text-[var(--text-primary)] font-mono">
                {item.title}
              </h4>

              {/* Content Body */}
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed font-sans">
                {item.content}
              </p>

              {/* Payload Breakdown Cards */}
              {item.payload && (
                <div className="pt-1 border-t border-[var(--border-subtle)] space-y-1 text-[9px] font-mono">
                  {/* Diagnosis payload */}
                  {item.payload.diagnosis && (
                    <div className="bg-rose-500/10 p-1.5 rounded-md border border-rose-500/30 text-rose-400 space-y-0.5">
                      <div>
                        <strong className="font-bold">Root Cause:</strong>{' '}
                        {item.payload.diagnosis.primary_root_cause}
                      </div>
                      {item.payload.diagnosis.bottleneck_location && (
                        <div>
                          <strong className="font-bold">Bottleneck:</strong>{' '}
                          {item.payload.diagnosis.bottleneck_location}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Candidate Selected */}
                  {item.payload.selected && (
                    <div className="bg-emerald-500/10 p-1.5 rounded-md border border-emerald-500/30 text-emerald-400 space-y-0.5">
                      <div className="font-bold">
                        Applied Intervention:
                      </div>
                      <div>{item.payload.selected.title}</div>
                      <div className="text-[8px] opacity-80">
                        {JSON.stringify(item.payload.selected.parameter_changes)}
                      </div>
                    </div>
                  )}

                  {/* Critic payload */}
                  {item.payload.critic_verdict && (
                    <div className="bg-orange-500/10 p-1.5 rounded-md border border-orange-500/30 text-orange-400 space-y-0.5">
                      <div className="font-bold">
                        Robustness Index: {intPct(item.payload.critic_verdict.robustness_index)}%
                      </div>
                      <div className="text-[8px] opacity-80">
                        {item.payload.critic_verdict.verdict_summary}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {/* Convergence Announcement */}
        {isConverged && (
          <div className="bg-gradient-to-br from-emerald-500/15 via-blue-500/10 to-orange-500/15 border border-emerald-500/50 rounded-lg p-3 space-y-1.5 text-center shadow-lg">
            <CheckSquareIcon className="w-5 h-5 text-emerald-400 mx-auto" />
            <h3 className="text-[11px] font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Autonomous Design Convergence
            </h3>
            <p className="text-[10px] text-emerald-400 font-sans">
              All engineering constraints verified by Adversarial Critic.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

function intPct(val: number): number {
  return Math.round((val || 1.0) * 100);
}
