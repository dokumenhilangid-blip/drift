'use client';

import { motion } from 'framer-motion';

interface ChaosMeterProps {
  value: number;
}

export default function ChaosMeter({ value }: ChaosMeterProps) {
  const percent = Math.round(value * 100);
  
  // Determine color based on chaos level
  let color = 'text-emotion-calm';
  let bgColor = 'bg-emotion-calm/10';
  let barColor = 'bg-emotion-calm';
  
  if (value > 0.66) {
    color = 'text-emotion-energy';
    bgColor = 'bg-emotion-energy/10';
    barColor = 'bg-emotion-energy';
  } else if (value > 0.33) {
    color = 'text-accent-secondary';
    bgColor = 'bg-accent-secondary/10';
    barColor = 'bg-accent-secondary';
  }

  const chaosLabel = value > 0.66 ? 'High' : value > 0.33 ? 'Moderate' : 'Low';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className={`rounded-lg border border-border-subtle p-6 ${bgColor}`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-subheading font-semibold text-foreground">
            Chaos Meter
          </p>
          <p className={`text-heading font-bold ${color}`}>
            {percent}%
          </p>
        </div>
        
        {/* Gauge Bar */}
        <div className="h-3 w-full rounded-full bg-surface-subtle overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className={`h-full rounded-full ${barColor}`}
          />
        </div>

        {/* Label */}
        <p className="text-caption text-foreground opacity-70">
          Your digital environment feels <span className={`font-semibold ${color}`}>{chaosLabel}</span>
        </p>
      </div>
    </motion.div>
  );
}
