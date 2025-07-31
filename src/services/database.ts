/**
 * Database service for managing transcription history, summaries, and user preferences
 */

import Database from '@tauri-apps/plugin-sql';
import type { 
  TranscriptionJobResult, 
  SummarizationResult
} from '@/models';

export interface TranscriptionRecord {
  id: string;
  audio_file_id: string;
  text: string;
  language: string;
  model_used: string;
  duration: number;
  confidence?: number;
  created_at: string;
  updated_at: string;
}

export interface SummaryRecord {
  id: string;
  transcription_id: string;
  summary: string;
  language: string;
  model_used: string;
  original_length: number;
  summary_length: number;
  compression_ratio: number;
  processing_time: number;
  created_at: string;
}

export interface UserPreference {
  key: string;
  value: string;
  updated_at: string;
}

export interface TranscriptionHistoryFilters {
  language?: string | undefined;
  modelUsed?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  searchText?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export interface TranscriptionHistoryResult {
  transcriptions: (TranscriptionRecord & { summary?: SummaryRecord | undefined })[];
  total: number;
  hasMore: boolean;
}

class DatabaseService {
  private db: Database | null = null;
  private isInitialized = false;

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Use the v1 API - Database.load for initialization
      this.db = await Database.load('sqlite:transcription_history.db');
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw new Error('Database initialization failed');
    }
  }

  /**
   * Save a transcription result to the database
   */
  async saveTranscription(transcription: TranscriptionJobResult): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.db!.execute(
        `INSERT OR REPLACE INTO transcriptions (
          id, audio_file_id, text, language, model_used, duration, confidence, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transcription.id,
          transcription.audioFileId,
          transcription.text,
          transcription.language,
          transcription.modelUsed,
          transcription.duration,
          transcription.confidence || null,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error('Failed to save transcription:', error);
      throw new Error('Failed to save transcription to database');
    }
  }

  /**
   * Save a summary result to the database
   */
  async saveSummary(summary: SummarizationResult): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.db!.execute(
        `INSERT OR REPLACE INTO summaries (
          id, transcription_id, summary, language, model_used, 
          original_length, summary_length, compression_ratio, processing_time, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          summary.id,
          summary.transcriptionId,
          summary.summary,
          summary.language,
          summary.modelUsed,
          summary.originalLength,
          summary.summaryLength,
          summary.compressionRatio,
          summary.processingTime,
          new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error('Failed to save summary:', error);
      throw new Error('Failed to save summary to database');
    }
  }

  /**
   * Get transcription history with optional filters
   */
  async getTranscriptionHistory(filters: TranscriptionHistoryFilters = {}): Promise<TranscriptionHistoryResult> {
    await this.ensureInitialized();

    try {
      let query = `
        SELECT t.*, s.id as summary_id, s.summary, s.compression_ratio, s.processing_time
        FROM transcriptions t
        LEFT JOIN summaries s ON t.id = s.transcription_id
        WHERE 1=1
      `;
      const params: any[] = [];

      // Apply filters
      if (filters.language) {
        query += ' AND t.language = ?';
        params.push(filters.language);
      }

      if (filters.modelUsed) {
        query += ' AND t.model_used = ?';
        params.push(filters.modelUsed);
      }

      if (filters.dateFrom) {
        query += ' AND t.created_at >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        query += ' AND t.created_at <= ?';
        params.push(filters.dateTo);
      }

      if (filters.searchText) {
        query += ' AND (t.text LIKE ? OR s.summary LIKE ?)';
        const searchPattern = `%${filters.searchText}%`;
        params.push(searchPattern, searchPattern);
      }

      // Get total count
      const countQuery = query.replace('SELECT t.*, s.id as summary_id, s.summary, s.compression_ratio, s.processing_time', 'SELECT COUNT(*) as total');
      const countResult = await this.db!.select(countQuery, params) as any[];
      const total = countResult[0]?.total || 0;

      // Add ordering and pagination
      query += ' ORDER BY t.created_at DESC';
      
      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
        
        if (filters.offset) {
          query += ' OFFSET ?';
          params.push(filters.offset);
        }
      }

      const results = await this.db!.select(query, params) as any[];

      // Transform results
      const transcriptions = results.map((row: any) => ({
        id: row.id,
        audio_file_id: row.audio_file_id,
        text: row.text,
        language: row.language,
        model_used: row.model_used,
        duration: row.duration,
        confidence: row.confidence,
        created_at: row.created_at,
        updated_at: row.updated_at,
        summary: row.summary_id ? {
          id: row.summary_id,
          transcription_id: row.id,
          summary: row.summary,
          language: row.language,
          model_used: row.model_used,
          original_length: 0, // Not stored in this query
          summary_length: 0, // Not stored in this query
          compression_ratio: row.compression_ratio,
          processing_time: row.processing_time,
          created_at: row.created_at
        } : undefined
      }));

      return {
        transcriptions,
        total,
        hasMore: filters.limit ? (filters.offset || 0) + transcriptions.length < total : false
      };
    } catch (error) {
      console.error('Failed to get transcription history:', error);
      throw new Error('Failed to retrieve transcription history');
    }
  }

  /**
   * Get a single transcription by ID
   */
  async getTranscription(id: string): Promise<TranscriptionRecord | null> {
    await this.ensureInitialized();

    try {
      const results = await this.db!.select(
        'SELECT * FROM transcriptions WHERE id = ?',
        [id]
      ) as any[];

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Failed to get transcription:', error);
      throw new Error('Failed to retrieve transcription');
    }
  }

  /**
   * Get summary for a transcription
   */
  async getSummary(transcriptionId: string): Promise<SummaryRecord | null> {
    await this.ensureInitialized();

    try {
      const results = await this.db!.select(
        'SELECT * FROM summaries WHERE transcription_id = ?',
        [transcriptionId]
      ) as any[];

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Failed to get summary:', error);
      throw new Error('Failed to retrieve summary');
    }
  }

  /**
   * Delete a transcription and its associated summary
   */
  async deleteTranscription(id: string): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.db!.execute('DELETE FROM summaries WHERE transcription_id = ?', [id]);
      await this.db!.execute('DELETE FROM transcriptions WHERE id = ?', [id]);
    } catch (error) {
      console.error('Failed to delete transcription:', error);
      throw new Error('Failed to delete transcription');
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<Record<string, string>> {
    await this.ensureInitialized();

    try {
      const results = await this.db!.select('SELECT key, value FROM user_preferences') as any[];
      
      const preferences: Record<string, string> = {};
      results.forEach((row: UserPreference) => {
        preferences[row.key] = row.value;
      });

      return preferences;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      throw new Error('Failed to retrieve user preferences');
    }
  }

  /**
   * Get a specific user preference
   */
  async getUserPreference(key: string): Promise<string | null> {
    await this.ensureInitialized();

    try {
      const results = await this.db!.select(
        'SELECT value FROM user_preferences WHERE key = ?',
        [key]
      ) as any[];

      return results.length > 0 ? results[0].value : null;
    } catch (error) {
      console.error('Failed to get user preference:', error);
      throw new Error('Failed to retrieve user preference');
    }
  }

  /**
   * Set a user preference
   */
  async setUserPreference(key: string, value: string): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.db!.execute(
        `INSERT OR REPLACE INTO user_preferences (key, value, updated_at) 
         VALUES (?, ?, ?)`,
        [key, value, new Date().toISOString()]
      );
    } catch (error) {
      console.error('Failed to set user preference:', error);
      throw new Error('Failed to save user preference');
    }
  }

  /**
   * Delete a user preference
   */
  async deleteUserPreference(key: string): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.db!.execute('DELETE FROM user_preferences WHERE key = ?', [key]);
    } catch (error) {
      console.error('Failed to delete user preference:', error);
      throw new Error('Failed to delete user preference');
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    totalTranscriptions: number;
    totalSummaries: number;
    totalDuration: number;
    averageConfidence: number;
    mostUsedLanguage: string;
    mostUsedModel: string;
  }> {
    await this.ensureInitialized();

    try {
      const stats = await this.db!.select(`
        SELECT 
          COUNT(DISTINCT t.id) as total_transcriptions,
          COUNT(DISTINCT s.id) as total_summaries,
          SUM(t.duration) as total_duration,
          AVG(t.confidence) as avg_confidence,
          t.language as most_used_language,
          t.model_used as most_used_model
        FROM transcriptions t
        LEFT JOIN summaries s ON t.id = s.transcription_id
        GROUP BY t.language, t.model_used
        ORDER BY COUNT(t.id) DESC
        LIMIT 1
      `) as any[];

      const result = stats[0] || {
        total_transcriptions: 0,
        total_summaries: 0,
        total_duration: 0,
        avg_confidence: 0,
        most_used_language: 'Unknown',
        most_used_model: 'Unknown'
      };

      return {
        totalTranscriptions: result.total_transcriptions || 0,
        totalSummaries: result.total_summaries || 0,
        totalDuration: result.total_duration || 0,
        averageConfidence: result.avg_confidence || 0,
        mostUsedLanguage: result.most_used_language || 'Unknown',
        mostUsedModel: result.most_used_model || 'Unknown'
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw new Error('Failed to retrieve database statistics');
    }
  }

  /**
   * Export database to JSON
   */
  async exportDatabase(): Promise<{
    transcriptions: TranscriptionRecord[];
    summaries: SummaryRecord[];
    preferences: UserPreference[];
    exportDate: string;
  }> {
    await this.ensureInitialized();

    try {
      const transcriptions = await this.db!.select('SELECT * FROM transcriptions ORDER BY created_at DESC') as TranscriptionRecord[];
      const summaries = await this.db!.select('SELECT * FROM summaries ORDER BY created_at DESC') as SummaryRecord[];
      const preferences = await this.db!.select('SELECT * FROM user_preferences') as UserPreference[];

      return {
        transcriptions,
        summaries,
        preferences,
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to export database:', error);
      throw new Error('Failed to export database');
    }
  }

  /**
   * Clear all data (for testing or reset purposes)
   */
  async clearAllData(): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.db!.execute('DELETE FROM summaries');
      await this.db!.execute('DELETE FROM transcriptions');
      await this.db!.execute('DELETE FROM user_preferences');
    } catch (error) {
      console.error('Failed to clear database:', error);
      throw new Error('Failed to clear database');
    }
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService(); 