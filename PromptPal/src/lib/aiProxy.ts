import axios from 'axios';
import axiosRetry from 'axios-retry';
import { tokenCache } from './auth';
import { logger } from './logger';
import { isTextGenerationAllowed, isImageGenerationAllowed } from './rateLimiter';

// Constants
const AI_PROXY_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL || 'http://localhost:3000';
const API_TIMEOUT_MS = 30000; // 30 seconds for AI requests
const MAX_PROMPT_LENGTH = 4000;
const MIN_PROMPT_LENGTH = 1;

export const aiProxy = axios.create({
  baseURL: AI_PROXY_URL,
  timeout: API_TIMEOUT_MS,
});

// Configure retry logic with exponential backoff
axiosRetry(aiProxy, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors, 5xx server errors, but not on 4xx client errors (except 429)
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response?.status && error.response.status >= 500) ||
           error.response?.status === 429;
  },
  onRetry: (retryCount, error, requestConfig) => {
    logger.warn('AI Proxy', `Request failed, retrying (${retryCount}/3)`, {
      url: requestConfig.url,
      status: error.response?.status,
    });
  },
});

// Request interceptor for JWT token
aiProxy.interceptors.request.use(async (config) => {
  try {
    const token = await tokenCache.getToken('__clerk_client_jwt');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    logger.error('AI Proxy', error, { operation: 'getAuthToken' });
  }

  // Add app identifier
  config.headers['x-app-id'] = 'prompt-pal';

  return config;
});

// Response interceptor for quota handling
aiProxy.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      // Quota exceeded - could show upgrade prompt
      logger.warn('AI Proxy', 'Quota exceeded', error.response.data);
    } else if (error.response?.status === 401) {
      logger.warn('AI Proxy', 'Authentication failed - token may be expired');
    } else {
      logger.error('AI Proxy', error, {
        status: error.response?.status,
        url: error.config?.url,
      });
    }
    return Promise.reject(error);
  }
);

export interface AIProxyRequest {
  type: 'text' | 'image';
  model?: string;
  input: {
    prompt: string;
    context?: string;
    seed?: number;
    size?: string;
  };
}

export interface AIProxyResponse {
  type: 'text' | 'image';
  model: string;
  result?: string;
  imageUrl?: string;
  tokensUsed?: number;
  remaining: {
    textCalls?: number;
    imageCalls?: number;
  };
  metadata?: {
    model?: string;
    latency?: number;
    tokensUsed?: number;
    [key: string]: unknown;
  };
}

export class AIProxyClient {
  /**
   * Validates prompt input before sending to API
   * @param prompt - The prompt to validate
   * @throws {Error} If prompt is invalid
   */
  private static validatePrompt(prompt: string): void {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt must be a non-empty string');
    }

    const trimmedPrompt = prompt.trim();

    if (trimmedPrompt.length < MIN_PROMPT_LENGTH) {
      throw new Error('Prompt cannot be empty');
    }

    if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
      throw new Error(`Prompt too long (maximum ${MAX_PROMPT_LENGTH} characters)`);
    }
  }

  /**
   * Generates text using the AI proxy backend
   * @param prompt - The user's input prompt
   * @param context - Optional context for the prompt
   * @returns Promise resolving to AI response with usage data
   * @throws {Error} If prompt is empty, rate limited, or API request fails
   */
  static async generateText(prompt: string, context?: string): Promise<AIProxyResponse> {
    this.validatePrompt(prompt);

    if (!isTextGenerationAllowed()) {
      throw new Error('Rate limit exceeded. Please wait before making another text generation request.');
    }

    try {
      const response = await aiProxy.post<AIProxyResponse>('/api/ai/proxy', {
        appId: 'prompt-pal',
        type: 'text',
        input: { prompt: prompt.trim(), context },
      });
      return response.data;
    } catch (error) {
      logger.error('AIProxyClient', error, { operation: 'generateText', promptLength: prompt.length });
      throw error;
    }
  }

  /**
   * Generates an image using the AI proxy backend
   * @param prompt - The user's input prompt for image generation
   * @param seed - Optional seed for reproducible results
   * @returns Promise resolving to AI response with image URL and usage data
   * @throws {Error} If prompt is empty, rate limited, or API request fails
   */
  static async generateImage(prompt: string, seed?: number): Promise<AIProxyResponse> {
    this.validatePrompt(prompt);

    if (!isImageGenerationAllowed()) {
      throw new Error('Rate limit exceeded. Please wait before making another image generation request.');
    }

    if (seed !== undefined && (typeof seed !== 'number' || seed < 0 || seed > 999999999)) {
      throw new Error('Seed must be a number between 0 and 999999999');
    }

    try {
      const response = await aiProxy.post<AIProxyResponse>('/api/ai/proxy', {
        appId: 'prompt-pal',
        type: 'image',
        input: { prompt: prompt.trim(), seed },
      });
      return response.data;
    } catch (error) {
      logger.error('AIProxyClient', error, { operation: 'generateImage', promptLength: prompt.length, hasSeed: !!seed });
      throw error;
    }
  }
}