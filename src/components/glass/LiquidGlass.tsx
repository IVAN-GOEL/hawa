import React, { useEffect, useRef, useState } from 'react';
import '../../vendor/liquid-glass/glass.css';
import { Container } from '../../vendor/liquid-glass/container.js';

interface LiquidGlassProps {
  type?: 'rounded' | 'circle' | 'pill';
  tintOpacity?: number;
  radius?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onClick?: () => void;
}

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  type = 'rounded',
  tintOpacity = 0.25,
  radius = 16,
  className = '',
  style = {},
  children,
  onClick,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerInstance = useRef<Container | null>(null);
  const [useCssFallback, setUseCssFallback] = useState<boolean>(true);

  useEffect(() => {
    // Check fallback criteria:
    // 1. prefers-reduced-motion
    // 2. low-end device (navigator.hardwareConcurrency <= 4)
    // 3. WebGL2 availability
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLowEnd = typeof navigator !== 'undefined' && navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4;
    
    let hasWebGL2 = false;
    try {
      const testCanvas = document.createElement('canvas');
      hasWebGL2 = !!testCanvas.getContext('webgl2');
    } catch {
      hasWebGL2 = false;
    }

    if (prefersReducedMotion || isLowEnd || !hasWebGL2) {
      setUseCssFallback(true);
      return;
    }

    setUseCssFallback(false);

    // Initialize vendor Container
    const container = new Container({
      type,
      tintOpacity,
      borderRadius: radius,
    });
    containerInstance.current = container;

    if (mountRef.current) {
      mountRef.current.appendChild(container.domElement);
      // Sample initial background
      container.sampleBackground();
    }

    // Throttled re-sampling on scroll end
    let scrollTimeout: any = null;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        container.sampleBackground();
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
      if (containerInstance.current) {
        containerInstance.current.destroy();
        containerInstance.current = null;
      }
    };
  }, [type, tintOpacity, radius]);

  // Radius style mapping
  const radiusClass =
    type === 'pill' ? 'rounded-pill' : type === 'circle' ? 'rounded-full' : 'rounded-card';

  if (useCssFallback) {
    return (
      <div
        onClick={onClick}
        style={style}
        className={`css-liquid-glass ${radiusClass} ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      onClick={onClick}
      style={style}
      className={`relative inline-block ${radiusClass} ${className}`}
    >
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};
