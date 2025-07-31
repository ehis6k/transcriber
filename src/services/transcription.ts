/**
 * Local transcription service using Transformers.js
 */

import { pipeline } from '@xenova/transformers';
import type { 
  WhisperModelSize, 
  TranscriptionOptions 
} from '@/models';

export interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
  modelUsed: string;
}

class TranscriptionService {
  private model: any = null;
  private currentModelSize: WhisperModelSize | null = null;
  private isInitializing = false;

  /**
   * Initialize the transcription model
   */
  async initialize(modelSize: WhisperModelSize = 'base'): Promise<boolean> {
    if (this.model && this.currentModelSize === modelSize) {
      return true; // Already initialized with the requested model
    }

    if (this.isInitializing) {
      // Wait for current initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.model !== null;
    }

    this.isInitializing = true;

    try {
      console.log(`Loading Whisper ${modelSize} model...`);
      
      // Load the model from Hugging Face Hub with explicit configuration
      // Use the full Hugging Face Hub URL to avoid local path issues
      const modelName = `Xenova/whisper-${modelSize}`;
      console.log(`Loading model: ${modelName}`);
      
      this.model = await pipeline(
        'automatic-speech-recognition',
        modelName,
        {
          quantized: false, // Disable quantization for better compatibility
          progress_callback: (progress: any) => {
            console.log(`Model loading progress: ${Math.round(progress * 100)}%`);
          }
        }
      );

      this.currentModelSize = modelSize;
      console.log(`Whisper ${modelSize} model loaded successfully`);
      return true;
    } catch (error) {
      console.error('Failed to initialize transcription model:', error);
      this.model = null;
      this.currentModelSize = null;
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Check if the service is ready for transcription
   */
  isReady(): boolean {
    return this.model !== null && !this.isInitializing;
  }

  /**
   * Get the currently loaded model size
   */
  getCurrentModelSize(): WhisperModelSize | null {
    return this.currentModelSize;
  }

  /**
   * Convert audio file to appropriate format for transcription
   */
  private async prepareAudioFile(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read audio file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Transcribe an audio file
   */
  async transcribe(
    audioFile: File,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    const {
      language = 'auto',
      modelSize = 'base',
      returnTimestamps = true,
      chunkLength = 30,
      onProgress,
    } = options;

    // Report initialization progress
    onProgress?.({
      status: 'initializing',
      progress: 0,
      message: 'Preparing transcription...',
    });

    // Initialize model if needed
    if (!this.isReady() || this.currentModelSize !== modelSize) {
      onProgress?.({
        status: 'loading-model',
        progress: 10,
        message: `Loading Whisper ${modelSize} model...`,
      });

      const initialized = await this.initialize(modelSize);
      if (!initialized) {
        throw new Error('Failed to initialize transcription model');
      }
    }

    // Prepare audio file
    onProgress?.({
      status: 'processing',
      progress: 30,
      message: 'Processing audio file...',
    });

    const audioData = await this.prepareAudioFile(audioFile);

    // Configure transcription options
    const transcriptionOptions: any = {
      chunk_length_s: chunkLength,
      stride_length_s: 5, // Overlap for better accuracy
      return_timestamps: returnTimestamps,
      language: language === 'auto' ? undefined : language,
      
      // Progress callback
      callback_function: (data: any) => {
        if (data && typeof data.progress !== 'undefined') {
          const progress = Math.min(30 + (data.progress * 60), 90);
          onProgress?.({
            status: 'processing',
            progress,
            message: 'Transcribing audio...',
          });
        }
      },
    };

    try {
      // Perform transcription
      const result = await this.model(audioData, transcriptionOptions);

      // Process result based on format
      let transcriptionText = '';
      let segments: TranscriptionSegment[] = [];

      if (typeof result === 'string') {
        // Simple text result
        transcriptionText = result;
      } else if (result.text) {
        // Object with text property
        transcriptionText = result.text;
        
        // Extract segments if available
        if (result.chunks && Array.isArray(result.chunks)) {
          segments = result.chunks.map((chunk: any) => ({
            text: chunk.text || '',
            start: chunk.timestamp?.[0] || 0,
            end: chunk.timestamp?.[1] || 0,
          }));
        }
      } else if (Array.isArray(result)) {
        // Array of segments
        segments = result.map((item: any) => ({
          text: item.text || '',
          start: item.start || 0,
          end: item.end || 0,
        }));
        transcriptionText = segments.map(s => s.text).join(' ');
      }

      // Report completion
      onProgress?.({
        status: 'completed',
        progress: 100,
        message: 'Transcription completed!',
      });

      return {
        text: transcriptionText.trim(),
        segments,
        language: result.language || language,
        duration: audioFile.size > 0 ? segments[segments.length - 1]?.end || 0 : 0,
        modelUsed: `whisper-${modelSize}`,
      };
    } catch (error) {
      onProgress?.({
        status: 'error',
        progress: 0,
        message: `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.model = null;
    this.currentModelSize = null;
    this.isInitializing = false;
  }
}

// Export singleton instance
export const transcriptionService = new TranscriptionService();
export default transcriptionService;