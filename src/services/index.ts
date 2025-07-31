/**
 * Main services export file for the Transcriber app
 */

// Audio service
export { AudioService } from './audio.js';

// Storage service
export { StorageService } from './storage.js';

// Transcription service
export { transcriptionService, default as TranscriptionService } from './transcription.js';

// Summarization service
export { summarizationService, default as SummarizationService } from './summarization.js';

// Language detection service
export { languageDetectionService, default as LanguageDetectionService } from './languageDetection.js';

// Export service
export { ExportService, type ExportOptions, type ExportProgress, type ExportMetadata } from './export.js';

// Database service
export { 
  databaseService, 
  type TranscriptionRecord, 
  type SummaryRecord, 
  type UserPreference,
  type TranscriptionHistoryFilters,
  type TranscriptionHistoryResult 
} from './database.js';

// Re-export everything for convenience
export * from './audio.js';
export * from './storage.js';
export * from './transcription.js';
export * from './summarization.js';
export * from './languageDetection.js';
