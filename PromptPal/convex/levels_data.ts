import { Id } from "./_generated/dataModel";

/**
 * PromptPal Level Designs - 30 levels teaching AI prompting
 * 
 * Each module has 10 levels: 3 easy, 4 medium, 3 hard
 */

// ===== IMAGE GENERATION LEVELS (10 levels) =====

export const imageLevels = [
  // EASY LEVELS (1-3)
  {
    id: "image-1-easy",
    type: "image" as const,
    title: "Color Match",
    description: "Generate a simple solid-colored image that matches the target",
    difficulty: "beginner" as const,
    passingScore: 70,
    unlocked: true,
    order: 1,
    targetImageUrl: "https://diligent-terrier-105.convex.cloud/api/storage/kg2czbmac17yhxehjed4jh8fh9809b5w",
    hiddenPromptKeywords: [],
    style: "Minimalist",
    points: 100,
    hints: [
      "Think about the exact color and shade needed",
      "Simple descriptions often work better for solid colors",
      "Include lighting context if needed (e.g., 'soft lighting')"
    ],
    estimatedTime: 2,
    tags: ["basics", "color", "simple"],
    learningObjectives: [
      "Learn basic prompt structure",
      "Understand color description",
      "Practice simplicity in prompting"
    ]
  },
  {
    id: "image-2-easy",
    type: "image" as const,
    title: "Basic Shape",
    description: "Create an image of a simple geometric shape",
    difficulty: "beginner" as const,
    passingScore: 70,
    unlocked: true,
    order: 2,
    targetImageUrl: "https://diligent-terrier-105.convex.cloud/api/storage/kg2fsmceyg0q50scm74zqkgy71809vhj",
    hiddenPromptKeywords: ["triangle", "square", "circle"],
    style: "Clean",
    points: 100,
    hints: [
      "Describe the shape precisely without naming it",
      "Include details like edges, lighting, and texture",
      "Consider the background and composition"
    ],
    estimatedTime: 3,
    tags: ["basics", "shapes", "composition"],
    learningObjectives: [
      "Practice descriptive prompting",
      "Learn to describe without direct naming",
      "Understand basic composition"
    ]
  },
  {
    id: "image-3-easy",
    type: "image" as const,
    title: "Simple Object",
    description: "Generate an everyday object with specific characteristics",
    difficulty: "beginner" as const,
    passingScore: 70,
    unlocked: true,
    order: 3,
    targetImageUrl: "https://diligent-terrier-105.convex.cloud/api/storage/kg2ec82prj9f66jj0x7w5jc429808z0q",
    hiddenPromptKeywords: ["coffee mug", "cup"],
    style: "Product photography",
    points: 100,
    hints: [
      "Focus on materials and texture",
      "Describe the object's main features",
      "Include context like 'on a wooden table' if visible"
    ],
    estimatedTime: 4,
    tags: ["objects", "materials", "texture"],
    learningObjectives: [
      "Learn to describe objects by features",
      "Practice material descriptions",
      "Understand context importance"
    ]
  },

  // MEDIUM LEVELS (4-7)
  {
    id: "image-4-medium",
    type: "image" as const,
    title: "Architectural Rendering",
    description: "Create a detailed architectural visualization of a building",
    difficulty: "intermediate" as const,
    passingScore: 75,
    unlocked: false,
    order: 4,
    targetImageUrl: "https://diligent-terrier-105.convex.cloud/api/storage/kg2czbmac17yhxehjed4jh8fh9809b5w",
    hiddenPromptKeywords: ["modern", "glass", "geometric", "clean lines"],
    style: "Architectural visualization",
    points: 150,
    hints: [
      "Describe structural elements and materials",
      "Include lighting and perspective details",
      "Consider scale and proportions"
    ],
    estimatedTime: 8,
    tags: ["architecture", "buildings", "technical"],
    learningObjectives: [
      "Learn to describe complex technical subjects",
      "Practice structural and material prompting",
      "Understand architectural visualization techniques"
    ]
  },
  {
    id: "image-5-medium",
    type: "image" as const,
    title: "Landscape Scene",
    description: "Generate a scenic landscape with specific time of day",
    difficulty: "intermediate" as const,
    passingScore: 75,
    unlocked: false,
    order: 5,
    targetImageUrl: "https://diligent-terrier-105.convex.cloud/api/storage/kg23j6335pwdzwxjr1dpenpaxn809804",
    hiddenPromptKeywords: ["sunset", "mountains", "lake"],
    style: "Photorealistic",
    points: 150,
    hints: [
      "Describe the lighting and atmosphere",
      "Include foreground, midground, and background elements",
      "Use words like 'golden hour' or 'dramatic clouds'"
    ],
    estimatedTime: 8,
    tags: ["landscapes", "lighting", "atmosphere"],
    learningObjectives: [
      "Learn atmospheric prompting",
      "Practice scene composition",
      "Understand lighting descriptions"
    ]
  },
  {
    id: "image-6-medium",
    type: "image" as const,
    title: "Food Photography",
    description: "Create a professional food image with specific styling",
    difficulty: "intermediate" as const,
    passingScore: 75,
    unlocked: false,
    order: 6,
    targetImageUrl: "https://diligent-terrier-105.convex.cloud/api/storage/kg2deg90t101ge2cgzkdj2hjt9808b2v",
    hiddenPromptKeywords: ["burger", "fries", "garnish"],
    style: "Commercial food photography",
    points: 150,
    hints: [
      "Describe textures and garnish details",
      "Include plating and presentation",
      "Mention lighting type (soft, backlit, etc.)"
    ],
    estimatedTime: 7,
    tags: ["food", "commercial", "styling"],
    learningObjectives: [
      "Learn professional food photography prompts",
      "Practice texture descriptions",
      "Understand styling terminology"
    ]
  },
  {
    id: "image-7-medium",
    type: "image" as const,
    title: "Abstract Art",
    description: "Generate an abstract piece with specific color palette and style",
    difficulty: "intermediate" as const,
    passingScore: 75,
    unlocked: false,
    order: 7,
    targetImageUrl: "https://diligent-terrier-105.convex.cloud/api/storage/kg2cf5vnf8y81xw1tj40w8g9q5809gz5",
    hiddenPromptKeywords: ["blue", "orange", "geometric"],
    style: "Abstract expressionism",
    points: 150,
    hints: [
      "Describe the visual flow and energy",
      "Mention art movement or inspiration",
      "Use evocative words for abstract concepts"
    ],
    estimatedTime: 8,
    tags: ["abstract", "art", "creativity"],
    learningObjectives: [
      "Learn abstract description techniques",
      "Practice creative prompting",
      "Understand artistic style references"
    ]
  },

  // HARD LEVELS (8-10)
  {
    id: "image-8-hard",
    type: "image" as const,
    title: "Mechanical Assembly",
    description: "Create a detailed technical illustration of complex machinery",
    difficulty: "advanced" as const,
    passingScore: 80,
    unlocked: false,
    order: 8,
    targetImageUrl: "https://diligent-terrier-105.convex.cloud/api/storage/kg2a7tyyc4fh2nxv76r961d079808qjz",
    hiddenPromptKeywords: ["gears", "precision", "industrial", "metallic"],
    style: "Technical illustration",
    points: 250,
    hints: [
      "Describe mechanical components and their interactions",
      "Include precise measurements and tolerances",
      "Specify materials, textures, and lighting effects"
    ],
    estimatedTime: 15,
    tags: ["mechanical", "technical", "precision"],
    learningObjectives: [
      "Master complex technical description",
      "Learn precision and detail prompting",
      "Understand industrial visualization techniques"
    ]
  },
  {
    id: "image-9-hard",
    type: "image" as const,
    title: "Complex Scene",
    description: "Generate a multi-element scene with action and interaction",
    difficulty: "advanced" as const,
    passingScore: 80,
    unlocked: false,
    order: 9,
    targetImageUrl: "https://diligent-terrier-105.convex.cloud/api/storage/kg29kq8hf09g871vyt63t8kzp1808wac",
    hiddenPromptKeywords: ["street", "rain", "umbrella", "neon lights"],
    style: "Cinematic",
    points: 250,
    hints: [
      "Describe the action and relationship between elements",
      "Include environmental details and atmosphere",
      "Mention camera perspective and depth"
    ],
    estimatedTime: 15,
    tags: ["scenes", "cinematic", "complex"],
    learningObjectives: [
      "Learn complex scene composition",
      "Practice action and interaction prompting",
      "Master cinematic descriptions"
    ]
  },
  {
    id: "image-10-hard",
    type: "image" as const,
    title: "Product Visualization",
    description: "Create a professional product shot with specific branding feel",
    difficulty: "advanced" as const,
    passingScore: 80,
    unlocked: false,
    order: 10,
    targetImageUrl: "https://diligent-terrier-105.convex.cloud/api/storage/kg22xchz6rff36ghgfszh709p1809hmb",
    hiddenPromptKeywords: ["smartphone", "elegant", "minimal", "studio lighting"],
    style: "Luxury product photography",
    points: 250,
    hints: [
      "Describe the product's materials and finish",
      "Include premium lighting reflections",
      "Specify the brand mood and positioning"
    ],
    estimatedTime: 15,
    tags: ["product", "commercial", "premium"],
    learningObjectives: [
      "Master commercial product prompting",
      "Learn luxury aesthetic descriptions",
      "Understand branding through imagery"
    ]
  }
];

