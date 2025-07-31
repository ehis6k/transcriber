/**
 * Transcription-related data models
 */

export type TranscriptionLanguage = 'auto' | 'en' | 'nl';
export type WhisperModelSize = 'tiny' | 'base' | 'small';

export interface TranscriptionProgress {
  status: 'initializing' | 'loading-model' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
}

export interface TranscriptionOptions {
  language?: TranscriptionLanguage;
  modelSize?: WhisperModelSize;
  returnTimestamps?: boolean;
  chunkLength?: number;
  onProgress?: (progress: TranscriptionProgress) => void;
}

export interface TranscriptionJob {
  id: string;
  audioFileId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  options: {
    language: 'auto' | 'en' | 'nl';
    modelSize: 'tiny' | 'base' | 'small';
    includeTimestamps: boolean;
  };
}

export interface TranscriptionSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence?: number;
}

export interface TranscriptionJobResult {
  id: string;
  audioFileId: string;
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  modelUsed: string;
  duration: number;
  confidence?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranscriptionSettings {
  defaultLanguage: 'auto' | 'en' | 'nl';
  defaultModelSize: 'tiny' | 'base' | 'small';
  includeTimestamps: boolean;
  autoTranscribe: boolean;
  maxConcurrentJobs: number;
}

export interface TranscriptionStats {
  totalTranscriptions: number;
  totalDuration: number; // in seconds
  averageAccuracy?: number;
  favoriteLanguage: string;
  mostUsedModel: string;
}

// Summarization types
export type SummarizationLanguage = 'auto' | 'en' | 'nl';
export type SummarizationModelSize = 'distilbart' | 'bart' | 't5-small';
export type SummarizationLength = 'short' | 'medium' | 'long';

export interface SummarizationProgress {
  status: 'initializing' | 'loading-model' | 'chunking' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  currentChunk?: number;
  totalChunks?: number;
}

export interface SummarizationOptions {
  language?: SummarizationLanguage;
  modelSize?: SummarizationModelSize;
  length?: SummarizationLength;
  maxLength?: number;
  minLength?: number;
  onProgress?: (progress: SummarizationProgress) => void;
}

export interface SummarizationChunk {
  id: string;
  text: string;
  summary: string;
  startIndex: number;
  endIndex: number;
}

export interface SummarizationResult {
  id: string;
  transcriptionId: string;
  summary: string;
  chunks: SummarizationChunk[];
  language: string;
  modelUsed: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
  processingTime: number;
  createdAt: Date;
}

// Language detection types
export interface LanguageDetectionResult {
  detectedLanguage: TranscriptionLanguage;
  confidence: number; // 0-1 scale
  alternatives: Array<{
    language: TranscriptionLanguage;
    confidence: number;
  }>;
  isReliable: boolean; // true if confidence > threshold
}

export interface LanguagePreferences {
  defaultLanguage: TranscriptionLanguage;
  autoDetect: boolean;
  confidenceThreshold: number;
  lastUsed: Date;
}