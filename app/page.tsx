'use client';

import { useState } from 'react';
import UploadZone from '@/components/UploadZone';
import LoadingState from '@/components/LoadingState';
import InsightCard from '@/components/InsightCard';
import EmotionalProfile from '@/components/EmotionalProfile';
import ChaosMeter from '@/components/ChaosMeter';
import InternetAlterEgo from '@/components/InternetAlterEgo';
import RecapCard from '@/components/RecapCard';
import { motion } from 'framer-motion';

interface Insight {
  title: string;
  observation: string;
  tag: string;
}

interface AnalysisResult {
  emotionalProfile: {
    primaryEmotion: string;
    intensity: number;
    confidence: number;
  };
  insights: Insight[];
  chaosMeter: number;
  internetAlterEgo: string;
  recap: string;
  fallback?: boolean;
}

const MAX_SCREENSHOTS = 5;

export default function Home() {
  const [screenshotCount, setScreenshotCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleUpload = async (file: File) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze screenshot');
      }

      const result = await response.json();
      setAnalysis(result);
      setScreenshotCount((prev) => prev + 1);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setScreenshotCount(0);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border-subtle bg-surface py-6 md:py-8"
      >
        <div className="container">
          <div className="space-y-2">
            <h1 className="text-display text-foreground">Drift</h1>
            <p className="text-body text-foreground opacity-70">
              Discover your digital behavior through emotional AI insights
            </p>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container py-8 md:py-12">
        {!analysis ? (
          // Upload Phase
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {isLoading ? (
              <LoadingState />
            ) : (
              <>
                <UploadZone
                  onUpload={handleUpload}
                  isLoading={isLoading}
                  screenshotCount={screenshotCount}
                  maxScreenshots={MAX_SCREENSHOTS}
                />

                {/* Info Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="rounded-lg border border-border-subtle bg-surface-subtle p-6 md:p-8"
                >
                  <h2 className="text-heading font-semibold text-foreground mb-4">
                    How it works
                  </h2>
                  <ul className="space-y-3 text-body text-foreground opacity-80">
                    <li className="flex gap-3">
                      <span className="text-accent-primary font-bold flex-shrink-0">1.</span>
                      <span>Upload a screenshot of your screen</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent-primary font-bold flex-shrink-0">2.</span>
                      <span>Our AI analyzes your digital behavior</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent-primary font-bold flex-shrink-0">3.</span>
                      <span>Receive emotionally accurate insights about your patterns</span>
                    </li>
                  </ul>
                </motion.div>
              </>
            )}
          </motion.div>
        ) : (
          // Report Phase
          <motion.div
            key="report"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Emotional Profile */}
            <EmotionalProfile
              primaryEmotion={analysis.emotionalProfile.primaryEmotion}
              intensity={analysis.emotionalProfile.intensity}
              confidence={analysis.emotionalProfile.confidence}
            />

            {/* Insight Cards */}
            <div className="space-y-4">
              {analysis.insights.map((insight, index) => (
                <InsightCard
                  key={index}
                  title={insight.title}
                  observation={insight.observation}
                  tag={insight.tag}
                  index={index}
                />
              ))}
            </div>

            {/* Chaos Meter */}
            <ChaosMeter value={analysis.chaosMeter} />

            {/* Internet Alter Ego */}
            <InternetAlterEgo text={analysis.internetAlterEgo} />

            {/* Recap */}
            <RecapCard text={analysis.recap} />

            {/* Fallback Badge */}
            {analysis.fallback && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="rounded-lg border border-border-subtle bg-surface-subtle p-4 text-center"
              >
                <p className="text-caption text-foreground opacity-60">
                  This reflection was generated with care when our AI couldn't analyze your screenshot.
                </p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="flex gap-3 pt-4"
            >
              <button
                onClick={handleReset}
                className="btn-secondary flex-1"
              >
                Upload Another
              </button>
              {screenshotCount < MAX_SCREENSHOTS && (
                <button
                  onClick={handleReset}
                  className="btn-primary flex-1"
                >
                  Continue Reflecting
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="border-t border-border-subtle bg-surface py-6 md:py-8 mt-12"
      >
        <div className="container text-center">
          <p className="text-caption text-foreground opacity-60">
            Drift is a stateless, privacy-first AI reflection tool. Your screenshots are never stored.
          </p>
        </div>
      </motion.footer>
    </main>
  );
}
