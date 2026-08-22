import React, { useEffect, useState, useRef } from 'react';

interface CustomCursorProps {
  isDarkMode: boolean;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ isDarkMode }) => {
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    document.body.classList.add('custom-cursor-active');

    const onMouseMove = (e: MouseEvent) => {
      setTargetPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest('button, a, input, select, textarea, [role="button"], canvas');
        setIsHovered(!!interactive);
      }
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Smooth Damped Actuator Lerp Kinematics
    const updateCursor = () => {
      setPosition((prev) => {
        const lerpFactor = 0.28; // Responsive mechanical damping
        const dx = targetPos.x - prev.x;
        const dy = targetPos.y - prev.y;
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
          return targetPos;
        }
        return {
          x: prev.x + dx * lerpFactor,
          y: prev.y + dy * lerpFactor,
        };
      });
      animFrameRef.current = requestAnimationFrame(updateCursor);
    };

    animFrameRef.current = requestAnimationFrame(updateCursor);

    return () => {
      document.body.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetPos, isVisible]);

  if (!isVisible) return null;

  const accentColor = isDarkMode ? '#38BDF8' : '#0284C7';
  const bracketColor = isDarkMode ? 'rgba(56, 189, 248, 0.6)' : 'rgba(2, 132, 199, 0.6)';

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-[99999]"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
    >
      {/* Sub-pixel Crosshair Dot */}
      <div
        className="w-1.5 h-1.5 rounded-full absolute -top-[3px] -left-[3px] transition-transform duration-150"
        style={{
          backgroundColor: accentColor,
          transform: isHovered ? 'scale(1.8)' : 'scale(1)',
          boxShadow: `0 0 6px ${accentColor}`,
        }}
      />

      {/* Trailing Reticle Ring / Target Brackets */}
      <div
        className="absolute rounded-full border transition-all duration-200"
        style={{
          width: isHovered ? '32px' : '20px',
          height: isHovered ? '32px' : '20px',
          top: isHovered ? '-16px' : '-10px',
          left: isHovered ? '-16px' : '-10px',
          borderColor: bracketColor,
          borderRadius: isHovered ? '4px' : '9999px',
          borderWidth: '1px',
          borderStyle: isHovered ? 'dashed' : 'solid',
        }}
      />

      {/* Coordinate HUD Readout */}
      {isHovered && (
        <div
          className="absolute left-5 top-2 text-[9px] font-mono tracking-wider font-semibold whitespace-nowrap px-1 py-0.5 rounded bg-black/60 backdrop-blur text-cyan-300 border border-cyan-500/30"
          style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}
        >
          [{Math.round(position.x)}, {Math.round(position.y)}] LOCK
        </div>
      )}
    </div>
  );
};
