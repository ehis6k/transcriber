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

// Platform utilities
export {
  getPlatformInfo,
  isMacOS,
  isWindows,
  isLinux,
  getKeyboardShortcuts,
  getPlatformPaths,
  initializePlatform,
} from './platform.js';
export type { Platform, PlatformInfo } from './platform.js';

// Audio metadata utilities
export {
  extractAudioMetadata,
  extractFileInfo,
  formatAudioDuration,
  estimateBitrate,
  type AudioMetadata,
  type ExtractedFileInfo,
} from './audioMetadata.js';

// Re-export everything for convenience
export * from './file.js';
export * from './date.js';
export * from './platform.js';
export * from './audioMetadata.js';
