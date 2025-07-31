/**
 * Tests for platform utility functions
 */

import { describe, it, expect } from 'vitest';
import { getPlatformInfo, getKeyboardShortcuts } from './platform';

describe('platform utilities', () => {
  describe('getPlatformInfo', () => {
    it('returns platform information', async () => {
      const info = await getPlatformInfo();

      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('arch');
      expect(info).toHaveProperty('version');
      expect(info.isDesktop).toBe(true);
      expect(info.isMobile).toBe(false);
      expect(['macos', 'windows', 'linux', 'unknown']).toContain(info.platform);
    });
  });

  describe('getKeyboardShortcuts', () => {
    it('returns keyboard shortcuts object', () => {
      const shortcuts = getKeyboardShortcuts();

      expect(shortcuts).toHaveProperty('openFile');
      expect(shortcuts).toHaveProperty('saveFile');
      expect(shortcuts).toHaveProperty('quit');
      expect(shortcuts).toHaveProperty('playPause', 'Space');
      expect(shortcuts).toHaveProperty('stop', 'Escape');

      // Should be either Mac or PC shortcuts
      expect(shortcuts.openFile === 'Cmd+O' || shortcuts.openFile === 'Ctrl+O').toBe(true);
    });
  });
});
