import React from 'react';

interface AirSwirlMotifProps {
  className?: string;
  opacity?: number;
}

export const AirSwirlMotif: React.FC<AirSwirlMotifProps> = ({
  className = '',
  opacity = 0.5,
}) => {
  return (
    <div
      className={`pointer-events-none fixed inset-0 overflow-hidden -z-10 max-w-full ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover overflow-hidden max-w-full"
        preserveAspectRatio="none"
      >
        {/* Soft curving air lines in Baby Pink and Cool Blue */}
        <path
          d="M-100 250 C320 80, 580 480, 980 260 C1220 120, 1400 320, 1540 280"
          stroke="#F5C6D2"
          strokeWidth="32"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M-50 480 C280 620, 680 320, 1080 540 C1280 640, 1380 500, 1540 460"
          stroke="#5B8EF2"
          strokeWidth="24"
          strokeLinecap="round"
          opacity="0.35"
        />
        <path
          d="M120 -40 C420 280, 850 -60, 1320 180"
          stroke="#E8DFCF"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M200 850 C600 650, 900 890, 1400 700"
          stroke="#F5C6D2"
          strokeWidth="18"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    </div>
  );
};

export default AirSwirlMotif;
