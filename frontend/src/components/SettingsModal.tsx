import React, { useState } from 'react';
import { SettingsSlidersIcon, CheckSquareIcon } from './icons/EngineeringIcons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [llmModel, setLlmModel] = useState<string>('gemini-2.5-pro');
  const [physicsRate, setPhysicsRate] = useState<number>(20);
  const [lidarRays, setLidarRays] = useState<number>(16);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="liquid-glass border border-[var(--border-subtle)] rounded-xl w-full max-w-lg flex flex-col shadow-2xl">
        {/* Header */}
        <div className="h-14 bg-[var(--bg-surface)] px-6 flex items-center justify-between border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <SettingsSlidersIcon className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
              SIMULATION & REASONING SETTINGS
            </h3>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 font-mono text-xs">
            [CLOSE]
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs font-mono">
          {/* LLM Engine */}
          <div className="space-y-1.5">
            <label className="text-[var(--text-secondary)] block">Reasoning LLM Backbone:</label>
            <select
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-subtle)] rounded-lg p-2 text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 font-sans"
            >
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Multi-Agent Synthesis)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra-Low Latency)</option>
              <option value="claude-3.7-sonnet">Claude 3.7 Sonnet (Hybrid Reasoning)</option>
              <option value="gpt-4o">GPT-4o (Robotics Planning)</option>
            </select>
          </div>

          {/* Physics Simulation Step Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-[var(--text-secondary)]">Physics Integration Frequency:</label>
              <strong className="text-cyan-400">{physicsRate} Hz (Δt = {(1 / physicsRate).toFixed(2)}s)</strong>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={physicsRate}
              onChange={(e) => setPhysicsRate(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Sensor Ray Density */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-[var(--text-secondary)]">Default 2D LiDAR Ray Density:</label>
              <strong className="text-blue-400">{lidarRays} beams / 360°</strong>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              step={4}
              value={lidarRays}
              onChange={(e) => setLidarRays(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="h-14 bg-[var(--bg-surface)] px-6 flex items-center justify-end border-t border-[var(--border-subtle)]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white actuator-transition flex items-center gap-1.5"
          >
            <CheckSquareIcon className="w-3.5 h-3.5" />
            <span>Apply Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
