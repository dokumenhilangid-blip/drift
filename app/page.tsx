'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CaptureStream } from '@/components/CaptureStream';
import { getSession, clearSession } from '@/lib/session';

type Phase = 'onboarding' | 'capture' | 'mirror';

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>('onboarding');

  const handleStart = useCallback(() => {
    setPhase('capture');
  }, []);

  const handleRevealReady = useCallback(() => {
    setPhase('mirror');
  }, []);

  const handleReset = useCallback(() => {
    clearSession();
    setPhase('onboarding');
  }, []);

  return (
    <AnimatePresence mode="wait">
      {phase === 'onboarding' && (
        <OnboardingPhase key="onboard" onStart={handleStart} />
      )}
      {phase === 'capture' && (
        <CapturePhase key="capture" onRevealReady={handleRevealReady} />
      )}
      {phase === 'mirror' && (
        <MirrorPhase key="mirror" onReset={handleReset} />
      )}
    </AnimatePresence>
  );
}

function OnboardingPhase({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center px-6 text-center"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          drift
        </h1>
        <p className="mt-6 text-sm text-foreground/50 leading-relaxed max-w-[300px]">
          Gw baca jejak digital lo dari screenshot HP.
          <br /><br />
          Bukan motivasi. Bukan nasihat.
          <br />
          Cuma cermin.
        </p>

        <p className="mt-8 text-xs text-foreground/30 max-w-[260px]">
          Upload screenshot dari app apapun yang lo buka hari ini.
          Timeline, chat, notif, browsing history, jam berapa aja.
        </p>
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onStart}
        className="mt-12 px-8 py-3 rounded-lg bg-accent text-background text-sm font-medium active:scale-[0.97] transition-transform"
      >
        Mulai
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-4 text-[11px] text-foreground/20"
      >
        Screenshot lo ga disimpan di server.
      </motion.p>
    </motion.div>
  );
}

function CapturePhase({ onRevealReady }: { onRevealReady: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <p className="text-xs font-mono text-foreground/40 text-center">
          drift / capture
        </p>
      </div>

      {/* Stream */}
      <div className="flex-1 flex flex-col min-h-0">
        <CaptureStream onRevealReady={onRevealReady} />
      </div>
    </motion.div>
  );
}

function MirrorPhase({ onReset }: { onReset: () => void }) {
  const session = typeof window !== 'undefined' ? getSession() : null;
  const frameCount = session?.frames.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center px-6 text-center"
    >
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-[320px]"
      >
        <p className="text-xs font-mono text-foreground/40 mb-4">
          {frameCount} fragments captured
        </p>
        <p className="text-sm text-foreground/60 leading-relaxed">
          Stage 2 (Pattern Detection) dan Stage 3 (Narrative Mirror) belum di-implement.
          <br /><br />
          Tapi lo udah bisa ngerasain Stage 1 — gimana AI acknowledge detail spesifik dari tiap screenshot.
        </p>
      </motion.div>

      <button
        onClick={onReset}
        className="mt-8 px-6 py-2.5 rounded-lg border border-border/50 text-sm text-foreground/60 active:scale-[0.97] transition-transform"
      >
        Mulai sesi baru
      </button>
    </motion.div>
  );
}
