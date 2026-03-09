import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { sanitizeHtmlForWebView } from '@/lib/htmlSanitizer';

interface HtmlPreviewProps {
  html: string;
  height?: number;
}

/**
 * Renders HTML in a WebView for live preview (e.g. starter code, generated output).
 * Sanitizes HTML to prevent XSS from prompt-injection attacks.
 */
/** Detect if body is effectively empty (blank page) */
function isBlankPage(html: string): boolean {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch?.[1]?.replace(/<script[\s\S]*?<\/script>/gi, '').trim() ?? '';
  return bodyContent.length < 20;
}

const EMPTY_PAGE_PLACEHOLDER = `
  <div style="display:flex;align-items:center;justify-content:center;min-height:120px;color:#9ca3af;font-size:13px;font-family:system-ui;text-align:center;padding:16px;">
    Empty webpage — describe what you want to add
  </div>
`;

export function HtmlPreview({ html, height = 200 }: HtmlPreviewProps) {
  if (!html || !html.trim()) return null;

  const sanitized = sanitizeHtmlForWebView(html);
  const tailwindScript = '<script src="https://cdn.tailwindcss.com"></script>';
  let wrappedHtml = sanitized.includes('<html')
    ? sanitized
    : `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">${tailwindScript}</head><body>${sanitized}</body></html>`;

  // If it's a full document but missing tailwind, and the user likely needs it (indicated by classes)
  if (sanitized.includes('<html') && !sanitized.includes('tailwindcss.com') && sanitized.includes('class=')) {
    wrappedHtml = wrappedHtml.replace('</head>', `${tailwindScript}</head>`);
  }

  // When body is empty, inject a placeholder so the user sees something
  if (isBlankPage(wrappedHtml)) {
    wrappedHtml = wrappedHtml.replace(/<body([^>]*)>([\s\S]*?)<\/body>/i, (_, attrs, inner) =>
      `<body${attrs}>${inner}${EMPTY_PAGE_PLACEHOLDER}</body>`
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html: wrappedHtml }}
        originWhitelist={['*']}
        style={styles.webview}
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        // Allow interaction: forms, buttons, links, inputs
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={false}
        bounces={true}
        nestedScrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'android' && { opacity: 0.99 }),
  },
});
