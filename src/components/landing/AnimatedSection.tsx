import React from 'react';
import { motion } from 'framer-motion';

const AnimatedSection = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => {
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  );
};

export default AnimatedSection;