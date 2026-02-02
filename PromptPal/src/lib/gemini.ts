// Gemini API integration - delegated to unified backend API
import { getSharedClient } from './unified-api';

export interface GeminiConfig {
  apiKey: string;
  models: {
    text: 'gemini-2.5-flash';
    image: 'gemini-2.5-flash-image';
    vision: 'gemini-2.5-flash';
  };
  useBackendApi?: boolean;
}

export class GeminiService {
  constructor(private config: GeminiConfig) { }

  // Generate an image based on a text prompt
  async generateImage(prompt: string): Promise<string> {
    try {
      console.log('[Gemini] 🎨 Generating image:', prompt.substring(0, 50));
      const client = getSharedClient();
      // unified-api generateImage returns { imageUrl: string, remaining: ... }
      const result = await client.generateImage(prompt);
      console.log('[Gemini] ✅ Image generated successfully:', result.imageUrl);
      return result.imageUrl;
    } catch (error) {
      console.error('[Gemini] ❌ Image generation failed:', error);
      throw error;
    }
  }

  // Compare two images and return similarity score (0-100)
  async compareImages(targetUrl: string, resultUrl: string, taskId?: string): Promise<number> {
    try {
      console.log('[Gemini] 🔍 Comparing images');
      const client = getSharedClient();

      if (taskId) {
        // Use advanced evaluation if taskId is provided
        const result = await client.evaluateImage({
          taskId,
          userImageUrl: resultUrl,
          expectedImageUrl: targetUrl
        });
        return result.evaluation.score;
      } else {
        // Use basic comparison
        const result = await client.compareImages(targetUrl, resultUrl);
        return result.score || 0;
      }
    } catch (error) {
      console.error('[Gemini] ❌ Comparison failed:', error);
      throw error;
    }
  }

  // Get contextual hints for prompt improvement
  async getPromptHints(prompt: string): Promise<string[]> {
    try {
      const client = getSharedClient();
      const systemPrompt = "You are an expert AI artist. Provide 3 specific, short hints to improve the user's image generation prompt. Output ONLY valid JSON array of strings.";
      const result = await client.generateText(prompt, systemPrompt);

      if (result.result) {
        try {
          // Extract JSON array from text if needed
          const jsonMatch = result.result.match(/\[.*\]/s);
          const hints = JSON.parse(jsonMatch ? jsonMatch[0] : result.result);
          return Array.isArray(hints) ? hints.slice(0, 3) : [];
        } catch {
          // Fallback if not valid JSON
          return [result.result.substring(0, 100)];
        }
      }
      return [];
    } catch (error) {
      console.warn('[Gemini] Failed to get prompt hints, keeping original prompt');
      return [];
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService({
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
  models: {
    text: 'gemini-2.5-flash',
    image: 'gemini-2.5-flash-image',
    vision: 'gemini-2.5-flash',
  },
  useBackendApi: true,
});

console.log('[Gemini Service] Initialized using Unified API');
