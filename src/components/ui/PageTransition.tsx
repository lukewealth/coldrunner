import React from 'react';
import { motion } from 'motion/react';

interface PageTransitionProps {
  children: React.ReactNode;
  tabKey: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, tabKey }) => (
  <motion.div
    key={tabKey}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
  >
    {children}
  </motion.div>
);
