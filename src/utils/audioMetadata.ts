/**
 * Audio metadata extraction utilities
 */

import type { SupportedAudioFormat } from '@/models';

export interface AudioMetadata {
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  hasMetadata: boolean;
}

export interface ExtractedFileInfo {
  name: string;
  size: number;
  format: SupportedAudioFormat;
  type: string;
  lastModified: Date;
  metadata: AudioMetadata;
}

/**
 * Extract audio metadata using HTML5 Audio API
 */
export function extractAudioMetadata(file: File): Promise<AudioMetadata> {
  return new Promise(resolve => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    let resolved = false;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      audio.remove();
    };

    const resolveMetadata = (metadata: AudioMetadata) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(metadata);
      }
    };

    // Set timeout to avoid hanging
    const timeout = setTimeout(() => {
      resolveMetadata({
        hasMetadata: false,
      });
    }, 5000); // 5 second timeout

    audio.addEventListener('loadedmetadata', () => {
      clearTimeout(timeout);
      resolveMetadata({
        duration: audio.duration,
        hasMetadata: true,
      });
    });

    audio.addEventListener('error', () => {
      clearTimeout(timeout);
      resolveMetadata({
        hasMetadata: false,
      });
    });

    // Load the audio file
    audio.src = objectUrl;
    audio.preload = 'metadata';
  });
}

/**
 * Extract comprehensive file information including metadata
 */
export async function extractFileInfo(
  file: File,
  format: SupportedAudioFormat
): Promise<ExtractedFileInfo> {
  const metadata = await extractAudioMetadata(file);

  return {
    name: file.name,
    size: file.size,
    format,
    type: file.type || 'unknown',
    lastModified: new Date(file.lastModified),
    metadata,
  };
}

/**
 * Format duration for display
 */
export function formatAudioDuration(duration?: number): string {
  if (!duration || !isFinite(duration)) {
    return '--:--';
  }

  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Estimate bitrate based on file size and duration
 */
export function estimateBitrate(fileSize: number, duration?: number): number | undefined {
  if (!duration || duration <= 0) {
    return undefined;
  }

  // Simple estimation: (file size in bits) / duration in seconds / 1000 for kbps
  return Math.round((fileSize * 8) / duration / 1000);
}
