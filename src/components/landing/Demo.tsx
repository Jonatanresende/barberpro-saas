import React from 'react';
import AnimatedSection from './AnimatedSection';

const Demo = () => {
  return (
    <AnimatedSection className="py-20 bg-brand-gray">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Veja o BarberPro em Ação</h2>
        <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">Uma interface intuitiva projetada para a rotina da sua barbearia.</p>
        <div className="bg-brand-dark p-4 rounded-xl shadow-lg border border-brand-gray/50">
          <img 
            src="https://placehold.co/1200x700/111111/D4AF37?text=Demonstração+do+Produto" 
            alt="Demonstração do BarberPro" 
            className="rounded-lg w-full"
          />
        </div>
      </div>
    </AnimatedSection>
  );
};

export default Demo;