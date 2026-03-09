/**
 * Allowed script sources for coding lesson preview (e.g. Tailwind CDN).
 * Only these exact origins are permitted; inline scripts are stripped.
 */
const ALLOWED_SCRIPT_SRCS = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/tailwindcss',
];

/**
 * Sanitizes HTML before rendering in WebView to prevent XSS and prompt-injection abuse.
 * - Strips inline scripts; allows only known CDN script src (e.g. Tailwind)
 * - Strips iframes, objects, embeds
 * - Strips event handlers and javascript: URLs
 * Used for AI-generated code preview where user prompts could coax malicious output.
 */
export function sanitizeHtmlForWebView(html: string): string {
  if (!html || typeof html !== 'string') return '';

  let out = html;

  // Strip <script> with inline content; keep only allowlisted external scripts
  out = out.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (_, attrs, body) => {
    const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (srcMatch) {
      const src = srcMatch[1].trim().toLowerCase();
      if (ALLOWED_SCRIPT_SRCS.some((allowed) => src.startsWith(allowed))) {
        return `<script${attrs}></script>`;
      }
    }
    return '';
  });

  // Strip <iframe>, <object>, <embed>
  out = out.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '');
  out = out.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '');
  out = out.replace(/<embed\b[^>]*\/?>/gi, '');

  // Strip event handler attributes (onclick, onerror, onload, etc.)
  out = out.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  out = out.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');

  // Strip javascript: and data:text/html URLs
  out = out.replace(/\s+href\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, ' href="#"');
  out = out.replace(/\s+src\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, '');
  out = out.replace(/\s+href\s*=\s*["']?\s*data:\s*text\/html[^"'\s>]*/gi, ' href="#"');
  out = out.replace(/\s+src\s*=\s*["']?\s*data:\s*text\/html[^"'\s>]*/gi, '');

  // Strip form action with javascript:
  out = out.replace(/\s+action\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, '');

  // Strip base tag
  out = out.replace(/<base\b[^>]*\/?>/gi, '');

  return out;
}
