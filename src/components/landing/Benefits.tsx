import React from 'react';
import { CalendarClock, Users, DollarSign, Smartphone } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

const benefits = [
  {
    icon: <CalendarClock className="w-10 h-10 text-brand-gold" />,
    title: "Agenda Simplificada",
    description: "Gerencie todos os agendamentos em um só lugar, evite conflitos e reduza faltas com lembretes automáticos."
  },
  {
    icon: <Users className="w-10 h-10 text-brand-gold" />,
    title: "Conheça Seus Clientes",
    description: "Mantenha um histórico completo de cada cliente, seus serviços preferidos e frequência de visitas."
  },
  {
    icon: <DollarSign className="w-10 h-10 text-brand-gold" />,
    title: "Controle Financeiro",
    description: "Acompanhe o faturamento, comissões e despesas de forma simples e visual, sem planilhas complicadas."
  },
  {
    icon: <Smartphone className="w-10 h-10 text-brand-gold" />,
    title: "Acesso de Onde Estiver",
    description: "Gerencie sua barbearia pelo celular, tablet ou computador. Seus dados seguros e sempre à mão."
  }
];

const Benefits = () => {
  return (
    <AnimatedSection className="py-20 bg-brand-dark">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Tudo que você precisa para crescer</h2>
        <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">Ferramentas poderosas para transformar a gestão da sua barbearia.</p>
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
    </AnimatedSection>
  );
};

export default Benefits;