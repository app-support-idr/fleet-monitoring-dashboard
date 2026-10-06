import './App.css';
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import type { ReactNode } from 'react';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const PerformancePage = lazy(() => import('./pages/PerformancePage'));
const IncidentsPage = lazy(() => import('./pages/IncidentsPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading, monitoringStatus, monitoringStatusLoading } = useAuth();

  if (loading || monitoringStatusLoading) {
    return <PageLoader />;
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
            Votre compte a bien ete cree, mais votre acces au Dashboard
            de supervision doit encore etre autorise par un administrateur.
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
            Acces desactive
          </h1>

          <p className="mb-6 text-muted-foreground">
            Votre acces au Dashboard de supervision a ete desactive.
            Contactez un administrateur si vous pensez qu'il s'agit d'une erreur.
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
            Acces non autorise
          </h1>

          <p className="mb-6 text-muted-foreground">
            Votre compte ne dispose pas encore des droits necessaires
            pour acceder a ce Dashboard.
          </p>
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { session, loading, monitoringStatus, monitoringRole, monitoringStatusLoading } = useAuth();

  if (loading || monitoringStatusLoading) {
    return <PageLoader />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (monitoringStatus !== 'ACTIVE') {
    return <Navigate to="/" replace />;
  }

  if (monitoringRole !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<ProtectedRoute><OverviewPage /></ProtectedRoute>} />
        <Route path="/performance" element={<ProtectedRoute><PerformancePage /></ProtectedRoute>} />
        <Route path="/incidents" element={<ProtectedRoute><IncidentsPage /></ProtectedRoute>} />
        <Route path="/historique" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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
