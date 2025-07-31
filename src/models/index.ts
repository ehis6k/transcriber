/**
 * Main models export file for the Transcriber app
 */

// Audio-related types
export type {
  SupportedAudioFormat,
  SupportedLanguage,
  TranscriptionStatus,
  SummarizationStatus,
  AudioFile,
  TranscriptionResult,
  SentenceTimestamp,
  SummaryResult,
  ProcessingJob,
  TranscriptionConfig,
  SummarizationConfig,
} from './audio.js';

// App-wide types
export type {
  Theme,
  ExportFormat,
  AppSettings,
  ExportSettings,
  AppState,
  Notification,
  NotificationAction,
  FileUploadProgress,
  ProcessingProgress,
} from './app.js';

// Transcription models
export type {
  TranscriptionLanguage,
  WhisperModelSize,
  TranscriptionProgress,
  TranscriptionOptions,
  TranscriptionJob,
  TranscriptionSegment,
  TranscriptionJobResult,
  TranscriptionSettings,
  TranscriptionStats,
  SummarizationLanguage,
  SummarizationModelSize,
  SummarizationLength,
  SummarizationProgress,
  SummarizationOptions,
  SummarizationChunk,
  SummarizationResult,
  LanguageDetectionResult,
  LanguagePreferences,
} from './transcription.js';

// Re-export everything for convenience
export * from './audio.js';
export * from './app.js';
export * from './transcription.js';
