/**
 * Audio file processing types and interfaces for the Transcriber app
 */

export type SupportedAudioFormat = 'wav' | 'mp3' | 'm4a' | 'flac' | 'ogg';

export type SupportedLanguage = 'en' | 'nl';

export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';

export type SummarizationStatus = 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';

export interface AudioFile {
  id: string;
  name: string;
  path: string;
  size: number;
  duration?: number;
  format: SupportedAudioFormat;
  uploadedAt: Date;
  lastModified: Date;
}

export interface TranscriptionResult {
  id: string;
  audioFileId: string;
  text: string;
  language: SupportedLanguage;
  confidence: number;
  processingTime: number;
  createdAt: Date;
  timestamps?: SentenceTimestamp[];
}

export interface SentenceTimestamp {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export interface SummaryResult {
  id: string;
  transcriptionId: string;
  summary: string;
  keyPoints: string[];
  processingTime: number;
  createdAt: Date;
}

export interface ProcessingJob {
  id: string;
  audioFileId: string;
  type: 'transcription' | 'summarization';
  status: TranscriptionStatus | SummarizationStatus;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface TranscriptionConfig {
  language: SupportedLanguage | 'auto';
  enableTimestamps: boolean;
  enableSpeakerDiarization: boolean;
  modelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large';
}

export interface SummarizationConfig {
  maxLength: number;
  includeKeyPoints: boolean;
  format: 'paragraph' | 'bullet-points' | 'markdown';
}
