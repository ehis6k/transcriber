/**
 * File handling utilities for the Transcriber app
 */

import type { SupportedAudioFormat } from '@/models';

export const SUPPORTED_AUDIO_FORMATS: SupportedAudioFormat[] = ['wav', 'mp3', 'm4a', 'flac', 'ogg'];

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
}

export function validateAudioFile(file: File): AudioFileValidation {
  const errors: string[] = [];

  if (!isSupportedAudioFile(file)) {
    errors.push(
      `Unsupported file format. Supported formats: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`
    );
  }

  // Check file size (max 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    errors.push(`File too large. Maximum size is ${formatFileSize(maxSize)}`);
  }

  // Check minimum file size (1KB)
  const minSize = 1024; // 1KB
  if (file.size < minSize) {
    errors.push(`File too small. Minimum size is ${formatFileSize(minSize)}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
