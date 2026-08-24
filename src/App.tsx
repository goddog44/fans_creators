import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { allRoles, roleHomeRoute } from '@/lib/rbac';

// Public
import { LandingPage } from '@/pages/public/LandingPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { ForgotPasswordPage } from '@/pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/public/ResetPasswordPage';

// User
import { UserHome } from '@/pages/user/UserHome';
import { UserExplore } from '@/pages/user/UserExplore';
import { ModelProfile } from '@/pages/user/ModelProfile';
import { UserSubscriptions } from '@/pages/user/UserSubscriptions';
import { UserMessages } from '@/pages/user/UserMessages';
import { UserNotifications } from '@/pages/user/UserNotifications';
import { UserBookmarks } from '@/pages/user/UserBookmarks';
import { UserPayments } from '@/pages/user/UserPayments';
import { UserProfile } from '@/pages/user/UserProfile';

// Model
import { ModelDashboard } from '@/pages/model/ModelDashboard';
import { ModelContent } from '@/pages/model/ModelContent';
import { ModelStories } from '@/pages/model/ModelStories';
import { ModelSubscribers } from '@/pages/model/ModelSubscribers';
import { ModelMessages } from '@/pages/model/ModelMessages';
import { ModelEarnings } from '@/pages/model/ModelEarnings';
import { ModelAnalytics } from '@/pages/model/ModelAnalytics';
import { ModelNotifications } from '@/pages/model/ModelNotifications';
import { ModelProfileSettings } from '@/pages/model/ModelProfileSettings';
import { ModelSettings } from '@/pages/model/ModelSettings';

// Manager
import { ManagerDashboard } from '@/pages/manager/ManagerDashboard';
import { ManagerModels } from '@/pages/manager/ManagerModels';
import { ManagerContent } from '@/pages/manager/ManagerContent';
import { ManagerSubscribers } from '@/pages/manager/ManagerSubscribers';
import { ManagerMessages } from '@/pages/manager/ManagerMessages';
import { ManagerRevenue } from '@/pages/manager/ManagerRevenue';
import { ManagerAnalytics } from '@/pages/manager/ManagerAnalytics';
import { ManagerNotifications } from '@/pages/manager/ManagerNotifications';
import { ManagerSettings } from '@/pages/manager/ManagerSettings';

