/**
 * Tests for the main App component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /transcriber/i })).toBeInTheDocument();
  });

  it('displays the app description', () => {
    render(<App />);
    expect(screen.getByText(/local-first audio transcription/i)).toBeInTheDocument();
  });

  it('shows supported audio formats', () => {
    render(<App />);
    expect(screen.getByText(/supports:/i)).toBeInTheDocument();
  });

  it('renders the audio uploader component', () => {
    render(<App />);
    expect(screen.getByText(/upload audio files/i)).toBeInTheDocument();
  });

  it('displays welcome message', () => {
    render(<App />);
    expect(screen.getByText(/welcome to transcriber/i)).toBeInTheDocument();
  });
});
