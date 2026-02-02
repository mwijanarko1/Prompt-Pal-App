/**
 * Unified API Client
 * Consolidates both api.ts (ApiClient) and aiProxy.ts into a single axios-based client
 * with unified interceptors for token refresh, retry logic, and error handling.
 *
 * @module unified-api
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from './logger';
import { triggerSignOut, tryRefreshToken } from './session-manager';
import { record401Error } from './auth-diagnostics';

// ============================================================================
// Constants
// ============================================================================

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:1337';
const AI_PROXY_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL || API_BASE_URL;
const API_TIMEOUT_MS = 30000;
const APP_ID = 'prompt-pal';

// ============================================================================
// Types
// ============================================================================

export type TokenProvider = () => Promise<string | null>;

/** Custom request config that includes retry flag */
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

// ============================================================================
// API Response Types (consolidated from api.ts)
// ============================================================================

export interface ApiError {
    error: string;
    details?: string;
    status?: number;
}

export interface GameState {
    currentLevelId: string | null;
    lives: number;
    score: number;
    isPlaying: boolean;
    unlockedLevels: string[];
    completedLevels: string[];
}

export interface GameStateResponse {
    gameState: GameState;
}

export interface LearningModule {
    id: string;
    category: string;
    title: string;
    level: string;
    topic: string;
    progress: number;
    icon: string;
    thumbnail?: string;
    accentColor: string;
    buttonText: string;
    type?: 'module' | 'course';
    format?: 'interactive' | 'video' | 'text';
    estimatedTime?: number;
}

export interface LearningModulesResponse {
    modules: LearningModule[];
    count: number;
}

export interface DailyQuest {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    timeRemaining: number;
    completed: boolean;
    expiresAt: number;
}

export interface UserQuestsResponse {
    appId: string;
    quests: DailyQuest[];
    availableQuests: DailyQuest[];
}

export interface Level {
    id: string;
    title: string;
    description?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    type: string;
    passingScore: number;
    unlocked?: boolean;
    moduleId?: string;
    targetImageUrl?: string | number;
    targetImageUrlForEvaluation?: string;
    hiddenPromptKeywords?: string[];
    style?: string;
    moduleTitle?: string;
    requirementBrief?: string;
    requirementImage?: string;
    language?: string;
    testCases?: { id: string; name: string; passed: boolean }[];
    briefTitle?: string;
    briefProduct?: string;
    briefTarget?: string;
    briefTone?: string;
    briefGoal?: string;
    metrics?: { label: string; value: number }[];
}

export interface LibraryData {
    userSummary: {
        totalXp: number;
        currentLevel: number;
        streak: number;
        completedLevels: number;
    };
    categories: LibraryCategory[];
}

export interface LibraryCategory {
    category: string;
    modules: LearningModule[];
    resources: Resource[];
}

export interface Resource {
    id: string;
    appId: string;
    type: 'guide' | 'cheatsheet' | 'lexicon' | 'case-study';
    title: string;
    description: string;
    content: unknown;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number | null;
    tags: string[];
    icon: string | null;
    metadata: unknown | null;
    order: number;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface LeaderboardEntry {
    rank: number;
    name: string;
    avatarUrl: string | null;
    points: number;
    level: number;
    isCurrentUser: boolean | null;
}

export interface LeaderboardResponse {
    leaderboard: LeaderboardEntry[];
    continueCursor: string | null;
}

export interface UserRankResponse {
    rank: number;
    name: string;
    avatarUrl: string | null;
    points: number;
    level: number;
    isCurrentUser: true;
}

export interface UserResultsResponse {
    taskResults: Array<{
        id: string;
        score: number;
        completedAt: string | null;
        taskType: 'image' | 'code' | 'copywriting';
    }>;
}

export interface UserLevelAttempt {
    id: string;
    attemptNumber: number;
    score: number;
    feedback: string[];
    keywordsMatched: string[];
    imageUrl: string;
    createdAt: string;
}

export interface UserLevelAttemptsResponse {
    attempts: UserLevelAttempt[];
}

export interface SaveAttemptRequest {
    score: number;
    feedback: string[];
    keywordsMatched: string[];
    imageUrl: string;
}

export interface SaveAttemptResponse {
    attempt: UserLevelAttempt;
}

export interface ProgressUpdateRequest {
    levelId: string;
    score: number;
    completed: boolean;
    bestScore?: number;
}

// AI Proxy Response Types
export interface AIProxyResponse {
    type: 'text' | 'image' | 'compare';
    model: string;
    result?: string;
    imageUrl?: string;
    score?: number;
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

export interface ImageEvaluationResult {
    score: number;
    similarity: number;
    keywordScore: number;
    styleScore: number;
    promptSimilarity?: number;
    feedback: string[];
    keywordsMatched: string[];
    criteria?: Array<{
        name: string;
        score: number;
        feedback: string;
    }>;
}

// ============================================================================
// Unified API Client Class
// ============================================================================

/**
 * Unified API client that consolidates all backend communication.
 * Uses axios with retry logic and automatic token refresh.
 */
export class UnifiedApiClient {
    private client: AxiosInstance;
    private tokenProvider: TokenProvider | null = null;

