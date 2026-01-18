import { Level } from '../game/store';

// Comprehensive level data supporting all three modules
export const LEVELS: Level[] = [
  // Image Module Levels
  {
    id: 'image_01',
    module: 'image',
    difficulty: 'beginner',
    title: 'Cyberpunk Cat',
    description: 'Generate an image of a cat in a cyberpunk setting',
    targetImageUrl: 'https://picsum.photos/400/400?random=1',
    hiddenPromptKeywords: ['cat', 'cyberpunk', 'neon', 'glowing eyes'],
    targetPrompt: 'A sleek black cat with glowing neon blue eyes, sitting on a futuristic rooftop at night in a cyberpunk city with neon lights reflecting off wet streets',
    passingScore: 75,
    points: 100,
    unlocked: true,
  },
  {
    id: 'image_02',
    module: 'image',
    difficulty: 'beginner',
    title: 'Mountain Sunset',
    description: 'Create a serene mountain landscape at sunset',
    targetImageUrl: 'https://picsum.photos/400/400?random=2',
    hiddenPromptKeywords: ['mountain', 'sunset', 'waterfall', 'peaceful'],
    targetPrompt: 'Majestic mountain peaks silhouetted against an orange and pink sunset sky, with a cascading waterfall in the foreground and pine trees dotting the landscape',
    passingScore: 75,
    points: 100,
    unlocked: false,
  },
  {
    id: 'image_03',
    module: 'image',
    difficulty: 'intermediate',
    title: 'Rainy City Night',
    description: 'Depict a bustling city street in the rain at night',
    targetImageUrl: 'https://picsum.photos/400/400?random=3',
    hiddenPromptKeywords: ['city', 'night', 'rain', 'streetlights', 'umbrella'],
    targetPrompt: 'A busy city street at night during heavy rain, with glowing streetlights creating reflections on wet pavement, people with umbrellas hurrying by, and neon signs illuminating the scene',
    passingScore: 80,
    points: 150,
    unlocked: false,
  },

  // Code Module Levels
  {
    id: 'code_01',
    module: 'code',
    difficulty: 'beginner',
    title: 'Hello World Function',
    description: 'Write a function that returns a greeting message',
    language: 'javascript',
    targetCode: 'function greet(name) {\n  return `Hello, ${name}! Welcome to PromptPal!`;\n}',
    instructions: 'Create a function called greet that takes a name parameter and returns a greeting message.',
    testCases: [
      { input: 'Alice', expectedOutput: 'Hello, Alice! Welcome to PromptPal!', description: 'Basic greeting' },
      { input: 'Bob', expectedOutput: 'Hello, Bob! Welcome to PromptPal!', description: 'Another name' },
    ],
    passingScore: 80,
    points: 120,
    unlocked: false,
  },
  {
    id: 'code_02',
    module: 'code',
    difficulty: 'beginner',
    title: 'Array Sum Calculator',
    description: 'Write a function that calculates the sum of numbers in an array',
    language: 'javascript',
    targetCode: 'function sumArray(numbers) {\n  let sum = 0;\n  for (let i = 0; i < numbers.length; i++) {\n    sum += numbers[i];\n  }\n  return sum;\n}',
    instructions: 'Create a function called sumArray that takes an array of numbers and returns their sum.',
    testCases: [
      { input: [1, 2, 3, 4, 5], expectedOutput: 15, description: 'Basic sum' },
      { input: [10, 20, 30], expectedOutput: 60, description: 'Different numbers' },
      { input: [], expectedOutput: 0, description: 'Empty array' },
    ],
    passingScore: 80,
    points: 120,
    unlocked: false,
  },

  // Copy Module Levels
  {
    id: 'copy_01',
    module: 'copy',
    difficulty: 'beginner',
    title: 'Product Description',
    description: 'Write compelling copy for a new fitness app',
    targetCopy: 'Transform your fitness journey with FitFlow, the revolutionary app that adapts to your lifestyle. Whether you\'re a busy professional or a weekend warrior, our AI-powered workout plans and real-time progress tracking ensure you stay motivated and achieve your goals. Download now and start your transformation today!',
    context: 'Mobile app marketing copy for a fitness tracking application',
    tone: 'motivational and energetic',
    wordCount: 75,
    passingScore: 75,
    points: 110,
    unlocked: false,
  },
  {
    id: 'copy_02',
    module: 'copy',
    difficulty: 'beginner',
    title: 'Restaurant Menu Item',
    description: 'Create an appetizing description for a signature dish',
    targetCopy: 'Indulge in our signature Truffle Risotto, where creamy Arborio rice meets the earthy elegance of black truffles, finished with a generous grating of aged Parmesan and a drizzle of truffle oil. Each spoonful delivers a symphony of flavors that transports you to the rolling hills of Piedmont.',
    context: 'Fine dining restaurant menu description',
    tone: 'elegant and descriptive',
    wordCount: 65,
    passingScore: 75,
    points: 110,
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
