import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { RequestListPage } from './pages/RequestListPage';
import { NewRequestPage } from './pages/NewRequestPage';
import { RequestDetailPage } from './pages/RequestDetailPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { PayerConfigPage } from './pages/PayerConfigPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Route Redirect Helper for workflow subtabs
const RequestTabRedirect: React.FC<{ tab: string }> = ({ tab }) => {
  const currentPath = window.location.pathname;
  const requestId = currentPath.split('/')[2];
  return <Navigate to={`/requests/${requestId}?tab=${tab}`} replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Clinical SaaS Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/requests" element={<RequestListPage />} />
              <Route path="/requests/new" element={<NewRequestPage />} />
              <Route path="/requests/:id" element={<RequestDetailPage />} />

              {/* Direct workflow route aliases */}
              <Route path="/requests/:id/documents" element={<RequestTabRedirect tab="documents" />} />
              <Route path="/requests/:id/extraction" element={<RequestTabRedirect tab="extraction" />} />
              <Route path="/requests/:id/completeness" element={<RequestTabRedirect tab="completeness" />} />
              <Route path="/requests/:id/generate" element={<RequestTabRedirect tab="generate" />} />
              <Route path="/requests/:id/review" element={<RequestTabRedirect tab="review" />} />
              <Route path="/requests/:id/tracking" element={<RequestTabRedirect tab="tracking" />} />

              <Route path="/tracking" element={<Navigate to="/requests?status=SUBMITTED" replace />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help" element={<HelpPage />} />

              {/* Administrator Only Routes */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute adminOnly>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/payers"
                element={
                  <ProtectedRoute adminOnly>
                    <PayerConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute adminOnly>
                    <AuditLogPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
