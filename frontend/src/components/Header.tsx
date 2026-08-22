import React from 'react';
import {
  SimWeaverLogoIcon,
  StepForwardIcon,
  ZapLoopIcon,
  CriticShieldIcon,
  ResetClockwiseIcon,
  SunSolarIcon,
  MoonNightIcon,
  ExportSheetIcon,
  SettingsSlidersIcon,
  LayersLayoutIcon,
  Cube3DIcon,
  TerminalConsoleIcon,
} from './icons/EngineeringIcons';

interface HeaderProps {
  currentView: 'home' | 'simulator' | 'docs';
  onNavigate: (view: 'home' | 'simulator' | 'docs') => void;
  phase: string;
  isConverged: boolean;
  isRunning: boolean;
  iteration: number;
  onStep: () => void;
  onRunAll: () => void;
  onReset: () => void;
  onOpenCritic: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  selectedPreset: string;
  onSelectPreset: (preset: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  phase,
  isConverged,
  isRunning,
  iteration,
  onStep,
  onRunAll,
  onReset,
  onOpenCritic,
  onOpenExport,
  onOpenSettings,
  selectedPreset,
  onSelectPreset,
  isDarkMode,
  onToggleTheme,
}) => {
  const getPhaseBadge = () => {
    if (isConverged) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono font-bold tracking-wide">
          <CriticShieldIcon className="w-3 h-3 text-emerald-400" />
          <span>CONVERGED</span>
        </div>
      );
    }

    const phaseStyles: Record<string, { bg: string; text: string; border: string }> = {
      IDLE: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
      REQUIREMENTS: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/40' },
      ARCHITECTURE: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/40' },
      SIMULATING: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/40' },
      EVALUATING: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/40' },
      DIAGNOSING: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/40' },
      OPTIMIZING: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/40' },
      CRITIC: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/40' },
    };

    const style = phaseStyles[phase] || phaseStyles.IDLE;

    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${style.bg} border ${style.border} ${style.text} text-[11px] font-mono font-bold tracking-wide`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        <span>{phase}</span>
        {iteration > 0 && <span className="opacity-70 ml-0.5">#{iteration}</span>}
      </div>
    );
  };

  return (
    <header className="h-13 liquid-glass-header px-4 flex items-center justify-between border-b border-[var(--border-subtle)] relative z-30 transition-colors w-full shrink-0">
      {/* Distinctive Brand & Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer group focus:outline-none text-left"
        >
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-md shadow-orange-500/30 actuator-transition group-hover:scale-105 border border-amber-300/40">
            <SimWeaverLogoIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <h1 className="font-extrabold text-sm tracking-tight leading-none text-[var(--text-primary)]">
              SimWeaver
            </h1>
          </div>
        </button>

        <div className="h-5 w-[1px] bg-[var(--border-subtle)]" />

        {/* View Navigation Switcher (Solid Single-Color Active Tabs) */}
        <nav className="flex items-center gap-1 bg-[var(--bg-surface)] p-0.5 rounded-md border border-[var(--border-subtle)] text-xs font-mono">
          <button
            onClick={() => onNavigate('home')}
            className={`px-2.5 py-1 rounded-md actuator-transition font-medium text-[11px] flex items-center gap-1.5 ${
              currentView === 'home'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <LayersLayoutIcon className="w-3 h-3" />
            <span>Capabilities</span>
          </button>

          <button
            onClick={() => onNavigate('simulator')}
            className={`px-2.5 py-1 rounded-md actuator-transition font-medium text-[11px] flex items-center gap-1.5 ${
              currentView === 'simulator'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Cube3DIcon className="w-3 h-3" />
            <span>Simulator Studio</span>
          </button>

          <button
            onClick={() => onNavigate('docs')}
            className={`px-2.5 py-1 rounded-md actuator-transition font-medium text-[11px] flex items-center gap-1.5 ${
              currentView === 'docs'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <TerminalConsoleIcon className="w-3 h-3" />
            <span>Docs</span>
          </button>
        </nav>
      </div>

      {/* Center Simulator Scenario & Status (Only in Simulator Mode) */}
      {currentView === 'simulator' && (
        <div className="flex items-center gap-2.5">
          {getPhaseBadge()}

          {/* Scenario Select */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] px-2 py-0.5 rounded-md border border-[var(--border-subtle)] text-[11px] font-mono">
            <span className="text-[var(--text-muted)]">Scenario:</span>
            <select
              value={selectedPreset}
              onChange={(e) => onSelectPreset(e.target.value)}
              disabled={isRunning}
              className="bg-transparent text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer text-[11px]"
            >
              <option value="warehouse_5_amr" className="bg-slate-900 text-white">
                Warehouse 5-AMR Traffic
              </option>
              <option value="dense_cross_traffic" className="bg-slate-900 text-white">
                High-Density Cross-Traffic (8 AMRs)
              </option>
              <option value="hospital_cleanroom" className="bg-slate-900 text-white">
                Hospital Cleanroom (4 AMRs)
              </option>
              <option value="airport_baggage_hub" className="bg-slate-900 text-white">
                Airport Baggage Hub (6 AMRs)
              </option>
            </select>
          </div>
        </div>
      )}

      {/* Right Controls: Solid Single-Color Squircle Action Buttons */}
      <div className="flex items-center gap-1.5">
        {currentView === 'simulator' && (
          <>
            {/* Step Button */}
            <button
              onClick={onStep}
              disabled={isRunning || isConverged}
              className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] actuator-transition flex items-center gap-1 shadow-sm disabled:opacity-50"
            >
              <StepForwardIcon className="w-3 h-3 text-blue-400" />
              <span>Step</span>
            </button>

            {/* Solid Single-Color Run Loop Action Button */}
            <button
              onClick={onRunAll}
              disabled={isRunning || isConverged}
              className="px-3 py-1 rounded-md text-[11px] font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm actuator-transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <ZapLoopIcon className="w-3 h-3 fill-current" />
              <span>{isRunning ? 'Optimizing...' : 'Run Loop'}</span>
            </button>

            {/* Critic Stress-Test */}
            <button
              onClick={onOpenCritic}
              className="px-2 py-1 rounded-md text-[11px] font-mono font-medium bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] actuator-transition flex items-center gap-1"
              title="Run Adversarial Critic Perturbations"
            >
              <CriticShieldIcon className="w-3 h-3 text-orange-400" />
              <span>Critic</span>
            </button>

            {/* Export Modal */}
            <button
              onClick={onOpenExport}
              className="px-2 py-1 rounded-md text-[11px] font-mono font-medium bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] actuator-transition flex items-center gap-1"
              title="Export Simulator Files"
            >
              <ExportSheetIcon className="w-3 h-3 text-purple-400" />
              <span>Export</span>
            </button>

            {/* Reset */}
            <button
              onClick={onReset}
              className="p-1 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] actuator-transition"
              title="Reset Architecture"
            >
              <ResetClockwiseIcon className="w-3.5 h-3.5" />
            </button>

            <div className="h-5 w-[1px] bg-[var(--border-subtle)] mx-0.5" />
          </>
        )}

        {/* Theme Switcher Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] actuator-transition flex items-center"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <SunSolarIcon className="w-3.5 h-3.5 text-orange-400" />
          ) : (
            <MoonNightIcon className="w-3.5 h-3.5 text-slate-700" />
          )}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] actuator-transition"
          title="LLM & Simulation Settings"
        >
          <SettingsSlidersIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
