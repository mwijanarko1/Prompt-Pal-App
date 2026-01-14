import { Level } from '../game/store';
import { apiClient, Task } from '../../lib/api';

// Sample level data - fallback when API is not available
// In production, these would be fetched from the API
const FALLBACK_LEVELS: Level[] = [
  {
    id: 'level_01',
    difficulty: 'beginner',
    targetImageUrl: 'https://picsum.photos/400/400?random=1',
    hiddenPromptKeywords: ['cat', 'cyberpunk', 'neon'],
    passingScore: 75,
    unlocked: true,
  },
  {
    id: 'level_02',
    difficulty: 'beginner',
    targetImageUrl: 'https://picsum.photos/400/400?random=2',
    hiddenPromptKeywords: ['mountain', 'sunset', 'waterfall'],
    passingScore: 75,
    unlocked: false,
  },
  {
    id: 'level_03',
    difficulty: 'intermediate',
    targetImageUrl: 'https://picsum.photos/400/400?random=3',
    hiddenPromptKeywords: ['city', 'night', 'rain', 'streetlights'],
    passingScore: 75,
    unlocked: false,
  },
  {
    id: 'level_04',
    difficulty: 'intermediate',
    targetImageUrl: 'https://picsum.photos/400/400?random=4',
    hiddenPromptKeywords: ['forest', 'mushrooms', 'magic', 'fairytale'],
    passingScore: 75,
    unlocked: false,
  },
  {
    id: 'level_05',
    difficulty: 'advanced',
    targetImageUrl: 'https://picsum.photos/400/400?random=5',
    hiddenPromptKeywords: ['abstract', 'geometry', 'colors', 'surreal'],
    passingScore: 75,
    unlocked: false,
  },
];

// Convert API Task to Level format
function taskToLevel(task: Task, index: number = 0): Level {
  // Get image URL from task
  let imageUrl = 'https://picsum.photos/400/400?random=' + (index + 1);
  if (task.Image) {
    if (typeof task.Image === 'string') {
      imageUrl = task.Image;
    } else if (task.Image.url) {
      // Handle Strapi media format
      const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:1337";
      imageUrl = task.Image.url.startsWith("http") 
        ? task.Image.url 
        : `${baseUrl}${task.Image.url}`;
    }
  }

  // Determine difficulty based on Day or default to beginner
  let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  if (task.Day) {
    if (task.Day <= 3) difficulty = 'beginner';
    else if (task.Day <= 7) difficulty = 'intermediate';
    else difficulty = 'advanced';
  }

  return {
    id: task.id || task.documentId || `task_${index}`,
    difficulty,
    targetImageUrl: imageUrl,
    hiddenPromptKeywords: task.idealPrompt?.split(',').map(k => k.trim()) || [],
    passingScore: 75, // Default passing score
    unlocked: index === 0, // First task is unlocked
  };
}

// Fetch levels from API
export async function fetchLevelsFromApi(): Promise<Level[]> {
  try {
    const tasks = await apiClient.getDailyTasks();
    if (tasks && tasks.length > 0) {
      return tasks.map((task, index) => taskToLevel(task, index));
    }
    // If no tasks from API, return fallback
    return FALLBACK_LEVELS;
  } catch (error) {
    console.warn('[Levels] Failed to fetch from API, using fallback:', error);
    return FALLBACK_LEVELS;
  }
}

// Fetch a single level by ID from API
export async function fetchLevelById(id: string): Promise<Level | undefined> {
  try {
    const task = await apiClient.getTaskById(id);
    return taskToLevel(task);
  } catch (error) {
    console.warn('[Levels] Failed to fetch level from API, checking fallback:', error);
    return getLevelById(id);
  }
}

// Legacy functions for backward compatibility
export const LEVELS = FALLBACK_LEVELS;

export function getLevelById(id: string): Level | undefined {
  return LEVELS.find(level => level.id === id);
}

export function getNextLevel(currentId: string): Level | undefined {
  const currentIndex = LEVELS.findIndex(level => level.id === currentId);
  if (currentIndex === -1 || currentIndex === LEVELS.length - 1) {
    return undefined;
  }
  return LEVELS[currentIndex + 1];
}

export function getUnlockedLevels(): Level[] {
  return LEVELS.filter(level => level.unlocked);
}
