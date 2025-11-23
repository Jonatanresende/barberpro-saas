import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/context/SettingsContext';
import defaultLogo from '@/assets/logo-Barbeironahora.png';
import dashboardShowcase from '@/assets/dashboard-showcase.png';
import { Check, XCircle, CheckCircle2, CalendarClock, Users, DollarSign, Smartphone, UserPlus, CalendarPlus, BarChart3, ShieldCheck } from 'lucide-react';
import { api } from '@/services/api';
import { Plano } from '@/types';

// --- Sub-componentes da Landing Page ---

const Header = () => {
  const { settings } = useSettings();
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const targetId = e.currentTarget.href.split('#')[1];
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <header className="bg-brand-dark/80 backdrop-blur-sm sticky top-0 z-50 border-b border-brand-gray/50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <img src={settings?.logo_url || defaultLogo} alt="Logo Barbeiro na Hora" className="h-10" />
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-300 hover:text-brand-gold transition-colors font-medium">Login</Link>
          <a href="#pricing" onClick={handleScroll} className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">Assinar Agora</a>
        </div>
      </div>
    </header>
  );
};

const Hero = () => {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const targetId = e.currentTarget.href.split('#')[1];
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <section className="relative bg-brand-dark py-20 md:py-32 overflow-hidden">
      <div className="container mx-auto px-6 text-center relative z-10">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
          Chega de Gerenciar sua Barbearia no <span className="text-brand-gold">Papel e WhatsApp</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          O Barbeiro na Hora organiza seus agendamentos, clientes e finanças para você focar no que realmente importa: seus clientes.
        </p>
        <div>
          <a href="#pricing" onClick={handleScroll} className="bg-brand-gold text-brand-dark font-bold py-4 px-8 rounded-lg text-lg hover:opacity-90 transition-opacity inline-block">
            Ver Planos e Contratar
          </a>
        </div>
        <div className="mt-16">
          <img src={dashboardShowcase} alt="Dashboard do Barbeiro na Hora" className="rounded-xl shadow-2xl shadow-brand-gold/10 w-full max-w-6xl h-auto object-contain" />
          <p className="text-gray-400 text-sm mt-4 text-center">Dashboard do Barbeiro na Hora</p>
        </div>
      </div>
    </section>
  );
};

