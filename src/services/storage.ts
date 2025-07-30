/**
 * Local storage service for persisting data
 */

import type {
  AudioFile,
  TranscriptionResult,
  SummaryResult,
  ProcessingJob,
  AppSettings,
} from '@/models';

export class StorageService {
  private static readonly STORAGE_KEYS = {
    audioFiles: 'transcriber_audio_files',
    transcriptions: 'transcriber_transcriptions',
    summaries: 'transcriber_summaries',
    jobs: 'transcriber_jobs',
    settings: 'transcriber_settings',
  } as const;

  /**
   * Audio Files Storage
   */
  static async saveAudioFile(audioFile: AudioFile): Promise<void> {
    const files = await this.getAudioFiles();
    const existingIndex = files.findIndex(f => f.id === audioFile.id);

    if (existingIndex >= 0) {
      files[existingIndex] = audioFile;
    } else {
      files.push(audioFile);
    }

    localStorage.setItem(this.STORAGE_KEYS.audioFiles, JSON.stringify(files));
  }

  static async getAudioFiles(): Promise<AudioFile[]> {
    const data = localStorage.getItem(this.STORAGE_KEYS.audioFiles);
    return data ? JSON.parse(data) : [];
  }

  static async getAudioFile(id: string): Promise<AudioFile | null> {
    const files = await this.getAudioFiles();
    return files.find(f => f.id === id) || null;
  }

  static async deleteAudioFile(id: string): Promise<void> {
    const files = await this.getAudioFiles();
    const filtered = files.filter(f => f.id !== id);
    localStorage.setItem(this.STORAGE_KEYS.audioFiles, JSON.stringify(filtered));
  }

  /**
   * Transcriptions Storage
   */
  static async saveTranscription(transcription: TranscriptionResult): Promise<void> {
    const transcriptions = await this.getTranscriptions();
    const existingIndex = transcriptions.findIndex(t => t.id === transcription.id);

    if (existingIndex >= 0) {
      transcriptions[existingIndex] = transcription;
    } else {
      transcriptions.push(transcription);
    }

    localStorage.setItem(this.STORAGE_KEYS.transcriptions, JSON.stringify(transcriptions));
  }

  static async getTranscriptions(): Promise<TranscriptionResult[]> {
    const data = localStorage.getItem(this.STORAGE_KEYS.transcriptions);
    return data ? JSON.parse(data) : [];
  }

  static async getTranscriptionsByAudioFile(audioFileId: string): Promise<TranscriptionResult[]> {
    const transcriptions = await this.getTranscriptions();
    return transcriptions.filter(t => t.audioFileId === audioFileId);
  }

  /**
   * Summaries Storage
   */
  static async saveSummary(summary: SummaryResult): Promise<void> {
    const summaries = await this.getSummaries();
    const existingIndex = summaries.findIndex(s => s.id === summary.id);

    if (existingIndex >= 0) {
      summaries[existingIndex] = summary;
    } else {
      summaries.push(summary);
    }

    localStorage.setItem(this.STORAGE_KEYS.summaries, JSON.stringify(summaries));
  }

  static async getSummaries(): Promise<SummaryResult[]> {
    const data = localStorage.getItem(this.STORAGE_KEYS.summaries);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Processing Jobs Storage
   */
  static async saveJob(job: ProcessingJob): Promise<void> {
    const jobs = await this.getJobs();
    const existingIndex = jobs.findIndex(j => j.id === job.id);

    if (existingIndex >= 0) {
      jobs[existingIndex] = job;
    } else {
      jobs.push(job);
    }

    localStorage.setItem(this.STORAGE_KEYS.jobs, JSON.stringify(jobs));
  }

  static async getJobs(): Promise<ProcessingJob[]> {
    const data = localStorage.getItem(this.STORAGE_KEYS.jobs);
    return data ? JSON.parse(data) : [];
  }

  /**
   * App Settings Storage
   */
  static async saveSettings(settings: AppSettings): Promise<void> {
    localStorage.setItem(this.STORAGE_KEYS.settings, JSON.stringify(settings));
  }

  static async getSettings(): Promise<AppSettings | null> {
    const data = localStorage.getItem(this.STORAGE_KEYS.settings);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Clear all stored data
   */
  static async clearAll(): Promise<void> {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}
