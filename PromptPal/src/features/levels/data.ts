import { Level } from '../game/store';
import { apiClient, Task } from '../../lib/api';

// Pre-import local level images mapped by API level ID for instant loading
// Map API level IDs (e.g., "image-1-easy") to local assets
const LEVEL_IMAGE_ASSETS = {
  // Beginner levels
  'image-1-easy': require('../../../assets/images/level-1-image.png'),
  'image-2-easy': require('../../../assets/images/level-2-image.png'),
  'image-3-easy': require('../../../assets/images/level-3-image.png'),

  // Intermediate levels
  'image-4-medium': require('../../../assets/images/level-4-image.png'),
  'image-5-medium': require('../../../assets/images/level-5-image.png'),
  'image-6-medium': require('../../../assets/images/level-6-image.png'),
  'image-7-medium': require('../../../assets/images/level-7-image.png'),

  // Advanced levels
  'image-8-hard': require('../../../assets/images/level-8-image.png'),
  'image-9-hard': require('../../../assets/images/level-9-image.png'),
  'image-10-hard': require('../../../assets/images/level-10-image.png'),

  // Alternative ID formats for backward compatibility
  'level-1': require('../../../assets/images/level-1-image.png'),
  'level-2': require('../../../assets/images/level-2-image.png'),
  'level-3': require('../../../assets/images/level-3-image.png'),
  'level-4': require('../../../assets/images/level-4-image.png'),
  'level-5': require('../../../assets/images/level-5-image.png'),
  'level-6': require('../../../assets/images/level-6-image.png'),
  'level-7': require('../../../assets/images/level-7-image.png'),
  'level-8': require('../../../assets/images/level-8-image.png'),
  'level-9': require('../../../assets/images/level-9-image.png'),
  'level-10': require('../../../assets/images/level-10-image.png'),
} as const;

// Helper function to get local image asset for a level ID
function getLocalImageForLevel(levelId: string): any {
  const image = LEVEL_IMAGE_ASSETS[levelId as keyof typeof LEVEL_IMAGE_ASSETS];
  if (!image) {
    console.warn(`[Levels] No local image asset found for level ${levelId}, using fallback`);
    // Return first available image as fallback
    return Object.values(LEVEL_IMAGE_ASSETS)[0] || null;
  }
  return image;
}

// Process API levels to use local assets for images
export function processApiLevelsWithLocalAssets(apiLevels: Level[]): Level[] {
  return apiLevels.map(level => ({
    ...level,
    targetImageUrl: getLocalImageForLevel(level.id), // Override API image with local asset
  }));
}


// Validation helper to ensure we have enough assets for configured levels
function validateLevelAssets(): void {
  const configCount = LEVEL_CONFIGS.length;
  const assetCount = Object.keys(LEVEL_IMAGE_ASSETS).length;

  if (configCount > assetCount) {
    console.warn(`[Levels] More level configs (${configCount}) than image assets (${assetCount}). Some levels will use fallback images.`);
  }
}

/**
 * LEVEL CONFIGURATION - How to Add New Levels
 *
 * 1. Add image asset to: PromptPal/assets/images/level-X-image.png
 * 2. Add entry to levelImages object above with next index
 * 3. Add new config object to LEVEL_CONFIGS array below
 * 4. Update prerequisites of next level (if any)
 *
 * That's it! The system automatically maps configs to assets by index.
 */

// Level configuration for local fallback - matches API level IDs
// These are used when API is unavailable and should match your API level IDs
const LEVEL_CONFIGS = [
  {
    id: 'image-1-easy',
    moduleId: 'image-generation',
    type: 'image' as const,
    title: 'Brass Key',
    difficulty: 'beginner' as const,
    hiddenPromptKeywords: ['brass', 'key', 'velvet', 'cushion', 'weathered'] as string[],
    style: 'Realistic',
    passingScore: 75,
    unlocked: true,
    prerequisites: [] as string[],
  },
  {
    id: 'image-2-easy',
    moduleId: 'image-generation',
    type: 'image' as const,
    title: 'Porcelain Teacups',
    difficulty: 'beginner' as const,
    hiddenPromptKeywords: ['porcelain', 'teacups', 'stack', 'marble', 'pedestal'] as string[],
    style: 'Elegant',
    passingScore: 75,
    unlocked: false,
    prerequisites: ['image-1-easy'] as string[],
  },
  {
    id: 'image-3-easy',
    moduleId: 'image-generation',
    type: 'image' as const,
    title: 'Rain Gear',
    difficulty: 'beginner' as const,
    hiddenPromptKeywords: ['yellow', 'raincoat', 'wooden', 'hook', 'umbrella', 'wet'] as string[],
    style: 'Realistic',
    passingScore: 75,
    unlocked: false,
    prerequisites: ['image-2-easy'] as string[],
  },
] as const;

