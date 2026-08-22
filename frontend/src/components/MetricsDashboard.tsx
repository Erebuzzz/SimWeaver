import React, { useState } from 'react';
import { 
  GaugeMetricIcon, 
  CriticShieldIcon, 
  ZapLoopIcon, 
  ResetClockwiseIcon,
  CheckSquareIcon,
  CrosshairIcon
} from './icons/EngineeringIcons';
import { MetricsResult, ExperimentRecord } from '../types';

interface MetricsDashboardProps {
  metrics: MetricsResult | null;
  history: ExperimentRecord[];
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics, history }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'kpi' | 'lineage' | 'pareto'>('kpi');

  return (
    <div className="liquid-glass border-t border-[var(--border-subtle)] transition-all duration-300 text-[var(--text-primary)] shrink-0 w-full z-20">
      {/* Precision Compact Toggle Bar (h-8) */}
      <div 
        className="h-8 bg-[var(--bg-surface)] px-4 flex items-center justify-between border-b border-[var(--border-subtle)] cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <GaugeMetricIcon className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              METRICS & LINEAGE
            </span>
          </div>

          {/* Quick inline metric summaries */}
          {metrics && (
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="text-[var(--text-secondary)]">
                Collisions:{' '}
                <strong className={metrics.collision_count === 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {metrics.collision_count}
                </strong>
              </span>
              <span className="text-[var(--text-secondary)]">
                Avg Delivery:{' '}
                <strong className={metrics.avg_delivery_time_sec < 60.0 ? 'text-blue-400 font-bold' : 'text-orange-400 font-bold'}>
                  {metrics.avg_delivery_time_sec.toFixed(1)}s
                </strong>
              </span>
              <span className="text-[var(--text-secondary)]">
                Cost J:{' '}
                <strong className="text-orange-400 font-bold">
                  {metrics.multi_objective_score.toFixed(3)}
                </strong>
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-[var(--text-muted)]">
            {history.length} Iterations
          </span>
          <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <span className="text-[10px] font-mono font-bold">{isOpen ? '[-]' : '[+]'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Panel Content */}
      {isOpen && (
        <div className="p-2.5 max-h-40 overflow-y-auto space-y-2.5">
          {/* Tab Selector (Squircle) */}
          <div className="flex gap-1.5 border-b border-[var(--border-subtle)] pb-1.5 text-[10px] font-mono">
            <button
              onClick={() => setActiveTab('kpi')}
              className={`px-2.5 py-0.5 rounded-md actuator-transition font-medium ${
                activeTab === 'kpi'
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              KPI Meters
            </button>

            <button
              onClick={() => setActiveTab('lineage')}
              className={`px-2.5 py-0.5 rounded-md actuator-transition font-medium ${
                activeTab === 'lineage'
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Lineage Table ({history.length})
            </button>

            <button
              onClick={() => setActiveTab('pareto')}
              className={`px-2.5 py-0.5 rounded-md actuator-transition font-medium ${
                activeTab === 'pareto'
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Cost J Curve
            </button>
          </div>

          {/* Tab 1: KPI Meter Tiles */}
          {activeTab === 'kpi' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {/* Tile 1: Collisions */}
              <div className="liquid-glass-card p-2 space-y-0.5">
                <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase">
                  Collisions
                </div>
                <div className="flex items-baseline justify-between">
                  <span
                    className={`text-base font-mono font-bold ${
                      (metrics?.collision_count || 0) === 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {metrics ? metrics.collision_count : '0'}
                  </span>
                  <span className="text-[9px] font-mono text-[var(--text-muted)]">Target: 0</span>
                </div>
                <div className="w-full bg-slate-800/40 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full ${
                      (metrics?.collision_count || 0) === 0 ? 'bg-emerald-400 w-full' : 'bg-rose-500 w-full'
                    }`}
                  />
                </div>
              </div>

              {/* Tile 2: Avg Delivery Time */}
              <div className="liquid-glass-card p-2 space-y-0.5">
                <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase">
                  Avg Delivery Time
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-mono font-bold text-blue-400">
                    {metrics ? `${metrics.avg_delivery_time_sec.toFixed(1)}s` : '0.0s'}
                  </span>
                  <span className="text-[9px] font-mono text-[var(--text-muted)]">&lt; 60s</span>
                </div>
                <div className="w-full bg-slate-800/40 rounded-full h-1">
                  <div
                    className="bg-blue-400 h-1 rounded-full"
                    style={{ width: `${Math.min(100, ((metrics?.avg_delivery_time_sec || 0) / 60) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Tile 3: Completion Rate */}
              <div className="liquid-glass-card p-2 space-y-0.5">
                <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase">
                  Completion Rate
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-mono font-bold text-indigo-400">
                    {metrics ? `${Math.round(metrics.completion_rate * 100)}%` : '0%'}
                  </span>
                  <span className="text-[9px] font-mono text-[var(--text-muted)]">&gt; 95%</span>
                </div>
                <div className="w-full bg-slate-800/40 rounded-full h-1">
                  <div
                    className="bg-indigo-400 h-1 rounded-full"
                    style={{ width: `${Math.min(100, (metrics?.completion_rate || 0) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Tile 4: Min Separation */}
              <div className="liquid-glass-card p-2 space-y-0.5">
                <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase">
                  Min Separation
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-mono font-bold text-orange-400">
                    {metrics ? `${metrics.min_separation_observed_m.toFixed(2)}m` : '0.00m'}
                  </span>
                  <span className="text-[9px] font-mono text-[var(--text-muted)]">&gt; 0.30m</span>
                </div>
                <div className="w-full bg-slate-800/40 rounded-full h-1">
                  <div
                    className="bg-orange-400 h-1 rounded-full"
                    style={{ width: `${Math.min(100, ((metrics?.min_separation_observed_m || 0) / 0.5) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Tile 5: Multi-Objective Cost J */}
              <div className="liquid-glass-card p-2 space-y-0.5">
                <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase">
                  Cost J
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-mono font-bold text-orange-400">
                    {metrics ? metrics.multi_objective_score.toFixed(3) : '0.000'}
                  </span>
                  <span className="text-[9px] font-mono text-[var(--text-muted)]">Minimize</span>
                </div>
                <div className="w-full bg-slate-800/40 rounded-full h-1">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-orange-500 h-1 rounded-full"
                    style={{ width: `${Math.min(100, (metrics?.multi_objective_score || 0) * 80)}%` }}
                  />
                </div>
              </div>

              {/* Tile 6: Critic Robustness Index */}
              <div className="liquid-glass-card p-2 space-y-0.5">
                <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase">
                  Robustness
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-mono font-bold text-emerald-400">
                    {metrics?.robustness_score ? `${Math.round(metrics.robustness_score * 100)}%` : 'Pending'}
                  </span>
                  <span className="text-[9px] font-mono text-[var(--text-muted)]">Critic</span>
                </div>
                <div className="w-full bg-slate-800/40 rounded-full h-1">
                  <div
                    className="bg-emerald-400 h-1 rounded-full"
                    style={{ width: `${(metrics?.robustness_score || 0.5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Lineage Table */}
          {activeTab === 'lineage' && (
            <div className="liquid-glass-card p-2 overflow-x-auto">
              <table className="w-full text-left text-[10px] font-mono">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase">
                    <th className="py-1 px-1.5">Exp #</th>
                    <th className="py-1 px-1.5">Coordination</th>
                    <th className="py-1 px-1.5">LiDAR Range</th>
                    <th className="py-1 px-1.5">Collisions</th>
                    <th className="py-1 px-1.5">Delivery</th>
                    <th className="py-1 px-1.5">Cost J</th>
                    <th className="py-1 px-1.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {history.map((exp) => (
                    <tr key={exp.experiment_id} className="hover:bg-[var(--bg-surface)] actuator-transition">
                      <td className="py-1 px-1.5 font-bold text-blue-400">Exp #{exp.experiment_id}</td>
                      <td className="py-1 px-1.5 uppercase font-medium">{exp.eir_design.coordination.protocol}</td>
                      <td className="py-1 px-1.5">{exp.eir_design.sensors.lidar_range} m</td>
                      <td className="py-1 px-1.5">
                        <span className={exp.metrics.collision_count === 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {exp.metrics.collision_count}
                        </span>
                      </td>
                      <td className="py-1 px-1.5">{exp.metrics.avg_delivery_time_sec.toFixed(1)}s</td>
                      <td className="py-1 px-1.5 text-orange-400 font-semibold">{exp.cost_j.toFixed(3)}</td>
                      <td className="py-1 px-1.5">
                        {exp.metrics.satisfies_all_constraints ? (
                          <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            PASSED
                          </span>
                        ) : (
                          <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            FAILED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Pareto Curve */}
          {activeTab === 'pareto' && (
            <div className="liquid-glass-card p-2.5 space-y-2">
              <div className="text-[10px] font-mono font-bold text-blue-400 uppercase">
                Optimization Cost J Trajectory
              </div>
              <div className="h-20 flex items-end gap-2 pt-2 px-2 border-b border-[var(--border-subtle)]">
                {history.map((exp, idx) => {
                  const heightPct = Math.max(15, Math.min(100, (exp.cost_j / 2.5) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-mono text-orange-400 font-bold">
                        {exp.cost_j.toFixed(2)}
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 via-indigo-500 to-orange-500 rounded-t actuator-transition hover:opacity-90"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[8px] font-mono text-[var(--text-muted)]">
                        #{exp.experiment_id}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
