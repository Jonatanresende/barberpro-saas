import React from 'react';
import { Scissors } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-brand-gray border-t border-brand-gray/50">
      <div className="container mx-auto px-6 py-8 text-center text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Scissors className="w-6 h-6 text-brand-gold" />
          <span className="text-xl font-bold text-white">BarberPro</span>
        </div>
        <p>&copy; {new Date().getFullYear()} BarberPro. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;