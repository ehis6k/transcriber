/**
 * Local text summarization service using Transformers.js
 */

import { pipeline } from '@xenova/transformers';
import type { 
  SummarizationModelSize, 
  SummarizationOptions,
  SummarizationChunk 
} from '@/models';

export interface SummarizationServiceResult {
  summary: string;
  chunks: SummarizationChunk[];
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
  processingTime: number;
  modelUsed: string;
}

class SummarizationService {
  private model: any = null;
  private currentModelSize: SummarizationModelSize | null = null;
  private isInitializing = false;

  /**
   * Get the model name for a given size
   */
  private getModelName(modelSize: SummarizationModelSize): string {
    switch (modelSize) {
      case 'distilbart':
        return 'Xenova/distilbart-cnn-12-6';
      case 'bart':
        return 'Xenova/bart-large-cnn';
      case 't5-small':
        return 'Xenova/t5-small';
      default:
        return 'Xenova/distilbart-cnn-12-6';
    }
  }

  /**
   * Initialize the summarization model
   */
  async initialize(modelSize: SummarizationModelSize = 'distilbart'): Promise<boolean> {
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
      const modelName = this.getModelName(modelSize);
      console.log(`Loading ${modelSize} summarization model: ${modelName}...`);
      
      // Load the summarization model
      this.model = await pipeline('summarization', modelName);

      this.currentModelSize = modelSize;
      console.log(`${modelSize} summarization model loaded successfully`);
      return true;
    } catch (error) {
      console.error('Failed to initialize summarization model:', error);
      this.model = null;
      this.currentModelSize = null;
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Check if the service is ready for summarization
   */
  isReady(): boolean {
    return this.model !== null && !this.isInitializing;
  }

  /**
   * Get the currently loaded model size
   */
  getCurrentModelSize(): SummarizationModelSize | null {
    return this.currentModelSize;
  }

  /**
   * Split text into manageable chunks for summarization
   */
  private chunkText(text: string, maxChunkLength: number = 1000): string[] {
    // Split by sentences first to maintain context
    const sentences = text.split(/[.!?]+\s+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      // If adding this sentence would exceed the limit, save current chunk
      if (currentChunk.length + trimmedSentence.length + 2 > maxChunkLength && currentChunk.length > 0) {
        const chunkToAdd = currentChunk.trim();
        if (chunkToAdd.length > 0) {
          chunks.push(chunkToAdd);
        }
        currentChunk = trimmedSentence;
      } else {
        currentChunk += (currentChunk.length > 0 ? '. ' : '') + trimmedSentence;
      }
    }

    // Add the last chunk if it has content
    const finalChunk = currentChunk.trim();
    if (finalChunk.length > 0) {
      chunks.push(finalChunk);
    }

    // Ensure we always return at least one non-empty chunk
    return chunks.length > 0 ? chunks.filter(chunk => chunk.length > 0) : [text.trim()];
  }

  /**
   * Get summarization parameters based on length preference
   */
  private getSummarizationParams(length: string, textLength: number) {
    switch (length) {
      case 'short':
        return {
          max_length: Math.min(Math.max(Math.floor(textLength * 0.1), 50), 100),
          min_length: Math.max(Math.floor(textLength * 0.05), 20),
        };
      case 'medium':
        return {
          max_length: Math.min(Math.max(Math.floor(textLength * 0.2), 100), 200),
          min_length: Math.max(Math.floor(textLength * 0.1), 50),
        };
      case 'long':
        return {
          max_length: Math.min(Math.max(Math.floor(textLength * 0.3), 150), 300),
          min_length: Math.max(Math.floor(textLength * 0.15), 75),
        };
      default:
        return {
          max_length: Math.min(Math.max(Math.floor(textLength * 0.2), 100), 200),
          min_length: Math.max(Math.floor(textLength * 0.1), 50),
        };
    }
  }

  /**
   * Summarize text using the loaded model
   */
  async summarize(
    text: string,
    options: SummarizationOptions = {}
  ): Promise<SummarizationServiceResult> {
    const {
      modelSize = 'distilbart',
      length = 'medium',
      maxLength,
      minLength,
      onProgress,
    } = options;

    const startTime = Date.now();

    // Report initialization progress
    onProgress?.({
      status: 'initializing',
      progress: 0,
      message: 'Preparing summarization...',
    });

    // Initialize model if needed
    if (!this.isReady() || this.currentModelSize !== modelSize) {
      onProgress?.({
        status: 'loading-model',
        progress: 10,
        message: `Loading ${modelSize} summarization model...`,
      });

      const initialized = await this.initialize(modelSize);
      if (!initialized) {
        throw new Error('Failed to initialize summarization model');
      }
    }

    // Chunk the text
    onProgress?.({
      status: 'chunking',
      progress: 30,
      message: 'Preparing text for summarization...',
    });

    const chunks = this.chunkText(text, 800); // Slightly smaller chunks for summarization
    const chunkResults: SummarizationChunk[] = [];

    onProgress?.({
      status: 'processing',
      progress: 40,
      message: `Processing ${chunks.length} text chunk${chunks.length > 1 ? 's' : ''}...`,
      currentChunk: 0,
      totalChunks: chunks.length,
    });

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]!; // Safe assertion since chunkText ensures no undefined elements

      const chunkProgress = 40 + (i / chunks.length) * 50;

      onProgress?.({
        status: 'processing',
        progress: chunkProgress,
        message: `Summarizing chunk ${i + 1} of ${chunks.length}...`,
        currentChunk: i + 1,
        totalChunks: chunks.length,
      });

      try {
        // Get appropriate parameters for this chunk
        const params = this.getSummarizationParams(length, chunk.length);
        
        // Override with custom length if provided
        const finalParams = {
          max_length: maxLength || params.max_length,
          min_length: minLength || params.min_length,
        };

        // Perform summarization
        const result = await this.model(chunk, finalParams);
        
        let chunkSummary = '';
        if (typeof result === 'string') {
          chunkSummary = result;
        } else if (result && result.summary_text) {
          chunkSummary = result.summary_text;
        } else if (Array.isArray(result) && result[0]?.summary_text) {
          chunkSummary = result[0].summary_text;
        } else {
          console.warn('Unexpected summarization result format:', result);
          chunkSummary = `Summary of chunk ${i + 1}: ${chunk.substring(0, 100)}...`;
        }

        chunkResults.push({
          id: `chunk-${i}`,
          text: chunk,
          summary: chunkSummary.trim(),
          startIndex: text.indexOf(chunk),
          endIndex: text.indexOf(chunk) + chunk.length,
        });
      } catch (error) {
        console.error(`Error summarizing chunk ${i + 1}:`, error);
        // Create a fallback summary for failed chunks
        chunkResults.push({
          id: `chunk-${i}`,
          text: chunk,
          summary: `[Summary unavailable for chunk ${i + 1}]`,
          startIndex: text.indexOf(chunk),
          endIndex: text.indexOf(chunk) + chunk.length,
        });
      }
    }

