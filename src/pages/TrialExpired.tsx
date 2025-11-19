import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const TrialExpiredPage = () => {
  const { user, logout } = useAuth();
  const trialEndedAt = user?.trialExpiresAt
    ? new Date(user.trialExpiresAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-brand-gray rounded-2xl border border-brand-gold/30 p-8 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-brand-gold">Período de teste encerrado</h1>
        <p className="text-gray-200">
          {trialEndedAt
            ? `Seu acesso gratuito terminou em ${trialEndedAt}.`
            : 'Seu acesso gratuito terminou.'}{' '}
          Para continuar usando o BarberPro, assine um plano completo.
        </p>
        <div className="space-y-3">
          <Link
            to="/#pricing"
            className="block w-full py-3 rounded-lg bg-brand-gold text-brand-dark font-bold hover:bg-yellow-400 transition"
          >
            Ver planos disponíveis
          </Link>
          <button
            onClick={logout}
            className="w-full py-3 rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-700 transition"
          >
            Sair da conta
          </button>
        </div>
        <p className="text-sm text-gray-400">
          Precisa de ajuda? Fale conosco em{' '}
          <a href="mailto:contato@barberpro.app" className="text-brand-gold underline">
            contato@barberpro.app
          </a>
        </p>
      </div>
    </div>
  );
};

export default TrialExpiredPage;

