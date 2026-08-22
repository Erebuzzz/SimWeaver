import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ObjectivePanel } from './components/ObjectivePanel';
import { SimulationCanvas } from './components/SimulationCanvas';
import { AgentLoopStream } from './components/AgentLoopStream';
import { MetricsDashboard } from './components/MetricsDashboard';
import { HomePage } from './components/HomePage';
import { DocumentationPage } from './components/DocumentationPage';
import { CustomCursor } from './components/CustomCursor';
import { ExportModal } from './components/ExportModal';
import { CriticModal } from './components/CriticModal';
import { SettingsModal } from './components/SettingsModal';
import { getApiUrl, getWsUrl } from './config';

import {
  EIRSpec,
  MetricsResult,
  ThoughtEvent,
  CriticVerdict,
  ExperimentRecord,
  SimulationFrame,
} from './types';

export const App: React.FC = () => {
  // Navigation View State ('home' | 'simulator' | 'docs')
  const [currentView, setCurrentView] = useState<'home' | 'simulator' | 'docs'>('home');

  // Core State
  const [eir, setEir] = useState<EIRSpec | null>(null);
  const [humanPrompt, setHumanPrompt] = useState<string>('Optimize 5 AMRs in a warehouse for zero collisions and under 60s delivery time');
  const [metrics, setMetrics] = useState<MetricsResult | null>(null);
  const [history, setHistory] = useState<ExperimentRecord[]>([]);
  const [thoughts, setThoughts] = useState<ThoughtEvent[]>([]);
  const [currentFrame, setCurrentFrame] = useState<SimulationFrame | null>(null);
  
  // Lifecycle Phase & Status
  const [phase, setPhase] = useState<string>('IDLE');
  const [iteration, setIteration] = useState<number>(0);
  const [isConverged, setIsConverged] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('warehouse_5_amr');

  // Modals
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isCriticOpen, setIsCriticOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [criticVerdict, setCriticVerdict] = useState<CriticVerdict | null>(null);
  const [isLoadingCritic, setIsLoadingCritic] = useState<boolean>(false);

  // Playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Dark/Light Theme System
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('simweaver_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  useEffect(() => {
    const themeStr = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeStr);
    document.documentElement.style.colorScheme = themeStr;

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
    localStorage.setItem('simweaver_theme', themeStr);
  }, [isDarkMode]);

  // Load initial preset on startup
  useEffect(() => {
    fetchPreset(selectedPreset);
  }, []);

  const fetchPreset = async (presetName: string) => {
    try {
      const res = await fetch(getApiUrl('/api/presets/load'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset_id: presetName }),
      });
      const data = await res.json();
      if (data.eir) {
        setEir(data.eir);
        if (data.eir.prompt) setHumanPrompt(data.eir.prompt);
      }
      if (data.history) setHistory(data.history);
      if (data.history && data.history.length > 0) {
        const latest = data.history[data.history.length - 1];
        setMetrics(latest.metrics);
        setIteration(latest.iteration);
      }
    } catch (err) {
      console.error('Failed to load preset:', err);
    }
  };

  // WebSocket for live telemetry streaming
  useEffect(() => {
    const wsUrl = getWsUrl();
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'frame') {
          setCurrentFrame(data.frame);
        } else if (data.type === 'thought') {
          setThoughts((prev) => [...prev, data.thought]);
        } else if (data.type === 'status') {
          setPhase(data.phase || 'IDLE');
          setIsConverged(Boolean(data.is_converged));
          setIteration(data.iteration || 0);
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    socket.onerror = () => {
      // Graceful fallback for offline mode
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleSelectPreset = (preset: string) => {
    setSelectedPreset(preset);
    fetchPreset(preset);
  };

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const res = await fetch(getApiUrl('/api/orchestrator/init'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: humanPrompt }),
      });
      const data = await res.json();
      if (data.eir) setEir(data.eir);
      if (data.thoughts) setThoughts(data.thoughts);
      setPhase('ARCHITECTURE');
      setIteration(0);
      setIsConverged(false);
    } catch (err) {
      console.error('Failed to initialize:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleStep = async () => {
    if (isRunning || isConverged) return;
    setIsRunning(true);
    try {
      const res = await fetch(getApiUrl('/api/orchestrator/step'), { method: 'POST' });
      const data = await res.json();
      if (data.eir) setEir(data.eir);
      if (data.metrics) setMetrics(data.metrics);
      if (data.history) setHistory(data.history);
      if (data.thoughts) setThoughts((prev) => [...prev, ...data.new_thoughts]);
      setPhase(data.phase || 'EVALUATING');
      setIsConverged(Boolean(data.is_converged));
      setIteration(data.iteration || 0);
    } catch (err) {
      console.error('Step execution failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunAll = async () => {
    if (isRunning || isConverged) return;
    setIsRunning(true);
    try {
      const res = await fetch(getApiUrl('/api/orchestrator/run_all'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: humanPrompt }),
      });
      const data = await res.json();
      if (data.eir) setEir(data.eir);
      if (data.metrics) setMetrics(data.metrics);
      if (data.history) setHistory(data.history);
      if (data.thoughts) setThoughts((prev) => [...prev, ...(data.new_thoughts || [])]);
      setPhase(data.phase || 'CONVERGED');
      setIsConverged(Boolean(data.is_converged));
      setIteration(data.iteration || 0);
    } catch (err) {
      console.error('Run all execution failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = async () => {
    try {
      await fetch(getApiUrl('/api/orchestrator/reset'), { method: 'POST' });
      setThoughts([]);
      setHistory([]);
      setMetrics(null);
      setPhase('IDLE');
      setIteration(0);
      setIsConverged(false);
      fetchPreset(selectedPreset);
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  const handleRunCritic = async () => {
    setIsLoadingCritic(true);
    try {
      const res = await fetch(getApiUrl('/api/critic/perturbations'), { method: 'POST' });
      const data = await res.json();
      setCriticVerdict(data.critic_verdict);
    } catch (err) {
      console.error('Critic test failed:', err);
    } finally {
      setIsLoadingCritic(false);
    }
  };

  const handlePlayLive = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  return (
    <div className="h-screen w-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col font-sans select-none overflow-hidden transition-colors">
      {/* Custom Hardware Reticle Cursor */}
      <CustomCursor isDarkMode={isDarkMode} />

      {/* Symmetrical Global Header */}
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        phase={phase}
        isConverged={isConverged}
        isRunning={isRunning}
        iteration={iteration}
        onStep={handleStep}
        onRunAll={handleRunAll}
        onReset={handleReset}
        onOpenCritic={() => setIsCriticOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        selectedPreset={selectedPreset}
        onSelectPreset={handleSelectPreset}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      {/* View Switcher: Home Showcase vs Simulator Studio vs Documentation */}
      {currentView === 'home' ? (
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <HomePage
            onLaunchSimulator={() => setCurrentView('simulator')}
            isDarkMode={isDarkMode}
          />
        </div>
      ) : currentView === 'docs' ? (
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <DocumentationPage
            onNavigateToSimulator={() => setCurrentView('simulator')}
            isDarkMode={isDarkMode}
          />
        </div>
      ) : (
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden w-full">
          {/* Middle Symmetrical Workbench (Golden Ratio Sections) */}
          <div className="flex-1 min-h-0 flex flex-row overflow-hidden w-full">
            {/* Left Objective & EIR Intent Panel */}
            <ObjectivePanel
              eir={eir}
              humanPrompt={humanPrompt}
              onUpdatePrompt={setHumanPrompt}
              onInitialize={handleInitialize}
              isLoading={isInitializing}
              reqTable={metrics?.requirement_table || []}
            />

            {/* Center 3D/2D Simulation Canvas Viewport */}
            <SimulationCanvas
              currentFrame={currentFrame}
              eir={eir}
              onPlayLive={handlePlayLive}
              isPlaying={isPlaying}
              onPause={handlePause}
              history={history}
              isDarkMode={isDarkMode}
            />

            {/* Right Agentic Reasoning Loop Stream */}
            <AgentLoopStream thoughts={thoughts} isConverged={isConverged} />
          </div>

          {/* Bottom Docked Metrics & Lineage Dashboard */}
          <MetricsDashboard metrics={metrics} history={history} />
        </main>
      )}

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        eir={eir}
        history={history}
      />

      <CriticModal
        isOpen={isCriticOpen}
        onClose={() => setIsCriticOpen(false)}
        onRunCritic={handleRunCritic}
        verdict={criticVerdict}
        isLoading={isLoadingCritic}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