    constructor(tokenProvider?: TokenProvider) {
        this.tokenProvider = tokenProvider || null;
        this.client = this.createAxiosInstance();
        this.setupInterceptors();
        this.setupRetry();
    }

    /**
     * Creates the axios instance with default configuration
     */
    private createAxiosInstance(): AxiosInstance {
        return axios.create({
            baseURL: API_BASE_URL,
            timeout: API_TIMEOUT_MS,
            headers: {
                'Content-Type': 'application/json',
                'x-app-id': APP_ID,
            },
        });
    }

    /**
     * Sets up request/response interceptors for auth and error handling
     */
    private setupInterceptors(): void {
        // Request interceptor - add auth token
        this.client.interceptors.request.use(
            async (config) => {
                try {
                    if (this.tokenProvider) {
                        const token = await this.tokenProvider();
                        if (token) {
                            config.headers.Authorization = `Bearer ${token}`;
                        }
                    }
                } catch (error) {
                    logger.error('UnifiedApiClient', error, { operation: 'getAuthToken' });
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor - handle 401 and token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined;

                if (!originalRequest) {
                    return Promise.reject(error);
                }

                // Handle rate limiting
                if (error.response?.status === 429) {
                    logger.warn('UnifiedApiClient', 'Quota exceeded', { data: error.response.data });
                    return Promise.reject(error);
                }

                // Handle 401 - try token refresh
                if (error.response?.status === 401 && !originalRequest._retry) {
                    record401Error(originalRequest.url || 'unknown');

                    logger.warn('UnifiedApiClient', 'Authentication failed - attempting token refresh', {
                        url: originalRequest.url,
                        status: error.response.status,
                    });

                    originalRequest._retry = true;

                    try {
                        const newToken = await tryRefreshToken();
                        if (newToken) {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            return this.client(originalRequest);
                        }
                    } catch (refreshError) {
                        logger.error('UnifiedApiClient', refreshError, { operation: 'tokenRefresh' });
                    }

                    // Token refresh failed, sign out user
                    logger.warn('UnifiedApiClient', 'Token refresh failed - signing out');
                    await triggerSignOut();
                }

                logger.error('UnifiedApiClient', error, {
                    status: error.response?.status,
                    url: originalRequest.url,
                });

                return Promise.reject(error);
            }
        );
    }

    /**
     * Configures retry logic with exponential backoff
     */
    private setupRetry(): void {
        axiosRetry(this.client, {
            retries: 3,
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: (error) => {
                return (
                    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
                    (error.response?.status !== undefined && error.response.status >= 500) ||
                    error.response?.status === 429
                );
            },
            onRetry: (retryCount, error, requestConfig) => {
                logger.warn('UnifiedApiClient', `Request failed, retrying (${retryCount}/3)`, {
                    url: requestConfig.url,
                    status: error.response?.status,
                });
            },
        });
    }

    /**
     * Updates the token provider
     */
    setTokenProvider(provider: TokenProvider): void {
        this.tokenProvider = provider;
    }

    // ==========================================================================
    // Game State Methods
    // ==========================================================================

    /**
     * Fetches the current game state from the backend
     */
    async getGameState(): Promise<GameState> {
        const response = await this.client.get<GameStateResponse>('/api/v1/user/game-state');
        return response.data.gameState;
    }

    /**
     * Updates the game state on the backend
     */
    async updateGameState(gameState: GameState): Promise<void> {
        try {
            logger.debug('UnifiedApiClient', 'Updating game state', { gameState });
            await this.client.put('/api/v1/user/game-state', {
                gameState,
            });
            logger.debug('UnifiedApiClient', 'Game state updated successfully');
        } catch (error) {
            logger.error('UnifiedApiClient', error, {
                operation: 'updateGameState',
                requestData: { gameState },
                status: (error as any)?.response?.status,
                responseData: (error as any)?.response?.data
            });
            throw error;
        }
    }

    /**
     * Updates progress for a specific level
     */
    async updateProgress(update: ProgressUpdateRequest): Promise<void> {
        await this.client.post('/api/v1/user/progress', {
            ...update,
            appId: APP_ID,
        });
    }

    // ==========================================================================
    // Learning Modules & Quests
    // ==========================================================================

    /**
     * Fetches all learning modules
     */
    async getLearningModules(): Promise<LearningModule[]> {
        const response = await this.client.get<LearningModulesResponse>('/api/v1/learning-modules');
        return response.data.modules || [];
    }

    /**
     * Updates progress for a specific module
     */
    async updateModuleProgress(moduleId: string, progress: number): Promise<void> {
        await this.client.put(`/api/v1/learning-modules/${moduleId}/progress`, { progress });
    }

    /**
     * Fetches user quests and returns the current/available quest
     */
    async getCurrentQuest(): Promise<DailyQuest | null> {
        const response = await this.client.get<UserQuestsResponse>('/api/v1/user/quests');

        if (response.data.availableQuests?.length > 0) {
            return response.data.availableQuests[0];
        }
        if (response.data.quests?.length > 0) {
            return response.data.quests[0];
        }
        return null;
    }

    /**
     * Marks the current quest as completed
     */
    async completeQuest(): Promise<void> {
        await this.client.put('/api/v1/user/quests', { action: 'complete' });
    }

    // ==========================================================================
    // Levels
    // ==========================================================================

    /**
     * Fetches all levels
     */
    async getLevels(): Promise<Level[]> {
        const response = await this.client.get<{ levels: Level[] }>('/api/v1/levels');
        return response.data.levels || [];
    }

    /**
     * Fetches a specific level by ID
     */
    async getLevelById(id: string): Promise<Level> {
        const response = await this.client.get<{ level: Level }>(`/api/v1/levels/${id}`);
        return response.data.level;
    }

    // ==========================================================================
    // Library & Leaderboard
    // ==========================================================================

    /**
     * Fetches library data including modules and resources
     */
    async getLibraryData(): Promise<LibraryData> {
        const response = await this.client.get<LibraryData>('/api/v1/library');
        return response.data;
    }

    /**
     * Fetches leaderboard entries
     */
    async getLeaderboard(limit: number = 50): Promise<LeaderboardResponse> {
        const response = await this.client.get<LeaderboardResponse>(`/api/v1/leaderboard?limit=${limit}`);
        return response.data;
    }

    /**
     * Fetches the current user's rank
     */
    async getUserRank(): Promise<UserRankResponse> {
        const response = await this.client.get<UserRankResponse>('/api/v1/user/rank');
        return response.data;
    }

    /**
     * Fetches the current user's task results and statistics
     */
    async getUserResults(userId: string, appId: string = APP_ID): Promise<UserResultsResponse> {
        const response = await this.client.get<UserResultsResponse>(`/api/v1/user/results?appId=${appId}`);
        return response.data;
    }

    /**
     * Fetches attempt history for a specific level
     */
    async getLevelAttempts(levelId: string): Promise<UserLevelAttemptsResponse> {
        const response = await this.client.get<UserLevelAttemptsResponse>(`/api/v1/user/levels/${levelId}/attempts`);
        return response.data;
    }

    /**
     * Saves a new attempt for a specific level
     */
    async saveLevelAttempt(levelId: string, attemptData: SaveAttemptRequest): Promise<SaveAttemptResponse> {
        const response = await this.client.post<SaveAttemptResponse>(`/api/v1/user/levels/${levelId}/attempts`, attemptData);
        return response.data;
    }

    // ==========================================================================
    // AI Proxy Methods (consolidated from aiProxy.ts)
    // ==========================================================================

    /**
     * Generates text using the AI proxy
     */
    async generateText(prompt: string, context?: string): Promise<AIProxyResponse> {
        this.validatePrompt(prompt);

        const response = await this.client.post<AIProxyResponse>('/api/v1/ai/proxy', {
            type: 'text',
            input: { prompt: prompt.trim(), context },
        });
        return response.data;
    }

    /**
     * Generates an image using the AI proxy
     */
    async generateImage(prompt: string, seed?: number): Promise<{
        imageUrl: string;
        remaining: { imageCalls?: number };
    }> {
        this.validatePrompt(prompt);

        const response = await this.client.post<{
            imageUrl: string;
            remaining: { imageCalls?: number };
        }>('/api/v1/ai/proxy', {
            type: 'image',
            input: { prompt: prompt.trim(), seed },
            appId: APP_ID,
        });
        return response.data;
    }

    /**
     * Compares two images using AI
     */
    async compareImages(targetUrl: string, resultUrl: string): Promise<AIProxyResponse> {
        if (!targetUrl || !resultUrl) {
            throw new Error('Both target and result URLs are required');
        }

        // Validate URL formats
        new URL(targetUrl);
        new URL(resultUrl);

        const response = await this.client.post<AIProxyResponse>('/api/v1/ai/proxy', {
            type: 'compare',
            input: { targetUrl, resultUrl },
            appId: APP_ID,
        });
        return response.data;
    }

    /**
     * Advanced image evaluation with detailed scoring
     */
    async evaluateImage(options: {
        taskId: string;
        userImageUrl: string;
        expectedImageUrl: string;
        hiddenPromptKeywords?: string[];
        style?: string;
        userPrompt?: string;
        targetPrompt?: string;
    }): Promise<{ evaluation: ImageEvaluationResult }> {
        const response = await this.client.post<{ evaluation: ImageEvaluationResult }>(
            '/api/v1/ai/proxy',
            {
                type: 'evaluate',
                appId: APP_ID,
                input: options,
            }
        );
        return response.data;
    }

    /**
     * Executes code and returns the result
     */
    async executeCode(
        code: string,
        language: string,
        testCase: { input?: any; expectedOutput?: any },
        functionName?: string
    ): Promise<{ success: boolean; output?: any; error?: string }> {
        const prompt = `Execute the following ${language.toUpperCase()} code and return the result as JSON:

Code to execute:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

${functionName ? `Call the function: ${functionName}(${testCase.input ? JSON.stringify(testCase.input) : ''})` : ''}
${testCase.expectedOutput ? `Expected output: ${JSON.stringify(testCase.expectedOutput)}` : ''}

Return the result as a JSON object with this exact format:
{
  "success": true/false,
  "output": <the execution result>,
  "error": "<error message if any>"
}`;

        try {
            const response = await this.generateText(prompt);

            // Parse the AI response as JSON
            try {
                const result = JSON.parse(response.result || '{}');
                return {
                    success: result.success || false,
                    output: result.output,
                    error: result.error,
                };
            } catch (parseError) {
                // If AI doesn't return valid JSON, wrap the response
                return {
                    success: true,
                    output: response.result,
                };
            }
        } catch (error) {
            logger.error('UnifiedApiClient', error, { operation: 'executeCode' });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Code execution failed',
            };
        }
    }

