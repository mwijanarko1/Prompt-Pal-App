// Gemini API integration - Phase 2 implementation
// Can use backend API or direct Gemini API calls

import { apiClient } from './api';

export interface GeminiConfig {
  apiKey: string;
  models: {
    text: 'gemini-2.5-flash';
    image: 'gemini-2.5-flash-image';
    vision: 'gemini-2.5-flash';
  };
  useBackendApi?: boolean; // Use backend API instead of direct Gemini calls
}

export class GeminiService {
  private config: GeminiConfig;
  private useBackendApi: boolean;

  constructor(config: GeminiConfig) {
    this.config = config;
    // Use backend API if API_URL is set, otherwise fall back to direct calls
    this.useBackendApi = config.useBackendApi ?? !!process.env.EXPO_PUBLIC_API_URL;
  }

  private getModelForOperation(operation: keyof GeminiConfig['models']): string {
    return this.config.models[operation];
  }

  // Generate an image based on a text prompt
  async generateImage(prompt: string): Promise<string> {
    // Use backend API if available
    if (this.useBackendApi) {
      try {
        console.log('[Gemini] 🎨 Generating image via backend API:', prompt.substring(0, 50));
        const result = await apiClient.generateImage(prompt);
        console.log('[Gemini] ✅ Image generated successfully via backend:', result.imageUrl);
        return result.imageUrl;
      } catch (error) {
        console.error('[Gemini] ❌ Backend API failed:', error);
        if (error && typeof error === 'object' && 'details' in error) {
          console.error('[Gemini] Error details:', (error as { details?: string }).details);
        }
        console.warn('[Gemini] ⚠️ Falling back to placeholder image');
        // Fall through to placeholder
      }
    }

    // TODO: Implement direct Gemini Imagen 2 API call
    // const model = this.getModelForOperation('image'); // Reserved for future implementation

    // Placeholder: return a mock image URL
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
    return `https://picsum.photos/400/400?random=${Math.random()}`;
  }

  // Compare two images and return similarity score (0-100)
  async compareImages(targetUrl: string, resultUrl: string, taskId?: string): Promise<number> {
    // Use backend API if available
    if (this.useBackendApi && taskId) {
      try {
        console.log('[Gemini] 🔍 Comparing images via backend API (taskId:', taskId, ')');
        const evaluation = await apiClient.evaluateImageComparison(taskId, resultUrl, targetUrl);
        console.log('[Gemini] ✅ Image comparison result:', evaluation);
        return evaluation.score || 0;
      } catch (error) {
        console.error('[Gemini] ❌ Backend API failed:', error);
        if (error && typeof error === 'object' && 'details' in error) {
          console.error('[Gemini] Error details:', (error as { details?: string }).details);
        }
        console.warn('[Gemini] ⚠️ Falling back to placeholder score');
        // Fall through to placeholder
      }
    }

    // TODO: Implement direct Gemini Pro Vision API call
    // const model = this.getModelForOperation('vision'); // Reserved for future implementation

    // Placeholder: return a random score between 0-100
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    return Math.floor(Math.random() * 101);
  }

  // Get contextual hints for prompt improvement
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPromptHints(_prompt: string): Promise<string[]> {
    // TODO: Implement Gemini Flash API call
    // const model = this.getModelForOperation('text'); // Reserved for future implementation

    // Placeholder: return generic hints
    const hints = [
      "Try adding a medium, like 'oil painting' or '3D render'",
      "Consider the lighting - is it natural or artificial?",
      "Don't forget the style - realistic, cartoon, abstract?",
    ];

    return hints.slice(0, Math.floor(Math.random() * hints.length) + 1);
  }
}

// Export singleton instance (will be configured with API key later)
export const geminiService = new GeminiService({
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'placeholder-key',
  models: {
    text: 'gemini-2.5-flash',
    image: 'gemini-2.5-flash-image',
    vision: 'gemini-2.5-flash',
  },
  useBackendApi: true, // Prefer backend API
});

// Log Gemini service configuration
console.log('[Gemini Service] Initialized');
console.log('[Gemini Service] Using backend API:', geminiService['useBackendApi']);
console.log('[Gemini Service] Backend API URL:', process.env.EXPO_PUBLIC_API_URL || 'http://localhost:1337 (default)');
