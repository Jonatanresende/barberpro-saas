import React from 'react';
import { ShieldCheck } from 'lucide-react';
import AnimatedSection from './AnimatedSection';
import { Link } from 'react-router-dom';

const Guarantee = () => {
  return (
    <AnimatedSection className="py-20 bg-brand-dark">
      <div className="container mx-auto px-6">
        <div className="bg-brand-gray border border-brand-gold/30 rounded-lg p-10 text-center max-w-4xl mx-auto">
          <ShieldCheck className="w-16 h-16 text-brand-gold mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Experimente o Futuro da Sua Barbearia, Sem Riscos</h2>
          <p className="text-lg text-gray-300 mb-8">
            Teste o Barbeiro na Hora por 7 dias e veja a transformação na sua rotina. Acesso total a todas as ferramentas, sem pedir seu cartão de crédito. Não gostou? Não precisa fazer nada. Simples, transparente e sem pegadinhas.
          </p>
          <Link 
            to="/login" 
            className="bg-brand-gold text-brand-dark font-bold py-3 px-8 rounded-lg text-lg hover:opacity-90 transition-opacity inline-block"
          >
            Quero Meu Teste Gratuito de 7 Dias
          </Link>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default Guarantee;