import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  chart: string;
  isDarkMode: boolean;
  className?: string;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({
  chart,
  isDarkMode,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDarkMode ? 'dark' : 'neutral',
      securityLevel: 'loose',
      fontFamily: 'JetBrains Mono, monospace, Inter, sans-serif',
      themeVariables: isDarkMode
        ? {
            darkMode: true,
            background: '#0E131C',
            primaryColor: '#1E293B',
            primaryBorderColor: '#38BDF8',
            primaryTextColor: '#F8FAFC',
            lineColor: '#60A5FA',
            secondaryColor: '#141A26',
            tertiaryColor: '#1E293B',
          }
        : {
            darkMode: false,
            background: '#FFFFFF',
            primaryColor: '#F1F5F9',
            primaryBorderColor: '#0284C7',
            primaryTextColor: '#0F172A',
            lineColor: '#0284C7',
            secondaryColor: '#F8FAFC',
            tertiaryColor: '#E2E8F0',
          },
    });

    const renderChart = async () => {
      try {
        setError(null);
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvgContent(svg);
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        setError('Failed to compile Mermaid diagram.');
      }
    };

    renderChart();
  }, [chart, isDarkMode]);

  if (error) {
    return (
      <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 font-mono text-xs">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-x-auto p-4 flex items-center justify-center bg-[var(--bg-surface)] rounded-md border border-[var(--border-subtle)] transition-colors ${className}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};
