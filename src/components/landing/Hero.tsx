import React from 'react';
import { motion } from 'framer-motion';

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
        <motion.h1 
          className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Chega de Gerenciar sua Barbearia no <span className="text-brand-gold">Papel e WhatsApp</span>
        </motion.h1>
        <motion.p 
          className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          O Barbeiro na Hora organiza seus agendamentos, clientes e finanças para você focar no que realmente importa: seus clientes.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <motion.a
            href="#pricing"
            onClick={handleScroll}
            whileTap={{ scale: 0.97 }}
            className="bg-brand-gold text-brand-dark font-bold py-4 px-8 rounded-lg text-lg hover:opacity-90 transition-opacity inline-block"
          >
            Ver Planos e Contratar
          </motion.a>
        </motion.div>
        <motion.div 
          className="mt-16"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.6, ease: 'easeOut' }}
        >
          <img 
            src="https://placehold.co/1200x600/111111/D4AF37?text=Veja+a+Sua+Agenda+Organizada" 
            alt="Dashboard do Barbeiro na Hora" 
            className="rounded-xl shadow-2xl shadow-brand-gold/10 mx-auto"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;