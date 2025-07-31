/**
 * Audio preview component with playback controls
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { formatDuration } from '@/utils';
import { TranscriptionPanel } from './TranscriptionPanel';
import type { AudioFile } from '@/models';

interface AudioPlayerProps {
  audioFile: AudioFile;
  className?: string;
  onRemove?: (fileId: string) => void;
}

export function AudioPlayer({ audioFile, className = '', onRemove }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create object URL for the audio file
  const audioUrl = useRef<string | null>(null);

  useEffect(() => {
    // Set the blob URL for the audio file
    audioUrl.current = audioFile.path;
    console.log('AudioPlayer: Setting audio URL:', audioUrl.current);
    console.log('AudioPlayer: File format:', audioFile.format);
    console.log('AudioPlayer: File size:', audioFile.size);
    
    // Force the audio element to reload
    if (audioRef.current) {
      audioRef.current.load();
      console.log('AudioPlayer: Forced audio element reload');
    }
    
    // Set a timeout to detect if loading takes too long
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('AudioPlayer: Loading timeout - audio may not be supported');
        setError('Audio loading timeout - file may not be supported');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout
    
    return () => {
      clearTimeout(loadingTimeout);
      if (audioUrl.current && audioUrl.current.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl.current);
      }
    };
  }, [audioFile]);

  const handleLoadedMetadata = useCallback(() => {
    console.log('AudioPlayer: Metadata loaded successfully');
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
      setError(null);
      console.log('AudioPlayer: Duration set to:', audioRef.current.duration);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('AudioPlayer: Error loading audio:', e);
    const target = e.currentTarget;
    const errorCode = target?.error?.code;
    const errorMessage = target?.error?.message;
    
    console.error('AudioPlayer: Error code:', errorCode);
    console.error('AudioPlayer: Error message:', errorMessage);
    
    let userFriendlyError = 'Unable to load audio file';
    if (errorCode === 4) {
      userFriendlyError = 'Audio format not supported by browser';
    } else if (errorCode === 3) {
      userFriendlyError = 'Audio file is corrupted or incomplete';
    } else if (errorCode === 2) {
      userFriendlyError = 'Network error while loading audio';
    }
    
    setError(userFriendlyError);
    setIsLoading(false);
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const togglePlayPause = useCallback(() => {
    console.log('AudioPlayer: Toggle play/pause, isPlaying:', isPlaying, 'error:', error);
    if (!audioRef.current || error) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.error('AudioPlayer: Play failed:', err);
        setError('Unable to play audio file');
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [isPlaying, error]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  const handleStop = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className={`audio-player error ${className}`}>
        <div className="audio-player-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`audio-player ${className}`}>
      <audio
        key={audioFile.id} // Force reload when audio file changes
        ref={audioRef}
        src={audioUrl.current || undefined}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onError={handleError}
        onEnded={handleEnded}
        onLoadStart={() => console.log('AudioPlayer: Load started')}
        onCanPlay={() => console.log('AudioPlayer: Can play')}
        onCanPlayThrough={() => console.log('AudioPlayer: Can play through')}
        preload="metadata"
      />

      <div className="audio-player-header">
        <div className="audio-info">
          <h4 className="audio-title">{audioFile.name}</h4>
          <div className="audio-meta">
            <span className="audio-format">{audioFile.format.toUpperCase()}</span>
            <span className="audio-size">{Math.round(audioFile.size / 1024)} KB</span>
            {duration > 0 && <span className="audio-duration">{formatDuration(duration)}</span>}
          </div>
        </div>
        {onRemove && (
          <button
            className="remove-button"
            onClick={() => onRemove(audioFile.id)}
            title="Remove file"
          >
            ❌
          </button>
        )}
      </div>

      <div className="audio-player-waveform">
        {/* Simple waveform visualization */}
        <div className="waveform-container">
          <div className="waveform-bars">
            {Array.from({ length: 40 }, (_, i) => (
              <div
                key={i}
                className={`waveform-bar ${i < (progressPercentage / 100) * 40 ? 'active' : ''}`}
                style={{
                  height: `${Math.random() * 60 + 20}%`,
                }}
              />
            ))}
          </div>
          <div className="waveform-progress" style={{ width: `${progressPercentage}%` }} />
        </div>
      </div>

      <div className="audio-player-controls">
        <div className="playback-controls">
          <button
            className="control-button stop-button"
            onClick={handleStop}
            disabled={isLoading}
            title="Stop"
          >
            ⏹️
          </button>
          <button
            className="control-button play-pause-button"
            onClick={togglePlayPause}
            disabled={isLoading}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? '⏳' : isPlaying ? '⏸️' : '▶️'}
          </button>
        </div>

        <div className="progress-section">
          <span className="time-display current-time">{formatDuration(currentTime)}</span>
          <input
            type="range"
            className="progress-slider"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            disabled={isLoading || duration === 0}
          />
          <span className="time-display total-time">{formatDuration(duration)}</span>
        </div>

        <div className="volume-section">
          <span className="volume-icon">🔊</span>
          <input
            type="range"
            className="volume-slider"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            disabled={isLoading}
          />
          <span className="volume-display">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      {/* Transcription Panel */}
      <TranscriptionPanel audioFile={audioFile} />
    </div>
  );
}
