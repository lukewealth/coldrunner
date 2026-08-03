import React from 'react';
import { motion } from 'motion/react';

interface StaggerListProps {
  children: React.ReactNode;
  className?: string;
}

export const StaggerList: React.FC<StaggerListProps> = ({ children, className = '' }) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 40,
        },
      },
    }}
  >
    {children}
  </motion.div>
);

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 12 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
    }}
  >
    {children}
  </motion.div>
);
