/**
 * React hook for managing summarization operations
 */

import { useState, useCallback, useRef } from 'react';
import { summarizationService } from '@/services';
import type { 
  SummarizationProgress, 
  SummarizationResult, 
  SummarizationOptions,
  TranscriptionJobResult 
} from '@/models';

interface UseSummarizationReturn {
  isSummarizing: boolean;
  progress: SummarizationProgress | null;
  result: SummarizationResult | null;
  error: string | null;
  startSummarization: (transcription: TranscriptionJobResult, options?: SummarizationOptions) => Promise<void>;
  summarizeText: (text: string, options?: SummarizationOptions) => Promise<void>;
  cancelSummarization: () => void;
  clearResult: () => void;
  isModelReady: boolean;
  currentModelSize: string | null;
}

export function useSummarization(): UseSummarizationReturn {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [progress, setProgress] = useState<SummarizationProgress | null>(null);
  const [result, setResult] = useState<SummarizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [currentModelSize, setCurrentModelSize] = useState<string | null>(null);
  
  const abortController = useRef<AbortController | null>(null);

  const processSummarization = useCallback(
    async (text: string, transcriptionId?: string, options: SummarizationOptions = {}) => {
      if (isSummarizing) {
        console.warn('Summarization already in progress');
        return;
      }

      // Reset state
      setIsSummarizing(true);
      setProgress(null);
      setResult(null);
      setError(null);
      
      // Create abort controller for cancellation
      abortController.current = new AbortController();

      try {
        // Start summarization with progress callback
        const summarizationResult = await summarizationService.summarize(text, {
          ...options,
          onProgress: (progressData) => {
            setProgress(progressData);
            
            // Update model ready state
            if (progressData.status === 'loading-model' || progressData.status === 'processing') {
              setIsModelReady(true);
              setCurrentModelSize(summarizationService.getCurrentModelSize());
            }
          },
        });

        // Check if cancelled
        if (abortController.current?.signal.aborted) {
          return;
        }

        // Create result with our interface structure
        const processedResult: SummarizationResult = {
          id: `summarization-${Date.now()}`,
          transcriptionId: transcriptionId || `text-${Date.now()}`,
          summary: summarizationResult.summary,
          chunks: summarizationResult.chunks,
          language: options.language || 'auto',
          modelUsed: summarizationResult.modelUsed,
          originalLength: summarizationResult.originalLength,
          summaryLength: summarizationResult.summaryLength,
          compressionRatio: summarizationResult.compressionRatio,
          processingTime: summarizationResult.processingTime,
          createdAt: new Date(),
        };

        setResult(processedResult);
        setProgress({
          status: 'completed',
          progress: 100,
          message: 'Summarization completed successfully!',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown summarization error';
        setError(errorMessage);
        setProgress({
          status: 'error',
          progress: 0,
          message: errorMessage,
        });
      } finally {
        setIsSummarizing(false);
        abortController.current = null;
      }
    },
    [isSummarizing]
  );

  const startSummarization = useCallback(
    async (transcription: TranscriptionJobResult, options?: SummarizationOptions) => {
      await processSummarization(transcription.text, transcription.id, options);
    },
    [processSummarization]
  );

  const summarizeText = useCallback(
    async (text: string, options?: SummarizationOptions) => {
      await processSummarization(text, undefined, options);
    },
    [processSummarization]
  );

  const cancelSummarization = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      setIsSummarizing(false);
      setProgress({
        status: 'error',
        progress: 0,
        message: 'Summarization cancelled by user',
      });
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(null);
  }, []);

  return {
    isSummarizing,
    progress,
    result,
    error,
    startSummarization,
    summarizeText,
    cancelSummarization,
    clearResult,
    isModelReady,
    currentModelSize,
  };
}