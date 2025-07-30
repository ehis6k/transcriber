/**
 * Audio file uploader component
 */

import { useCallback, useState } from 'react';
import { useAudioUpload } from '@/hooks';
import { SUPPORTED_AUDIO_FORMATS } from '@/utils';
import type { AudioFile } from '@/models';

interface AudioUploaderProps {
  onFilesUploaded: (files: AudioFile[]) => void;
  disabled?: boolean;
}

export function AudioUploader({ onFilesUploaded, disabled = false }: AudioUploaderProps) {
  const { uploadFiles, uploadProgress, isUploading, clearProgress } = useAudioUpload();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const audioFiles = Array.from(files).filter(file =>
        SUPPORTED_AUDIO_FORMATS.some(format => file.name.toLowerCase().endsWith(`.${format}`))
      );

      if (audioFiles.length > 0) {
        const uploadedFiles = await uploadFiles(audioFiles);
        onFilesUploaded(uploadedFiles);
      }
    },
    [uploadFiles, onFilesUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [handleFiles, disabled]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  return (
    <div className="audio-uploader">
      <div
        className={`upload-area ${isDragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="upload-content">
          <h3>Upload Audio Files</h3>
          <p>Drop audio files here or click to browse</p>
          <p className="supported-formats">
            Supported formats: {SUPPORTED_AUDIO_FORMATS.join(', ').toUpperCase()}
          </p>

          <input
            type="file"
            multiple
            accept={SUPPORTED_AUDIO_FORMATS.map(f => `.${f}`).join(',')}
            onChange={handleFileInput}
            disabled={disabled || isUploading}
            className="file-input"
          />

          <button
            className="browse-button"
            disabled={disabled || isUploading}
            onClick={() => document.querySelector<HTMLInputElement>('.file-input')?.click()}
          >
            {isUploading ? 'Uploading...' : 'Browse Files'}
          </button>
        </div>
      </div>

      {uploadProgress.length > 0 && (
        <div className="upload-progress">
          <h4>Upload Progress</h4>
          {uploadProgress.map(progress => (
            <div key={progress.fileId} className="progress-item">
              <div className="progress-info">
                <span className="filename">{progress.fileName}</span>
                <span className={`status status-${progress.status}`}>{progress.status}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress.progress}%` }} />
              </div>
              {progress.error && <div className="error-message">{progress.error}</div>}
            </div>
          ))}
          <button onClick={clearProgress} className="clear-button">
            Clear Progress
          </button>
        </div>
      )}
    </div>
  );
}
