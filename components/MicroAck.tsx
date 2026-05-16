'use client';

import { motion } from 'motion/react';
import type { FramePerception } from '@/lib/schema';

interface MicroAckProps {
  perception: FramePerception;
  index: number;
}

export function MicroAck({ perception, index }: MicroAckProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="flex gap-3 items-start"
    >
      <div className="shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center mt-0.5">
        <span className="text-xs font-mono text-accent">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground/90 leading-relaxed">
          {perception.one_line_mirror}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {perception.app_detected && perception.app_detected !== 'unknown' && (
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-alt text-foreground/50">
              {perception.app_detected}
            </span>
          )}
          {perception.timestamp_visible && perception.timestamp_visible !== 'not_visible' && (
            <span className="text-[11px] font-mono text-foreground/40">
              {perception.timestamp_visible}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
