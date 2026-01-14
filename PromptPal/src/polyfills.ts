// Polyfill for import.meta on web
if (typeof window !== 'undefined' && typeof (globalThis as any).importMeta === 'undefined') {
  (globalThis as any).importMeta = {
    env: {},
    url: '',
  };
}

// Polyfill for process.env if needed
if (typeof window !== 'undefined' && typeof (globalThis as any).process === 'undefined') {
  (globalThis as any).process = {
    env: {},
  };
}
