import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const SimWeaverLogoIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Precision Interlocking Orbital Rings forming S/W dynamic synergy */}
    <path
      d="M6 10C6 7.79086 7.79086 6 10 6H22C24.2091 6 26 7.79086 26 10V14C26 16.2091 24.2091 18 22 18H10C7.79086 18 6 19.7909 6 22V22C6 24.2091 7.79086 26 10 26H22C24.2091 26 26 24.2091 26 22"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="6" r="2" fill={color} />
    <circle cx="26" cy="22" r="2" fill={color} />
    <circle cx="16" cy="16" r="2.5" fill="none" stroke={color} strokeWidth="1.8" />
    <path d="M16 11V13M16 19V21M11 16H13M19 16H21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const CrosshairIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <circle cx="12" cy="12" r="8" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export const LidarSweepIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M12 22A10 10 0 0 0 22 12" />
    <path d="M12 17A5 5 0 0 0 17 12" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 12L20 4" strokeDasharray="2 2" />
    <path d="M2 12h2M12 2v2" />
  </svg>
);

export const Cube3DIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M21 16.5V7.5L12 2.5L3 7.5V16.5L12 21.5L21 16.5Z" />
    <path d="M12 2.5V21.5" />
    <path d="M3 7.5L12 12.5L21 7.5" />
  </svg>
);

export const Blueprint2DIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" strokeDasharray="1.5 1.5" />
    <path d="M6 6h6v6H6z" fill={color} fillOpacity="0.15" />
  </svg>
);

export const StepForwardIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <polygon points="5 4 15 12 5 20 5 4" fill={color} fillOpacity="0.2" />
    <line x1="19" y1="5" x2="19" y2="19" strokeWidth="2" />
  </svg>
);

export const ZapLoopIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={color} fillOpacity="0.2" />
  </svg>
);

export const CriticShieldIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const ResetClockwiseIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M21.5 2v6h-6" />
    <path d="M21.34 15.57a9 9 0 1 1-.57-8.38l5.67-5.19" />
  </svg>
);

export const SunSolarIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <circle cx="12" cy="12" r="4" fill={color} fillOpacity="0.2" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

export const MoonNightIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={color} fillOpacity="0.15" />
  </svg>
);

export const ExportSheetIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <polyline points="9 15 12 18 15 15" />
  </svg>
);

export const SettingsSlidersIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

export const LayersLayoutIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

export const TerminalConsoleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

export const GaugeMetricIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M12 2a10 10 0 0 0-7.07 17.07" />
    <path d="M19.07 19.07A10 10 0 0 0 12 2" />
    <circle cx="12" cy="14" r="2" />
    <line x1="12" y1="14" x2="16" y2="8" strokeWidth="2" />
  </svg>
);

export const RobotAgentIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16.01" strokeWidth="2" />
    <line x1="16" y1="16" x2="16" y2="16.01" strokeWidth="2" />
  </svg>
);

export const BrainNeuralIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 4.18 2.5 2.5 0 0 0 3.92 2.54A2.5 2.5 0 0 0 12 19.5" />
    <path d="M12 4.5a2.5 2.5 0 0 1 4.96-.46 2.5 2.5 0 0 1 1.98 3 2.5 2.5 0 0 1 1.32 4.24 3 3 0 0 1-.34 4.18 2.5 2.5 0 0 1-3.92 2.54A2.5 2.5 0 0 1 12 19.5" />
    <path d="M12 4.5v15" />
  </svg>
);

export const SparkleTargetIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" fill={color} fillOpacity="0.15" />
    <circle cx="18" cy="18" r="3" />
  </svg>
);

export const CheckSquareIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

export const FlameHeatmapIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

export const ClockTimeIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const CompassGizmoIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={color} fillOpacity="0.2" />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const PlaySolidIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    fill={color}
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
