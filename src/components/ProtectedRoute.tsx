import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-brand-dark">
        <div className="text-brand-gold text-xl">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redireciona para a página de configuração se o nome da barbearia for temporário
  const isTemporaryName = user.role === UserRole.BARBEARIA && user.barbeariaNome?.startsWith('Barbearia de ');
  if (isTemporaryName && location.pathname !== '/initial-setup') {
    return <Navigate to="/initial-setup" replace />;
  }
  
  // Impede o acesso à página de setup se o nome já foi alterado
  if (!isTemporaryName && location.pathname === '/initial-setup') {
    return <Navigate to={`/${user.link_personalizado}/dashboard`} replace />;
  }

  const trialExpired =
    user.role === UserRole.BARBEARIA &&
    user.trialExpiresAt &&
    new Date(user.trialExpiresAt) < new Date();

  if (trialExpired) {
    return <Navigate to="/trial-expired" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to a relevant dashboard or an unauthorized page
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;