import React from 'react';

/**
 * Hand-drawn expressive college character illustrations and doodle stickers.
 * Pure SVG vectors with playful sketched lines, textured ink strokes,
 * and high-energy college campus vibes.
 */

// 1. Cutting Chai & Laptop Student ("The Campus Insider")
export const ChaiStudentCharacter: React.FC<{ className?: string }> = ({ className = 'w-32 h-32' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Soft aura */}
    <circle cx="80" cy="80" r="68" fill="#F5C6D2" fillOpacity="0.4" />
    
    {/* Body / Hoodie */}
    <path d="M45 130 C45 95, 115 95, 115 130 L115 145 L45 145 Z" fill="#1E5560" stroke="#3B0F20" strokeWidth="3" strokeLinejoin="round" />
    
    {/* Head */}
    <circle cx="80" cy="65" r="26" fill="#F3EDE2" stroke="#3B0F20" strokeWidth="3" />
    
    {/* Messy Campus Hair */}
    <path d="M54 62 C50 42, 70 34, 85 36 C98 34, 108 45, 106 62 C100 52, 92 50, 80 50 C68 50, 60 54, 54 62 Z" fill="#3B0F20" />
    
    {/* Glasses */}
    <circle cx="72" cy="66" r="8" fill="#FFFFFF" fillOpacity="0.8" stroke="#3B0F20" strokeWidth="2.5" />
    <circle cx="88" cy="66" r="8" fill="#FFFFFF" fillOpacity="0.8" stroke="#3B0F20" strokeWidth="2.5" />
    <path d="M80 66 L80 64" stroke="#3B0F20" strokeWidth="2.5" />
    
    {/* Cheeky Smile */}
    <path d="M74 79 C78 83, 84 82, 86 79" stroke="#3B0F20" strokeWidth="2.5" strokeLinecap="round" />
    
    {/* Cutting Chai Glass */}
    <g transform="translate(108, 92) rotate(-8)">
      <path d="M0 0 L16 0 L13 26 L3 26 Z" fill="#FF8A3D" fillOpacity="0.85" stroke="#3B0F20" strokeWidth="2" />
      {/* Tea level */}
      <path d="M2 10 L14 10 L12 24 L4 24 Z" fill="#3B0F20" fillOpacity="0.75" />
      {/* Steam lines */}
      <path d="M5 -4 C4 -8, 8 -10, 6 -14" stroke="#FF8A3D" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 -3 C10 -7, 14 -9, 12 -13" stroke="#FF8A3D" strokeWidth="2" strokeLinecap="round" />
    </g>

    {/* Hand-drawn speech bubble */}
    <g transform="translate(12, 10)">
      <rect x="0" y="0" width="70" height="24" rx="12" fill="#FFFFFF" stroke="#3B0F20" strokeWidth="2" />
      <text x="35" y="15" textAnchor="middle" font-family="'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="9" fill="#1E5560">
        Pakka hawa hai!
      </text>
      <path d="M45 24 L52 30 L49 24 Z" fill="#FFFFFF" stroke="#3B0F20" strokeWidth="2" />
    </g>
  </svg>
);

// 2. The Fest Enthusiast / Headphone DJ Kid
export const FestGirlCharacter: React.FC<{ className?: string }> = ({ className = 'w-32 h-32' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Soft aura */}
    <circle cx="80" cy="80" r="68" fill="#5B8EF2" fillOpacity="0.25" />
    
    {/* Body / Fest Tee */}
    <path d="M48 128 C48 98, 112 98, 112 128 L112 145 L48 145 Z" fill="#F5C6D2" stroke="#3B0F20" strokeWidth="3" />
    
    {/* Head */}
    <circle cx="80" cy="68" r="25" fill="#F3EDE2" stroke="#3B0F20" strokeWidth="3" />
    
    {/* Cool Ponytail Hair */}
    <path d="M56 68 C54 44, 75 36, 92 40 C106 44, 105 60, 104 70" fill="#3B0F20" />
    <path d="M98 44 C120 40, 130 65, 120 85 C116 75, 110 65, 102 56 Z" fill="#3B0F20" />
    
    {/* Big DJ Headphones */}
    <path d="M52 64 C50 36, 110 36, 108 64" fill="none" stroke="#FF8A3D" strokeWidth="6" strokeLinecap="round" />
    <rect x="48" y="58" width="10" height="20" rx="5" fill="#1E5560" stroke="#3B0F20" strokeWidth="2" />
    <rect x="102" y="58" width="10" height="20" rx="5" fill="#1E5560" stroke="#3B0F20" strokeWidth="2" />
    
    {/* Sunglasses */}
    <path d="M68 64 L92 64 L90 74 L70 74 Z" fill="#3B0F20" rx="2" />
    
    {/* Sparkles around */}
    <path d="M125 35 L128 25 L131 35 L141 38 L131 41 L128 51 L125 41 L115 38 Z" fill="#FF8A3D" />
    <path d="M25 85 L27 78 L29 85 L36 87 L29 89 L27 96 L25 89 L18 87 Z" fill="#5B8EF2" />
    
    {/* Speech Bubble */}
    <g transform="translate(68, 6)">
      <rect x="0" y="0" width="76" height="24" rx="12" fill="#FFFFFF" stroke="#3B0F20" strokeWidth="2" />
      <text x="38" y="15" textAnchor="middle" font-family="'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="9" fill="#FF8A3D">
        Main stage scene 🔥
      </text>
    </g>
  </svg>
);

