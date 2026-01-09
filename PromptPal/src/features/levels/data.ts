import { Level } from '../game/store';

// Sample level data - in production, these would be pre-generated images
// hosted on a CDN and the prompts would be more sophisticated
export const LEVELS: Level[] = [
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
