import React from 'react';
import AnimatedSection from './AnimatedSection';

const testimonials = [
  {
    quote: "A gestão da minha barbearia mudou completamente. A agenda online é fantástica e meus clientes adoram a facilidade de marcar um horário.",
    name: "Dono de Barbearia",
    title: "Parceiro Barbeiro na Hora",
    avatar: "https://placehold.co/100x100/D4AF37/111111?text=B"
  },
  {
    quote: "Finalmente tenho controle total sobre o faturamento e as comissões. A parte financeira ficou muito mais simples e transparente.",
    name: "Gerente de Salão",
    title: "Parceiro Barbeiro na Hora",
    avatar: "https://placehold.co/100x100/D4AF37/111111?text=N"
  },
  {
    quote: "O sistema é super fácil de usar. Em um dia já estava com tudo configurado e recebendo agendamentos pelo link.",
    name: "Barbeiro Profissional",
    title: "Parceiro Barbeiro na Hora",
    avatar: "https://placehold.co/100x100/D4AF37/111111?text=H"
  }
];

const Testimonials = () => {
  return (
    <AnimatedSection className="py-20 bg-brand-gray">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-12">O que os Barbeiros Dizem</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-brand-dark p-8 rounded-lg border border-brand-gray/50">
              <p className="text-gray-300 italic mb-6">"{testimonial.quote}"</p>
              <div className="flex items-center justify-center">
                <img src={testimonial.avatar} alt={testimonial.name} className="w-14 h-14 rounded-full mr-4" />
                <div>
                  <p className="font-bold text-white">{testimonial.name}</p>
                  <p className="text-sm text-brand-gold">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

export default Testimonials;