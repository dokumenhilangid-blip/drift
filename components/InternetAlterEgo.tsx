'use client';

import { motion } from 'framer-motion';

interface InternetAlterEgoProps {
  text: string;
}

export default function InternetAlterEgo({ text }: InternetAlterEgoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="rounded-lg border border-accent-subtle bg-accent-subtle/30 p-6"
    >
      <p className="text-center text-body italic text-accent-secondary leading-relaxed">
        "{text}"
      </p>
    </motion.div>
  );
}