// ===== CODING & LOGIC LEVELS (onboarding-style prompt-for-UI lessons) =====

import { codingLessons } from "./coding_lessons_data";
import { copywritingLessons } from "./copywriting_lessons_data";
import { questLevelsData } from "./quest_levels_data";

/** Map onboarding-style coding lessons to level format for seeding */
function mapCodingLessonToLevel(
  lesson: (typeof codingLessons)[0],
  index: number
) {
  const order = 11 + index;
  const difficulty =
    index < 5 ? "beginner" : index < 10 ? "intermediate" : "advanced";
  return {
    id: lesson.id,
    type: "code" as const,
    title: lesson.title,
    description: lesson.instruction,
    difficulty: difficulty as "beginner" | "intermediate" | "advanced",
    passingScore: 70,
    unlocked: index < 3,
    order,
    instruction: lesson.instruction,
    hints: [lesson.hint],
    starterCode: lesson.starterCode,
    grading: lesson.grading,
    failState: lesson.failState,
    successState: lesson.successState,
    lessonTakeaway: lesson.lessonTakeaway,
    learningObjectives: [lesson.lessonTakeaway],
    points: 100,
    estimatedTime: 6,
    tags: ["prompting", "web", "ui"],
    language: "html",
  };
}

export const codeLevels = codingLessons.map(mapCodingLessonToLevel);

