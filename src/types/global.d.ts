// Global type declarations for polyfills
import { Buffer } from 'buffer';
import { EventEmitter } from 'events';

type ProcessNextTick = (callback: (...args: unknown[]) => void, ...args: unknown[]) => void;

declare global {
  interface Window {
    global: typeof globalThis;
    Buffer: typeof Buffer;
    EventEmitter: typeof EventEmitter;
    process: {
      env: Record<string, string | undefined>;
      nextTick: ProcessNextTick;
      browser: boolean;
      version: string;
      versions: Record<string, string>;
    };
  }

  const global: typeof globalThis;
  const Buffer: typeof Buffer;
  const EventEmitter: typeof EventEmitter;
  const process: {
    env: Record<string, string | undefined>;
    nextTick: ProcessNextTick;
    browser: boolean;
    version: string;
    versions: Record<string, string>;
  };
}

export {};