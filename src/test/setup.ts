/**
 * Test setup file for Vitest
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Tauri APIs for testing
const mockTauriApi = {
  os: {
    platform: () => Promise.resolve('darwin'),
    arch: () => Promise.resolve('x86_64'),
    version: () => Promise.resolve('22.0.0'),
  },
  dialog: {
    open: () => Promise.resolve([]),
    save: () => Promise.resolve(''),
  },
  fs: {
    readTextFile: () => Promise.resolve(''),
    writeTextFile: () => Promise.resolve(),
  },
};

// Mock @tauri-apps/api module
vi.mock('@tauri-apps/api', () => mockTauriApi);
vi.mock('@tauri-apps/api/os', () => mockTauriApi.os);
vi.mock('@tauri-apps/api/dialog', () => mockTauriApi.dialog);
vi.mock('@tauri-apps/api/fs', () => mockTauriApi.fs);

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock File and FileList for file upload tests
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(chunks: (string | BufferSource)[], filename: string, options: FilePropertyBag = {}) {
    this.name = filename;
    this.size = chunks.reduce((acc, chunk) => {
      if (typeof chunk === 'string') return acc + chunk.length;
      return acc + chunk.byteLength;
    }, 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
} as unknown as typeof File;

global.FileList = class MockFileList extends Array<File> {
  item(index: number) {
    return this[index] || null;
  }
} as unknown as typeof FileList;

// Mock HTMLAudioElement for audio player tests
class MockAudioElement {
  public currentTime = 0;
  public duration = 0;
  public volume = 1;
  public src = '';
  public paused = true;

  private listeners: { [key: string]: EventListener[] } = {};

  play() {
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }

  addEventListener(event: string, listener: EventListener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  removeEventListener(event: string, listener: EventListener) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(listener);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    }
  }

  dispatchEvent(event: Event) {
    if (this.listeners[event.type]) {
      this.listeners[event.type]?.forEach(listener => listener(event));
    }
    return true;
  }

  // Simulate metadata loading
  triggerLoadedMetadata() {
    this.dispatchEvent(new Event('loadedmetadata'));
  }

  // Simulate time update
  triggerTimeUpdate() {
    this.dispatchEvent(new Event('timeupdate'));
  }

  // Simulate error
  triggerError() {
    this.dispatchEvent(new Event('error'));
  }

  // Simulate ended
  triggerEnded() {
    this.dispatchEvent(new Event('ended'));
  }
}

// Mock HTMLAudioElement constructor
global.HTMLAudioElement = MockAudioElement as unknown as typeof HTMLAudioElement;
Object.defineProperty(window, 'HTMLAudioElement', {
  writable: true,
  value: MockAudioElement,
});

// Silence console warnings in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
};
