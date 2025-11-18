import React from 'react';
import { XCircle, CheckCircle2 } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

const ProblemSolution = () => {
  const problems = [
    "Agendamentos confusos em papel ou WhatsApp.",
    "Dificuldade para acompanhar o faturamento.",
    "Falta de dados sobre clientes e serviços mais populares.",
    "Perda de tempo com tarefas administrativas repetitivas."
  ];

  const solutions = [
    "Agenda online inteligente e organizada por barbeiro.",
    "Relatórios financeiros claros e automáticos.",
    "Cadastro de clientes e histórico de serviços.",
    "Automação que libera seu tempo para o que importa: cortar."
  ];

  return (
    <AnimatedSection className="py-20 bg-brand-gray">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-brand-dark p-8 rounded-lg border border-red-500/30">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><XCircle className="text-red-500" /> O Problema</h2>
            <ul className="space-y-4">
              {problems.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-300">
                  <span className="text-red-500 mt-1">&#10006;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-brand-dark p-8 rounded-lg border border-green-500/30">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><CheckCircle2 className="text-green-500" /> A Solução BarberPro</h2>
            <ul className="space-y-4">
              {solutions.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-300">
                  <span className="text-green-500 mt-1">&#10004;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default ProblemSolution;