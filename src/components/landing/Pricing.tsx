import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { api } from '@/services/api';
import { Plano } from '@/types';

const planLinks: { [key: string]: string } = {
  'Básico': 'https://pay.kiwify.com.br/7LfyG5Z',
  'Profissional': 'https://pay.kiwify.com.br/ot4k2Am',
};

const Pricing = () => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlanos = async () => {
      try {
        const data = await api.getPlanos();
        // Filtrando para garantir que o plano 'trial' não seja exibido
        setPlanos(data.filter(p => p.ativo && p.nome.toLowerCase() !== 'trial'));
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
    <section id="pricing" className="py-20 bg-brand-dark">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Um Plano Para Cada Tamanho de Barbearia</h2>
        <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">Escolha o plano ideal e comece a transformar sua gestão hoje mesmo.</p>
        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {planos.map(plano => (
            <div key={plano.id} className={`bg-brand-gray p-8 rounded-lg border flex flex-col relative ${plano.popular ? 'border-2 border-brand-gold' : 'border-brand-gray/50'}`}>
              {plano.popular && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-gold text-brand-dark px-3 py-1 text-sm font-bold rounded-full">
                  Mais Escolhido
                </div>
              )}
              <h3 className="text-2xl font-bold text-brand-gold">{plano.nome}</h3>
              <p className="text-4xl font-extrabold my-4 text-white">R${plano.preco.toFixed(2)}<span className="text-base font-medium text-gray-400">/mês</span></p>
              <ul className="space-y-3 text-gray-300 text-left flex-grow mb-8">
                {plano.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a 
                href={planLinks[plano.nome] || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-auto bg-brand-gold text-brand-dark font-bold py-3 px-6 rounded-lg w-full hover:opacity-90 transition-opacity"
              >
                Contratar Agora
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;