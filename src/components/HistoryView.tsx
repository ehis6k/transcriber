/**
 * History view component for displaying transcription history
 */

import { useState, useEffect } from 'react';
import { databaseService, type TranscriptionHistoryFilters, type TranscriptionHistoryResult } from '@/services';
import { TranscriptDisplay } from './TranscriptDisplay';
import type { TranscriptionJobResult, SummarizationResult } from '@/models';

interface HistoryViewProps {
  className?: string;
}

export function HistoryView({ className = '' }: HistoryViewProps) {
  const [history, setHistory] = useState<TranscriptionHistoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TranscriptionHistoryFilters>({
    limit: 20,
    offset: 0
  });
  const [selectedTranscription, setSelectedTranscription] = useState<TranscriptionJobResult | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<SummarizationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState<{
    totalTranscriptions: number;
    totalSummaries: number;
    totalDuration: number;
    averageConfidence: number;
    mostUsedLanguage: string;
    mostUsedModel: string;
  } | null>(null);

  // Load history data
  const loadHistory = async (newFilters?: TranscriptionHistoryFilters) => {
    setLoading(true);
    setError(null);

    try {
      const historyData = await databaseService.getTranscriptionHistory(newFilters || filters);
      setHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  // Load database statistics
  const loadStats = async () => {
    try {
      const databaseStats = await databaseService.getDatabaseStats();
      setStats(databaseStats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  // Load initial data
  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<TranscriptionHistoryFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, offset: 0 };
    setFilters(updatedFilters);
    loadHistory(updatedFilters);
  };

  // Handle search
  const handleSearch = (searchText: string) => {
    handleFilterChange({ searchText: searchText || undefined });
  };

  // Handle pagination
  const handleLoadMore = () => {
    if (history?.hasMore) {
      const newFilters = { ...filters, offset: (filters.offset || 0) + (filters.limit || 20) };
      setFilters(newFilters);
      loadHistory(newFilters);
    }
  };

  // Handle transcription selection
  const handleTranscriptionSelect = (transcription: any) => {
    const transcriptionResult: TranscriptionJobResult = {
      id: transcription.id,
      audioFileId: transcription.audio_file_id,
      text: transcription.text,
      segments: [], // We don't store segments in history, so empty array
      language: transcription.language,
      modelUsed: transcription.model_used,
      duration: transcription.duration,
      confidence: transcription.confidence,
      createdAt: new Date(transcription.created_at),
      updatedAt: new Date(transcription.updated_at)
    };

    setSelectedTranscription(transcriptionResult);

    if (transcription.summary) {
      const summaryResult: SummarizationResult = {
        id: transcription.summary.id,
        transcriptionId: transcription.id,
        summary: transcription.summary.summary,
        chunks: [], // We don't store chunks in history
        language: transcription.language,
        modelUsed: transcription.model_used,
        originalLength: 0, // Not stored in history
        summaryLength: 0, // Not stored in history
        compressionRatio: transcription.summary.compression_ratio,
        processingTime: transcription.summary.processing_time,
        createdAt: new Date(transcription.created_at)
      };
      setSelectedSummary(summaryResult);
    } else {
      setSelectedSummary(null);
    }

    setShowDetails(true);
  };

  // Handle deletion
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transcription? This action cannot be undone.')) {
      return;
    }

    try {
      await databaseService.deleteTranscription(id);
      loadHistory(); // Reload history
      loadStats(); // Reload stats
      
      // Clear selection if deleted item was selected
      if (selectedTranscription?.id === id) {
        setSelectedTranscription(null);
        setSelectedSummary(null);
        setShowDetails(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transcription');
    }
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className={`history-view ${className}`}>
      {/* Header */}
      <div className="history-header">
        <h2>📚 Transcription History</h2>
        {stats && (
          <div className="history-stats">
            <div className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{stats.totalTranscriptions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Summaries:</span>
              <span className="stat-value">{stats.totalSummaries}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Duration:</span>
              <span className="stat-value">{formatDuration(stats.totalDuration)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg Confidence:</span>
              <span className="stat-value">{Math.round(stats.averageConfidence * 100)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="history-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="🔍 Search transcriptions and summaries..."
            className="search-input"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <select
            className="filter-select"
            onChange={(e) => handleFilterChange({ language: e.target.value || undefined })}
          >
            <option value="">🌍 All Languages</option>
            <option value="en">🇺🇸 English</option>
            <option value="nl">🇳🇱 Dutch</option>
          </select>
          
          <select
            className="filter-select"
            onChange={(e) => handleFilterChange({ modelUsed: e.target.value || undefined })}
          >
            <option value="">🤖 All Models</option>
            <option value="whisper-tiny">Whisper Tiny</option>
            <option value="whisper-base">Whisper Base</option>
            <option value="whisper-small">Whisper Small</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="history-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button className="retry-button" onClick={() => loadHistory()}>
            🔄 Retry
          </button>
        </div>
      )}

      {/* History List */}
      <div className="history-content">
        {loading && !history ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <span>Loading transcription history...</span>
          </div>
        ) : history?.transcriptions.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📝</span>
            <h3>No transcriptions yet</h3>
            <p>Your transcription history will appear here once you start transcribing audio files.</p>
          </div>
        ) : (
          <div className="history-list">
            {history?.transcriptions.map((transcription) => (
              <div
                key={transcription.id}
                className={`history-item ${selectedTranscription?.id === transcription.id ? 'selected' : ''}`}
                onClick={() => handleTranscriptionSelect(transcription)}
              >
                <div className="item-header">
                  <div className="item-meta">
                    <span className="item-date">{formatDate(transcription.created_at)}</span>
                    <span className="item-duration">{formatDuration(transcription.duration)}</span>
                    <span className="item-language">🌍 {transcription.language}</span>
                    <span className="item-model">🤖 {transcription.model_used}</span>
                  </div>
                  <div className="item-actions">
                    <button
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(transcription.id);
                      }}
                      title="Delete transcription"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="item-content">
                  <div className="item-text">
                    {transcription.text.length > 200 
                      ? transcription.text.substring(0, 200) + '...'
                      : transcription.text
                    }
                  </div>
                  
                  {transcription.confidence && (
                    <div className="item-confidence">
                      <span className={`confidence-badge ${transcription.confidence > 0.8 ? 'high' : transcription.confidence > 0.6 ? 'medium' : 'low'}`}>
                        {Math.round(transcription.confidence * 100)}% confidence
                      </span>
                    </div>
                  )}
                  
                  {transcription.summary && (
                    <div className="item-summary">
                      <span className="summary-icon">📋</span>
                      <span className="summary-text">
                        {transcription.summary.summary.length > 100 
                          ? transcription.summary.summary.substring(0, 100) + '...'
                          : transcription.summary.summary
                        }
                      </span>
                      <span className="summary-ratio">
                        ({transcription.summary.compression_ratio.toFixed(1)}% shorter)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {history?.hasMore && (
              <div className="load-more">
                <button 
                  className="load-more-button"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : '📄 Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Panel */}
      {showDetails && selectedTranscription && (
        <div className="details-panel">
          <div className="details-header">
            <h3>📝 Transcription Details</h3>
            <button 
              className="close-details-button"
              onClick={() => setShowDetails(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="details-content">
            <TranscriptDisplay
              transcription={selectedTranscription}
              summary={selectedSummary || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
} 