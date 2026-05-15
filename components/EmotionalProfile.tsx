'use client';

import { motion } from 'framer-motion';

interface EmotionalProfileProps {
  primaryEmotion: string;
  intensity: number;
  confidence: number;
}

const emotionEmojis: Record<string, string> = {
  joy: '✨',
  calm: '🌿',
  reflection: '🪞',
  melancholy: '🌙',
  energy: '⚡',
  anxiety: '🌊',
  boredom: '💭',
  frustration: '🔥',
  overwhelm: '🌪️',
  focus: '🎯',
};

const emotionColors: Record<string, string> = {
  joy: 'bg-emotion-joy/20 text-emotion-joy',
  calm: 'bg-emotion-calm/20 text-emotion-calm',
  reflection: 'bg-emotion-reflection/20 text-emotion-reflection',
  melancholy: 'bg-emotion-melancholy/20 text-emotion-melancholy',
  energy: 'bg-emotion-energy/20 text-emotion-energy',
  anxiety: 'bg-emotion-melancholy/20 text-emotion-melancholy',
  boredom: 'bg-emotion-reflection/20 text-emotion-reflection',
  frustration: 'bg-emotion-energy/20 text-emotion-energy',
  overwhelm: 'bg-emotion-melancholy/20 text-emotion-melancholy',
  focus: 'bg-emotion-calm/20 text-emotion-calm',
};

export default function EmotionalProfile({
  primaryEmotion,
  intensity,
  confidence,
}: EmotionalProfileProps) {
  const emoji = emotionEmojis[primaryEmotion.toLowerCase()] || '✨';
  const colorClass = emotionColors[primaryEmotion.toLowerCase()] || emotionColors.reflection;
  const intensityPercent = Math.round(intensity * 100);
  const confidencePercent = Math.round(confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Emotion Badge */}
      <div className={`inline-flex items-center gap-3 rounded-full px-4 py-2 ${colorClass}`}>
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className="text-caption font-semibold capitalize">
            {primaryEmotion}
          </p>
          <p className="text-caption opacity-75">
            {confidencePercent}% confidence
          </p>
        </div>
      </div>

      {/* Intensity Gauge */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-caption font-medium text-foreground opacity-70">
            Intensity
          </p>
          <p className="text-caption font-semibold text-accent-primary">
            {intensityPercent}%
          </p>
        </div>
        <div className="h-2 w-full rounded-full bg-surface-subtle overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${intensityPercent}%` }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="h-full bg-accent-primary rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}
