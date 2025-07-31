/**
 * Main hooks export file for the Transcriber app
 */

// Audio upload hook
export { useAudioUpload } from './useAudioUpload.js';

// Transcription hook
export { useTranscription } from './useTranscription.js';

// Summarization hook
export { useSummarization } from './useSummarization.js';

// Language detection hook
export { useLanguageDetection } from './useLanguageDetection.js';

// Re-export everything for convenience
export * from './useAudioUpload.js';
export * from './useTranscription.js';
export * from './useSummarization.js';
export * from './useLanguageDetection.js';
