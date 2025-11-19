import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Plano } from '@/types';
import AnimatedSection from './AnimatedSection';

const Pricing = () => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlanos = async () => {
      try {
        const data = await api.getPlanos();
        setPlanos(data.filter(p => p.ativo));
      } catch (error) {
        console.error("Failed to fetch plans:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlanos();
  }, []);

  if (loading) {
    return <div className="text-center py-20">Carregando planos...</div>;
  }

  return (
    <AnimatedSection className="py-20 bg-brand-dark">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Planos que cabem no seu bolso</h2>
        <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">Escolha o plano ideal para o tamanho da sua barbearia e comece a crescer.</p>
        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {planos.map(plano => (
            <div key={plano.id} className={`bg-brand-gray p-8 rounded-lg border flex flex-col ${plano.popular ? 'border-2 border-brand-gold' : 'border-brand-gray/50'}`}>
              <h3 className="text-2xl font-bold text-brand-gold">{plano.nome}</h3>
              <p className="text-4xl font-extrabold my-4 text-white">R${plano.preco.toFixed(2)}<span className="text-base font-medium text-gray-400">/mês</span></p>
              <ul className="space-y-3 text-gray-300 text-left flex-grow mb-8">
                {plano.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/login" className="mt-auto bg-brand-gold text-brand-dark font-bold py-3 px-6 rounded-lg w-full hover:opacity-90 transition-opacity">
                Iniciar Teste Grátis
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

export default Pricing;