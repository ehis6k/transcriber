/**
 * Summarization panel component with controls and results display
 */

import { useState, useEffect } from 'react';
import { useSummarization } from '@/hooks';
import { databaseService } from '@/services';
import type { SummarizationOptions, TranscriptionJobResult } from '@/models';

interface SummarizationPanelProps {
  transcription?: TranscriptionJobResult;
  text?: string;
  className?: string;
  onSummaryGenerated?: (summary: string) => void;
}

export function SummarizationPanel({ 
  transcription, 
  text, 
  className = '',
  onSummaryGenerated 
}: SummarizationPanelProps) {
  const {
    isSummarizing,
    progress,
    result,
    error,
    startSummarization,
    summarizeText,
    cancelSummarization,
    clearResult,
    isModelReady,
    currentModelSize,
  } = useSummarization();

  const [options, setOptions] = useState<SummarizationOptions>({
    language: 'auto',
    modelSize: 'distilbart',
    length: 'medium',
  });

  const sourceText = transcription?.text || text || '';
  const canSummarize = sourceText.trim().length > 50; // Minimum text length for meaningful summarization

  const handleStartSummarization = () => {
    if (transcription) {
      startSummarization(transcription, options);
    } else if (text) {
      summarizeText(text, options);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOptions((prev: SummarizationOptions) => ({
      ...prev,
      language: e.target.value as 'auto' | 'en' | 'nl',
    }));
  };

  const handleModelSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOptions((prev: SummarizationOptions) => ({
      ...prev,
      modelSize: e.target.value as 'distilbart' | 'bart' | 't5-small',
    }));
  };

  const handleLengthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOptions((prev: SummarizationOptions) => ({
      ...prev,
      length: e.target.value as 'short' | 'medium' | 'long',
    }));
  };

  const copyToClipboard = async () => {
    if (result?.summary) {
      try {
        await navigator.clipboard.writeText(result.summary);
        onSummaryGenerated?.(result.summary);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  const getModelDisplayName = (model: string) => {
    switch (model) {
      case 'distilbart':
        return 'DistilBART (Fast)';
      case 'bart':
        return 'BART (Balanced)';
      case 't5-small':
        return 'T5-Small (Comprehensive)';
      default:
        return model;
    }
  };

  const getCompressionDisplay = (ratio: number) => {
    const percentage = Math.round((1 - ratio) * 100);
    return `${percentage}% compression`;
  };

  // Save summary to database when it completes
  useEffect(() => {
    if (result && transcription) {
      const saveToDatabase = async () => {
        try {
          await databaseService.saveSummary(result);
          console.log('Summary saved to database');
        } catch (error) {
          console.error('Failed to save summary to database:', error);
        }
      };

      saveToDatabase();
    }
  }, [result, transcription]);

  if (!canSummarize) {
    return (
      <div className={`summarization-panel ${className}`}>
        <div className="summarization-header">
          <h3>📋 Summarization</h3>
        </div>
        <div className="summarization-disabled">
          <p>📝 No text available for summarization</p>
          <p>Please transcribe an audio file or provide text to generate a summary.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`summarization-panel ${className}`}>
      <div className="summarization-header">
        <h3>📋 Summarization</h3>
        {isModelReady && (
          <span className="model-status">
            Model: {getModelDisplayName(currentModelSize || 'unknown')} ✅
          </span>
        )}
      </div>

      {/* Source Text Info */}
      <div className="source-text-info">
        <span className="source-label">
          {transcription ? '📝 Transcription' : '📄 Text'} ({sourceText.length} characters)
        </span>
      </div>

      {/* Summarization Controls */}
      <div className="summarization-controls">
        <div className="controls-row">
          <div className="control-group">
            <label htmlFor="language-select">Language:</label>
            <select
              id="language-select"
              value={options.language}
              onChange={handleLanguageChange}
              disabled={isSummarizing}
            >
              <option value="auto">Auto-detect</option>
              <option value="en">English</option>
              <option value="nl">Dutch</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="model-size-select">Model:</label>
            <select
              id="model-size-select"
              value={options.modelSize}
              onChange={handleModelSizeChange}
              disabled={isSummarizing}
            >
              <option value="distilbart">DistilBART (Fast)</option>
              <option value="bart">BART (Balanced)</option>
              <option value="t5-small">T5-Small (Comprehensive)</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="length-select">Length:</label>
            <select
              id="length-select"
              value={options.length}
              onChange={handleLengthChange}
              disabled={isSummarizing}
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
        </div>

        <div className="action-buttons">
          {!isSummarizing ? (
            <button
              className="summarize-button"
              onClick={handleStartSummarization}
              disabled={!canSummarize}
            >
              📋 Generate Summary
            </button>
          ) : (
            <button className="cancel-button" onClick={cancelSummarization}>
              ⏹️ Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress Display */}
      {progress && (
        <div className="summarization-progress">
          <div className="progress-header">
            <span className="progress-status">{progress.message}</span>
            <span className="progress-percentage">{Math.round(progress.progress)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${progress.status}`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          {progress.currentChunk && progress.totalChunks && (
            <div className="chunk-progress">
              Processing chunk {progress.currentChunk} of {progress.totalChunks}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="summarization-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button className="clear-error-button" onClick={clearResult}>
            ✕
          </button>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="summarization-results">
          <div className="results-header">
            <h4>📋 Summary</h4>
            <div className="result-actions">
              <button className="copy-button" onClick={copyToClipboard} title="Copy to clipboard">
                📋 Copy
              </button>
              <button className="clear-button" onClick={clearResult} title="Clear result">
                🗑️ Clear
              </button>
            </div>
          </div>

          <div className="result-metadata">
            <span className="metadata-item">Model: {getModelDisplayName(result.modelUsed)}</span>
            <span className="metadata-item">
              Length: {result.summaryLength} chars
            </span>
            <span className="metadata-item">
              {getCompressionDisplay(result.compressionRatio)}
            </span>
            <span className="metadata-item">
              Time: {Math.round(result.processingTime / 1000)}s
            </span>
            {result.chunks.length > 1 && (
              <span className="metadata-item">Chunks: {result.chunks.length}</span>
            )}
          </div>

          <div className="summary-text">
            {result.summary}
          </div>

          {/* Chunk Details */}
          {result.chunks.length > 1 && (
            <div className="summary-chunks">
              <h5>📑 Chunk Summaries</h5>
              <div className="chunks-list">
                {result.chunks.map((chunk, index) => (
                  <div key={chunk.id} className="chunk-item">
                    <div className="chunk-header">
                      <span className="chunk-number">Chunk {index + 1}</span>
                      <span className="chunk-range">
                        {chunk.startIndex}-{chunk.endIndex}
                      </span>
                    </div>
                    <div className="chunk-summary">{chunk.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}