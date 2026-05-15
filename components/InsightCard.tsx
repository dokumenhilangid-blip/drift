'use client';

import { motion } from 'framer-motion';

interface InsightCardProps {
  title: string;
  observation: string;
  tag: string;
  index: number;
}

const emotionColors: Record<string, string> = {
  joy: 'bg-emotion-joy/10 border-emotion-joy/30',
  calm: 'bg-emotion-calm/10 border-emotion-calm/30',
  reflection: 'bg-emotion-reflection/10 border-emotion-reflection/30',
  melancholy: 'bg-emotion-melancholy/10 border-emotion-melancholy/30',
  energy: 'bg-emotion-energy/10 border-emotion-energy/30',
  observation: 'bg-accent-subtle/30 border-accent-subtle/50',
};

const emotionTextColors: Record<string, string> = {
  joy: 'text-emotion-joy',
  calm: 'text-emotion-calm',
  reflection: 'text-emotion-reflection',
  melancholy: 'text-emotion-melancholy',
  energy: 'text-emotion-energy',
  observation: 'text-accent-secondary',
};

export default function InsightCard({
  title,
  observation,
  tag,
  index,
}: InsightCardProps) {
  const bgColor = emotionColors[tag] || emotionColors.observation;
  const textColor = emotionTextColors[tag] || emotionTextColors.observation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.3,
        ease: 'easeOut',
      }}
      className={`rounded-lg border p-6 ${bgColor}`}
    >
      <div className="space-y-2">
        <h3 className={`text-subheading font-semibold ${textColor}`}>
          {title}
        </h3>
        <p className="text-body text-foreground leading-relaxed">
          {observation}
        </p>
      </div>
    </motion.div>
  );
}
