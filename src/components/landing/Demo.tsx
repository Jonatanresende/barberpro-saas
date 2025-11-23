import React from 'react';
import AnimatedSection from './AnimatedSection';
import dashboardImage from '../../assets/dashboard-showcase.png';

const Demo = () => {
  return (
    <AnimatedSection className="py-20 bg-brand-gray">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Veja como é Fácil Gerenciar Tudo</h2>
        <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">Uma interface limpa e intuitiva, projetada para a velocidade da sua rotina.</p>
        <div className="bg-brand-dark p-4 rounded-xl shadow-lg border border-brand-gray/50">
          <img 
            src={dashboardImage} 
            alt="Demonstração do Barbeiro na Hora" 
            className="rounded-lg w-full"
          />
        </div>
      </div>
    </AnimatedSection>
  );
};

export default Demo;