const ProblemSolution = () => {
  const problems = ["Agenda lotada no WhatsApp e clientes sem resposta.", "Fim do mês chega e você não sabe quanto lucrou de verdade.", "Clientes que somem e você não sabe o porquê.", "Horas perdidas respondendo mensagens em vez de estar na cadeira cortando."];
  const solutions = ["Agenda online que seus clientes podem usar sozinhos, 24h por dia.", "Financeiro na palma da mão: veja seu faturamento diário, semanal e mensal.", "Ficha de cada cliente com histórico de cortes e preferências.", "Seu tempo de volta para focar na arte de barbear."];
  return (
    <section className="py-20 bg-brand-gray">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white">Sua rotina parece com isso?</h2>
          <p className="text-lg text-gray-400 mt-2">Sabemos como é. Por isso, criamos a solução.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="bg-brand-dark p-8 rounded-lg border border-red-500/30">
            <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><XCircle className="text-red-500" /> O Caos Atual</h3>
            <ul className="space-y-4">{problems.map((item, index) => <li key={index} className="flex items-start gap-3 text-gray-300"><span className="text-red-500 mt-1">&#10006;</span><span>{item}</span></li>)}</ul>
          </div>
          <div className="bg-brand-dark p-8 rounded-lg border border-green-500/30">
            <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><CheckCircle2 className="text-green-500" /> A Solução Barbeiro na Hora</h3>
            <ul className="space-y-4">{solutions.map((item, index) => <li key={index} className="flex items-start gap-3 text-gray-300"><span className="text-green-500 mt-1">&#10004;</span><span>{item}</span></li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const Benefits = () => {
  const benefits = [{ icon: <CalendarClock className="w-10 h-10 text-brand-gold" />, title: "Agenda Inteligente", description: "Menos tempo no celular, zero conflitos de horário e clientes que não esquecem a hora marcada." }, { icon: <Users className="w-10 h-10 text-brand-gold" />, title: "Fidelize Seus Clientes", description: "Saiba qual o corte preferido de cada um e quando foi a última visita. Ofereça um serviço personalizado." }, { icon: <DollarSign className="w-10 h-10 text-brand-gold" />, title: "Financeiro Descomplicado", description: "Entenda de onde vem seu dinheiro. Acompanhe o faturamento por barbeiro, serviço e dia, sem planilhas." }, { icon: <Smartphone className="w-10 h-10 text-brand-gold" />, title: "Sua Barbearia no Bolso", description: "Gerencie tudo pelo celular ou computador. Seus dados seguros e sempre à mão, onde você estiver." }];
  return (
    <section className="py-20 bg-brand-dark">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Assuma o Controle e Acelere o Crescimento</h2>
        <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">O Barbeiro na Hora foi desenhado para simplificar sua rotina e profissionalizar sua gestão.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">{benefits.map((benefit, index) => <div key={index} className="bg-brand-gray p-8 rounded-lg border border-brand-gray/50 text-left"><div className="mb-4">{benefit.icon}</div><h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3><p className="text-gray-400">{benefit.description}</p></div>)}</div>
      </div>
    </section>
  );
};

const Demo = () => (
  <section className="py-20 bg-brand-gray">
    <div className="container mx-auto px-6 text-center">
      <h2 className="text-4xl font-bold text-white mb-4">Veja como é Fácil Gerenciar Tudo</h2>
      <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">Uma interface limpa e intuitiva, projetada para a velocidade da sua rotina.</p>
      <div className="bg-brand-dark p-4 rounded-xl shadow-lg border border-brand-gray/50">
        <img src={dashboardShowcase} alt="Demonstração do Barbeiro na Hora" className="rounded-lg w-full" />
      </div>
    </div>
  </section>
);

const Pricing = () => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const planLinks: { [key: string]: string } = { 'Básico': 'https://pay.kiwify.com.br/7LfyG5Z', 'Profissional': 'https://pay.kiwify.com.br/ot4k2Am' };
  useEffect(() => {
    api.getPlanos().then(data => setPlanos(data.filter(p => p.ativo && p.nome.toLowerCase() !== 'trial'))).catch(err => console.error(err)).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="text-center py-20">Carregando planos...</div>;
  return (
    <section id="pricing" className="py-20 bg-brand-dark">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Um Plano Para Cada Tamanho de Barbearia</h2>
        <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">Escolha o plano ideal e comece a transformar sua gestão hoje mesmo.</p>
        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">{planos.map(plano => <div key={plano.id} className={`bg-brand-gray p-8 rounded-lg border flex flex-col relative ${plano.popular ? 'border-2 border-brand-gold' : 'border-brand-gray/50'}`}>{plano.popular && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-gold text-brand-dark px-3 py-1 text-sm font-bold rounded-full">Mais Escolhido</div>}<h3 className="text-2xl font-bold text-brand-gold">{plano.nome}</h3><p className="text-4xl font-extrabold my-4 text-white">R${plano.preco.toFixed(2)}<span className="text-base font-medium text-gray-400">/mês</span></p><ul className="space-y-3 text-gray-300 text-left flex-grow mb-8">{plano.features.map((feature, index) => <li key={index} className="flex items-start gap-3"><Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" /><span>{feature}</span></li>)}</ul><a href={planLinks[plano.nome] || '#'} target="_blank" rel="noopener noreferrer" className="mt-auto bg-brand-gold text-brand-dark font-bold py-3 px-6 rounded-lg w-full hover:opacity-90 transition-opacity">Contratar Agora</a></div>)}</div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [{ icon: <UserPlus className="w-12 h-12 text-brand-gold" />, title: "1. Crie sua Conta", description: "Em 2 minutos, sem burocracia e sem pedir seu cartão de crédito. Acesso liberado na hora." }, { icon: <CalendarPlus className="w-12 h-12 text-brand-gold" />, title: "2. Configure sua Barbearia", description: "Adicione seus serviços, barbeiros e horários. Nossa interface é tão fácil que você não vai precisar de manual." }, { icon: <BarChart3 className="w-12 h-12 text-brand-gold" />, title: "3. Divulgue e Cresça", description: "Compartilhe seu link de agendamento exclusivo e veja sua agenda encher. É simples assim." }];
  return (
    <section className="py-20 bg-brand-gray">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-12">Comece a usar em 3 passos simples</h2>
        <div className="grid md:grid-cols-3 gap-10">{steps.map((step, index) => <div key={index} className="flex flex-col items-center"><div className="bg-brand-dark p-6 rounded-full border-2 border-brand-gray mb-6">{step.icon}</div><h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3><p className="text-gray-400 max-w-xs">{step.description}</p></div>)}</div>
      </div>
    </section>
  );
};

const Guarantee = () => {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const targetId = e.currentTarget.href.split('#')[1];
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <section className="py-20 bg-brand-dark">
      <div className="container mx-auto px-6">
        <div className="bg-brand-gray border border-brand-gold/30 rounded-lg p-10 text-center max-w-4xl mx-auto">
          <ShieldCheck className="w-16 h-16 text-brand-gold mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">A Escolha Certa para o Futuro da Sua Barbearia</h2>
          <p className="text-lg text-gray-300 mb-8">Invista na ferramenta que vai organizar sua rotina, fidelizar seus clientes e aumentar seu faturamento.</p>
          <a href="#pricing" onClick={handleScroll} className="bg-brand-gold text-brand-dark font-bold py-3 px-8 rounded-lg text-lg hover:opacity-90 transition-opacity inline-block">Ver Planos e Contratar</a>
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => {
  const testimonials = [{ quote: "A gestão da minha barbearia mudou completamente. A agenda online é fantástica e meus clientes adoram a facilidade.", name: "Dono de Barbearia", title: "Parceiro Barbeiro na Hora", avatar: "https://placehold.co/100x100/D4AF37/111111?text=B" }, { quote: "Finalmente tenho controle total sobre o faturamento e as comissões. A parte financeira ficou muito mais simples.", name: "Gerente de Salão", title: "Parceiro Barbeiro na Hora", avatar: "https://placehold.co/100x100/D4AF37/111111?text=N" }, { quote: "O sistema é super fácil de usar. Em um dia já estava com tudo configurado e recebendo agendamentos pelo link.", name: "Barbeiro Profissional", title: "Parceiro Barbeiro na Hora", avatar: "https://placehold.co/100x100/D4AF37/111111?text=H" }];
  return (
    <section className="py-20 bg-brand-gray">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-12">O que os Barbeiros Dizem</h2>
        <div className="grid md:grid-cols-3 gap-8">{testimonials.map((testimonial, index) => <div key={index} className="bg-brand-dark p-8 rounded-lg border border-brand-gray/50"><p className="text-gray-300 italic mb-6">"{testimonial.quote}"</p><div className="flex items-center justify-center"><img src={testimonial.avatar} alt={testimonial.name} className="w-14 h-14 rounded-full mr-4" /><div className="text-left"><p className="font-bold text-white">{testimonial.name}</p><p className="text-sm text-brand-gold">{testimonial.title}</p></div></div></div>)}</div>
      </div>
    </section>
  );
};

const FinalCTA = () => {
  const { settings } = useSettings();
  const supportEmail = settings?.support_email || 'contato@barbeironahora.com';
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const targetId = e.currentTarget.href.split('#')[1];
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <section className="py-20 bg-brand-dark">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Sua Barbearia Merece uma Gestão Profissional</h2>
        <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">Deixe o caos do WhatsApp para trás. Junte-se aos barbeiros que estão usando a tecnologia para crescer.</p>
        <a href="#pricing" onClick={handleScroll} className="bg-brand-gold text-brand-dark font-bold py-4 px-10 rounded-lg text-xl hover:opacity-90 transition-opacity inline-block">Contratar Agora</a>
        <div className="mt-6"><a href={`mailto:${supportEmail}`} className="text-gray-400 hover:text-brand-gold transition-colors">Dúvidas? Fale com um especialista</a></div>
      </div>
    </section>
  );
};

const Footer = () => {
  const { settings } = useSettings();
  return (
    <footer className="bg-brand-gray border-t border-brand-gray/50">
      <div className="container mx-auto px-6 py-8 text-center text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src={settings?.logo_url || defaultLogo} alt="Logo Barbeiro na Hora" className="h-12" />
        </div>
        <p>&copy; {new Date().getFullYear()} Barbeiro na Hora. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

// --- Componente Principal da Landing Page ---

const LandingPage = () => {
  return (
    <div className="bg-brand-dark text-brand-light font-sans antialiased">
      <Header />
      <main>
        <Hero />
        <ProblemSolution />
        <Benefits />
        <Demo />
        <Pricing />
        <HowItWorks />
        <Guarantee />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;