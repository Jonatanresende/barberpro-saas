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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Sua Satisfação ou seu Dinheiro de Volta</h2>
          <p className="text-lg text-gray-300 mb-8">
            Teste o BarberPro por 7 dias, sem riscos. Explore todas as funcionalidades e veja na prática como podemos transformar sua gestão. Não pedimos cartão de crédito. Cancele a qualquer momento.
          </p>
          <Link 
            to="/login" 
            className="bg-brand-gold text-brand-dark font-bold py-3 px-8 rounded-lg text-lg hover:opacity-90 transition-opacity inline-block"
          >
            Começar meu Teste Gratuito
          </Link>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default Guarantee;