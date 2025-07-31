/**
 * Platform detection and platform-specific utilities
 */

import { os } from '@tauri-apps/api';

export type Platform = 'macos' | 'windows' | 'linux' | 'unknown';

export interface PlatformInfo {
  platform: Platform;
  arch: string;
  version: string;
  isMobile: boolean;
  isDesktop: boolean;
}

let platformCache: PlatformInfo | null = null;

/**
 * Get platform information (cached after first call)
 */
export async function getPlatformInfo(): Promise<PlatformInfo> {
  if (platformCache) {
    return platformCache;
  }

  try {
    const [platform, arch, version] = await Promise.all([os.platform(), os.arch(), os.version()]);

    const normalizedPlatform = normalizePlatform(platform);

    platformCache = {
      platform: normalizedPlatform,
      arch,
      version,
      isMobile: false, // Tauri is desktop-only
      isDesktop: true,
    };

    return platformCache;
  } catch (error) {
    console.warn('Failed to detect platform:', error);

    // Fallback to browser detection
    const fallbackPlatform = detectPlatformFromUserAgent();

    platformCache = {
      platform: fallbackPlatform,
      arch: 'unknown',
      version: 'unknown',
      isMobile: false,
      isDesktop: true,
    };

    return platformCache;
  }
}

/**
 * Normalize platform string to our Platform type
 */
function normalizePlatform(platform: string): Platform {
  const platformLower = platform.toLowerCase();

  if (platformLower.includes('darwin') || platformLower.includes('macos')) {
    return 'macos';
  }
  if (platformLower.includes('windows') || platformLower.includes('win32')) {
    return 'windows';
  }
  if (platformLower.includes('linux')) {
    return 'linux';
  }

  return 'unknown';
}

/**
 * Fallback platform detection using user agent
 */
function detectPlatformFromUserAgent(): Platform {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('mac')) return 'macos';
  if (userAgent.includes('win')) return 'windows';
  if (userAgent.includes('linux')) return 'linux';

  return 'unknown';
}

/**
 * Quick platform checks (use after calling getPlatformInfo at least once)
 */
export function isMacOS(): boolean {
  return platformCache?.platform === 'macos' || false;
}

export function isWindows(): boolean {
  return platformCache?.platform === 'windows' || false;
}

export function isLinux(): boolean {
  return platformCache?.platform === 'linux' || false;
}

/**
 * Get platform-specific keyboard shortcuts
 */
export function getKeyboardShortcuts() {
  const isMac = isMacOS();

  return {
    // File operations
    openFile: isMac ? 'Cmd+O' : 'Ctrl+O',
    saveFile: isMac ? 'Cmd+S' : 'Ctrl+S',

    // App operations
    quit: isMac ? 'Cmd+Q' : 'Ctrl+Q',
    preferences: isMac ? 'Cmd+,' : 'Ctrl+,',

    // Audio operations
    playPause: 'Space',
    stop: 'Escape',

    // Navigation
    newWindow: isMac ? 'Cmd+N' : 'Ctrl+N',
    close: isMac ? 'Cmd+W' : 'Ctrl+W',
  };
}

/**
 * Get platform-specific file paths
 */
export async function getPlatformPaths() {
  const info = await getPlatformInfo();

  const paths = {
    desktop: '$DESKTOP',
    documents: '$DOCUMENT',
    downloads: '$DOWNLOAD',
    home: '$HOME',
  };

  // Platform-specific audio directories
  if (info.platform === 'macos') {
    return {
      ...paths,
      audio: '$HOME/Music',
      defaultSave: '$HOME/Documents/Transcriber',
    };
  }

  if (info.platform === 'windows') {
    return {
      ...paths,
      audio: '$HOME/Music',
      defaultSave: '$HOME/Documents/Transcriber',
    };
  }

  if (info.platform === 'linux') {
    return {
      ...paths,
      audio: '$HOME/Music',
      defaultSave: '$HOME/Documents/Transcriber',
    };
  }

  return {
    ...paths,
    audio: '$HOME',
    defaultSave: '$HOME/Transcriber',
  };
}

/**
 * Initialize platform detection (call this early in app lifecycle)
 */
export async function initializePlatform(): Promise<PlatformInfo> {
  return await getPlatformInfo();
}
