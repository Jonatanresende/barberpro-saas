import React from 'react';
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