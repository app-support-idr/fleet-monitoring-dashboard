import './App.css';
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import type { ReactNode } from 'react';

const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const PerformancePage = lazy(() => import('./pages/PerformancePage'));
const IncidentsPage = lazy(() => import('./pages/IncidentsPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  );
}

function Layout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Layout><OverviewPage /></Layout>} />
        <Route path="/performance" element={<Layout><PerformancePage /></Layout>} />
        <Route path="/incidents" element={<Layout><IncidentsPage /></Layout>} />
        <Route path="/historique" element={<Layout><HistoryPage /></Layout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
