/**
 * React hook for managing transcription operations
 */

import { useState, useCallback, useRef } from 'react';
import { transcriptionService } from '@/services';
import type { 
  TranscriptionProgress, 
  TranscriptionJobResult, 
  TranscriptionOptions,
  AudioFile 
} from '@/models';

interface UseTranscriptionReturn {
  isTranscribing: boolean;
  progress: TranscriptionProgress | null;
  result: TranscriptionJobResult | null;
  error: string | null;
  startTranscription: (audioFile: AudioFile, options?: TranscriptionOptions) => Promise<void>;
  cancelTranscription: () => void;
  clearResult: () => void;
  isModelReady: boolean;
  currentModelSize: string | null;
}

export function useTranscription(): UseTranscriptionReturn {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState<TranscriptionProgress | null>(null);
  const [result, setResult] = useState<TranscriptionJobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [currentModelSize, setCurrentModelSize] = useState<string | null>(null);
  
  const abortController = useRef<AbortController | null>(null);

  const startTranscription = useCallback(
    async (audioFile: AudioFile, options: TranscriptionOptions = {}) => {
      if (isTranscribing) {
        console.warn('Transcription already in progress');
        return;
      }

      // Reset state
      setIsTranscribing(true);
      setProgress(null);
      setResult(null);
      setError(null);
      
      // Create abort controller for cancellation
      abortController.current = new AbortController();

      try {
        // Use the stored File object directly for transcription
        if (!audioFile.file) {
          throw new Error('Audio file object not available for transcription');
        }

        // Start transcription with progress callback
        const transcriptionResult = await transcriptionService.transcribe(audioFile.file, {
          ...options,
          onProgress: (progressData) => {
            setProgress(progressData);
            
            // Update model ready state
            if (progressData.status === 'loading-model' || progressData.status === 'processing') {
              setIsModelReady(true);
              setCurrentModelSize(transcriptionService.getCurrentModelSize());
            }
          },
        });

        // Check if cancelled
        if (abortController.current?.signal.aborted) {
          return;
        }

        // Create result with our interface structure
        const processedResult: TranscriptionJobResult = {
          id: `transcription-${Date.now()}`,
          audioFileId: audioFile.id,
          text: transcriptionResult.text,
          segments: transcriptionResult.segments.map((seg, index) => ({
            id: `segment-${index}`,
            text: seg.text,
            startTime: seg.start,
            endTime: seg.end,
          })),
          language: transcriptionResult.language === 'auto' || !['en', 'nl'].includes(transcriptionResult.language) 
            ? 'en' 
            : transcriptionResult.language as 'en' | 'nl',
          modelUsed: transcriptionResult.modelUsed,
          duration: transcriptionResult.duration,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setResult(processedResult);
        setProgress({
          status: 'completed',
          progress: 100,
          message: 'Transcription completed successfully!',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown transcription error';
        setError(errorMessage);
        setProgress({
          status: 'error',
          progress: 0,
          message: errorMessage,
        });
      } finally {
        setIsTranscribing(false);
        abortController.current = null;
      }
    },
    [isTranscribing]
  );

  const cancelTranscription = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      setIsTranscribing(false);
      setProgress({
        status: 'error',
        progress: 0,
        message: 'Transcription cancelled by user',
      });
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(null);
  }, []);

  return {
    isTranscribing,
    progress,
    result,
    error,
    startTranscription,
    cancelTranscription,
    clearResult,
    isModelReady,
    currentModelSize,
  };
}