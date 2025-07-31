/**
 * Enhanced transcript and summary display interface
 */

import { useState, useRef, useEffect } from 'react';
import { ExportDialog } from './ExportDialog';
import type { 
  TranscriptionJobResult, 
  SummarizationResult,
  TranscriptionSegment 
} from '@/models';

interface TranscriptDisplayProps {
  transcription: TranscriptionJobResult;
  summary?: SummarizationResult | undefined;
  className?: string;
  onSegmentClick?: (segment: TranscriptionSegment) => void;
  onEditTranscript?: (newText: string) => void;
}

export function TranscriptDisplay({ 
  transcription, 
  summary, 
  className = '',
  onSegmentClick,
  onEditTranscript 
}: TranscriptDisplayProps) {
  const [activeView, setActiveView] = useState<'transcript' | 'summary' | 'split'>('split');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcription.text);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Update edited text when transcription changes
  useEffect(() => {
    setEditedText(transcription.text);
  }, [transcription.text]);

  const handleSegmentClick = (segment: TranscriptionSegment) => {
    setSelectedSegment(selectedSegment === segment.id ? null : segment.id);
    onSegmentClick?.(segment);
  };

  const handleEditSave = () => {
    if (onEditTranscript && editedText !== transcription.text) {
      onEditTranscript(editedText);
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditedText(transcription.text);
    setIsEditing(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const scrollToSegment = (segmentId: string) => {
    const element = document.getElementById(`segment-${segmentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className={`transcript-display ${className}`}>
      {/* View Controls */}
      <div className="view-controls">
        <div className="view-tabs">
          <button
            className={`view-tab ${activeView === 'transcript' ? 'active' : ''}`}
            onClick={() => setActiveView('transcript')}
          >
            📝 Transcript
          </button>
          <button
            className={`view-tab ${activeView === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveView('summary')}
            disabled={!summary}
          >
            📋 Summary {summary && `(${summary.compressionRatio.toFixed(1)}% shorter)`}
          </button>
          <button
            className={`view-tab ${activeView === 'split' ? 'active' : ''}`}
            onClick={() => setActiveView('split')}
            disabled={!summary}
          >
            📊 Split View
          </button>
        </div>

        <div className="view-actions">
          <button
            className="action-button"
            onClick={() => copyToClipboard(transcription.text)}
            title="Copy transcript"
          >
            📋 Copy
          </button>
          <button
            className="action-button"
            onClick={() => setShowExportDialog(true)}
            title="Export transcription"
          >
            📤 Export
          </button>
          {onEditTranscript && (
            <button
              className="action-button"
              onClick={() => setIsEditing(!isEditing)}
              title="Edit transcript"
            >
              ✏️ Edit
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {/* Transcript View */}
        {(activeView === 'transcript' || activeView === 'split') && (
          <div className={`transcript-section ${activeView === 'split' ? 'split' : 'full'}`}>
            <div className="section-header">
              <h3>📝 Transcript</h3>
              <div className="transcript-stats">
                <span>{transcription.text.length} characters</span>
                <span>{transcription.segments.length} segments</span>
                <span>{formatTimestamp(transcription.duration)} duration</span>
              </div>
            </div>

            <div className="transcript-content" ref={transcriptRef}>
              {isEditing ? (
                <div className="edit-mode">
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="transcript-editor"
                    placeholder="Edit transcript text..."
                  />
                  <div className="edit-actions">
                    <button onClick={handleEditSave} className="save-button">
                      💾 Save
                    </button>
                    <button onClick={handleEditCancel} className="cancel-button">
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="transcript-text">
                  {transcription.segments.length > 0 ? (
                    <div className="segments-container">
                      {transcription.segments.map((segment: TranscriptionSegment) => (
                        <div
                          key={segment.id}
                          id={`segment-${segment.id}`}
                          className={`segment-item ${selectedSegment === segment.id ? 'selected' : ''}`}
                          onClick={() => handleSegmentClick(segment)}
                        >
                          <div className="segment-timestamp">
                            <span className="timestamp">
                              {formatTimestamp(segment.startTime)}
                            </span>
                            {segment.confidence && (
                              <span className={`confidence ${segment.confidence > 0.8 ? 'high' : segment.confidence > 0.6 ? 'medium' : 'low'}`}>
                                {Math.round(segment.confidence * 100)}%
                              </span>
                            )}
                          </div>
                          <div className="segment-text">{segment.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="full-text">{transcription.text}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary View */}
        {(activeView === 'summary' || activeView === 'split') && summary && (
          <div className={`summary-section ${activeView === 'split' ? 'split' : 'full'}`}>
            <div className="section-header">
              <h3>📋 Summary</h3>
              <div className="summary-stats">
                <span>{summary.summaryLength} characters</span>
                <span>{summary.compressionRatio.toFixed(1)}% shorter</span>
                <span>{summary.processingTime / 1000}s processing</span>
              </div>
            </div>

            <div className="summary-content" ref={summaryRef}>
              <div className="summary-text">{summary.summary}</div>

              {/* Summary Chunks */}
              {summary.chunks.length > 1 && (
                <div className="summary-chunks">
                  <h4>📦 Chunked Summary</h4>
                  <div className="chunks-container">
                    {summary.chunks.map((chunk) => (
                      <div key={chunk.id} className="chunk-item">
                        <div className="chunk-header">
                          <span className="chunk-range">
                            Chars {chunk.startIndex}-{chunk.endIndex}
                          </span>
                        </div>
                        <div className="chunk-summary">{chunk.summary}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Panel */}
      {transcription.segments.length > 0 && (
        <div className="navigation-panel">
          <h4>📍 Quick Navigation</h4>
          <div className="navigation-segments">
            {transcription.segments.slice(0, 10).map((segment: TranscriptionSegment) => (
              <button
                key={segment.id}
                className={`nav-segment ${selectedSegment === segment.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedSegment(segment.id);
                  scrollToSegment(segment.id);
                }}
              >
                <span className="nav-timestamp">{formatTimestamp(segment.startTime)}</span>
                <span className="nav-text">{segment.text.substring(0, 30)}...</span>
              </button>
            ))}
            {transcription.segments.length > 10 && (
              <div className="nav-more">
                +{transcription.segments.length - 10} more segments
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Dialog */}
      <ExportDialog
        transcription={transcription}
        summary={summary}
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
    </div>
  );
} 