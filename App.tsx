import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { UserRole } from './types';
import AdminPage from './pages/admin/AdminPage';
import { BarbeariaPage } from './pages/barbearia/BarbeariaPage';
import { BarbeiroPage } from './pages/barbeiro/BarbeiroPage';
import PublicBookingPage from './pages/cliente/PublicBookingPage';
import ConfirmationPage from './pages/cliente/ConfirmationPage';
import ToastProvider from './components/ToastProvider';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-brand-dark">
        <div className="text-brand-gold text-xl">Carregando...</div>
      </div>
    );
  }
  
  return (
     <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        {/* Public booking page is now at /agendar/:slug */}
        <Route path="/agendar/:slug" element={<PublicBookingPage />} />
        <Route path="/" element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <Navigate to="/login" />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <DashboardLayout title="Painel do Administrador" />
          </ProtectedRoute>
        }>
            <Route path="dashboard" element={<AdminPage />} />
            <Route path="barbershops" element={<AdminPage />} />
            <Route path="plans" element={<AdminPage />} />
            <Route path="settings" element={<AdminPage />} />
            <Route index element={<Navigate to="dashboard" />} />
        </Route>

        {/* Barbearia Routes with custom slug */}
        <Route path="/:slug" element={
           <ProtectedRoute allowedRoles={[UserRole.BARBEARIA]}>
            <DashboardLayout title="Painel da Barbearia" />
          </ProtectedRoute>
        }>
            <Route path="" element={<BarbeariaPage />} />
            <Route path="dashboard" element={<BarbeariaPage />} />
            <Route path="barbers" element={<BarbeariaPage />} />
            <Route path="services" element={<BarbeariaPage />} />
            <Route path="appointments" element={<BarbeariaPage />} />
            <Route path="settings" element={<BarbeariaPage />} />
        </Route>

        {/* Barbeiro Routes */}
        <Route path="/barbeiro" element={
            <ProtectedRoute allowedRoles={[UserRole.BARBEIRO]}>
                <DashboardLayout title="Painel do Barbeiro" />
            </ProtectedRoute>
        }>
            <Route path="dashboard" element={<BarbeiroPage />} />
            <Route index element={<Navigate to="dashboard" />} />
        </Route>

        {/* Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
  );
}

const App = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <ToastProvider />
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;