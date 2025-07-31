/**
 * Export dialog component for transcriptions and summaries
 */

import { useState } from 'react';
import { ExportService, type ExportOptions, type ExportProgress } from '@/services';
import type { TranscriptionJobResult, SummarizationResult } from '@/models';

interface ExportDialogProps {
  transcription: TranscriptionJobResult;
  summary?: SummarizationResult | undefined;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function ExportDialog({ 
  transcription, 
  summary, 
  isOpen, 
  onClose, 
  className = '' 
}: ExportDialogProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeMetadata: true,
    includeMarkdown: false,
    format: 'txt'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFormatChange = (format: ExportOptions['format']) => {
    setExportOptions(prev => ({ ...prev, format }));
  };

  const handleMetadataToggle = () => {
    setExportOptions(prev => ({ ...prev, includeMetadata: !prev.includeMetadata }));
  };

  const handleMarkdownToggle = () => {
    setExportOptions(prev => ({ ...prev, includeMarkdown: !prev.includeMarkdown }));
  };

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setError(null);
    setProgress({
      status: 'preparing',
      message: 'Preparing export...',
      progress: 0
    });

    try {
      await ExportService.exportTranscription(
        transcription,
        summary,
        exportOptions,
        (progressUpdate) => {
          setProgress(progressUpdate);
          if (progressUpdate.status === 'complete') {
            setTimeout(() => {
              onClose();
              setIsExporting(false);
              setProgress(null);
            }, 1500);
          } else if (progressUpdate.status === 'error') {
            setError(progressUpdate.message);
            setIsExporting(false);
          }
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      setIsExporting(false);
      setProgress(null);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
      setError(null);
      setProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`export-dialog-overlay ${className}`}>
      <div className="export-dialog">
        <div className="dialog-header">
          <h3>📤 Export Transcription</h3>
          <button 
            className="close-button" 
            onClick={handleClose}
            disabled={isExporting}
          >
            ✕
          </button>
        </div>

        <div className="dialog-content">
          {/* Format Selection */}
          <div className="format-section">
            <h4>📄 Export Format</h4>
            <div className="format-options">
              <label className="format-option">
                <input
                  type="radio"
                  name="format"
                  value="txt"
                  checked={exportOptions.format === 'txt'}
                  onChange={() => handleFormatChange('txt')}
                  disabled={isExporting}
                />
                <span className="format-label">
                  <span className="format-icon">📝</span>
                  <span className="format-name">Text File (.txt)</span>
                  <span className="format-desc">Plain text with timestamps</span>
                </span>
              </label>

              <label className="format-option">
                <input
                  type="radio"
                  name="format"
                  value="docx"
                  checked={exportOptions.format === 'docx'}
                  onChange={() => handleFormatChange('docx')}
                  disabled={isExporting}
                />
                <span className="format-label">
                  <span className="format-icon">📄</span>
                  <span className="format-name">Word Document (.docx)</span>
                  <span className="format-desc">Formatted document with styles</span>
                </span>
              </label>

              <label className="format-option">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={exportOptions.format === 'pdf'}
                  onChange={() => handleFormatChange('pdf')}
                  disabled={isExporting}
                />
                <span className="format-label">
                  <span className="format-icon">📋</span>
                  <span className="format-name">PDF Document (.pdf)</span>
                  <span className="format-desc">Portable document format</span>
                </span>
              </label>
            </div>
          </div>

          {/* Options */}
          <div className="options-section">
            <h4>⚙️ Export Options</h4>
            <div className="option-group">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={exportOptions.includeMetadata}
                  onChange={handleMetadataToggle}
                  disabled={isExporting}
                />
                <span className="option-label">
                  📊 Include metadata (source file, language, model, etc.)
                </span>
              </label>

              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={exportOptions.includeMarkdown}
                  onChange={handleMarkdownToggle}
                  disabled={isExporting}
                />
                <span className="option-label">
                  📝 Use markdown formatting (for better readability)
                </span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="preview-section">
            <h4>👀 Preview</h4>
            <div className="preview-content">
              <div className="preview-item">
                <span className="preview-label">Format:</span>
                <span className="preview-value">
                  {exportOptions.format.toUpperCase()}
                  {exportOptions.includeMarkdown && ' (Markdown)'}
                </span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Content:</span>
                <span className="preview-value">
                  Transcription
                  {summary && ' + Summary'}
                  {exportOptions.includeMetadata && ' + Metadata'}
                </span>
              </div>
              <div className="preview-item">
                <span className="preview-label">File size:</span>
                <span className="preview-value">
                  ~{Math.round(transcription.text.length / 1000)}KB
                  {summary && ` + ~${Math.round(summary.summary.length / 1000)}KB`}
                </span>
              </div>
            </div>
          </div>

          {/* Progress */}
          {progress && (
            <div className="progress-section">
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
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="error-section">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          )}
        </div>

        <div className="dialog-actions">
          <button
            className="cancel-button"
            onClick={handleClose}
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            className="export-button"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
} 