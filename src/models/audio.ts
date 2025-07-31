/**
 * Audio file model and related types
 */

export type SupportedAudioFormat = 'wav' | 'mp3' | 'm4a' | 'flac' | 'ogg';

export type SupportedLanguage = 'en' | 'nl';

export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';

export type SummarizationStatus = 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';

export interface AudioFile {
  id: string;
  name: string;
  path: string; // URL or file path
  file?: File; // Actual File object for transcription
  size: number;
  duration?: number;
  format: SupportedAudioFormat;
  uploadedAt: Date;
  lastModified: Date;
}

export interface AudioMetadata {
  duration?: number;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
}

export interface AudioProcessingOptions {
  quality?: 'low' | 'medium' | 'high';
  format?: 'mp3' | 'wav' | 'ogg' | 'm4a';
  sampleRate?: number;
  channels?: number;
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
