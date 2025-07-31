/**
 * Language detection service with confidence scoring
 */

import type { TranscriptionLanguage } from '@/models';

export interface LanguageDetectionResult {
  detectedLanguage: TranscriptionLanguage;
  confidence: number; // 0-1 scale
  alternatives: Array<{
    language: TranscriptionLanguage;
    confidence: number;
  }>;
  isReliable: boolean; // true if confidence > 0.7
}

export interface LanguagePreferences {
  defaultLanguage: TranscriptionLanguage;
  autoDetect: boolean;
  confidenceThreshold: number;
  lastUsed: Date;
}

class LanguageDetectionService {
  private preferences: LanguagePreferences = {
    defaultLanguage: 'auto',
    autoDetect: true,
    confidenceThreshold: 0.7,
    lastUsed: new Date(),
  };

  constructor() {
    this.loadPreferences();
  }

  /**
   * Load language preferences from localStorage
   */
  private loadPreferences(): void {
    try {
      const saved = localStorage.getItem('transcriber-language-preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.preferences = {
          ...this.preferences,
          ...parsed,
          lastUsed: new Date(parsed.lastUsed || Date.now()),
        };
      }
    } catch (error) {
      console.warn('Failed to load language preferences:', error);
    }
  }

  /**
   * Save language preferences to localStorage
   */
  private savePreferences(): void {
    try {
      this.preferences.lastUsed = new Date();
      localStorage.setItem(
        'transcriber-language-preferences',
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.warn('Failed to save language preferences:', error);
    }
  }

  /**
   * Get current language preferences
   */
  getPreferences(): LanguagePreferences {
    return { ...this.preferences };
  }

  /**
   * Update language preferences
   */
  updatePreferences(updates: Partial<LanguagePreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
  }

  /**
   * Analyze text content for language detection
   * This is a simplified heuristic-based approach for browser-based detection
   */
  detectLanguageFromText(text: string): LanguageDetectionResult {
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    if (words.length === 0) {
      return this.createDefaultResult('auto', 0);
    }

    // Simple heuristic-based language detection
    const englishIndicators = [
      'the', 'and', 'that', 'this', 'with', 'for', 'are', 'but', 'they', 'have',
      'from', 'word', 'said', 'each', 'which', 'she', 'will', 'their', 'if', 'do'
    ];

    const dutchIndicators = [
      'de', 'het', 'een', 'van', 'en', 'dat', 'is', 'te', 'voor', 'met',
      'zijn', 'op', 'niet', 'aan', 'ook', 'als', 'er', 'maar', 'om', 'ze'
    ];

    let englishScore = 0;
    let dutchScore = 0;

    words.forEach(word => {
      if (englishIndicators.includes(word)) englishScore++;
      if (dutchIndicators.includes(word)) dutchScore++;
    });

    const total = words.length;
    const englishConfidence = englishScore / total;
    const dutchConfidence = dutchScore / total;

    // Determine the most likely language
    if (englishConfidence > dutchConfidence && englishConfidence > 0.1) {
      return {
        detectedLanguage: 'en',
        confidence: Math.min(englishConfidence * 2, 0.95), // Scale up confidence
        alternatives: [
          { language: 'nl', confidence: dutchConfidence },
          { language: 'auto', confidence: 0.1 },
        ],
        isReliable: englishConfidence > this.preferences.confidenceThreshold,
      };
    } else if (dutchConfidence > englishConfidence && dutchConfidence > 0.1) {
      return {
        detectedLanguage: 'nl',
        confidence: Math.min(dutchConfidence * 2, 0.95),
        alternatives: [
          { language: 'en', confidence: englishConfidence },
          { language: 'auto', confidence: 0.1 },
        ],
        isReliable: dutchConfidence > this.preferences.confidenceThreshold,
      };
    } else {
      // Low confidence - recommend auto-detection
      return {
        detectedLanguage: 'auto',
        confidence: 0.3,
        alternatives: [
          { language: 'en', confidence: englishConfidence },
          { language: 'nl', confidence: dutchConfidence },
        ],
        isReliable: false,
      };
    }
  }

  /**
   * Get recommended language based on user preferences and content analysis
   */
  getRecommendedLanguage(text?: string): TranscriptionLanguage {
    if (!this.preferences.autoDetect) {
      return this.preferences.defaultLanguage;
    }

    if (!text || text.length < 10) {
      return this.preferences.defaultLanguage;
    }

    const detection = this.detectLanguageFromText(text);
    
    if (detection.isReliable) {
      return detection.detectedLanguage;
    }

    // Fall back to user's default preference if detection is unreliable
    return this.preferences.defaultLanguage === 'auto' ? 'auto' : this.preferences.defaultLanguage;
  }

  /**
   * Create a default detection result
   */
  private createDefaultResult(language: TranscriptionLanguage, confidence: number): LanguageDetectionResult {
    return {
      detectedLanguage: language,
      confidence,
      alternatives: [
        { language: 'en', confidence: 0.1 },
        { language: 'nl', confidence: 0.1 },
      ],
      isReliable: confidence > this.preferences.confidenceThreshold,
    };
  }

  /**
   * Get language display name
   */
  getLanguageDisplayName(language: TranscriptionLanguage): string {
    switch (language) {
      case 'en':
        return 'English';
      case 'nl':
        return 'Dutch';
      case 'auto':
        return 'Auto-detect';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get language flag emoji
   */
  getLanguageFlag(language: TranscriptionLanguage): string {
    switch (language) {
      case 'en':
        return '🇺🇸';
      case 'nl':
        return '🇳🇱';
      case 'auto':
        return '🌐';
      default:
        return '❓';
    }
  }

  /**
   * Check if a language is supported
   */
  isSupportedLanguage(language: string): language is TranscriptionLanguage {
    return ['en', 'nl', 'auto'].includes(language);
  }

  /**
   * Reset preferences to defaults
   */
  resetPreferences(): void {
    this.preferences = {
      defaultLanguage: 'auto',
      autoDetect: true,
      confidenceThreshold: 0.7,
      lastUsed: new Date(),
    };
    this.savePreferences();
  }
}

// Export singleton instance
export const languageDetectionService = new LanguageDetectionService();
export default languageDetectionService; 