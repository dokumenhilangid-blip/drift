'use client';

import { useState, useRef } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  isLoading: boolean;
  screenshotCount: number;
  maxScreenshots: number;
}

export default function UploadZone({
  onUpload,
  isLoading,
  screenshotCount,
  maxScreenshots,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDisabled = screenshotCount >= maxScreenshots || isLoading;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDisabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isDisabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setError(null);

    if (files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    try {
      await onUpload(file);
    } catch (err) {
      setError('Failed to upload screenshot. Please try again.');
    }
  };

  const handleClick = () => {
    if (!isDisabled) {
      fileInputRef.current?.click();
    }
  };

  const isComplete = screenshotCount >= maxScreenshots;

  return (
    <div className="space-y-4">
      {/* Screenshot Counter */}
      <div className="flex items-center justify-between">
        <div className="text-caption">
          <span className="font-semibold text-accent-primary">
            {screenshotCount}/{maxScreenshots}
          </span>
          <span className="ml-2 text-foreground opacity-70">screenshots captured</span>
        </div>
        {isComplete && (
          <div className="text-caption font-medium text-emotion-joy">
            Ready to reflect
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full rounded-full bg-surface-subtle overflow-hidden">
        <div
          className="h-full bg-accent-primary transition-all duration-300"
          style={{ width: `${(screenshotCount / maxScreenshots) * 100}%` }}
        />
      </div>

      {/* Upload Zone */}
      <button
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={isDisabled}
        className={`
          relative w-full rounded-lg border-2 border-dashed p-12 transition-all duration-200
          ${isDragging && !isDisabled ? 'border-accent-primary bg-surface-subtle' : 'border-border-subtle'}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-accent-primary hover:bg-surface-subtle'}
          ${isLoading ? 'pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          disabled={isDisabled}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <Upload
            size={32}
            className={`transition-colors ${isDragging && !isDisabled ? 'text-accent-primary' : 'text-accent-secondary opacity-60'}`}
          />
          <div className="text-center">
            <p className="text-body font-medium text-foreground">
              {isLoading ? 'Analyzing your moment...' : 'Drop your screenshot here'}
            </p>
            <p className="text-caption text-foreground opacity-60 mt-1">
              or tap to select from your device
            </p>
          </div>
        </div>
      </button>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-error/10 p-4">
          <AlertCircle size={20} className="text-error flex-shrink-0 mt-0.5" />
          <p className="text-caption text-error">{error}</p>
        </div>
      )}

      {/* Help Text */}
      {!isComplete && (
        <p className="text-caption text-center text-foreground opacity-60">
          {screenshotCount === 0
            ? 'Start by uploading a screenshot of your screen'
            : `Upload up to ${maxScreenshots - screenshotCount} more screenshot${maxScreenshots - screenshotCount !== 1 ? 's' : ''}`}
        </p>
      )}
    </div>
  );
}
