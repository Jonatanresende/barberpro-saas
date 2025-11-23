import React from 'react';
// Removido framer-motion para simplificar
// A imagem agora é servida diretamente da pasta /public
// import dashboardImage from '@/assets/dashboard-showcase.png';

const Hero = () => {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const targetId = e.currentTarget.href.split('#')[1];
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative bg-brand-dark py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="container mx-auto px-6 text-center relative z-10">
        <h1 
          className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4"
        >
          Chega de Gerenciar sua Barbearia no <span className="text-brand-gold">Papel e WhatsApp</span>
        </h1>
        <p 
          className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8"
        >
          O Barbeiro na Hora organiza seus agendamentos, clientes e finanças para você focar no que realmente importa: seus clientes.
        </p>
        <div>
          <a
            href="#pricing"
            onClick={handleScroll}
            className="bg-brand-gold text-brand-dark font-bold py-4 px-8 rounded-lg text-lg hover:opacity-90 transition-opacity inline-block"
          >
            Ver Planos e Contratar
          </a>
        </div>
        <div className="mt-16">
          <div className="relative flex flex-col items-center">
            <img 
              src="/dashboard-showcase.png" 
              alt="Dashboard do Barbeiro na Hora" 
              className="rounded-xl shadow-2xl shadow-brand-gold/10 w-full max-w-6xl h-auto object-contain"
            />
            <p className="text-gray-400 text-sm mt-4 text-center">Dashboard do Barbeiro na Hora</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;