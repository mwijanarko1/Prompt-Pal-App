/**
 * API Client for connecting to Strapi backend
 * Handles all communication with the prompt-pal-api
 */

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

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
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
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
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
  async generateImage(prompt: string): Promise<string> {
    const response = await this.request<ImageGenerationResponse>(
      "/api/analyzer/generate-image",
      {
        method: "POST",
        body: JSON.stringify({ prompt }),
      }
    );
    return response.imageUrl;
  }

  async evaluateImageComparison(
    taskId: string,
    userImageUrl: string,
    expectedImageUrl: string
  ): Promise<ImageEvaluationResponse["evaluation"]> {
    const response = await this.request<ImageEvaluationResponse>(
      "/api/analyzer/evaluate-images",
      {
        method: "POST",
        body: JSON.stringify({
          taskId,
          userImageUrl,
          expectedImageUrl,
        }),
      }
    );
    return response.evaluation;
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
        body: JSON.stringify({ email, name, externalId }),
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
}

// Export singleton instance
export const apiClient = new ApiClient();
