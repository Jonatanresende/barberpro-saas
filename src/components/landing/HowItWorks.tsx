import React from 'react';
import { UserPlus, CalendarPlus, BarChart3 } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

const steps = [
  {
    icon: <UserPlus className="w-12 h-12 text-brand-gold" />,
    title: "1. Cadastre-se",
    description: "Crie sua conta em menos de 2 minutos. É rápido, fácil e sem compromisso."
  },
  {
    icon: <CalendarPlus className="w-12 h-12 text-brand-gold" />,
    title: "2. Configure sua Barbearia",
    description: "Adicione seus serviços, barbeiros e horários de funcionamento. Nós te guiamos no processo."
  },
  {
    icon: <BarChart3 className="w-12 h-12 text-brand-gold" />,
    title: "3. Comece a Gerenciar",
    description: "Receba agendamentos, acompanhe suas finanças e veja sua produtividade decolar."
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