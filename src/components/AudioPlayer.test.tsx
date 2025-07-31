/**
 * Tests for the AudioPlayer component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AudioPlayer } from './AudioPlayer';
import type { AudioFile } from '@/models';

describe('AudioPlayer', () => {
  const mockAudioFile: AudioFile = {
    id: 'test-audio-1',
    name: 'test-audio.mp3',
    path: '/path/to/test-audio.mp3',
    size: 5242880, // 5MB
    format: 'mp3',
    uploadedAt: new Date('2024-01-01'),
    lastModified: new Date('2024-01-01'),
  };

  it('renders audio player with file information', () => {
    render(<AudioPlayer audioFile={mockAudioFile} />);

    expect(screen.getByText('test-audio.mp3')).toBeInTheDocument();
    expect(screen.getByText('MP3')).toBeInTheDocument();
    expect(screen.getByText('5120 KB')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<AudioPlayer audioFile={mockAudioFile} />);

    const playButton = screen.getByTitle('Play');
    expect(playButton).toBeInTheDocument();
    expect(playButton).toHaveTextContent('⏳');
    expect(playButton).toBeDisabled();
  });

  it('displays stop button', () => {
    render(<AudioPlayer audioFile={mockAudioFile} />);

    const stopButton = screen.getByTitle('Stop');
    expect(stopButton).toBeInTheDocument();
    expect(stopButton).toHaveTextContent('⏹️');
  });

  it('shows volume control', () => {
    render(<AudioPlayer audioFile={mockAudioFile} />);

    expect(screen.getByText('🔊')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays progress slider', () => {
    render(<AudioPlayer audioFile={mockAudioFile} />);

    const progressSlider = screen.getByDisplayValue('0');
    expect(progressSlider).toBeInTheDocument();
    expect(progressSlider).toHaveAttribute('type', 'range');
  });

  it('shows waveform visualization', () => {
    render(<AudioPlayer audioFile={mockAudioFile} />);

    const waveformContainer = document.querySelector('.waveform-container');
    expect(waveformContainer).toBeInTheDocument();

    const waveformBars = document.querySelectorAll('.waveform-bar');
    expect(waveformBars).toHaveLength(40); // We create 40 bars
  });

  it('displays volume slider with correct attributes', () => {
    render(<AudioPlayer audioFile={mockAudioFile} />);

    const volumeSlider = screen.getByDisplayValue('1');
    expect(volumeSlider).toHaveAttribute('type', 'range');
    expect(volumeSlider).toHaveAttribute('min', '0');
    expect(volumeSlider).toHaveAttribute('max', '1');
    expect(volumeSlider).toHaveAttribute('step', '0.05');
  });

  it('shows audio file metadata', () => {
    render(<AudioPlayer audioFile={mockAudioFile} />);

    expect(screen.getByText('MP3')).toBeInTheDocument();
    expect(screen.getByText('5120 KB')).toBeInTheDocument();
  });

  it('contains audio element with correct attributes', () => {
    render(<AudioPlayer audioFile={mockAudioFile} />);

    const audioElement = document.querySelector('audio');
    expect(audioElement).toBeInTheDocument();
    expect(audioElement).toHaveAttribute('preload', 'metadata');
  });

  it('applies custom className', () => {
    const { container } = render(
      <AudioPlayer audioFile={mockAudioFile} className="custom-class" />
    );

    const audioPlayer = container.querySelector('.audio-player');
    expect(audioPlayer).toHaveClass('custom-class');
  });
});
