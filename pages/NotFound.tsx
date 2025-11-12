
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-6xl font-bold text-brand-gold mb-4">404</h1>
      <h2 className="text-3xl font-semibold text-white mb-2">Página Não Encontrada</h2>
      <p className="text-gray-400 mb-8">A página que você está procurando não existe ou foi movida.</p>
      <Link
        to="/login"
        className="px-6 py-3 bg-brand-gold text-brand-dark font-bold rounded-lg hover:bg-yellow-400 transition-colors"
      >
        Voltar para o Login
      </Link>
    </div>
  );
};

export default NotFound;
