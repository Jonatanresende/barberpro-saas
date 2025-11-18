import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-brand-dark/80 backdrop-blur-sm sticky top-0 z-50 border-b border-brand-gray/50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Scissors className="w-6 h-6 text-brand-gold" />
          <span className="text-xl font-bold text-white">BarberPro</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-300 hover:text-brand-gold transition-colors font-medium">
            Login
          </Link>
          <Link to="/login" className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
            Teste Grátis
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;