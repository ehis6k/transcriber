/**
 * Main utilities export file for the Transcriber app
 */

// File utilities
export {
  SUPPORTED_AUDIO_FORMATS,
  SUPPORTED_MIME_TYPES,
  isSupportedAudioFile,
  getFileExtension,
  getAudioFormat,
  formatFileSize,
  formatDuration,
  validateAudioFile,
  type AudioFileValidation,
} from './file.js';

// Date utilities
export { formatDate, formatRelativeTime, formatProcessingTime, getTimestamp } from './date.js';

// Re-export everything for convenience
export * from './file.js';
export * from './date.js';
