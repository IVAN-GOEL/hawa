import React from 'react';
import { NavLink } from 'react-router-dom';
import { TrendingUp, Trophy, PlusCircle, User, Shield } from 'lucide-react';
import { LiquidGlass } from './glass/LiquidGlass';
import { useHawaStore } from '../store/useHawaStore';

export const BottomNav: React.FC = () => {
  const { currentUser } = useHawaStore();

  const navItems = [
    { to: '/feed', label: 'Markets', icon: TrendingUp },
    { to: '/leaderboard', label: 'Ranks', icon: Trophy },
    { to: '/propose', label: 'Propose', icon: PlusCircle, isPrimary: true },
    { to: '/profile', label: 'Profile', icon: User },
    ...(currentUser?.role === 'admin'
      ? [{ to: '/admin', label: 'Admin', icon: Shield }]
      : []),
  ];

  return (
    <nav
      className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
      aria-label="Bottom Navigation"
    >
      <LiquidGlass
        type="pill"
        tintOpacity={0.35}
        radius={999}
        className="pointer-events-auto p-1.5 shadow-float max-w-md w-full border border-linen-deep/80"
      >
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-2 py-1 rounded-pill transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol ${
                    item.isPrimary
                      ? isActive
                        ? 'bg-tangerine text-black-cherry font-bold shadow-sm'
                        : 'bg-linen-deep/90 text-black-cherry font-semibold hover:bg-tangerine/90'
                      : isActive
                      ? 'bg-petrol text-linen font-bold shadow-sm'
                      : 'text-black-cherry/75 hover:text-black-cherry hover:bg-linen-deep/40'
                  }`
                }
                aria-label={item.label}
              >
                <Icon className={`w-5 h-5 ${item.isPrimary ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </LiquidGlass>
    </nav>
  );
};
