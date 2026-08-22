import React from 'react';
import { 
  CriticShieldIcon, 
  CheckSquareIcon, 
  StepForwardIcon, 
  SparkleTargetIcon 
} from './icons/EngineeringIcons';
import { CriticVerdict } from '../types';

interface CriticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCritic: () => void;
  verdict: CriticVerdict | null;
  isLoading: boolean;
}

export const CriticModal: React.FC<CriticModalProps> = ({
  isOpen,
  onClose,
  onRunCritic,
  verdict,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="liquid-glass border border-amber-500/40 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="h-14 bg-[var(--bg-surface)] px-6 flex items-center justify-between border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <CriticShieldIcon className="w-5 h-5 text-amber-400" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
              ADVERSARIAL CRITIC & ROBUSTNESS SUITE
            </h3>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 font-mono text-xs">
            [CLOSE]
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="space-y-1">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
              The Critic challenges converged designs against 4 adversarial environmental shifts
              to ensure the solution does not overfit to a single benchmark scenario.
            </p>
          </div>

          {/* Trigger Action */}
          <div className="flex items-center justify-between bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-subtle)]">
            <div>
              <span className="text-xs font-mono font-bold text-[var(--text-primary)] block">
                Run 4-Dimensional Stress Test
              </span>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                Tests Sensor Noise, Mass Surge, Wheel Drift, and Task Volume Spikes.
              </span>
            </div>
            <button
              onClick={onRunCritic}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm actuator-transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <StepForwardIcon className="w-4 h-4" />
              <span>{isLoading ? 'Running Stress Tests...' : 'Execute Perturbation Battery'}</span>
            </button>
          </div>

          {/* Results Display */}
          {verdict && (
            <div className="space-y-4">
              {/* Verdict Summary Banner */}
              <div
                className={`p-4 rounded-lg border flex items-start gap-3 ${
                  verdict.passed
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs">
                      {verdict.passed ? 'Robustness Verified (Passed)' : 'Critic Rejection (Overfitting Detected)'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[var(--bg-main)] text-cyan-400 font-mono text-[10px] border border-[var(--border-subtle)]">
                      Score: {Math.round(verdict.robustness_index * 100)}%
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90 font-sans">{verdict.verdict_summary}</p>
                </div>
              </div>

              {/* 4 Test Breakdown Cards */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-[var(--text-secondary)] block">
                  Perturbation Battery Breakdown:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  {verdict.perturbation_results.map((res, idx) => (
                    <div
                      key={idx}
                      className="liquid-glass-card p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-primary)] font-semibold text-[11px] truncate">
                          {res.name}
                        </span>
                        {res.passed ? (
                          <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                            <CheckSquareIcon className="w-3 h-3 text-emerald-400" /> PASS
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold text-[10px] flex items-center gap-1">
                            FAIL
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
                        <span>Collisions: <strong className={res.collisions === 0 ? 'text-emerald-400' : 'text-rose-400'}>{res.collisions}</strong></span>
                        <span>Avg Time: <strong className="text-cyan-400">{res.avg_delivery_time.toFixed(1)}s</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 bg-[var(--bg-surface)] px-6 flex items-center justify-end border-t border-[var(--border-subtle)]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-mono font-medium bg-[var(--bg-main)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] actuator-transition"
          >
            [CLOSE]
          </button>
        </div>
      </div>
    </div>
  );
};
