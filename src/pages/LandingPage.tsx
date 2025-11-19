import React, { useState, useCallback } from 'react';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import ProblemSolution from '../components/landing/ProblemSolution';
import Benefits from '../components/landing/Benefits';
import Demo from '../components/landing/Demo';
import Pricing from '../components/landing/Pricing';
import HowItWorks from '../components/landing/HowItWorks';
import Guarantee from '../components/landing/Guarantee';
import Testimonials from '../components/landing/Testimonials';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/landing/Footer';
import FreeTrialModal from '@/components/landing/FreeTrialModal';

const LandingPage = () => {
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);

  const openTrialModal = useCallback(() => setIsTrialModalOpen(true), []);
  const closeTrialModal = useCallback(() => setIsTrialModalOpen(false), []);

  return (
    <div className="bg-brand-dark text-brand-light font-sans antialiased">
      <Header onStartTrial={openTrialModal} />
      <main>
        <Hero onStartTrial={openTrialModal} />
        <ProblemSolution />
        <Benefits />
        <Demo />
        <Pricing />
        <HowItWorks />
        <Guarantee />
        <Testimonials />
        <FinalCTA onStartTrial={openTrialModal} />
      </main>
      <Footer />
      <FreeTrialModal isOpen={isTrialModalOpen} onClose={closeTrialModal} />
    </div>
  );
};

export default LandingPage;