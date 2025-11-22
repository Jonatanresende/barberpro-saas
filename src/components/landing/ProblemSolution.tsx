import React from 'react';
import { XCircle, CheckCircle2 } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

const ProblemSolution = () => {
  const problems = [
    "Agenda lotada no WhatsApp e clientes sem resposta.",
    "Fim do mês chega e você não sabe quanto lucrou de verdade.",
    "Clientes que somem e você não sabe o porquê.",
    "Horas perdidas respondendo mensagens em vez de estar na cadeira cortando."
  ];

  const solutions = [
    "Agenda online que seus clientes podem usar sozinhos, 24h por dia.",
    "Financeiro na palma da mão: veja seu faturamento diário, semanal e mensal.",
    "Ficha de cada cliente com histórico de cortes e preferências.",
    "Seu tempo de volta para focar na arte de barbear."
  ];

  return (
    <AnimatedSection className="py-20 bg-brand-gray">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white">Sua rotina parece com isso?</h2>
            <p className="text-lg text-gray-400 mt-2">Sabemos como é. Por isso, criamos a solução.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="bg-brand-dark p-8 rounded-lg border border-red-500/30">
            <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><XCircle className="text-red-500" /> O Caos Atual</h3>
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
            <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><CheckCircle2 className="text-green-500" /> A Solução Barbeiro na Hora</h3>
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