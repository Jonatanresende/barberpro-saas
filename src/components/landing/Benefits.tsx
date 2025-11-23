import React from 'react';
import { CalendarClock, Users, DollarSign, Smartphone } from 'lucide-react';

const benefits = [
  {
    icon: <CalendarClock className="w-10 h-10 text-brand-gold" />,
    title: "Agenda Inteligente",
    description: "Menos tempo no celular, zero conflitos de horário e clientes que não esquecem a hora marcada."
  },
  {
    icon: <Users className="w-10 h-10 text-brand-gold" />,
    title: "Fidelize Seus Clientes",
    description: "Saiba qual o corte preferido de cada um e quando foi a última visita. Ofereça um serviço personalizado."
  },
  {
    icon: <DollarSign className="w-10 h-10 text-brand-gold" />,
    title: "Financeiro Descomplicado",
    description: "Entenda de onde vem seu dinheiro. Acompanhe o faturamento por barbeiro, serviço e dia, sem planilhas."
  },
  {
    icon: <Smartphone className="w-10 h-10 text-brand-gold" />,
    title: "Sua Barbearia no Bolso",
    description: "Gerencie tudo pelo celular ou computador. Seus dados seguros e sempre à mão, onde você estiver."
  }
];

const Benefits = () => {
  return (
    <section className="py-20 bg-brand-dark">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Assuma o Controle e Acelere o Crescimento</h2>
        <p className="text-lg text-gray-400 mb-2 max-w-3xl mx-auto">O Barbeiro na Hora foi desenhado para simplificar sua rotina e profissionalizar sua gestão.</p>
        <p className="text-sm text-gray-500 mb-12 italic">Criado por especialistas para resolver os desafios reais do dia a dia de uma barbearia.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-brand-gray p-8 rounded-lg border border-brand-gray/50 text-left">
              <div className="mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
              <p className="text-gray-400">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;