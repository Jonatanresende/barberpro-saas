import React from 'react';
import { UserPlus, CalendarPlus, BarChart3 } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

const steps = [
  {
    icon: <UserPlus className="w-12 h-12 text-brand-gold" />,
    title: "1. Crie sua Conta",
    description: "Em 2 minutos, sem burocracia e sem pedir seu cartão de crédito. Acesso liberado na hora."
  },
  {
    icon: <CalendarPlus className="w-12 h-12 text-brand-gold" />,
    title: "2. Configure sua Barbearia",
    description: "Adicione seus serviços, barbeiros e horários. Nossa interface é tão fácil que você não vai precisar de manual."
  },
  {
    icon: <BarChart3 className="w-12 h-12 text-brand-gold" />,
    title: "3. Divulgue e Cresça",
    description: "Compartilhe seu link de agendamento exclusivo e veja sua agenda encher. É simples assim."
  }
];

const HowItWorks = () => {
  return (
    <AnimatedSection className="py-20 bg-brand-gray">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-12">Comece a usar em 3 passos simples</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="bg-brand-dark p-6 rounded-full border-2 border-brand-gray mb-6">
                {step.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-gray-400 max-w-xs">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

export default HowItWorks;