import React from 'react';
import { useSettings } from '@/context/SettingsContext';

const FinalCTA = () => {
  const { settings } = useSettings();
  const supportEmail = settings?.support_email || 'contato@barbeironahora.com';

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const targetId = e.currentTarget.href.split('#')[1];
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="py-20 bg-brand-dark">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Sua Barbearia Merece uma Gestão Profissional</h2>
        <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">Deixe o caos do WhatsApp para trás. Junte-se aos barbeiros que estão usando a tecnologia para crescer.</p>
        <a
          href="#pricing"
          onClick={handleScroll}
          className="bg-brand-gold text-brand-dark font-bold py-4 px-10 rounded-lg text-xl hover:opacity-90 transition-opacity inline-block"
        >
          Contratar Agora
        </a>
        <div className="mt-6">
            <a href={`mailto:${supportEmail}`} className="text-gray-400 hover:text-brand-gold transition-colors">
                Dúvidas? Fale com um especialista
            </a>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;