// Admin
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminManagers } from '@/pages/admin/AdminManagers';
import { AdminModels } from '@/pages/admin/AdminModels';
import { AdminContent } from '@/pages/admin/AdminContent';
import { AdminSubscriptions } from '@/pages/admin/AdminSubscriptions';
import { AdminTransactions } from '@/pages/admin/AdminTransactions';
import { AdminPayouts } from '@/pages/admin/AdminPayouts';
import { AdminReports } from '@/pages/admin/AdminReports';
import { AdminModeration } from '@/pages/admin/AdminModeration';
import { AdminNotifications } from '@/pages/admin/AdminNotifications';
import { AdminSettings } from '@/pages/admin/AdminSettings';
import { AdminAuditLogs } from '@/pages/admin/AdminAuditLogs';

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={roleHomeRoute[user.role]} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/explore" element={<ProtectedRoute roles={allRoles}><UserExplore /></ProtectedRoute>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* User */}
      <Route path="/home" element={<ProtectedRoute roles={allRoles}><UserHome /></ProtectedRoute>} />
      <Route path="/user/explore" element={<ProtectedRoute roles={allRoles}><UserExplore /></ProtectedRoute>} />
      <Route path="/model/:id" element={<ProtectedRoute roles={allRoles}><ModelProfile /></ProtectedRoute>} />
      <Route path="/subscriptions" element={<ProtectedRoute roles={allRoles}><UserSubscriptions /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute roles={allRoles}><UserMessages /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute roles={allRoles}><UserNotifications /></ProtectedRoute>} />
      <Route path="/bookmarks" element={<ProtectedRoute roles={allRoles}><UserBookmarks /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute roles={allRoles}><UserPayments /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute roles={allRoles}><UserProfile /></ProtectedRoute>} />

      {/* Model */}
      <Route path="/model" element={<ProtectedRoute roles={['MODEL']}><ModelDashboard /></ProtectedRoute>} />
      <Route path="/model/content" element={<ProtectedRoute roles={['MODEL']}><ModelContent /></ProtectedRoute>} />
      <Route path="/model/stories" element={<ProtectedRoute roles={['MODEL']}><ModelStories /></ProtectedRoute>} />
      <Route path="/model/subscribers" element={<ProtectedRoute roles={['MODEL']}><ModelSubscribers /></ProtectedRoute>} />
      <Route path="/model/messages" element={<ProtectedRoute roles={['MODEL']}><ModelMessages /></ProtectedRoute>} />
      <Route path="/model/earnings" element={<ProtectedRoute roles={['MODEL']}><ModelEarnings /></ProtectedRoute>} />
      <Route path="/model/analytics" element={<ProtectedRoute roles={['MODEL']}><ModelAnalytics /></ProtectedRoute>} />
      <Route path="/model/notifications" element={<ProtectedRoute roles={['MODEL']}><ModelNotifications /></ProtectedRoute>} />
      <Route path="/model/profile" element={<ProtectedRoute roles={['MODEL']}><ModelProfileSettings /></ProtectedRoute>} />
      <Route path="/model/settings" element={<ProtectedRoute roles={['MODEL']}><ModelSettings /></ProtectedRoute>} />

      {/* Manager */}
      <Route path="/manager" element={<ProtectedRoute roles={['MANAGER']}><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/manager/models" element={<ProtectedRoute roles={['MANAGER']}><ManagerModels /></ProtectedRoute>} />
      <Route path="/manager/content" element={<ProtectedRoute roles={['MANAGER']}><ManagerContent /></ProtectedRoute>} />
      <Route path="/manager/subscribers" element={<ProtectedRoute roles={['MANAGER']}><ManagerSubscribers /></ProtectedRoute>} />
      <Route path="/manager/messages" element={<ProtectedRoute roles={['MANAGER']}><ManagerMessages /></ProtectedRoute>} />
      <Route path="/manager/revenue" element={<ProtectedRoute roles={['MANAGER']}><ManagerRevenue /></ProtectedRoute>} />
      <Route path="/manager/analytics" element={<ProtectedRoute roles={['MANAGER']}><ManagerAnalytics /></ProtectedRoute>} />
      <Route path="/manager/notifications" element={<ProtectedRoute roles={['MANAGER']}><ManagerNotifications /></ProtectedRoute>} />
      <Route path="/manager/settings" element={<ProtectedRoute roles={['MANAGER']}><ManagerSettings /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/managers" element={<ProtectedRoute roles={['ADMIN']}><AdminManagers /></ProtectedRoute>} />
      <Route path="/admin/models" element={<ProtectedRoute roles={['ADMIN']}><AdminModels /></ProtectedRoute>} />
      <Route path="/admin/content" element={<ProtectedRoute roles={['ADMIN']}><AdminContent /></ProtectedRoute>} />
      <Route path="/admin/subscriptions" element={<ProtectedRoute roles={['ADMIN']}><AdminSubscriptions /></ProtectedRoute>} />
      <Route path="/admin/transactions" element={<ProtectedRoute roles={['ADMIN']}><AdminTransactions /></ProtectedRoute>} />
      <Route path="/admin/payouts" element={<ProtectedRoute roles={['ADMIN']}><AdminPayouts /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['ADMIN']}><AdminReports /></ProtectedRoute>} />
      <Route path="/admin/moderation" element={<ProtectedRoute roles={['ADMIN']}><AdminModeration /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute roles={['ADMIN']}><AdminNotifications /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute roles={['ADMIN']}><AdminSettings /></ProtectedRoute>} />
      <Route path="/admin/audit-logs" element={<ProtectedRoute roles={['ADMIN']}><AdminAuditLogs /></ProtectedRoute>} />

      <Route path="/redirect" element={<RoleRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
