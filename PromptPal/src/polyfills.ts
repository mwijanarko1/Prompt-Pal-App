// Polyfill for import.meta on web
// This must be defined before any code that uses import.meta
if (typeof window !== 'undefined') {
  // Define import.meta as a global object
  (window as any).import = (window as any).import || {};
  (window as any).import.meta = (window as any).import.meta || {
    env: { MODE: 'development' },
    url: typeof window !== 'undefined' ? window.location.href : '',
  };
  
  // Also set on globalThis for compatibility
  (globalThis as any).import = (globalThis as any).import || {};
  (globalThis as any).import.meta = (window as any).import.meta;
}

// Polyfill for process.env if needed
if (typeof window !== 'undefined' && typeof (globalThis as { process?: { env: Record<string, string> } }).process === 'undefined') {
  (globalThis as { process?: { env: Record<string, string> } }).process = {
    env: {},
  };
}
