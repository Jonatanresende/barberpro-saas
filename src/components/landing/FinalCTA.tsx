import React from 'react';
import AnimatedSection from './AnimatedSection';

interface FinalCTAProps {
  onStartTrial: () => void;
}

const FinalCTA = ({ onStartTrial }: FinalCTAProps) => {
  return (
    <AnimatedSection className="py-20 bg-brand-dark">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Pronto para modernizar sua barbearia?</h2>
        <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">Junte-se a centenas de barbearias que já estão otimizando sua gestão com o BarberPro.</p>
        <button
          onClick={onStartTrial}
          className="bg-brand-gold text-brand-dark font-bold py-4 px-10 rounded-lg text-xl hover:opacity-90 transition-opacity inline-block"
        >
          Comece seu teste agora
        </button>
      </div>
    </AnimatedSection>
  );
};

export default FinalCTA;