// 3. The Hostel League Striker / Cricket Bowler
export const SportsStrikerCharacter: React.FC<{ className?: string }> = ({ className = 'w-32 h-32' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Soft aura */}
    <circle cx="80" cy="80" r="68" fill="#FF8A3D" fillOpacity="0.25" />
    
    {/* Jersey */}
    <path d="M48 126 C48 96, 112 96, 112 126 L112 145 L48 145 Z" fill="#1E5560" stroke="#3B0F20" strokeWidth="3" />
    <text x="80" y="122" textAnchor="middle" font-family="'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="18" fill="#F3EDE2">
      07
    </text>
    
    {/* Head & Headband */}
    <circle cx="80" cy="66" r="25" fill="#F3EDE2" stroke="#3B0F20" strokeWidth="3" />
    {/* Headband */}
    <path d="M56 60 C70 56, 90 56, 104 60 L104 67 C90 63, 70 63, 56 67 Z" fill="#FF8A3D" stroke="#3B0F20" strokeWidth="1.5" />
    
    {/* Intense Focus Eyes */}
    <path d="M70 70 L78 72" stroke="#3B0F20" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M82 72 L90 70" stroke="#3B0F20" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="74" cy="74" r="2.5" fill="#3B0F20" />
    <circle cx="86" cy="74" r="2.5" fill="#3B0F20" />
    
    {/* Determined grin */}
    <path d="M74 82 L86 82" stroke="#3B0F20" strokeWidth="2" strokeLinecap="round" />
    
    {/* Tape Tennis Ball */}
    <g transform="translate(112, 60)">
      <circle cx="14" cy="14" r="14" fill="#5B8EF2" stroke="#3B0F20" strokeWidth="2.5" />
      {/* Red electrical tape strip around ball */}
      <path d="M2 10 C14 8, 22 18, 26 14" stroke="#FF8A3D" strokeWidth="4" strokeLinecap="round" />
    </g>

    {/* Speech Bubble */}
    <g transform="translate(10, 12)">
      <rect x="0" y="0" width="75" height="24" rx="12" fill="#FFFFFF" stroke="#3B0F20" strokeWidth="2" />
      <text x="37" y="15" textAnchor="middle" font-family="'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="9" fill="#1E5560">
        Hostel A clean sweep!
      </text>
    </g>
  </svg>
);

// 4. Cool Hand-Drawn Doodle Stickers Pack
export const WashiTapeSticker: React.FC<{ text?: string; color?: string; className?: string }> = ({
  text = 'CAMPUS BUZZ',
  color = '#F5C6D2',
  className = '',
}) => (
  <div
    className={`inline-block px-3 py-1 font-display font-black text-[11px] uppercase tracking-wider text-black-cherry border border-black-cherry/20 shadow-sm select-none transform -rotate-2 ${className}`}
    style={{
      backgroundColor: color,
      clipPath: 'polygon(0% 4%, 4% 0%, 96% 2%, 100% 6%, 98% 96%, 94% 100%, 2% 98%, 0% 94%)',
    }}
  >
    {text}
  </div>
);

export const HandDrawnArrow: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M15 45 C30 20, 50 25, 65 35"
      stroke="#FF8A3D"
      strokeWidth="4"
      strokeLinecap="round"
      strokeDasharray="4 2"
    />
    <path d="M52 25 L68 36 L55 48" stroke="#FF8A3D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ApprovedStampBadge: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g transform="rotate(-12 50 50)">
      <rect x="8" y="24" width="84" height="52" rx="8" fill="none" stroke="#1E5560" strokeWidth="4" strokeDasharray="6 3" />
      <text x="50" y="56" textAnchor="middle" font-family="'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="16" fill="#1E5560" letterSpacing="1">
        APPROVED
      </text>
      <text x="50" y="68" textAnchor="middle" font-family="'Inter', sans-serif" fontWeight="700" fontSize="7" fill="#1E5560">
        STUDENT COUNCIL
      </text>
    </g>
  </svg>
);

export const DoodledStar: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-6 h-6',
  color = '#FF8A3D',
}) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M20 2 L24 14 L37 15 L27 24 L30 37 L20 29 L10 37 L13 24 L3 15 L16 14 Z"
      fill={color}
      stroke="#3B0F20"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);
