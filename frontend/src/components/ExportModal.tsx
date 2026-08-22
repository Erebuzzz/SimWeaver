import React, { useState, useEffect } from 'react';
import { 
  ExportSheetIcon, 
  Blueprint2DIcon, 
  Cube3DIcon, 
  RobotAgentIcon, 
  TerminalConsoleIcon, 
  CheckSquareIcon 
} from './icons/EngineeringIcons';
import { EIRSpec, ExperimentRecord } from '../types';
import { getApiUrl } from '../config';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eir: EIRSpec | null;
  history: ExperimentRecord[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, eir, history }) => {
  const [activeTab, setActiveTab] = useState<'yaml' | 'ros2' | 'urdf' | 'webots' | 'pybullet' | 'report'>('yaml');
  const [copied, setCopied] = useState(false);
  const [ros2Content, setRos2Content] = useState<string>('');
  const [urdfContent, setUrdfContent] = useState<string>('');
  const [webotsContent, setWebotsContent] = useState<string>('');
  const [pybulletContent, setPybulletContent] = useState<string>('');
  const [reportContent, setReportContent] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    fetch(getApiUrl('/api/export/ros2'))
      .then((res) => res.json())
      .then((data) => setRos2Content(data.launch_file_content || ''))
      .catch(() => {});

    fetch(getApiUrl('/api/export/urdf'))
      .then((res) => res.json())
      .then((data) => setUrdfContent(data.urdf || ''))
      .catch(() => {});

    fetch(getApiUrl('/api/export/webots'))
      .then((res) => res.json())
      .then((data) => setWebotsContent(data.webots_world || ''))
      .catch(() => {});

    fetch(getApiUrl('/api/export/pybullet'))
      .then((res) => res.json())
      .then((data) => setPybulletContent(data.pybullet_script || ''))
      .catch(() => {});

    fetch(getApiUrl('/api/export/report'))
      .then((res) => res.json())
      .then((data) => setReportContent(data.markdown_report || ''))
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const getActiveContent = () => {
    switch (activeTab) {
      case 'yaml':
        return eir ? JSON.stringify(eir, null, 2) : '';
      case 'ros2':
        return ros2Content;
      case 'urdf':
        return urdfContent;
      case 'webots':
        return webotsContent;
      case 'pybullet':
        return pybulletContent;
      case 'report':
        return reportContent;
      default:
        return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = getActiveContent();
    const filenames: Record<string, string> = {
      yaml: 'simweaver_eir_design.yaml',
      ros2: 'simweaver_nav2_launch.py',
      urdf: 'simweaver_amr.urdf',
      webots: 'simweaver_warehouse.wbt',
      pybullet: 'simulate_pybullet.py',
      report: 'simweaver_experiment_report.md',
    };

    const filename = filenames[activeTab] || 'export.txt';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="liquid-glass border border-[var(--border-subtle)] rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="h-14 bg-[var(--bg-surface)] px-6 flex items-center justify-between border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <ExportSheetIcon className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
              EXPORT SIMULATOR & ENGINEERING ARTIFACTS
            </h3>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 font-mono text-xs">
            [CLOSE]
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-main)] px-6 pt-2 gap-2 text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setActiveTab('yaml')}
            className={`py-2 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap actuator-transition ${
              activeTab === 'yaml'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Blueprint2DIcon className="w-3.5 h-3.5" />
            <span>EIR Design (YAML)</span>
          </button>

          <button
            onClick={() => setActiveTab('ros2')}
            className={`py-2 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap actuator-transition ${
              activeTab === 'ros2'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <TerminalConsoleIcon className="w-3.5 h-3.5" />
            <span>ROS2 Launch</span>
          </button>

          <button
            onClick={() => setActiveTab('urdf')}
            className={`py-2 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap actuator-transition ${
              activeTab === 'urdf'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <RobotAgentIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>URDF (XML)</span>
          </button>

          <button
            onClick={() => setActiveTab('webots')}
            className={`py-2 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap actuator-transition ${
              activeTab === 'webots'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Cube3DIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Webots (.wbt)</span>
          </button>

          <button
            onClick={() => setActiveTab('pybullet')}
            className={`py-2 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap actuator-transition ${
              activeTab === 'pybullet'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <TerminalConsoleIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>PyBullet (.py)</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`py-2 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap actuator-transition ${
              activeTab === 'report'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ExportSheetIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>Audit Report (MD)</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg-main)] m-4 rounded-lg border border-[var(--border-subtle)]">
          <pre className="text-xs font-mono text-cyan-300 whitespace-pre-wrap leading-relaxed">
            {getActiveContent()}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="h-14 bg-[var(--bg-surface)] px-6 flex items-center justify-between border-t border-[var(--border-subtle)]">
          <span className="text-xs text-[var(--text-secondary)] font-mono">
            {activeTab === 'yaml' && 'Simulator-Independent Engineering Representation'}
            {activeTab === 'ros2' && 'Deployment Launch File for ROS2 / Nav2'}
            {activeTab === 'urdf' && 'Standard Unified Robot Description Format Model'}
            {activeTab === 'webots' && 'Executable Webots 3D World Description'}
            {activeTab === 'pybullet' && 'Standalone PyBullet Physics Simulation Script'}
            {activeTab === 'report' && 'Engineering Audit & Lineage Summary'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-main)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] actuator-transition flex items-center gap-1.5"
            >
              {copied ? <CheckSquareIcon className="w-3.5 h-3.5 text-emerald-400" /> : <ExportSheetIcon className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white actuator-transition flex items-center gap-1.5"
            >
              <ExportSheetIcon className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
