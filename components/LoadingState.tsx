'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const LOADING_MESSAGES = [
  'reading your patterns...',
  'sensing the mood...',
  'finding the reflection...',
  'understanding the moment...',
];

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [charIndex, setCharIndex] = useState(0);

  const currentMessage = LOADING_MESSAGES[messageIndex];

  // Cycle through messages
  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      setCharIndex(0);
      setDisplayedText('');
    }, 2500);

    return () => clearInterval(messageTimer);
  }, []);

  // Stream text character by character
  useEffect(() => {
    if (charIndex < currentMessage.length) {
      const charTimer = setTimeout(() => {
        setDisplayedText((prev) => prev + currentMessage[charIndex]);
        setCharIndex((prev) => prev + 1);
      }, 60);

      return () => clearTimeout(charTimer);
    }
  }, [charIndex, currentMessage]);

  return (
    <div className="space-y-8">
      {/* Skeleton Cards */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="rounded-lg bg-surface-subtle p-6"
          >
            <div className="space-y-3">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-3/4 rounded" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Streaming Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex justify-center"
      >
        <p className="text-caption text-accent-secondary italic font-light">
          {displayedText}
          <span className="animate-pulse">_</span>
        </p>
      </motion.div>
    </div>
  );
}
