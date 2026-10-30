import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useHawaStore } from '../store/useHawaStore';
import { LiquidLogo } from './three/LiquidLogo';
import { Coin3D } from './three/Coin3D';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, isLoading } = useHawaStore();
  const location = useLocation();

  // Fullscreen logo loader while session resolves (prevents flash of content)
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-linen flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-48 h-24 mb-4">
          <LiquidLogo size="small" interactiveParallax={false} />
        </div>
        <Coin3D isFlipping={true} size={48} className="my-2" />
        <h2 className="font-display font-black text-xl text-black-cherry mt-3">
          Kya hawa hai?
        </h2>
        <p className="text-xs text-black-cherry/60 mt-1">
          Loading your campus predictions...
        </p>
      </div>
    );
  }

  // No authenticated session -> redirect to /login with state
  if (!currentUser) {
    const searchParams = new URLSearchParams(location.search);
    const refCode = searchParams.get('ref');
    const redirectUrl = location.pathname + location.search;

    const targetUrl = refCode
      ? `/login?redirect=${encodeURIComponent(redirectUrl)}&ref=${encodeURIComponent(refCode)}`
      : `/login?redirect=${encodeURIComponent(redirectUrl)}`;

    return <Navigate to={targetUrl} replace />;
  }

  // Session exists, but profile onboarding is incomplete -> redirect to /onboarding
  if (!currentUser.onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
