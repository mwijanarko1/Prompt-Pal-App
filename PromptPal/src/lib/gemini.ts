// Gemini API integration - delegated to Convex backend
import { convexHttpClient } from './convex-client';
import { api } from '../../convex/_generated/api.js';

// Model configuration - used for reference only (actual calls go through Convex)
const MODELS = {
  text: 'gemini-2.5-flash' as const,
  image: 'gemini-2.5-flash-image-preview' as const,
  vision: 'gemini-2.5-flash' as const,
};

export class GeminiService {
  // Generate an image based on a text prompt
  async generateImage(prompt: string): Promise<string> {
    try {
      console.log('[Gemini] 🎨 Generating image:', prompt.substring(0, 50));
      // Convex generateImage returns { imageUrl: string, remainingQuota: ... }
      const result = await convexHttpClient.action(api.ai.generateImage, {
        prompt,
        appId: "prompt-pal",
      });
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

      // Use advanced evaluation
      const result = await convexHttpClient.action(api.ai.evaluateImage, {
        taskId: taskId || `task-${Date.now()}`,
        userImageUrl: resultUrl,
        expectedImageUrl: targetUrl,
      });
      return result.evaluation?.score || 0;
    } catch (error) {
      console.error('[Gemini] ❌ Comparison failed:', error);
      throw error;
    }
  }

  // Get contextual hints for prompt improvement
  async getPromptHints(prompt: string): Promise<string[]> {
    try {
      const systemPrompt = "You are an expert AI artist. Provide 3 specific, short hints to improve user's image generation prompt. Output ONLY valid JSON array of strings.";
      const result = await convexHttpClient.action(api.ai.generateText, {
        prompt,
        context: systemPrompt,
        appId: "prompt-pal",
      });

      if (result.result) {
        try {
          // Extract JSON array from text if needed
          let jsonText = result.result;
          const jsonMatch = result.result.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            jsonText = jsonMatch[0];
          }

          jsonText = jsonText.trim();
          const hints = JSON.parse(jsonText);
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
export const geminiService = new GeminiService();

console.log('[Gemini Service] Initialized using Convex backend');
