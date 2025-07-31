/**
 * File handling utilities for the Transcriber app
 */

import type { SupportedAudioFormat } from '@/models';
import { DEV_CONFIG } from '@/config/development';

export const SUPPORTED_AUDIO_FORMATS = DEV_CONFIG.SUPPORTED_FORMATS;

export const SUPPORTED_MIME_TYPES = [
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/flac',
  'audio/x-flac',
  'audio/ogg',
  'audio/vorbis',
] as const;

/**
 * Check if a file is a supported audio format
 */
export function isSupportedAudioFile(file: File): boolean {
  const extension = getFileExtension(file.name);
  return SUPPORTED_AUDIO_FORMATS.includes(extension as SupportedAudioFormat);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get audio format from file
 */
export function getAudioFormat(file: File): SupportedAudioFormat | null {
  const extension = getFileExtension(file.name);
  if (SUPPORTED_AUDIO_FORMATS.includes(extension as SupportedAudioFormat)) {
    return extension as SupportedAudioFormat;
  }
  return null;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in human readable format
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Validate audio file before processing
 */
export interface AudioFileValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    name: string;
    size: string;
    type: string;
    format?: SupportedAudioFormat | undefined;
  };
}

export function validateAudioFile(file: File): AudioFileValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const format = getAudioFormat(file);

  // File format validation
  if (!isSupportedAudioFile(file)) {
    const detectedExtension = getFileExtension(file.name);
    errors.push(
      `❌ "${file.name}" has unsupported format (.${detectedExtension}). Please use: ${SUPPORTED_AUDIO_FORMATS.map(f => f.toUpperCase()).join(', ')}`
    );
  }

  // File size validation
  const maxSize = DEV_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024;
  const warningSize = maxSize * 0.8; // Warn at 80% of max size
  const minSize = 1024; // 1KB

  if (file.size > maxSize) {
    errors.push(
      `📁 "${file.name}" is too large (${formatFileSize(file.size)}). Maximum allowed: ${formatFileSize(maxSize)}`
    );
  } else if (file.size > warningSize) {
    warnings.push(
      `⚠️ Large file detected (${formatFileSize(file.size)}). Processing may take longer than usual.`
    );
  }

  if (file.size < minSize) {
    errors.push(
      `📁 "${file.name}" is too small (${formatFileSize(file.size)}). Minimum size: ${formatFileSize(minSize)}`
    );
  }

  // Empty file check
  if (file.size === 0) {
    errors.push(`❌ "${file.name}" appears to be empty or corrupted.`);
  }

  // MIME type validation for additional security
  if (
    file.type &&
    !SUPPORTED_MIME_TYPES.includes(file.type.toLowerCase() as (typeof SUPPORTED_MIME_TYPES)[number])
  ) {
    warnings.push(
      `🔍 "${file.name}" has unexpected MIME type (${file.type}). Proceeding based on file extension.`
    );
  }

  // File name validation
  if (file.name.length > 255) {
    warnings.push(`📝 "${file.name}" has a very long filename. Consider shortening it.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileInfo: {
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || 'unknown',
      format: format || undefined,
    },
  };
}
