/**
 * Audio files context for managing uploaded files state
 */

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { AudioFile } from '@/models';

interface AudioFilesState {
  files: AudioFile[];
  isLoading: boolean;
  error: string | null;
}

type AudioFilesAction =
  | { type: 'ADD_FILES'; payload: AudioFile[] }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'CLEAR_FILES' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_FROM_STORAGE'; payload: AudioFile[] };

interface AudioFilesContextType {
  state: AudioFilesState;
  addFiles: (files: AudioFile[]) => void;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const AudioFilesContext = createContext<AudioFilesContextType | undefined>(undefined);

const STORAGE_KEY = 'transcriber-audio-files';

function audioFilesReducer(state: AudioFilesState, action: AudioFilesAction): AudioFilesState {
  switch (action.type) {
    case 'ADD_FILES':
      return {
        ...state,
        files: [...state.files, ...action.payload],
        error: null,
      };
    case 'REMOVE_FILE':
      return {
        ...state,
        files: state.files.filter(file => file.id !== action.payload),
      };
    case 'CLEAR_FILES':
      return {
        ...state,
        files: [],
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'LOAD_FROM_STORAGE':
      return {
        ...state,
        files: action.payload,
      };
    default:
      return state;
  }
}

interface AudioFilesProviderProps {
  children: ReactNode;
}

export function AudioFilesProvider({ children }: AudioFilesProviderProps) {
  const [state, dispatch] = useReducer(audioFilesReducer, {
    files: [],
    isLoading: false,
    error: null,
  });

  // Load files from localStorage on mount
  useEffect(() => {
    try {
      const savedFiles = localStorage.getItem(STORAGE_KEY);
      if (savedFiles) {
        const parsedFiles: AudioFile[] = JSON.parse(savedFiles).map((file: AudioFile) => ({
          ...file,
          uploadedAt: new Date(file.uploadedAt),
          lastModified: new Date(file.lastModified),
        }));
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsedFiles });
      }
    } catch (error) {
      console.warn('Failed to load audio files from localStorage:', error);
    }
  }, []);

  // Save files to localStorage whenever files change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.files));
    } catch (error) {
      console.warn('Failed to save audio files to localStorage:', error);
    }
  }, [state.files]);

  const addFiles = (files: AudioFile[]) => {
    dispatch({ type: 'ADD_FILES', payload: files });
  };

  const removeFile = (fileId: string) => {
    // Find the file and revoke its blob URL to prevent memory leaks
    const file = state.files.find(f => f.id === fileId);
    if (file && file.path.startsWith('blob:')) {
      URL.revokeObjectURL(file.path);
    }
    dispatch({ type: 'REMOVE_FILE', payload: fileId });
  };

  const clearFiles = () => {
    // Revoke all blob URLs to prevent memory leaks
    state.files.forEach(file => {
      if (file.path.startsWith('blob:')) {
        URL.revokeObjectURL(file.path);
      }
    });
    dispatch({ type: 'CLEAR_FILES' });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const contextValue: AudioFilesContextType = {
    state,
    addFiles,
    removeFile,
    clearFiles,
    setLoading,
    setError,
  };

  return <AudioFilesContext.Provider value={contextValue}>{children}</AudioFilesContext.Provider>;
}

export function useAudioFiles() {
  const context = useContext(AudioFilesContext);
  if (context === undefined) {
    throw new Error('useAudioFiles must be used within an AudioFilesProvider');
  }
  return context;
}
