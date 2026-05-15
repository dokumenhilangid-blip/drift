'use client';

import { motion } from 'framer-motion';

interface RecapCardProps {
  text: string;
}

export default function RecapCard({ text }: RecapCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.3 }}
      className="rounded-lg border border-border-subtle bg-surface-subtle p-6"
    >
      <p className="text-body text-foreground leading-relaxed">
        {text}
      </p>
    </motion.div>
  );
}
