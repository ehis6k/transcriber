/**
 * React hook for handling audio file uploads
 */

import { useState, useCallback } from 'react';
import type { AudioFile, FileUploadProgress } from '@/models';
import { validateAudioFile, getAudioFormat } from '@/utils';

interface UseAudioUploadReturn {
  uploadProgress: FileUploadProgress[];
  uploadFiles: (files: File[]) => Promise<AudioFile[]>;
  isUploading: boolean;
  clearProgress: () => void;
}

export function useAudioUpload(): UseAudioUploadReturn {
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = useCallback(async (files: File[]): Promise<AudioFile[]> => {
    setIsUploading(true);
    const uploadedFiles: AudioFile[] = [];

    try {
      for (const file of files) {
        const fileId = crypto.randomUUID();

        // Initialize progress
        const progress: FileUploadProgress = {
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'uploading',
        };

        setUploadProgress(prev => [...prev, progress]);

        try {
          // Validate file
          const validation = validateAudioFile(file);
          if (!validation.isValid) {
            setUploadProgress(prev =>
              prev.map(p =>
                p.fileId === fileId
                  ? { ...p, status: 'error', error: validation.errors.join(', ') }
                  : p
              )
            );
            continue;
          }

          // Update progress - validating
          setUploadProgress(prev =>
            prev.map(p => (p.fileId === fileId ? { ...p, progress: 25, status: 'validating' } : p))
          );

          // TODO: Actual file processing/copying to app directory
          // For now, we'll simulate the upload process
          await new Promise(resolve => setTimeout(resolve, 1000));

          const audioFile: AudioFile = {
            id: fileId,
            name: file.name,
            path: file.name, // TODO: Use actual file path
            size: file.size,
            format: getAudioFormat(file)!,
            uploadedAt: new Date(),
            lastModified: new Date(file.lastModified),
          };

          // Complete upload
          setUploadProgress(prev =>
            prev.map(p => (p.fileId === fileId ? { ...p, progress: 100, status: 'completed' } : p))
          );

          uploadedFiles.push(audioFile);
        } catch (error) {
          setUploadProgress(prev =>
            prev.map(p =>
              p.fileId === fileId
                ? {
                    ...p,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error',
                  }
                : p
            )
          );
        }
      }
    } finally {
      setIsUploading(false);
    }

    return uploadedFiles;
  }, []);

  const clearProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  return {
    uploadProgress,
    uploadFiles,
    isUploading,
    clearProgress,
  };
}