    // Combine chunk summaries into final summary
    const combinedSummary = chunkResults
      .map(chunk => chunk.summary)
      .filter(summary => !summary.includes('[Summary unavailable'))
      .join(' ');

    // If we have multiple chunks, create an overall summary
    let finalSummary = combinedSummary;
    if (chunks.length > 1 && combinedSummary.length > 0) {
      onProgress?.({
        status: 'processing',
        progress: 95,
        message: 'Creating final summary...',
      });

      try {
        // Summarize the combined chunk summaries for a final coherent summary
        const finalParams = this.getSummarizationParams(length, combinedSummary.length);
        const finalResult = await this.model(combinedSummary, finalParams);
        
        if (typeof finalResult === 'string') {
          finalSummary = finalResult;
        } else if (finalResult && finalResult.summary_text) {
          finalSummary = finalResult.summary_text;
        } else if (Array.isArray(finalResult) && finalResult[0]?.summary_text) {
          finalSummary = finalResult[0].summary_text;
        }
      } catch (error) {
        console.warn('Error creating final summary, using combined chunks:', error);
        // Keep the combined summary as fallback
      }
    }

    const processingTime = Date.now() - startTime;

    onProgress?.({
      status: 'completed',
      progress: 100,
      message: 'Summarization completed!',
    });

    return {
      summary: finalSummary.trim(),
      chunks: chunkResults,
      originalLength: text.length,
      summaryLength: finalSummary.length,
      compressionRatio: Math.round((finalSummary.length / text.length) * 100) / 100,
      processingTime,
      modelUsed: this.getModelName(modelSize),
    };
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
export const summarizationService = new SummarizationService();
export default summarizationService;