// Polyfill for import.meta on web
if (typeof window !== 'undefined' && typeof (globalThis as { importMeta?: { env: Record<string, string>; url: string } }).importMeta === 'undefined') {
  (globalThis as { importMeta?: { env: Record<string, string>; url: string } }).importMeta = {
    env: {},
    url: '',
  };
}

// Polyfill for process.env if needed
if (typeof window !== 'undefined' && typeof (globalThis as { process?: { env: Record<string, string> } }).process === 'undefined') {
  (globalThis as { process?: { env: Record<string, string> } }).process = {
    env: {},
  };
}
