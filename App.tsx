import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { UserRole } from './types';
import AdminPage from './pages/admin/AdminPage';
import { BarbeariaPage } from './pages/barbearia/BarbeariaPage';
import { BarbeiroPage } from './pages/barbeiro/BarbeiroPage';
import PublicBookingPage from './pages/cliente/PublicBookingPage';
import BookingSuccessPage from './pages/cliente/BookingSuccessPage';
import PublicProfilePage from './pages/cliente/PublicProfilePage';
import ToastProvider from './components/ToastProvider';
import LandingPage from './pages/LandingPage';

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
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/booking-success" element={<BookingSuccessPage />} />

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

        {/* Barbeiro Routes */}
        <Route path="/barbeiro" element={
            <ProtectedRoute allowedRoles={[UserRole.BARBEIRO]}>
                <DashboardLayout title="Painel do Barbeiro" />
            </ProtectedRoute>
        }>
            <Route path="dashboard" element={<BarbeiroPage />} />
            <Route path="appointments" element={<BarbeiroPage />} />
            <Route path="availability" element={<BarbeiroPage />} />
            <Route index element={<Navigate to="appointments" />} />
        </Route>

        {/* Dynamic Slug-based Routes (Public and Protected Barbearia) */}
        <Route path="/:slug">
          <Route index element={<PublicProfilePage />} />
          <Route path="agendamento" element={<PublicBookingPage />} />
          
          {/* Protected Barbearia Dashboard Routes */}
          <Route element={
            <ProtectedRoute allowedRoles={[UserRole.BARBEARIA]}>
              <DashboardLayout title="Painel da Barbearia" />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<BarbeariaPage />} />
            <Route path="barbers" element={<BarbeariaPage />} />
            <Route path="services" element={<BarbeariaPage />} />
            <Route path="appointments" element={<BarbeariaPage />} />
            <Route path="settings" element={<BarbeariaPage />} />
          </Route>
        </Route>

        {/* Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
  );
}

const App = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider />
          <AppRoutes />
        </SettingsProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;