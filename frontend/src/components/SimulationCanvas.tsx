import React, { useRef, useEffect, useState } from 'react';
import { 
  Cube3DIcon, 
  Blueprint2DIcon, 
  StepForwardIcon, 
  FlameHeatmapIcon, 
  CrosshairIcon, 
  ClockTimeIcon,
  LidarSweepIcon,
  ResetClockwiseIcon
} from './icons/EngineeringIcons';
import { SimulationFrame, RobotTelemetrySnapshot, BoxObstacle, ZoneSpec, EIRSpec, ExperimentRecord } from '../types';
import { Robotics3DViewport } from './Robotics3DViewport';

interface SimulationCanvasProps {
  currentFrame: SimulationFrame | null;
  eir: EIRSpec | null;
  onPlayLive: (speed: number) => void;
  isPlaying: boolean;
  onPause: () => void;
  history: ExperimentRecord[];
  isDarkMode: boolean;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  currentFrame,
  eir,
  onPlayLive,
  isPlaying,
  onPause,
  history,
  isDarkMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [showLidar, setShowLidar] = useState<boolean>(true);
  const [showPaths, setShowPaths] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);

  // Scrubber & Replay State
  const [selectedExpId, setSelectedExpId] = useState<number | 'live'>('live');
  const [replayFrames, setReplayFrames] = useState<SimulationFrame[]>([]);
  const [scrubIndex, setScrubIndex] = useState<number>(0);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);

  const envWidth = eir?.environment.width || 24.0;
  const envHeight = eir?.environment.height || 16.0;

  // Load replay frames when switching iteration
  useEffect(() => {
    if (selectedExpId === 'live') {
      setReplayFrames([]);
      setIsReplaying(false);
      return;
    }

    fetch(`/api/experiments/${selectedExpId}/frames`)
      .then((res) => res.json())
      .then((data) => {
        if (data.frames && data.frames.length > 0) {
          setReplayFrames(data.frames);
          setScrubIndex(0);
        }
      })
      .catch(() => {});
  }, [selectedExpId]);

  // Replay animation timer
  useEffect(() => {
    if (!isReplaying || replayFrames.length === 0) return;

    const interval = setInterval(() => {
      setScrubIndex((prev) => {
        if (prev >= replayFrames.length - 1) {
          setIsReplaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, Math.max(20, 100 / speedMultiplier));

    return () => clearInterval(interval);
  }, [isReplaying, replayFrames, speedMultiplier]);

  // Active frame
  const activeFrame =
    selectedExpId !== 'live' && replayFrames.length > 0
      ? replayFrames[Math.min(scrubIndex, replayFrames.length - 1)]
      : currentFrame;

  const selectedRobot = activeFrame?.robots.find((r) => r.robot_id === selectedRobotId);

  // 2D Canvas Renderer
  useEffect(() => {
    if (viewMode !== '2d') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const scaleX = width / envWidth;
    const scaleY = height / envHeight;
    const scale = Math.min(scaleX, scaleY) * 0.94;
    const offsetX = (width - envWidth * scale) / 2;
    const offsetY = (height - envHeight * scale) / 2;

    const toCanvasX = (wx: number) => offsetX + wx * scale;
    const toCanvasY = (wy: number) => offsetY + (envHeight - wy) * scale;

    // Background
    ctx.fillStyle = isDarkMode ? '#0B0F15' : '#F4F6F9';
    ctx.fillRect(0, 0, width, height);

    // Floor Grid
    ctx.strokeStyle = isDarkMode ? 'rgba(71, 85, 105, 0.25)' : 'rgba(203, 213, 225, 0.8)';
    ctx.lineWidth = 1;
    const gridStep = 2.0;
    for (let gx = 0; gx <= envWidth; gx += gridStep) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(gx), toCanvasY(0));
      ctx.lineTo(toCanvasX(gx), toCanvasY(envHeight));
      ctx.stroke();
    }
    for (let gy = 0; gy <= envHeight; gy += gridStep) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(0), toCanvasY(gy));
      ctx.lineTo(toCanvasX(envWidth), toCanvasY(gy));
      ctx.stroke();
    }

    // Warehouse Boundary
    ctx.strokeStyle = isDarkMode ? '#334155' : '#94A3B8';
    ctx.lineWidth = 2;
    ctx.strokeRect(toCanvasX(0), toCanvasY(envHeight), envWidth * scale, envHeight * scale);

    // Zones
    if (showZones && eir?.environment.zones) {
      eir.environment.zones.forEach((zone) => {
        const zx = toCanvasX(zone.x - zone.width / 2);
        const zy = toCanvasY(zone.y + zone.height / 2);
        const zw = zone.width * scale;
        const zh = zone.height * scale;

        if (zone.zone_type === 'pick') {
          ctx.fillStyle = isDarkMode ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.12)';
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.fillRect(zx, zy, zw, zh);
          ctx.strokeRect(zx, zy, zw, zh);
          ctx.setLineDash([]);

          ctx.fillStyle = isDarkMode ? '#38BDF8' : '#0284C7';
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.fillText(zone.name, zx + 4, zy + 12);
        } else if (zone.zone_type === 'drop') {
          ctx.fillStyle = isDarkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(5, 150, 105, 0.12)';
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.fillRect(zx, zy, zw, zh);
          ctx.strokeRect(zx, zy, zw, zh);
          ctx.setLineDash([]);

          ctx.fillStyle = isDarkMode ? '#34D399' : '#059669';
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.fillText(zone.name, zx + 4, zy + 12);
        } else if (zone.zone_type === 'intersection') {
          const isOccupied = activeFrame && Object.keys(activeFrame.active_reservations || {}).length > 0;
          ctx.fillStyle = isOccupied ? 'rgba(249, 115, 22, 0.15)' : 'rgba(139, 92, 246, 0.08)';
          ctx.strokeStyle = isOccupied ? 'rgba(249, 115, 22, 0.8)' : 'rgba(139, 92, 246, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.fillRect(zx, zy, zw, zh);
          ctx.strokeRect(zx, zy, zw, zh);
          ctx.setLineDash([]);

          ctx.fillStyle = isOccupied ? '#F97316' : '#A78BFA';
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.fillText(
            isOccupied ? 'RESERVED' : 'INTERSECTION',
            zx + 4,
            zy + 12
          );
        }
      });
    }

    // Shelves
    if (eir?.environment.obstacles) {
      eir.environment.obstacles.forEach((obs) => {
        const ox = toCanvasX(obs.x - obs.width / 2);
        const oy = toCanvasY(obs.y + obs.height / 2);
        const ow = obs.width * scale;
        const oh = obs.height * scale;

        ctx.fillStyle = isDarkMode ? '#1E293B' : '#E2E8F0';
        ctx.fillRect(ox, oy, ow, oh);
        ctx.strokeStyle = isDarkMode ? '#475569' : '#94A3B8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ox, oy, ow, oh);

        ctx.fillStyle = isDarkMode ? '#94A3B8' : '#475569';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(obs.label, ox + 6, oy + oh / 2 + 3);
      });
    }

    // Heatmap
    if (showHeatmap && selectedExpId !== 'live') {
      const exp = history.find((h) => h.experiment_id === selectedExpId);
      if (exp && exp.metrics.collision_count > 0) {
        const cx = toCanvasX(12.0);
        const cy = toCanvasY(8.0);
        const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 70);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 70, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // AMR Robots (Single Unified Industrial Body Color + Intensity-Driven Signals)
    if (activeFrame?.robots) {
      const maxLidarRange = eir?.sensors.lidar_range || 3.5;

      activeFrame.robots.forEach((robot) => {
        const rx = toCanvasX(robot.x);
        const ry = toCanvasY(robot.y);
        const rRadius = (eir?.robot.radius || 0.28) * scale;
        const isSelected = robot.robot_id === selectedRobotId;
        const chassisColor = isDarkMode ? '#1E293B' : '#E2E8F0';
        const ringColor = '#38BDF8';

        // 1. Intensity-Driven Omnidirectional FOV Radial Disc on Floor
        if (showLidar) {
          const fovPixelRadius = maxLidarRange * scale;
          const fovGrad = ctx.createRadialGradient(rx, ry, 2, rx, ry, fovPixelRadius);
          fovGrad.addColorStop(0.0, 'rgba(255, 247, 237, 0.4)');
          fovGrad.addColorStop(0.12, 'rgba(249, 115, 22, 0.25)');
          fovGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.12)');
          fovGrad.addColorStop(0.7, 'rgba(99, 102, 241, 0.04)');
          fovGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

          ctx.fillStyle = fovGrad;
          ctx.beginPath();
          ctx.arc(rx, ry, fovPixelRadius, 0, Math.PI * 2);
          ctx.fill();

          // Concentric decibel range rings
          [0.33, 0.66].forEach((frac) => {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(rx, ry, fovPixelRadius * frac, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          });
        }

        // 2. Intensity-Driven LiDAR Ray Hits
        if (showLidar && robot.lidar_hits) {
          robot.lidar_hits.forEach((hit) => {
            const hx = toCanvasX(hit[0]);
            const hy = toCanvasY(hit[1]);
            const hitDist = Math.hypot(hit[0] - robot.x, hit[1] - robot.y);
            const normDist = Math.min(1.0, hitDist / maxLidarRange);

            let hitColor = '#38BDF8';
            let rayAlpha = 0.25;
            if (normDist < 0.3) {
              hitColor = '#F97316'; // Near hot return
              rayAlpha = 0.45;
            } else if (normDist < 0.7) {
              hitColor = '#38BDF8'; // Mid cyan
              rayAlpha = 0.25;
            } else {
              hitColor = '#818CF8'; // Far indigo
              rayAlpha = 0.12;
            }

            ctx.strokeStyle = hitColor;
            ctx.globalAlpha = rayAlpha;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(hx, hy);
            ctx.stroke();
            ctx.globalAlpha = 1.0;

            // Impact Spark
            ctx.fillStyle = hitColor;
            ctx.fillRect(hx - 1.5, hy - 1.5, 3, 3);
          });
        }

        // Planned Waypoints
        if (showPaths && robot.target_x !== undefined && robot.target_y !== undefined && robot.target_x !== null) {
          const tx = toCanvasX(robot.target_x);
          const ty = toCanvasY(robot.target_y);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(tx, ty);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Selection Halo
        if (isSelected) {
          ctx.strokeStyle = '#F97316';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(rx, ry, rRadius + 5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Single Unified Chassis Body
        ctx.fillStyle = chassisColor;
        ctx.beginPath();
        ctx.arc(rx, ry, rRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Heading Pointer
        const hx = rx + Math.cos(robot.theta) * (rRadius + 4);
        const hy = ry - Math.sin(robot.theta) * (rRadius + 4);
        ctx.strokeStyle = '#F97316';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(hx, hy);
        ctx.stroke();

        // Label
        ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#0F172A';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(robot.robot_id.toUpperCase(), rx, ry - rRadius - 4);
        ctx.textAlign = 'start';
      });
    }

  }, [viewMode, activeFrame, eir, selectedRobotId, showLidar, showPaths, showZones, showHeatmap, selectedExpId, history, envWidth, envHeight, isDarkMode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !activeFrame?.robots) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = rect.width / envWidth;
    const scaleY = rect.height / envHeight;
    const scale = Math.min(scaleX, scaleY) * 0.94;
    const offsetX = (rect.width - envWidth * scale) / 2;
    const offsetY = (rect.height - envHeight * scale) / 2;

    for (const robot of activeFrame.robots) {
      const rx = offsetX + robot.x * scale;
      const ry = offsetY + (envHeight - robot.y) * scale;
      const dist = Math.hypot(clickX - rx, clickY - ry);
      if (dist <= (eir?.robot.radius || 0.28) * scale + 10) {
        setSelectedRobotId(robot.robot_id === selectedRobotId ? null : robot.robot_id);
        return;
      }
    }
    setSelectedRobotId(null);
  };

  return (
    <div className="flex-1 min-w-0 h-full bg-[var(--bg-main)] flex flex-col relative overflow-hidden transition-colors">
      {/* High-Precision Symmetrical Toolbar */}
      <div className="h-10 liquid-glass-header px-3 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Viewport 3D / 2D Switcher (Squircle Tabs) */}
          <div className="flex items-center gap-0.5 bg-[var(--bg-surface)] p-0.5 rounded-md border border-[var(--border-subtle)] text-[11px] font-mono">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold actuator-transition flex items-center gap-1 ${
                viewMode === '3d'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Cube3DIcon className="w-3 h-3" />
              <span>3D Twin</span>
            </button>

            <button
              onClick={() => setViewMode('2d')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold actuator-transition flex items-center gap-1 ${
                viewMode === '2d'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Blueprint2DIcon className="w-3 h-3" />
              <span>2D Blueprint</span>
            </button>
          </div>

          <div className="h-4 w-[1px] bg-[var(--border-subtle)]" />

          {/* Iteration Selector Pill */}
          <div className="flex items-center gap-0.5 bg-[var(--bg-surface)] p-0.5 rounded-md border border-[var(--border-subtle)] text-[10px] font-mono">
            <span className="text-[var(--text-muted)] px-1 flex items-center gap-0.5">
              <ResetClockwiseIcon className="w-2.5 h-2.5" /> View:
            </span>
            <button
              onClick={() => setSelectedExpId('live')}
              className={`px-1.5 py-0.2 rounded-md font-bold actuator-transition ${
                selectedExpId === 'live'
                  ? 'bg-blue-500 text-slate-950 font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Live
            </button>
            {history.map((h) => (
              <button
                key={h.experiment_id}
                onClick={() => setSelectedExpId(h.experiment_id)}
                className={`px-1.5 py-0.2 rounded-md font-bold actuator-transition ${
                  selectedExpId === h.experiment_id
                    ? 'bg-orange-500 text-slate-950 font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                #{h.experiment_id}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-[var(--border-subtle)]" />

          {/* Play / Pause Controls */}
          {selectedExpId === 'live' ? (
            <button
              onClick={() => (isPlaying ? onPause() : onPlayLive(speedMultiplier))}
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold flex items-center gap-1 actuator-transition ${
                isPlaying
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/40'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <StepForwardIcon className="w-3 h-3" />
              <span>{isPlaying ? 'Pause' : 'Play Live'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsReplaying(!isReplaying)}
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold flex items-center gap-1 actuator-transition ${
                isReplaying
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/40'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <StepForwardIcon className="w-3 h-3" />
              <span>{isReplaying ? 'Pause' : 'Play Replay'}</span>
            </button>
          )}

          {/* Speed Multipliers */}
          <div className="flex items-center gap-0.5 bg-[var(--bg-surface)] p-0.5 rounded-md border border-[var(--border-subtle)] text-[10px] font-mono">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSpeedMultiplier(s);
                  if (isPlaying) onPlayLive(s);
                }}
                className={`px-1.5 py-0.2 rounded-md font-bold ${
                  speedMultiplier === s
                    ? 'bg-blue-500 text-slate-950 font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Toggle Layers */}
          <div className="flex items-center gap-1 text-[10px] font-mono">
            <button
              onClick={() => setShowLidar(!showLidar)}
              className={`px-1.5 py-0.5 rounded-md border actuator-transition ${
                showLidar
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/40'
                  : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)]'
              }`}
            >
              LiDAR
            </button>
            <button
              onClick={() => setShowPaths(!showPaths)}
              className={`px-1.5 py-0.5 rounded-md border actuator-transition ${
                showPaths
                  ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/40'
                  : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)]'
              }`}
            >
              Paths
            </button>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-1.5 py-0.5 rounded-md border actuator-transition flex items-center gap-1 ${
                showHeatmap
                  ? 'bg-orange-500/15 text-orange-400 border-orange-500/40'
                  : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)]'
              }`}
            >
              <FlameHeatmapIcon className="w-2.5 h-2.5" /> Heatmap
            </button>
          </div>
        </div>

        {/* Live Simulation Clock & Progress */}
        <div className="flex items-center gap-2.5 text-[10px] font-mono text-[var(--text-secondary)]">
          <div className="flex items-center gap-1">
            <ClockTimeIcon className="w-3 h-3 text-orange-400" />
            <span>T =</span>
            <strong className="text-[var(--text-primary)] font-bold">
              {activeFrame ? `${activeFrame.sim_time.toFixed(1)}s` : '0.0s'}
            </strong>
          </div>
          <div>
            Tasks:{' '}
            <strong className="text-emerald-400 font-bold">
              {activeFrame?.completed_tasks_so_far || 0}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Viewport Mount */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-1 min-h-0">
        {viewMode === '3d' ? (
          <Robotics3DViewport
            currentFrame={activeFrame}
            eir={eir}
            isDarkMode={isDarkMode}
            history={history}
            selectedExpId={selectedExpId}
          />
        ) : (
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-full rounded-md cursor-crosshair border border-[var(--border-subtle)]"
          />
        )}

        {/* Selected Robot Inspector HUD */}
        {selectedRobot && (
          <div className="absolute bottom-4 left-4 liquid-glass-card p-3 w-56 shadow-2xl space-y-1.5 text-[10px] font-mono z-20">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1">
              <span className="font-bold text-blue-400 flex items-center gap-1">
                <CrosshairIcon className="w-3 h-3 text-orange-400" />
                {selectedRobot.robot_id.toUpperCase()}
              </span>
              <span
                className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                  selectedRobot.is_yielding
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {selectedRobot.state}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[9px]">
              <div>
                <span className="text-[var(--text-muted)]">Pos:</span>
                <span className="text-[var(--text-primary)] font-bold block">
                  [{selectedRobot.x.toFixed(2)}, {selectedRobot.y.toFixed(2)}]
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Heading:</span>
                <span className="text-[var(--text-primary)] block">
                  {((selectedRobot.theta * 180) / Math.PI).toFixed(0)}°
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Speed (v):</span>
                <span className="text-emerald-400 font-bold block">
                  {selectedRobot.v.toFixed(2)} m/s
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Angular (w):</span>
                <span className="text-[var(--text-primary)] block">
                  {selectedRobot.w.toFixed(2)} rad/s
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Timeline Scrubber (If replay frame active) */}
      {selectedExpId !== 'live' && replayFrames.length > 0 && (
        <div className="h-8 liquid-glass px-4 flex items-center gap-3 z-20 border-t border-[var(--border-subtle)] shrink-0">
          <span className="text-[10px] font-mono text-orange-400 font-bold whitespace-nowrap">
            Scrubber [{scrubIndex + 1}/{replayFrames.length}]
          </span>
          <input
            type="range"
            min={0}
            max={replayFrames.length - 1}
            value={scrubIndex}
            onChange={(e) => setScrubIndex(Number(e.target.value))}
            className="flex-1 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-orange-400"
          />
          <span className="text-[10px] font-mono text-[var(--text-secondary)] whitespace-nowrap">
            T = {replayFrames[scrubIndex]?.sim_time.toFixed(1)}s
          </span>
        </div>
      )}
    </div>
  );
};
