/**
 * Tests for file utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  formatFileSize,
  getFileExtension,
  isSupportedAudioFile,
  getAudioFormat,
  validateAudioFile,
} from './file';

describe('file utilities', () => {
  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(512)).toBe('512 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('formats sizes with appropriate decimals', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2048000)).toBe('1.95 MB');
    });
  });

  describe('getFileExtension', () => {
    it('extracts file extensions correctly', () => {
      expect(getFileExtension('test.mp3')).toBe('mp3');
      expect(getFileExtension('audio.file.wav')).toBe('wav');
      expect(getFileExtension('noextension')).toBe('noextension'); // This returns the whole filename when no extension
      expect(getFileExtension('.hidden')).toBe('hidden'); // This returns everything after the dot
      expect(getFileExtension('file.')).toBe(''); // This correctly returns empty string
    });
  });

  describe('isSupportedAudioFile', () => {
    it('identifies supported audio files', () => {
      const supportedFile = new File([''], 'test.mp3', { type: 'audio/mp3' });
      expect(isSupportedAudioFile(supportedFile)).toBe(true);
    });

    it('rejects unsupported file types', () => {
      const unsupportedFile = new File([''], 'test.txt', { type: 'text/plain' });
      expect(isSupportedAudioFile(unsupportedFile)).toBe(false);
    });

    it('handles files without extensions', () => {
      const noExtFile = new File([''], 'test', { type: 'audio/mp3' });
      expect(isSupportedAudioFile(noExtFile)).toBe(false);
    });
  });

  describe('getAudioFormat', () => {
    it('returns correct format for supported files', () => {
      const mp3File = new File([''], 'test.mp3', { type: 'audio/mp3' });
      expect(getAudioFormat(mp3File)).toBe('mp3');

      const wavFile = new File([''], 'test.wav', { type: 'audio/wav' });
      expect(getAudioFormat(wavFile)).toBe('wav');
    });

    it('returns null for unsupported files', () => {
      const txtFile = new File([''], 'test.txt', { type: 'text/plain' });
      expect(getAudioFormat(txtFile)).toBeNull();
    });
  });

  describe('validateAudioFile', () => {
    it('validates supported audio files', () => {
      const validFile = new File(['x'.repeat(2000)], 'test.mp3', { type: 'audio/mp3' });
      const result = validateAudioFile(validFile);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects files that are too large', () => {
      const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'test.mp3', {
        type: 'audio/mp3',
      });
      const result = validateAudioFile(largeFile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('is too large'))).toBe(true);
      expect(result.errors.some(error => error.includes('Maximum allowed'))).toBe(true);
    });

    it('rejects files that are too small', () => {
      const smallFile = new File([''], 'test.mp3', { type: 'audio/mp3' });
      const result = validateAudioFile(smallFile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('appears to be empty'))).toBe(true);
    });

    it('rejects unsupported file formats', () => {
      const unsupportedFile = new File(['x'.repeat(2000)], 'test.txt', { type: 'text/plain' });
      const result = validateAudioFile(unsupportedFile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('has unsupported format'))).toBe(true);
      expect(result.errors.some(error => error.includes('Please use:'))).toBe(true);
    });

    it('generates warnings for large files', () => {
      // Create a file that's 85MB (above warning threshold but below max)
      const largeFile = new File(['x'.repeat(85 * 1024 * 1024)], 'test.mp3', { type: 'audio/mp3' });
      const result = validateAudioFile(largeFile);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(warning => warning.includes('Large file detected'))).toBe(true);
    });

    it('includes file info in validation result', () => {
      const testFile = new File(['x'.repeat(2000)], 'test.mp3', { type: 'audio/mp3' });
      const result = validateAudioFile(testFile);

      expect(result.fileInfo).toBeDefined();
      expect(result.fileInfo.name).toBe('test.mp3');
      expect(result.fileInfo.format).toBe('mp3');
      expect(result.fileInfo.size).toContain('KB');
      expect(result.fileInfo.type).toBe('audio/mp3');
    });

    it('handles files with unexpected MIME types', () => {
      const testFile = new File(['x'.repeat(2000)], 'test.mp3', {
        type: 'application/octet-stream',
      });
      const result = validateAudioFile(testFile);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(warning => warning.includes('unexpected MIME type'))).toBe(true);
    });
  });
});
