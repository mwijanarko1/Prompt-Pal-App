/**
 * API Client for connecting to Strapi backend
 * Handles all communication with the prompt-pal-api
 */

import { getFreshToken } from './token-utils';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:1337";

// Log API configuration on module load
console.log("[API Client] Initialized with base URL:", API_BASE_URL);
console.log(
  "[API Client] Environment variable EXPO_PUBLIC_API_URL:",
  process.env.EXPO_PUBLIC_API_URL || "not set (using default)"
);

export interface ApiError {
  error: string;
  details?: string;
  status?: number;
}

export interface Task {
  id: string;
  documentId?: string;
  name: string;
  question: string;
  idealPrompt?: string;
  Image?: {
    url: string;
    formats?: {
      thumbnail?: { url: string };
      small?: { url: string };
      medium?: { url: string };
      large?: { url: string };
    };
  };
  Day?: number;
}

export interface TaskResponse {
  data: Task[];
}

export interface SingleTaskResponse {
  data: Task;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl: string;
  prompt: string;
}

export interface ImageEvaluationResponse {
  success: boolean;
  evaluation: {
    score: number;
    feedback?: string;
    criteria?: Array<{
      name: string;
      score: number;
      feedback: string;
    }>;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  externalId?: string;
}

export interface UserResponse {
  success: boolean;
  data: User;
}

export interface SubmissionResponse {
  success: boolean;
  submissionId?: string;
}

export interface SubquestionResult {
  subquestionId: string;
  score: number;
}

export interface CriterionResult {
  criterionId: string;
  score: number;
  subquestionResults: SubquestionResult[];
}

export interface TaskResult {
  taskId: string;
  score: number;
  criterionResults: CriterionResult[];
}

export interface UserResultsResponse {
  score: number | null;
  taskResults: TaskResult[];
}

export interface LearningModulesResponse {
  modules: LearningModule[];
  count: number;
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
  moduleId?: string; // Added for module filtering

  // Additional properties used in the app
  targetImageUrl?: string;
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

export interface LevelsResponse {
  levels: Level[];
  count: number;
}

export interface SingleLevelResponse {
  level: Level;
}

export interface GameState {
  currentLevelId: string | null;
  lives: number;
  unlockedLevels: string[];
  completedLevels: string[];
  score: number;
  isPlaying: boolean;
}

export interface GameStateResponse {
  gameState: GameState;
}

export interface ProgressUpdateRequest {
  levelId: string;
  score: number;
  completed: boolean;
  bestScore?: number;
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
  type: "guide" | "cheatsheet" | "lexicon" | "case-study";
  title: string;
  description: string;
  content: any;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: number | null;
  tags: string[];
  icon: string | null;
  metadata: any | null;
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

class ApiClient {
  private baseUrl: string;
  private token: string;
  private getToken?: () => Promise<string | null>;

  constructor(token: string, baseUrl: string = API_BASE_URL, getToken?: () => Promise<string | null>) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.token = token;
    this.getToken = getToken;
  }

  // Method to set the token getter for fresh token retrieval
  setTokenGetter(getToken: () => Promise<string | null>) {
    this.getToken = getToken;
  }

  private requiresAuthentication(endpoint: string): boolean {
    // ALL endpoints now require authentication
    // The only exception is the health check endpoint
    return !endpoint.startsWith('/api/health');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    console.log(`[API] ${options.method || "GET"} ${url}`);
    if (options.body) {
      console.log(`[API] Request body:`, JSON.parse(options.body as string));
    }

    const defaultHeaders: HeadersInit = {
      "Content-Type": "application/json",
      "x-app-id": "prompt-pal",  // Required for all API requests
    };

    // Add Authorization header for authenticated endpoints
    const requiresAuth = this.requiresAuthentication(endpoint);
    let authHeader: HeadersInit = {};

    if (requiresAuth) {
      // For AI proxy endpoints, always use fresh tokens to avoid expiration issues
      const isAiProxyEndpoint = endpoint === '/api/ai/proxy';

      if (isAiProxyEndpoint && this.getToken) {
        try {
          const freshToken = await this.getToken();
          if (freshToken) {
            authHeader = {
              "Authorization": `Bearer ${freshToken}`,
            };
            console.log(`[API] Using fresh token for AI proxy endpoint`);
          } else {
            console.warn(`[API] No fresh token available for AI proxy endpoint`);
          }
        } catch (error) {
          console.error(`[API] Failed to get fresh token for AI proxy:`, error);
        }
      } else if (this.token) {
        authHeader = {
          "Authorization": `Bearer ${this.token}`,
        };
        console.log(`[API] Including auth token for authenticated endpoint`);
      } else {
        console.warn(`[API] No token available for authenticated endpoint: ${endpoint}`);
      }
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...authHeader,
        ...options.headers,
      },
    };