    // ==========================================================================
    // Usage & Analytics
    // ==========================================================================

    /**
     * Fetches user usage data
     */
    async getUserUsage(): Promise<{
        tier: string;
        limits: { textCalls: number; imageCalls: number };
        used: { textCalls: number; imageCalls: number };
        remaining: { textCalls: number; imageCalls: number };
        resetAt: string;
        planName: string;
        renewalDate?: string;
    }> {
        const response = await this.client.get('/api/v1/user/usage');
        return response.data;
    }

    // ==========================================================================
    // Private Helpers
    // ==========================================================================

    private validatePrompt(prompt: string): void {
        const MIN_PROMPT_LENGTH = 1;
        const MAX_PROMPT_LENGTH = 4000;

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
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a new UnifiedApiClient with the given token provider
 * @param tokenProvider - Function that returns a fresh auth token
 */
export function createUnifiedClient(tokenProvider?: TokenProvider): UnifiedApiClient {
    return new UnifiedApiClient(tokenProvider);
}

/**
 * Creates a UnifiedApiClient with a static token (backwards compatibility)
 * @param token - Static auth token
 */
export function createClientWithToken(token: string): UnifiedApiClient {
    return new UnifiedApiClient(() => Promise.resolve(token));
}

// ============================================================================
// Singleton for backwards compatibility (will be deprecated)
// ============================================================================

let _sharedClient: UnifiedApiClient | null = null;
let _sharedClientTokenProvider: TokenProvider | null = null;

/**
 * Gets or creates a shared client instance.
 * Prefer using createUnifiedClient() with a token provider for most use cases.
 * 
 * IMPORTANT: Must call setSharedClientTokenProvider() BEFORE first use, or pass
 * the provider to createUnifiedClient() instead.
 */
export function getSharedClient(): UnifiedApiClient {
    if (!_sharedClient) {
        if (!_sharedClientTokenProvider) {
            throw new Error(
                'Shared API client used without token provider. ' +
                'Call setSharedClientTokenProvider() before using getSharedClient(), ' +
                'or use createUnifiedClient(tokenProvider) instead.'
            );
        }
        _sharedClient = new UnifiedApiClient(_sharedClientTokenProvider);
    }
    return _sharedClient;
}

/**
 * Sets the token provider for the shared client.
 * Must be called BEFORE the first getSharedClient() call.
 */
export function setSharedClientTokenProvider(provider: TokenProvider): void {
    if (_sharedClient) {
        _sharedClient.setTokenProvider(provider);
    } else {
        _sharedClientTokenProvider = provider;
    }
}

// Log initialization
logger.info('UnifiedApiClient', 'Module initialized', {
    baseUrl: API_BASE_URL,
    aiProxyUrl: AI_PROXY_URL,
});
