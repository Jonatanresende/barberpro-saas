
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ScissorsIcon } from '../components/icons';

const roleRedirects: Record<UserRole, string> = {
  [UserRole.ADMIN]: '/admin/dashboard',
  [UserRole.BARBEARIA]: '/barbearia/dashboard',
  [UserRole.BARBEIRO]: '/barbeiro/dashboard',
  [UserRole.CLIENTE]: '/',
};

const Login = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(roleRedirects[user.role]);
    }
  }, [user, navigate]);

  const handleLogin = (role: UserRole) => {
    login(role);
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-gray rounded-xl shadow-lg p-8 border border-gray-700">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-brand-dark rounded-full mb-4">
            <ScissorsIcon className="h-10 w-10 text-brand-gold" />
          </div>
          <h1 className="text-3xl font-bold text-white">BarberPro SaaS</h1>
          <p className="text-gray-400 mt-2">Selecione seu perfil para entrar</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => handleLogin(UserRole.ADMIN)}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar como Administrador'}
          </button>
          <button
            onClick={() => handleLogin(UserRole.BARBEARIA)}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar como Dono de Barbearia'}
          </button>
          <button
            onClick={() => handleLogin(UserRole.BARBEIRO)}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar como Barbeiro'}
          </button>
        </div>
        <p className="text-center text-gray-500 text-xs mt-8">
            Este é um painel de simulação. Clique em um perfil para acessar o dashboard correspondente.
        </p>
      </div>
    </div>
  );
};

export default Login;
