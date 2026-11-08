import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/types';
import AdminPage from '@/pages/admin/AdminPage';
import { EstabelecimentoPage } from '@/pages/estabelecimento/EstabelecimentoPage';
import { ProfissionalPage } from '@/pages/profissional/ProfissionalPage';
import PublicBookingPage from '@/pages/cliente/PublicBookingPage';
import BookingSuccessPage from './pages/cliente/BookingSuccessPage';
import PublicProfilePage from '@/pages/cliente/PublicProfilePage';
import ToastProvider from '@/components/ToastProvider';
import TrialExpiredPage from '@/pages/TrialExpired';
import InitialSetupPage from '@/pages/estabelecimento/InitialSetupPage';
import { useAuth } from '@/hooks/useAuth';

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-brand-dark">
        <div className="text-brand-gold text-xl">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case UserRole.ADMIN:
      return <Navigate to="/admin/dashboard" replace />;
    case UserRole.ESTABELECIMENTO:
      return <Navigate to={`/${user.link_personalizado || 'estabelecimento'}/dashboard`} replace />;
    case UserRole.PROFISSIONAL:
      return <Navigate to="/profissional/appointments" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const AppRoutes = () => {
  return (
     <Routes>
        {/* Redirecionamento inteligente na raiz do app para o painel correspondente ou login */}
        <Route path="/" element={<RootRedirect />} />

        {/* A rota "/" agora é tratada pelo HTML estático. O React assume as rotas com hash. */}
        <Route path="/login" element={<Login />} />
        <Route path="/booking-success" element={<BookingSuccessPage />} />
        <Route path="/trial-expired" element={<TrialExpiredPage />} />

        {/* Rota de configuração inicial para estabelecimentos */}
        <Route path="/initial-setup" element={
          <ProtectedRoute allowedRoles={[UserRole.ESTABELECIMENTO]}>
            <InitialSetupPage />
          </ProtectedRoute>
        } />

        {/* Rotas de Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <DashboardLayout title="Painel do Administrador" />
          </ProtectedRoute>
        }>
            <Route path="dashboard" element={<AdminPage />} />
            <Route path="estabelecimentos" element={<AdminPage />} />
            <Route path="barbershops" element={<Navigate to="/admin/estabelecimentos" replace />} />
            <Route path="plans" element={<AdminPage />} />
            <Route path="expenses" element={<AdminPage />} />
            <Route path="settings" element={<AdminPage />} />
            <Route index element={<Navigate to="dashboard" />} />
        </Route>

        {/* Rotas do Profissional */}
        <Route path="/profissional" element={
            <ProtectedRoute allowedRoles={[UserRole.PROFISSIONAL]}>
                <DashboardLayout title="Painel do Profissional" />
            </ProtectedRoute>
        }>
            <Route path="dashboard" element={<ProfissionalPage />} />
            <Route path="appointments" element={<ProfissionalPage />} />
            <Route path="availability" element={<ProfissionalPage />} />
            <Route index element={<Navigate to="appointments" />} />
        </Route>
        {/* Rota legado /barbeiro redireciona para /profissional */}
        <Route path="/barbeiro/*" element={<Navigate to="/profissional" replace />} />

        {/* Rotas dinâmicas baseadas em Slug (Públicas e Painel do Estabelecimento) */}
        <Route path="/:slug">
          <Route index element={<PublicProfilePage />} />
          <Route path="agendamento" element={<PublicBookingPage />} />
          
          {/* Rotas protegidas do painel do estabelecimento */}
          <Route element={
            <ProtectedRoute allowedRoles={[UserRole.ESTABELECIMENTO]}>
              <DashboardLayout title="Painel do Estabelecimento" />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<EstabelecimentoPage />} />
            <Route path="profissionais" element={<EstabelecimentoPage />} />
            <Route path="barbers" element={<Navigate to="profissionais" replace />} />
            <Route path="services" element={<EstabelecimentoPage />} />
            <Route path="appointments" element={<EstabelecimentoPage />} />
            <Route path="clients" element={<EstabelecimentoPage />} />
            <Route path="settings" element={<EstabelecimentoPage />} />
            <Route path="settings/types" element={<EstabelecimentoPage />} /> 
            <Route path="settings/general" element={<EstabelecimentoPage />} /> 
            <Route path="profile" element={<EstabelecimentoPage />} />
          </Route>
        </Route>

        {/* Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
  );
}

const App = () => {
  return (
    <>
      <ToastProvider />
      <AppRoutes />
    </>
  );
};

export default App;
