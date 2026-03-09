import { Level } from '../game/store';
import { convexHttpClient } from '../../lib/convex-client';
import { api } from '../../../convex/_generated/api.js';

// Note: Target images are now stored in Convex and URLs are provided by the backend API
// Local assets are only used for UI display

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

  // Coding Logic levels (code-1-easy through code-15-hard use fallback)
  'code-1-easy': require('../../../assets/images/level-4-image.png'),
  'code-2-easy': require('../../../assets/images/level-5-image.png'),
  'code-3-easy': require('../../../assets/images/level-6-image.png'),

  // Copywriting levels (copywriting-1-easy through copywriting-15-hard)
  'copywriting-1-easy': require('../../../assets/images/level-7-image.png'),
  'copywriting-2-easy': require('../../../assets/images/level-8-image.png'),
  'copywriting-3-easy': require('../../../assets/images/level-9-image.png'),
  'copywriting-4-medium': require('../../../assets/images/level-7-image.png'),
  'copywriting-5-medium': require('../../../assets/images/level-8-image.png'),
  'copywriting-6-medium': require('../../../assets/images/level-9-image.png'),
  'copywriting-7-medium': require('../../../assets/images/level-7-image.png'),
  'copywriting-8-hard': require('../../../assets/images/level-8-image.png'),
  'copywriting-9-hard': require('../../../assets/images/level-9-image.png'),
  'copywriting-10-hard': require('../../../assets/images/level-7-image.png'),
  'copywriting-11-hard': require('../../../assets/images/level-8-image.png'),
  'copywriting-12-hard': require('../../../assets/images/level-9-image.png'),
  'copywriting-13-hard': require('../../../assets/images/level-7-image.png'),
  'copywriting-14-hard': require('../../../assets/images/level-8-image.png'),
  'copywriting-15-hard': require('../../../assets/images/level-9-image.png'),

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

// Note: getHostedImageUrlForLevel removed - backend now provides URLs directly

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

const APP_ID = 'prompt-pal';

const MODULE_ID_BY_TYPE: Record<string, string> = {
  image: 'image-generation',
  code: 'coding-logic',
  copywriting: 'copywriting',
};

// Process API levels to use local assets for images
export function processApiLevelsWithLocalAssets(apiLevels: Level[]): Level[] {
  return apiLevels.map(level => ({
    ...level,
    moduleId: level.moduleId ?? (level.type ? MODULE_ID_BY_TYPE[level.type] : undefined),
    // Only get local image for image-based levels
    targetImageUrl: level.type === 'image' ? getLocalImageForLevel(level.id) : level.targetImageUrl,
  }));
}


// Fetch levels from API
export async function fetchLevelsFromApi(): Promise<Level[]> {
  try {
    const levels = await convexHttpClient.query(api.queries.getLevels, { appId: APP_ID });

    // Process levels to add local assets if needed (or if API returns full URLs, updated logic might be needed)
    // For now, mapping IDs to local assets for consistency as per existing logic
    if (levels && levels.length > 0) {
      return processApiLevelsWithLocalAssets(levels as Level[]);
    }

    // If no levels from API, return empty array (no fallback data)
    return [];
  } catch (error) {
    console.warn('[Levels] Failed to fetch from API:', error);
    return [];
  }
}

// Fetch a single level by ID from API
export async function fetchLevelById(id: string): Promise<Level | undefined> {
  try {
    const level = await convexHttpClient.query(api.queries.getLevelById, { id });

    if (level) {
      // Convert/process if needed, or return directly.
      // Existing logic used taskToLevel. Here we assume Level.
      // We still want local image assets for consistent UI if they use local images.
      const levels = processApiLevelsWithLocalAssets([level as Level]);
      return levels[0];
    }
    return undefined;
  } catch (error) {
    console.warn('[Levels] Failed to fetch level from API:', error);
    return undefined;
  }
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

