import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import Animated, { FadeIn } from 'react-native-reanimated';
import { sanitizeHtmlForWebView } from '@/lib/htmlSanitizer';

interface HtmlPreviewProps {
  html: string;
  height?: number;
}

function isBlankPage(html: string): boolean {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch?.[1]?.replace(/<script[\s\S]*?<\/script>/gi, '').trim() ?? '';
  return bodyContent.length < 20;
}

const EMPTY_PAGE_PLACEHOLDER = `
  <div style="display:flex;align-items:center;justify-content:center;width:100%;min-height:40vh;color:#9ca3af;font-size:18px;line-height:1.4;font-family:system-ui;text-align:center;padding:24px;">
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

  if (sanitized.includes('<html') && !sanitized.includes('tailwindcss.com') && sanitized.includes('class=')) {
    wrappedHtml = wrappedHtml.replace('</head>', `${tailwindScript}</head>`);
  }

  if (isBlankPage(wrappedHtml)) {
    wrappedHtml = wrappedHtml.replace(/<body([^>]*)>([\s\S]*?)<\/body>/i, (_, attrs, inner) =>
      `<body${attrs}>${inner}${EMPTY_PAGE_PLACEHOLDER}</body>`
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[styles.container, { height }]}>
      <WebView
        source={{ html: wrappedHtml }}
        originWhitelist={['*']}
        style={styles.webview}
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={false}
        bounces={true}
        nestedScrollEnabled={true}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 120,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'android' && { opacity: 0.99 }),
  },
});
