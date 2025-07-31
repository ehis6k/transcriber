/**
 * Application-wide types and interfaces
 */

export type Theme = 'light' | 'dark' | 'system';

export type ExportFormat = 'txt' | 'docx' | 'pdf' | 'markdown';

export interface AppSettings {
  theme: Theme;
  language: 'en' | 'nl';
  autoSave: boolean;
  defaultTranscriptionConfig: import('./audio.js').TranscriptionConfig;
  defaultSummarizationConfig: import('./audio.js').SummarizationConfig;
  exportSettings: ExportSettings;
}

export interface ExportSettings {
  defaultFormat: ExportFormat;
  includeTimestamps: boolean;
  includeSummary: boolean;
  includeMetadata: boolean;
}

export interface AppState {
  isLoading: boolean;
  currentView: 'upload' | 'processing' | 'results' | 'history';
  error?: string;
  notification?: Notification;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'validating' | 'completed' | 'error';
  error?: string | undefined;
  warnings?: string | undefined;
}

export interface ProcessingProgress {
  jobId: string;
  type: 'transcription' | 'summarization';
  progress: number;
  status: string;
  estimatedTimeRemaining?: number;
}
