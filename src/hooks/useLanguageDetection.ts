/**
 * React hook for managing language detection and preferences
 */

import { useState, useEffect, useCallback } from 'react';
import { languageDetectionService } from '@/services';
import type { 
  TranscriptionLanguage, 
  LanguageDetectionResult, 
  LanguagePreferences 
} from '@/models';

interface UseLanguageDetectionReturn {
  preferences: LanguagePreferences;
  detectedLanguage: TranscriptionLanguage;
  confidence: number;
  isReliable: boolean;
  alternatives: Array<{ language: TranscriptionLanguage; confidence: number }>;
  updatePreferences: (updates: Partial<LanguagePreferences>) => void;
  detectLanguage: (text: string) => LanguageDetectionResult;
  getRecommendedLanguage: (text?: string) => TranscriptionLanguage;
  resetPreferences: () => void;
  getLanguageDisplayName: (language: TranscriptionLanguage) => string;
  getLanguageFlag: (language: TranscriptionLanguage) => string;
}

export function useLanguageDetection(): UseLanguageDetectionReturn {
  const [preferences, setPreferences] = useState<LanguagePreferences>(
    languageDetectionService.getPreferences()
  );
  const [detectionResult, setDetectionResult] = useState<LanguageDetectionResult>({
    detectedLanguage: 'auto',
    confidence: 0,
    alternatives: [],
    isReliable: false,
  });

  // Update local state when preferences change
  const updatePreferences = useCallback((updates: Partial<LanguagePreferences>) => {
    languageDetectionService.updatePreferences(updates);
    setPreferences(languageDetectionService.getPreferences());
  }, []);

  // Detect language from text
  const detectLanguage = useCallback((text: string): LanguageDetectionResult => {
    const result = languageDetectionService.detectLanguageFromText(text);
    setDetectionResult(result);
    return result;
  }, []);

  // Get recommended language
  const getRecommendedLanguage = useCallback((text?: string): TranscriptionLanguage => {
    return languageDetectionService.getRecommendedLanguage(text);
  }, []);

  // Reset preferences
  const resetPreferences = useCallback(() => {
    languageDetectionService.resetPreferences();
    setPreferences(languageDetectionService.getPreferences());
  }, []);

  // Get language display name
  const getLanguageDisplayName = useCallback((language: TranscriptionLanguage): string => {
    return languageDetectionService.getLanguageDisplayName(language);
  }, []);

  // Get language flag
  const getLanguageFlag = useCallback((language: TranscriptionLanguage): string => {
    return languageDetectionService.getLanguageFlag(language);
  }, []);

  // Load preferences on mount
  useEffect(() => {
    setPreferences(languageDetectionService.getPreferences());
  }, []);

  return {
    preferences,
    detectedLanguage: detectionResult.detectedLanguage,
    confidence: detectionResult.confidence,
    isReliable: detectionResult.isReliable,
    alternatives: detectionResult.alternatives,
    updatePreferences,
    detectLanguage,
    getRecommendedLanguage,
    resetPreferences,
    getLanguageDisplayName,
    getLanguageFlag,
  };
} 