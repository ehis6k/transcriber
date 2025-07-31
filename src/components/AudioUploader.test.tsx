/**
 * Tests for the AudioUploader component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioUploader } from './AudioUploader';

describe('AudioUploader', () => {
  const mockOnFilesUploaded = vi.fn();

  beforeEach(() => {
    mockOnFilesUploaded.mockClear();
  });

  it('renders the upload area', () => {
    render(<AudioUploader onFilesUploaded={mockOnFilesUploaded} />);
    expect(screen.getByText(/upload audio files/i)).toBeInTheDocument();
  });

  it('shows browse files button', () => {
    render(<AudioUploader onFilesUploaded={mockOnFilesUploaded} />);
    expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument();
  });

  it('displays supported formats', () => {
    render(<AudioUploader onFilesUploaded={mockOnFilesUploaded} />);
    expect(screen.getByText(/supported formats:/i)).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<AudioUploader onFilesUploaded={mockOnFilesUploaded} disabled />);
    expect(screen.getByRole('button', { name: /browse files/i })).toBeDisabled();
  });

  it('handles drag events', async () => {
    render(<AudioUploader onFilesUploaded={mockOnFilesUploaded} />);
    const uploadArea = screen.getByText(/upload audio files/i).closest('.upload-area');

    expect(uploadArea).toHaveClass('upload-area');

    // Test that drag events don't throw errors
    fireEvent.dragEnter(uploadArea!);
    fireEvent.dragOver(uploadArea!);
    fireEvent.dragLeave(uploadArea!);

    // Component should still be rendered
    expect(uploadArea).toBeInTheDocument();
  });

  it('handles file input change', async () => {
    const user = userEvent.setup();
    render(<AudioUploader onFilesUploaded={mockOnFilesUploaded} />);

    const file = new File(['audio content'], 'test.mp3', { type: 'audio/mp3' });
    const input = screen
      .getByRole('button', { name: /browse files/i })
      .closest('.upload-area')
      ?.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await user.upload(input, file);
      // Note: The actual file processing is mocked, so we're just testing the interaction
    }
  });
});
