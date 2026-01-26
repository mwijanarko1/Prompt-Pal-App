import { Level } from '../game/store';
import { apiClient, Task } from '../../lib/api';

// Sample level data - fallback when API is not available
// In production, these would be fetched from the API
const FALLBACK_LEVELS: Level[] = [
  {
    id: 'level_01',
    moduleId: 'mod_1',
    type: 'image',
    title: 'Surreal Landscapes',
    difficulty: 'beginner',
    targetImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
    hiddenPromptKeywords: ['floating islands', 'nebula', 'waterfall', 'crystals'],
    style: 'Surrealism',
    passingScore: 75,
    unlocked: true,
  },
  {
    id: 'level_02',
    moduleId: 'mod_2',
    type: 'code',
    title: 'Sort Dictionary List',
    moduleTitle: 'Python: Module 4',
    difficulty: 'intermediate',
    requirementBrief: 'Create a prompt that instructs the AI to write a function sort_by_age(data). The function should take a list of dictionaries and return it sorted by the \'age\' key in descending order.',
    requirementImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop',
    language: 'PYTHON 3.10',
    passingScore: 80,
    unlocked: true,
    testCases: [
      { id: '1', name: 'test_sorting_basic', passed: true },
      { id: '2', name: 'test_empty_list', passed: true },
      { id: '3', name: 'test_reverse_order', passed: true },
    ]
  },
  {
    id: 'level_03',
    moduleId: 'mod_3',
    type: 'copywriting',
    title: 'Copywriting Challenge',
    moduleTitle: 'MODULE 3: ENGAGEMENT',
    difficulty: 'advanced',
    briefTitle: 'The Marketing Brief',
    briefProduct: 'Neo-Coffee Social',
    briefTarget: 'Gen Z Urbanites',
    briefTone: 'Bold & Energetic',
    briefGoal: 'Drive subscriptions for sustainable, biodegradable coffee pods. Focus on the intersection of convenience and eco-consciousness.',
    targetImageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=1000&auto=format&fit=crop',
    passingScore: 85,
    unlocked: true,
    metrics: [
      { label: 'TONE', value: 85 },
      { label: 'PERSUASION', value: 72 },
      { label: 'CLARITY', value: 90 },
    ]
  }
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

export function getLevelsByModuleId(moduleId: string): Level[] {
  return LEVELS.filter(level => level.moduleId === moduleId);
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