    try {
      const startTime = Date.now();
      const response = await fetch(url, config);
      const duration = Date.now() - startTime;
      const data = await response.json();

      console.log(`[API] Response (${duration}ms):`, {
        status: response.status,
        ok: response.ok,
        data: response.ok ? data : { error: data.error, details: data.details },
      });

      if (!response.ok) {
        const error: ApiError = {
          error: data.error || "An error occurred",
          details: data.details,
          status: response.status,
        };
        console.error(`[API] Request failed:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`[API] Network/Request error:`, error);
      if (error && typeof error === "object" && "error" in error) {
        throw error;
      }
      throw {
        error: "Network error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiError;
    }
  }

  // Task endpoints
  async getDailyTasks(): Promise<Task[]> {
    const response = await this.request<TaskResponse>(
      "/api/analyzer/daily-tasks"
    );
    return response.data || [];
  }

  async getTaskById(taskId: string): Promise<Task> {
    const response = await this.request<SingleTaskResponse>(
      `/api/analyzer/tasks/${taskId}`
    );
    return response.data;
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    const response = await this.request<TaskResponse>(
      `/api/analyzer/users/${userId}/tasks`
    );
    return response.data || [];
  }

  async getUserImageTasks(userId: string): Promise<Task[]> {
    const response = await this.request<TaskResponse>(
      `/api/analyzer/users/${userId}/image-tasks`
    );
    return response.data || [];
  }

  // Image generation and evaluation
  async generateImage(prompt: string, seed?: number): Promise<{
    imageUrl: string;
    remaining: { imageCalls?: number };
  }> {
    const response = await this.request<{
      imageUrl: string;
      remaining: { imageCalls?: number };
    }>(
      "/api/ai/proxy",
      {
        method: "POST",
        body: JSON.stringify({
          type: "image",
          input: {
            prompt,
            seed,
          },
          appId: "prompt-pal",
        }),
      }
    );
    return response;
  }

  async compareImagesBasic(targetUrl: string, resultUrl: string): Promise<{
    score: number;
    remaining: { imageCalls?: number };
  }> {
    const response = await this.request<{
      score: number;
      remaining: { imageCalls?: number };
    }>(
      "/api/ai/proxy",
      {
        method: "POST",
        body: JSON.stringify({
          type: "compare",
          input: {
            targetUrl,
            resultUrl
          },
          appId: "prompt-pal",
        }),
      }
    );
    return response;
  }

  async evaluateImageAdvanced(options: {
    taskId: string;
    userImageUrl: string;
    expectedImageUrl: string;
    hiddenPromptKeywords?: string[];
    style?: string;
    userPrompt?: string;
    targetPrompt?: string;
  }): Promise<{
    evaluation: {
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
    };
  }> {
    const response = await this.request<{
      evaluation: {
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
      };
    }>(
      "/api/analyzer/evaluate-images",
      {
        method: "POST",
        body: JSON.stringify({
          ...options,
          appId: "prompt-pal",
        }),
      }
    );
    return response;
  }

  // User management
  async createUser(
    email: string,
    name: string,
    externalId?: string
  ): Promise<User> {
    const response = await this.request<{ id: string; success: boolean }>(
      "/api/analyzer/users/create",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          name,
          externalId,
          appId: "prompt-pal",
        }),
      }
    );
    // Fetch the created user
    return this.getUserById(response.id);
  }

  async getUserById(userId: string): Promise<User> {
    const response = await this.request<UserResponse>(
      `/api/analyzer/users/${userId}`
    );
    return response.data;
  }

  async getUserByExternalId(externalId: string): Promise<User> {
    const response = await this.request<UserResponse>(
      `/api/analyzer/users/external/${externalId}`
    );
    return response.data;
  }

  // Submission endpoints
  async submitSolution(
    userId: string,
    taskId: string,
    solutionPrompt: string
  ): Promise<void> {
    await this.request(`/api/analyzer/users/${userId}/submit`, {
      method: "POST",
      body: JSON.stringify({
        taskId,
        solutionPrompt,
        appId: "prompt-pal",
      }),
    });
  }

  async checkSubmission(submissionId: string): Promise<void> {
    return this.request(`/api/analyzer/submissions/${submissionId}/check`);
  }

  // User results and progress
  async getUserResults(userId: string): Promise<UserResultsResponse> {
    return this.request<UserResultsResponse>(
      `/api/analyzer/users/${userId}/results`
    );
  }

  async getUserStreak(userId: string): Promise<number> {
    const response = await this.request<{ success: boolean; data: number }>(
      `/api/analyzer/users/${userId}/streak`
    );
    return response.data;
  }

  async getCompletedTasks(userId: string): Promise<Task[]> {
    const response = await this.request<{ success: boolean; data: Task[] }>(
      `/api/analyzer/users/${userId}/completed-tasks`
    );
    return response.data || [];
  }

  // Learning modules and quests
  async getLearningModules(): Promise<LearningModule[]> {
    const response = await this.request<LearningModulesResponse>(
      "/api/v1/learning-modules"
    );
    return response.modules || [];
  }

  async updateModuleProgress(moduleId: string, progress: number): Promise<void> {
    await this.request(`/api/v1/learning-modules/${moduleId}/progress`, {
      method: "PUT",
      body: JSON.stringify({ progress }),
    });
  }

  async getCurrentQuest(): Promise<DailyQuest | null> {
    const response = await this.request<UserQuestsResponse>(
      "/api/v1/user/quests"
    );

    // Return the first available quest, or null if none available
    if (response.availableQuests && response.availableQuests.length > 0) {
      return response.availableQuests[0];
    }

    // If no available quests, return the first active quest
    if (response.quests && response.quests.length > 0) {
      return response.quests[0];
    }

    return null;
  }

  async completeQuest(): Promise<void> {
    await this.request("/api/v1/user/quests", {
      method: "PUT",
      body: JSON.stringify({
        action: "complete",
        // Add any additional data needed for completion
      }),
    });
  }

  // Levels endpoints
  async getLevels(): Promise<Level[]> {
    const response = await this.request<{ levels: Level[] }>(
      "/api/v1/levels"
    );
    return response.levels || [];
  }

  async getLevelById(id: string): Promise<Level> {
    const response = await this.request<{ level: Level }>(
      `/api/v1/levels/${id}`
    );
    return response.level;
  }

  // Game state endpoints
  async getGameState(): Promise<GameState> {
    const response = await this.request<GameStateResponse>(
      "/api/user/game-state"
    );
    return response.gameState;
  }

  async updateGameState(gameState: Partial<GameState>): Promise<void> {
    await this.request("/api/user/game-state", {
      method: "POST",
      body: JSON.stringify({
        gameState,
        appId: "prompt-pal",
      }),
    });
  }

  async updateProgress(update: ProgressUpdateRequest): Promise<void> {
    await this.request("/api/user/progress", {
      method: "POST",
      body: JSON.stringify({
        ...update,
        appId: "prompt-pal",
      }),
    });
  }

  // Library and leaderboard endpoints
  async getLibraryData(): Promise<LibraryData> {
    return this.request<LibraryData>('/api/v1/library');
  }

  async getLeaderboard(limit: number = 50): Promise<LeaderboardResponse> {
    return this.request<LeaderboardResponse>(
      `/api/v1/leaderboard?limit=${limit}`
    );
  }

  async getUserRank(): Promise<UserRankResponse> {
    return this.request<UserRankResponse>('/api/v1/user/rank');
  }
}

// Function to create authenticated API client
export function createApiClient(token: string): ApiClient {
  return new ApiClient(token);
}

// Legacy function for backward compatibility - creates client with empty token
// This will need to be updated to pass a real token
export const apiClient = new ApiClient("");

// Function to update token for the legacy singleton (temporary - should migrate to createApiClient)
export function setApiClientToken(token: string) {
  // Note: This is a temporary solution. The singleton pattern should be replaced
  // with dependency injection where components create their own authenticated clients
  (apiClient as any).token = token;
}
