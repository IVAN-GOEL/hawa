import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useHawaStore } from './store/useHawaStore';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { FooterNote } from './components/FooterNote';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { MarketDetailPage } from './pages/MarketDetailPage';
import { ProposePage } from './pages/ProposePage';
import { AdminPage } from './pages/AdminPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { BrandPage } from './pages/BrandPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Layout wrapper for authenticated in-app pages
const InAppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-linen text-black-cherry flex flex-col font-sans selection:bg-baby-pink">
      <Header />
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
      <FooterNote />
    </div>
  );
};

export function App() {
  const { init } = useHawaStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* Public Routes Only */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Onboarding Route (Session exists but not onboarded) */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Protected In-App Experience */}
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <InAppLayout>
                <HomePage />
              </InAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/market/:id"
          element={
            <ProtectedRoute>
              <InAppLayout>
                <MarketDetailPage />
              </InAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/propose"
          element={
            <ProtectedRoute>
              <InAppLayout>
                <ProposePage />
              </InAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <InAppLayout>
                <AdminPage />
              </InAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <InAppLayout>
                <LeaderboardPage />
              </InAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <InAppLayout>
                <ProfilePage />
              </InAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/brand"
          element={
            <ProtectedRoute>
              <InAppLayout>
                <BrandPage />
              </InAppLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all 404 */}
        <Route
          path="*"
          element={
            <InAppLayout>
              <NotFoundPage />
            </InAppLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
