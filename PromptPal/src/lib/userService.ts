/**
 * User Service - Handles user authentication and management
 * Integrates with Strapi backend for user operations
 */

import { apiClient, User, Task, UserResultsResponse } from "./api";
import * as SecureStore from "expo-secure-store";

const USER_STORAGE_KEY = "promptpal_user_id";
const USER_EXTERNAL_ID_KEY = "promptpal_external_id";

export interface UserSession {
  user: User;
  userId: string;
}

class UserService {
  private currentUser: User | null = null;
  private userId: string | null = null;

  /**
   * Initialize user session from storage
   */
  async initialize(): Promise<User | null> {
    try {
      const storedUserId = await this.getStoredUserId();
      if (storedUserId) {
        const user = await apiClient.getUserById(storedUserId);
        this.currentUser = user;
        this.userId = storedUserId;
        return user;
      }
    } catch (error) {
      console.warn("[UserService] Failed to initialize user:", error);
    }
    return null;
  }

  /**
   * Create a new user or get existing user
   */
  async createOrGetUser(
    email: string,
    name: string,
    externalId?: string
  ): Promise<User> {
    try {
      // Try to get user by external ID if provided
      if (externalId) {
        try {
          const existingUser = await apiClient.getUserByExternalId(externalId);
          await this.setStoredUserId(existingUser.id);
          this.currentUser = existingUser;
          this.userId = existingUser.id;
          return existingUser;
        } catch (error) {
          // User doesn't exist, create new one
          console.error(
            "[UserService] Failed to get user by external ID:",
            error
          );
          throw error;
        }
      }

      // Create new user
      const newUser = await apiClient.createUser(email, name, externalId);
      await this.setStoredUserId(newUser.id);
      if (externalId) {
        await this.setStoredExternalId(externalId);
      }
      this.currentUser = newUser;
      this.userId = newUser.id;
      return newUser;
    } catch (error) {
      console.error("[UserService] Failed to create/get user:", error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.userId;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.currentUser !== null && this.userId !== null;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await this.clearStoredUserId();
    await this.clearStoredExternalId();
    this.currentUser = null;
    this.userId = null;
  }

  /**
   * Get user tasks
   */
  async getUserTasks(): Promise<Task[]> {
    if (!this.userId) {
      throw new Error("User not logged in");
    }
    return apiClient.getUserTasks(this.userId);
  }

  /**
   * Get user image tasks
   */
  async getUserImageTasks(): Promise<Task[]> {
    if (!this.userId) {
      throw new Error("User not logged in");
    }
    return apiClient.getUserImageTasks(this.userId);
  }

  /**
   * Submit a solution
   */
  async submitSolution(taskId: string, solutionPrompt: string): Promise<void> {
    if (!this.userId) {
      throw new Error("User not logged in");
    }
    return apiClient.submitSolution(this.userId, taskId, solutionPrompt);
  }

  /**
   * Get user results
   */
  async getUserResults(): Promise<UserResultsResponse> {
    if (!this.userId) {
      throw new Error("User not logged in");
    }
    return apiClient.getUserResults(this.userId);
  }

  /**
   * Get user streak
   */
  async getUserStreak(): Promise<number> {
    if (!this.userId) {
      throw new Error("User not logged in");
    }
    return apiClient.getUserStreak(this.userId);
  }

  /**
   * Get completed tasks
   */
  async getCompletedTasks(): Promise<Task[]> {
    if (!this.userId) {
      throw new Error("User not logged in");
    }
    return apiClient.getCompletedTasks(this.userId);
  }

  // Private storage helpers
  private async getStoredUserId(): Promise<string | null> {
    try {
      if (typeof window !== "undefined") {
        return window.localStorage.getItem(USER_STORAGE_KEY);
      } else {
        return await SecureStore.getItemAsync(USER_STORAGE_KEY);
      }
    } catch {
      return null;
    }
  }

  private async setStoredUserId(userId: string): Promise<void> {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(USER_STORAGE_KEY, userId);
      } else {
        await SecureStore.setItemAsync(USER_STORAGE_KEY, userId);
      }
    } catch (error) {
      console.error("[UserService] Failed to store user ID:", error);
    }
  }

  private async clearStoredUserId(): Promise<void> {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      } else {
        await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
      }
    } catch (error) {
      console.error("[UserService] Failed to clear user ID:", error);
    }
  }

  private async getStoredExternalId(): Promise<string | null> {
    try {
      if (typeof window !== "undefined") {
        return window.localStorage.getItem(USER_EXTERNAL_ID_KEY);
      } else {
        return await SecureStore.getItemAsync(USER_EXTERNAL_ID_KEY);
      }
    } catch {
      return null;
    }
  }

  private async setStoredExternalId(externalId: string): Promise<void> {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(USER_EXTERNAL_ID_KEY, externalId);
      } else {
        await SecureStore.setItemAsync(USER_EXTERNAL_ID_KEY, externalId);
      }
    } catch (error) {
      console.error("[UserService] Failed to store external ID:", error);
    }
  }

  private async clearStoredExternalId(): Promise<void> {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(USER_EXTERNAL_ID_KEY);
      } else {
        await SecureStore.deleteItemAsync(USER_EXTERNAL_ID_KEY);
      }
    } catch (error) {
      console.error("[UserService] Failed to clear external ID:", error);
    }
  }
}

// Export singleton instance
export const userService = new UserService();
