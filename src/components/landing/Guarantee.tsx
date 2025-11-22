import React from 'react';
import { ShieldCheck } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

const Guarantee = () => {
  return (
    <AnimatedSection className="py-20 bg-brand-dark">
      <div className="container mx-auto px-6">
        <div className="bg-brand-gray border border-brand-gold/30 rounded-lg p-10 text-center max-w-4xl mx-auto">
          <ShieldCheck className="w-16 h-16 text-brand-gold mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">A Escolha Certa para o Futuro da Sua Barbearia</h2>
          <p className="text-lg text-gray-300 mb-8">
            Invista na ferramenta que vai organizar sua rotina, fidelizar seus clientes e aumentar seu faturamento. Uma decisão inteligente e sem burocracia.
          </p>
          <a 
            href="/#pricing" 
            className="bg-brand-gold text-brand-dark font-bold py-3 px-8 rounded-lg text-lg hover:opacity-90 transition-opacity inline-block"
          >
            Ver Planos e Contratar
          </a>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default Guarantee;