// Dynamic level data created from local assets when API is not available
export function createLocalLevelsFromAssets(): Level[] {
  // Validate we have enough assets for the configured levels
  validateLevelAssets();

  return LEVEL_CONFIGS.map((config) => ({
    ...config,
    targetImageUrl: getLocalImageForLevel(config.id),
  }));
}

// Convert API Task to Level format

function taskToLevel(task: Task, index: number = 0): Level {
  // Use local assets for target images - ignore API image URLs
  // Prefer task.id/documentId from API, fallback to generated ID
  const levelId = task.id || task.documentId || task.name || `task_${index}`;
  const localImageUrl = getLocalImageForLevel(levelId);

  // Determine difficulty based on Day or default to beginner
  let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  if (task.Day) {
    if (task.Day <= 3) difficulty = 'beginner';
    else if (task.Day <= 7) difficulty = 'intermediate';
    else difficulty = 'advanced';
  }

  // Prerequisites: All previous tasks in the sequence
  const prerequisites = index > 0
    ? Array.from({ length: index }, (_, i) => `task_${i}`)
    : [];

  return {
    id: levelId,
    type: 'image', // Default to image type since Task interface doesn't have type
    title: task.name || `Level ${index + 1}`, // Use task name as title
    difficulty,
    targetImageUrl: localImageUrl, // Always use local asset
    hiddenPromptKeywords: task.idealPrompt?.split(',').map(k => k.trim()) || [],
    passingScore: 75, // Default passing score since Task interface doesn't have it
    unlocked: index === 0, // First task is unlocked
    prerequisites,
  };
}

// Fetch levels from API
export async function fetchLevelsFromApi(): Promise<Level[]> {
  try {
    const tasks = await apiClient.getDailyTasks();
    if (tasks && tasks.length > 0) {
      return tasks.map((task, index) => taskToLevel(task, index));
    }
    // If no tasks from API, return empty array (no fallback data)
    return [];
  } catch (error) {
    console.warn('[Levels] Failed to fetch from API:', error);
    return [];
  }
}

// Fetch a single level by ID from API
export async function fetchLevelById(id: string): Promise<Level | undefined> {
  try {
    const task = await apiClient.getTaskById(id);
    return taskToLevel(task);
  } catch (error) {
    console.warn('[Levels] Failed to fetch level from API:', error);
    return getLevelById(id);
  }
}

// Legacy functions for backward compatibility
export function getLevelById(id: string): Level | undefined {
  // First try to find in local configs
  const localLevels = createLocalLevelsFromAssets();
  const localLevel = localLevels.find(level => level.id === id);
  if (localLevel) return localLevel;

  // If not found, return undefined (let API handle it)
  return undefined;
}

export function getLevelsByModuleId(moduleId: string): Level[] {
  // Get levels from local assets when API is not available
  const localLevels = createLocalLevelsFromAssets();
  return localLevels.filter(level => level.moduleId === moduleId);
}

export function getNextLevel(currentId: string): Level | undefined {
  const localLevels = createLocalLevelsFromAssets();
  const currentIndex = localLevels.findIndex(level => level.id === currentId);
  if (currentIndex === -1 || currentIndex === localLevels.length - 1) {
    return undefined;
  }
  return localLevels[currentIndex + 1];
}

export function getUnlockedLevels(): Level[] {
  const localLevels = createLocalLevelsFromAssets();
  return localLevels.filter(level => level.unlocked);
}

/**
 * Checks if a level is unlocked based on its prerequisites
 * @param level - The level to check
 * @param completedLevels - Array of completed level IDs
 * @returns Whether the level is unlocked
 */
export function isLevelUnlocked(level: Level, completedLevels: string[] = []): boolean {
  if (!level.prerequisites || level.prerequisites.length === 0) {
    return level.unlocked;
  }

  const allPrerequisitesMet = level.prerequisites.every(prereqId =>
    completedLevels.includes(prereqId)
  );

  return level.unlocked && allPrerequisitesMet;
}

/**
 * Gets all levels that should be unlocked based on completed levels
 * @param completedLevels - Array of completed level IDs
 * @returns Array of unlocked levels
 */
export function getUnlockedLevelsByProgress(completedLevels: string[]): Level[] {
  const localLevels = createLocalLevelsFromAssets();
  return localLevels.filter(level => isLevelUnlocked(level, completedLevels));
}

/**
 * Gets the next level that should be unlocked after completing a level
 * @param completedLevelId - The ID of the completed level
 * @returns The next level to unlock, or null if none
 */
export function getNextUnlockableLevel(completedLevelId: string): Level | null {
  const localLevels = createLocalLevelsFromAssets();
  const lockedLevels = localLevels.filter(level => !level.unlocked);

  return lockedLevels.find(level =>
    level.prerequisites?.includes(completedLevelId)
  ) || null;
}

