import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import { OverviewPage } from '@/pages/OverviewPage';
import { PerformancePage } from '@/pages/PerformancePage';
import { IncidentsPage } from '@/pages/IncidentsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading, monitoringStatus } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (monitoringStatus === 'PENDING') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-semibold">
            Compte en attente
          </h1>

          <p className="mb-6 text-muted-foreground">
            Votre compte a bien été créé, mais votre accès au Dashboard
            de supervision doit encore être autorisé par un administrateur.
          </p>

        </div>
      </div>
    );
  }

  if (monitoringStatus === 'DISABLED') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-semibold">
            Accès désactivé
          </h1>

          <p className="mb-6 text-muted-foreground">
            Votre accès au Dashboard de supervision a été désactivé.
            Contactez un administrateur si vous pensez qu’il s’agit d’une erreur.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Actualiser
          </button>
        </div>
      </div>
    );
  }

  if (monitoringStatus !== 'ACTIVE') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-semibold">
            Accès non autorisé
          </h1>

          <p className="mb-6 text-muted-foreground">
            Votre compte ne dispose pas encore des droits nécessaires
            pour accéder à ce Dashboard.
          </p>
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<ProtectedRoute><OverviewPage /></ProtectedRoute>} />
      <Route path="/performance" element={<ProtectedRoute><PerformancePage /></ProtectedRoute>} />
      <Route path="/incidents" element={<ProtectedRoute><IncidentsPage /></ProtectedRoute>} />
      <Route path="/historique" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
