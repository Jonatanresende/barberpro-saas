import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, logout, loading } = useAuth();
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

  // Bloqueio quando o estabelecimento está inativo (dono e profissional)
  const isEstabelecimentoInativo =
    (user.role === UserRole.ESTABELECIMENTO || user.role === UserRole.PROFISSIONAL) &&
    user.estabelecimentoStatus === 'inativa';

  if (isEstabelecimentoInativo) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-brand-gray/30 p-8 rounded-lg border border-red-500/30 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Acesso Suspenso</h2>
          <p className="text-brand-light/80 mb-6">
            O acesso a este estabelecimento foi temporariamente desativado. Entre em contato com o suporte para mais informações.
          </p>
          <button
            onClick={() => logout()}
            className="w-full bg-brand-gold text-brand-dark font-semibold py-2 px-4 rounded hover:bg-yellow-400 transition"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  // Redireciona para a página de configuração se o nome do estabelecimento for temporário
  const isTemporaryName = user.role === UserRole.ESTABELECIMENTO && (
    user.estabelecimentoNome?.startsWith('Estabelecimento de ') ||
    user.estabelecimentoNome?.startsWith('Barbearia de ')
  );
  if (isTemporaryName && location.pathname !== '/initial-setup') {
    return <Navigate to="/initial-setup" replace />;
  }
  
  // Impede o acesso à página de setup se o nome já foi alterado
  if (!isTemporaryName && location.pathname === '/initial-setup') {
    return <Navigate to={`/${user.link_personalizado}/dashboard`} replace />;
  }

  const trialExpired =
    user.role === UserRole.ESTABELECIMENTO &&
    user.trialExpiresAt &&
    new Date(user.trialExpiresAt) < new Date();

  if (trialExpired) {
    return <Navigate to="/trial-expired" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
