import React from 'react';
import logo from '../../assets/logo-Barbeironahora.png';

const Footer = () => {
  return (
    <footer className="bg-brand-gray border-t border-brand-gray/50">
      <div className="container mx-auto px-6 py-8 text-center text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src={logo} alt="Logo Barbeiro na Hora" className="h-12" />
        </div>
        <p>&copy; {new Date().getFullYear()} Barbeiro na Hora. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;