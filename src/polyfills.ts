// Polyfills for Node.js modules in browser environment
import { Buffer } from 'buffer';
import process from 'process';
import { EventEmitter } from 'events';

// Ensure Buffer is available globally BEFORE any other modules load
(globalThis as Record<string, unknown>).Buffer = Buffer;
(globalThis as Record<string, unknown>).global = globalThis;
(globalThis as Record<string, unknown>).process = process;

// Make Node.js globals available in browser
if (typeof window !== 'undefined') {
  window.global = window.global || window;
  window.Buffer = window.Buffer || Buffer;
  window.process = window.process || process;
  window.EventEmitter = window.EventEmitter || EventEmitter;
  
  // Ensure process.env exists
  if (!window.process.env) {
    window.process.env = {};
  }
  
  // Add process methods that streams might need
  if (!window.process.nextTick) {
    window.process.nextTick = function(callback: (...args: unknown[]) => void, ...args: unknown[]) {
      setTimeout(() => callback(...(args as unknown[])), 0);
    };
  }
  
  // Add process.browser flag for compatibility
  if (typeof window.process.browser === 'undefined') {
    window.process.browser = true;
  }
}

// Ensure all globals are set immediately
if (typeof global === 'undefined') {
  (globalThis as Record<string, unknown>).global = globalThis;
}

if (typeof Buffer === 'undefined') {
  (globalThis as Record<string, unknown>).Buffer = Buffer;
}

if (typeof process === 'undefined') {
  (globalThis as Record<string, unknown>).process = process;
}

// Add process.browser flag globally
if (process && typeof process.browser === 'undefined') {
  process.browser = true;
}

// Ensure Buffer methods are available
if (Buffer && !Buffer.isBuffer) {
  Buffer.isBuffer = function(obj: unknown) {
    return obj != null && (obj as Record<string, unknown>).constructor === Buffer;
  };
}

export {};