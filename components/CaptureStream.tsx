'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Plus, Eye } from 'lucide-react';
import { MicroAck } from './MicroAck';
import type { FramePerception } from '@/lib/schema';
import { addFrame, getSession, createSession, storeImage } from '@/lib/session';

interface CaptureStreamProps {
  onRevealReady: () => void;
}

const PROGRESS_COPY = [
  'Gw masih buta. Belum cukup data buat baca lo.',
  'Satu fragment. Gw mulai liat bentuk.',
  'Dua fragment. Ada shape yang mulai keliatan.',
  'Tiga fragment. Gw udah bisa kasih lo cermin kasar.',
  'Empat fragment. Pola makin jelas.',
  'Lima fragment. Gw bisa baca hari lo.',
  'Enam fragment. Detail makin dalam.',
  'Tujuh fragment. Ini udah cukup buat reconstruct.',
];

function getProgressCopy(count: number): string {
  if (count >= PROGRESS_COPY.length) return PROGRESS_COPY[PROGRESS_COPY.length - 1];
  return PROGRESS_COPY[count];
}

export function CaptureStream({ onRevealReady }: CaptureStreamProps) {
  const [frames, setFrames] = useState<FramePerception[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Resize for mobile optimization — max 1024px
      const base64 = await fileToBase64(file);
      
      const session = getSession() || createSession();
      const frameIndex = session.frames.length;

      const response = await fetch('/api/perceive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: base64,
          frame_index: frameIndex,
        }),
      });

      // Even non-2xx responses should be parseable JSON; tolerate everything.
      let data: { success?: boolean; perception?: FramePerception; error?: string; degraded?: boolean; parse_method?: string };
      try {
        data = await response.json();
      } catch {
        setError('Server kasih respons aneh. Coba lagi.');
        return;
      }

      if (!data?.perception) {
        setError(data?.error || 'AI nggak balas. Coba lagi.');
        return;
      }

      const perception = data.perception;
      if (data.degraded) {
        // Degraded but valid — show subtle hint, still render the frame.
        console.warn('[drift] Degraded perception:', data.parse_method);
      }
      
      // Store in session
      addFrame(perception);
      
      // Store image blob in IndexedDB
      await storeImage(perception.frame_id, file);

      // Create thumbnail URL
      const thumbUrl = URL.createObjectURL(file);
      setThumbnails(prev => [...prev, thumbUrl]);
      setFrames(prev => [...prev, perception]);
    } catch (err) {
      setError('Gagal memproses screenshot. Coba lagi.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
      // Reset input so same file can be re-uploaded
      e.target.value = '';
    }
  }, [processImage]);

  const handleTap = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const canReveal = frames.length >= 3;

  return (
    <div className="flex flex-col h-full">
      {/* Thumbnail strip */}
      {thumbnails.length > 0 && (
        <div className="px-4 py-3 border-b border-border/50 overflow-x-auto">
          <div className="flex gap-2">
            {thumbnails.map((thumb, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="shrink-0 w-10 h-10 rounded-md overflow-hidden border border-border/30"
              >
                <img src={thumb} alt={`Frame ${i + 1}`} className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Stream area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Onboarding state */}
        {frames.length === 0 && !isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-sm text-foreground/60 leading-relaxed max-w-[280px] mx-auto">
              Drift baca 24 jam terakhir lo lewat screenshot.
              <br /><br />
              Makin banyak lo kasih, makin dalam yang gw liat.
              <br /><br />
              <span className="text-foreground/40">Min 3 buat liat pola. 5-7 buat liat lo.</span>
            </p>
          </motion.div>
        )}

        {/* Micro acknowledgments */}
        <AnimatePresence mode="popLayout">
          {frames.map((frame, i) => (
            <MicroAck key={frame.frame_id} perception={frame} index={i} />
          ))}
        </AnimatePresence>

        {/* Processing state */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 items-center"
          >
            <div className="shrink-0 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="w-3 h-3 border border-accent/50 border-t-accent rounded-full"
              />
            </div>
            <p className="text-sm text-foreground/50 italic">
              Gw lagi baca...
            </p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-500/80 pl-9"
          >
            {error}
          </motion.p>
        )}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/50 px-4 py-4 space-y-3">
        {/* Progress copy */}
        <p className="text-xs text-foreground/40 text-center font-mono">
          {getProgressCopy(frames.length)}
        </p>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleTap}
            disabled={isProcessing || frames.length >= 7}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-surface-alt border border-border/50 text-sm text-foreground/70 active:scale-[0.98] transition-transform disabled:opacity-40"
          >
            {frames.length === 0 ? (
              <>
                <Upload size={16} />
                <span>Upload Screenshot</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Tambah Fragment</span>
              </>
            )}
          </button>

          {canReveal && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={onRevealReady}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-accent text-background text-sm font-medium active:scale-[0.98] transition-transform"
            >
              <Eye size={16} />
              <span>Buka Cermin</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

// Utility: convert File to base64 (without data: prefix)
async function fileToBase64(file: File): Promise<string> {
  // Resize to max 1024px for mobile optimization
  const bitmap = await createImageBitmap(file);
  const maxDim = 1024;
  let width = bitmap.width;
  let height = bitmap.height;

  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