/** Map copywriting lessons to level format for seeding */
function mapCopyLessonToLevel(
  lesson: (typeof copywritingLessons)[0],
  index: number
) {
  const order = 21 + index;
  const difficulty =
    index < 5 ? "beginner" : index < 10 ? "intermediate" : "advanced";
  return {
    id: lesson.id,
    type: "copywriting" as const,
    title: lesson.title,
    description: lesson.instruction,
    difficulty: difficulty as "beginner" | "intermediate" | "advanced",
    passingScore: 70,
    unlocked: index < 3,
    order,
    instruction: lesson.instruction,
    hints: [lesson.hint],
    starterContext: lesson.starterContext,
    grading: lesson.grading,
    failState: lesson.failState,
    successState: lesson.successState,
    lessonTakeaway: lesson.lessonTakeaway,
    learningObjectives: [lesson.lessonTakeaway],
    points: 100,
    estimatedTime: 8,
    tags: ["copywriting", "prompting", "voice"],
    wordLimit: { max: 800 },
  };
}

export const copywritingLevels = copywritingLessons.map(mapCopyLessonToLevel);

// Export all levels combined (no separate onboarding level - onboarding uses copywriting-1-easy)
export const allLevels = [
  ...imageLevels,
  ...codeLevels,
  ...copywritingLevels,
  ...questLevelsData,
];
