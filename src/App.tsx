import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/types';
import AdminPage from '@/pages/admin/AdminPage';
import { BarbeariaPage } from '@/pages/barbearia/BarbeariaPage';
import { BarbeiroPage } from '@/pages/barbeiro/BarbeiroPage';
import PublicBookingPage from '@/pages/cliente/PublicBookingPage';
import BookingSuccessPage from './pages/cliente/BookingSuccessPage';
import PublicProfilePage from '@/pages/cliente/PublicProfilePage';
import ToastProvider from '@/components/ToastProvider';
import TrialExpiredPage from '@/pages/TrialExpired';
import InitialSetupPage from '@/pages/barbearia/InitialSetupPage';

const AppRoutes = () => {
  return (
     <Routes>
        {/* Rota para a raiz que não renderiza nada, mantendo a landing page estática visível */}
        <Route path="/" element={null} />

        {/* A rota "/" agora é tratada pelo HTML estático. O React assume as rotas com hash. */}
        <Route path="/login" element={<Login />} />
        <Route path="/booking-success" element={<BookingSuccessPage />} />
        <Route path="/trial-expired" element={<TrialExpiredPage />} />

        {/* Initial Setup Route for Barbershops */}
        <Route path="/initial-setup" element={
          <ProtectedRoute allowedRoles={[UserRole.BARBEARIA]}>
            <InitialSetupPage />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <DashboardLayout title="Painel do Administrador" />
          </ProtectedRoute>
        }>
            <Route path="dashboard" element={<AdminPage />} />
            <Route path="barbershops" element={<AdminPage />} />
            <Route path="plans" element={<AdminPage />} />
            <Route path="expenses" element={<AdminPage />} /> {/* NOVA ROTA */}
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
            <Route path="clients" element={<BarbeariaPage />} />
            <Route path="settings" element={<BarbeariaPage />} />
            <Route path="settings/types" element={<BarbeariaPage />} /> 
            <Route path="settings/general" element={<BarbeariaPage />} /> 
            <Route path="profile" element={<BarbeariaPage />} />
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