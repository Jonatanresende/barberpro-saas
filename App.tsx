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

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
     <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/:slug" element={<PublicBookingPage />} />
        <Route path="/" element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <Navigate to="/login" />} />

        {/* Admin Routes */}
        {/* FIX: Pass children as an explicit prop to work around a TypeScript error where it was not being detected. */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]} children={
            <DashboardLayout title="Painel do Administrador" />
          } />
        }>
            <Route path="dashboard" element={<AdminPage />} />
            <Route path="barbershops" element={<AdminPage />} />
            <Route path="plans" element={<AdminPage />} />
            <Route path="settings" element={<AdminPage />} />
            <Route index element={<Navigate to="dashboard" />} />
        </Route>

        {/* Barbearia Routes */}
        {/* FIX: Pass children as an explicit prop to work around a TypeScript error where it was not being detected. */}
        <Route path="/barbearia" element={
           <ProtectedRoute allowedRoles={[UserRole.BARBEARIA]} children={
            <DashboardLayout title="Painel da Barbearia" />
          } />
        }>
            <Route path="dashboard" element={<BarbeariaPage />} />
            <Route path="barbers" element={<BarbeariaPage />} />
            <Route path="services" element={<BarbeariaPage />} />
            <Route path="appointments" element={<BarbeariaPage />} />
            <Route path="settings" element={<BarbeariaPage />} />
            <Route index element={<Navigate to="dashboard" />} />
        </Route>

        {/* Barbeiro Routes */}
        {/* FIX: Pass children as an explicit prop to work around a TypeScript error where it was not being detected. */}
        <Route path="/barbeiro" element={
            <ProtectedRoute allowedRoles={[UserRole.BARBEIRO]} children={
                <DashboardLayout title="Painel do Barbeiro" />
            } />
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
    // FIX: Pass children as an explicit prop to work around a TypeScript error where it was not being detected.
    <AuthProvider
      children={
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      }
    />
  );
};

export default App;