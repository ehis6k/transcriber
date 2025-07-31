/**
 * Transcription panel component with controls and results display
 */

import { useState, useEffect } from 'react';
import { useTranscription, useLanguageDetection } from '@/hooks';
import { databaseService } from '@/services';
import { SummarizationPanel } from './SummarizationPanel';
import { TranscriptDisplay } from './TranscriptDisplay';
import type { AudioFile, TranscriptionOptions, TranscriptionLanguage } from '@/models';

interface TranscriptionPanelProps {
  audioFile: AudioFile;
  className?: string;
}

export function TranscriptionPanel({ audioFile, className = '' }: TranscriptionPanelProps) {
  const {
    isTranscribing,
    progress,
    result,
    error,
    startTranscription,
    cancelTranscription,
    clearResult,
    isModelReady,
    currentModelSize,
  } = useTranscription();

  const {
    preferences,
    detectLanguage,
    getLanguageDisplayName,
    getLanguageFlag,
  } = useLanguageDetection();

  const [options, setOptions] = useState<TranscriptionOptions>({
    language: preferences.defaultLanguage,
    modelSize: 'base',
    returnTimestamps: true,
  });

  // Auto-detect language and save to database when transcription completes
  useEffect(() => {
    if (result?.text) {
      // Auto-detect language if needed
      if (options.language === 'auto') {
        const detection = detectLanguage(result.text);
        if (detection.isReliable && detection.detectedLanguage !== 'auto') {
          setOptions(prev => ({
            ...prev,
            language: detection.detectedLanguage,
          }));
        }
      }

      // Save transcription to database
      const saveToDatabase = async () => {
        try {
          await databaseService.saveTranscription(result);
          console.log('Transcription saved to database');
        } catch (error) {
          console.error('Failed to save transcription to database:', error);
        }
      };

      saveToDatabase();
    }
  }, [result?.text, options.language, detectLanguage]);

  const handleStartTranscription = () => {
    startTranscription(audioFile, options);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOptions((prev: TranscriptionOptions) => ({
      ...prev,
      language: e.target.value as 'auto' | 'en' | 'nl',
    }));
  };

  const handleModelSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOptions((prev: TranscriptionOptions) => ({
      ...prev,
      modelSize: e.target.value as 'tiny' | 'base' | 'small',
    }));
  };

  const handleTimestampsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prev: TranscriptionOptions) => ({
      ...prev,
      returnTimestamps: e.target.checked,
    }));
  };



  return (
    <div className={`transcription-panel ${className}`}>
      <div className="transcription-header">
        <h3>🎤 Transcription</h3>
        {isModelReady && (
          <span className="model-status">
            Model: {currentModelSize || 'Unknown'} ✅
          </span>
        )}
      </div>

      {/* Transcription Controls */}
      <div className="transcription-controls">
        <div className="controls-row">
                           <div className="control-group">
                   <label htmlFor="language-select">Language:</label>
                   <div className="language-select-container">
                     <select
                       id="language-select"
                       value={options.language}
                       onChange={handleLanguageChange}
                       disabled={isTranscribing}
                     >
                       <option value="auto">🌐 Auto-detect</option>
                       <option value="en">🇺🇸 English</option>
                       <option value="nl">🇳🇱 Dutch</option>
                     </select>
                     {result?.text && options.language === 'auto' && (
                       <div className="language-detection-info">
                         <span className="detection-status">
                           {getLanguageFlag(result.language as TranscriptionLanguage)} {getLanguageDisplayName(result.language as TranscriptionLanguage)}
                         </span>
                       </div>
                     )}
                   </div>
                 </div>

          <div className="control-group">
            <label htmlFor="model-size-select">Model Size:</label>
            <select
              id="model-size-select"
              value={options.modelSize}
              onChange={handleModelSizeChange}
              disabled={isTranscribing}
            >
              <option value="tiny">Tiny (Fast)</option>
              <option value="base">Base (Balanced)</option>
              <option value="small">Small (Accurate)</option>
            </select>
          </div>
        </div>

        <div className="controls-row">
          <div className="control-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.returnTimestamps || false}
                onChange={handleTimestampsChange}
                disabled={isTranscribing}
              />
              Include timestamps
            </label>
          </div>

          <div className="action-buttons">
            {!isTranscribing ? (
              <button
                className="transcribe-button"
                onClick={handleStartTranscription}
                disabled={!audioFile}
              >
                🎤 Start Transcription
              </button>
            ) : (
              <button className="cancel-button" onClick={cancelTranscription}>
                ⏹️ Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Display */}
      {progress && (
        <div className="transcription-progress">
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

      {/* Error Display */}
      {error && (
        <div className="transcription-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button className="clear-error-button" onClick={clearResult}>
            ✕
          </button>
        </div>
      )}

      {/* Enhanced Results Display */}
      {result && (
        <TranscriptDisplay
          transcription={result}
          onSegmentClick={(segment) => {
            console.log('Segment clicked:', segment);
            // Could integrate with audio player to jump to timestamp
          }}
          onEditTranscript={(newText) => {
            console.log('Transcript edited:', newText);
            // Could implement transcript editing functionality
          }}
        />
      )}

      {/* Summarization Panel - Show when transcription is complete */}
      {result && (
        <SummarizationPanel 
          transcription={result} 
          onSummaryGenerated={(summary) => {
            console.log('Summary generated:', summary);
            // Could integrate summary with TranscriptDisplay
          }}
        />
      )}
    </div>
  );
}