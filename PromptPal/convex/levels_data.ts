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

// ===== CODING & LOGIC LEVELS (10 levels) =====

export const codeLevels = [
  // EASY LEVELS (1-3)
  {
    id: "code-1-easy",
    type: "code" as const,
    title: "Hello Function",
    description: "Write a prompt to generate a simple function that returns a greeting",
    difficulty: "beginner" as const,
    passingScore: 70,
    unlocked: true,
    order: 11,
    moduleTitle: "JavaScript Basics",
    requirementBrief: "Create a function that takes a name and returns 'Hello, [name]!'",
    language: "JavaScript",
    testCases: [
      { input: { name: "Alice" }, expectedOutput: "Hello, Alice!", description: "Standard name" },
      { input: { name: "Bob" }, expectedOutput: "Hello, Bob!", description: "Different name" },
      { input: { name: "" }, expectedOutput: "Hello, !", description: "Empty name" }
    ],
    points: 100,
    hints: [
      "Be specific about the function signature",
      "Include examples if needed",
      "Mention the exact return format"
    ],
    estimatedTime: 3,
    tags: ["basics", "functions", "strings"],
    learningObjectives: [
      "Learn to request specific code structures",
      "Understand function signature prompting",
      "Practice output format specification"
    ]
  },
  {
    id: "code-2-easy",
    type: "code" as const,
    title: "Array Filter",
    description: "Generate code to filter numbers greater than a threshold",
    difficulty: "beginner" as const,
    passingScore: 70,
    unlocked: true,
    order: 12,
    moduleTitle: "Array Operations",
    requirementBrief: "Create a function that filters numbers greater than 10",
    language: "JavaScript",
    testCases: [
      { input: { numbers: [5, 15, 8, 20, 3] }, expectedOutput: [15, 20], description: "Mixed array" },
      { input: { numbers: [1, 2, 3] }, expectedOutput: [], description: "All below threshold" },
      { input: { numbers: [11, 12, 13] }, expectedOutput: [11, 12, 13], description: "All above threshold" }
    ],
    points: 100,
    hints: [
      "Explain the filtering logic clearly",
      "Include an example input/output",
      "Specify edge case handling"
    ],
    estimatedTime: 4,
    tags: ["arrays", "filtering", "conditionals"],
    learningObjectives: [
      "Learn logic prompting",
      "Understand array operation requests",
      "Practice edge case specification"
    ]
  },
  {
    id: "code-3-easy",
    type: "code" as const,
    title: "String Manipulation",
    description: "Write a prompt to generate code that capitalizes the first letter",
    difficulty: "beginner" as const,
    passingScore: 70,
    unlocked: true,
    order: 13,
    moduleTitle: "String Operations",
    requirementBrief: "Create a function that capitalizes the first letter of a string",
    language: "JavaScript",
    testCases: [
      { input: { text: "hello" }, expectedOutput: "Hello", description: "Lowercase input" },
      { input: { text: "world" }, expectedOutput: "World", description: "Different word" },
      { input: { text: "" }, expectedOutput: "", description: "Empty string" }
    ],
    points: 100,
    hints: [
      "Be clear about string handling",
      "Specify what happens with empty input",
      "Include character and string operations"
    ],
    estimatedTime: 4,
    tags: ["strings", "manipulation", "characters"],
    learningObjectives: [
      "Learn string operation prompting",
      "Understand character-level requests",
      "Practice edge case descriptions"
    ]
  },

  // MEDIUM LEVELS (4-7)
  {
    id: "code-4-medium",
    type: "code" as const,
    title: "Data Validation",
    description: "Generate code to validate an email address",
    difficulty: "intermediate" as const,
    passingScore: 75,
    unlocked: false,
    order: 14,
    moduleTitle: "Validation",
    requirementBrief: "Create a function that checks if a string is a valid email",
    language: "JavaScript",
    testCases: [
      { input: { email: "test@example.com" }, expectedOutput: true, description: "Valid email" },
      { input: { email: "invalid-email" }, expectedOutput: false, description: "Missing @ symbol" },
      { input: { email: "test@.com" }, expectedOutput: false, description: "Missing domain" },
      { input: { email: "" }, expectedOutput: false, description: "Empty string" }
    ],
    points: 150,
    hints: [
      "Specify the validation rules",
      "Include examples of valid and invalid formats",
      "Mention common edge cases to test"
    ],
    estimatedTime: 8,
    tags: ["validation", "regex", "strings"],
    learningObjectives: [
      "Learn validation logic prompting",
      "Understand edge case requirements",
      "Practice comprehensive testing descriptions"
    ]
  },
  {
    id: "code-5-medium",
    type: "code" as const,
    title: "Async Fetch",
    description: "Write a prompt to generate async code that fetches data",
    difficulty: "intermediate" as const,
    passingScore: 75,
    unlocked: false,
    order: 15,
    moduleTitle: "Asynchronous Programming",
    requirementBrief: "Create an async function that fetches user data and returns name",
    language: "JavaScript",
    testCases: [
      { input: { userId: "123" }, expectedOutput: { name: "John" }, description: "Successful fetch" },
      { input: { userId: "456" }, expectedOutput: { name: "Jane" }, description: "Different user" }
    ],
    points: 150,
    hints: [
      "Specify async/await usage",
      "Include error handling requirements",
      "Describe the API response structure"
    ],
    estimatedTime: 10,
    tags: ["async", "fetch", "api"],
    learningObjectives: [
      "Learn async code prompting",
      "Understand error handling requirements",
      "Practice API interaction descriptions"
    ]
  },
  {
    id: "code-6-medium",
    type: "code" as const,
    title: "Object Transformation",
    description: "Generate code to transform object properties",
    difficulty: "intermediate" as const,
    passingScore: 75,
    unlocked: false,
    order: 16,
    moduleTitle: "Object Manipulation",
    requirementBrief: "Create a function that transforms user object to display format",
    language: "JavaScript",
    testCases: [
      { input: { user: { firstName: "John", lastName: "Doe" } }, expectedOutput: { fullName: "John Doe" }, description: "Standard transformation" },
      { input: { user: { firstName: "Jane", lastName: "Smith", age: 25 } }, expectedOutput: { fullName: "Jane Smith" }, description: "With extra property" }
    ],
    points: 150,
    hints: [
      "Specify the input/output object structure",
      "Mention property mapping logic",
      "Include handling for extra properties"
    ],
    estimatedTime: 7,
    tags: ["objects", "transformation", "mapping"],
    learningObjectives: [
      "Learn object manipulation prompting",
      "Understand structure mapping",
      "Practice property selection"
    ]
  },
  {
    id: "code-7-medium",
    type: "code" as const,
    title: "State Management",
    description: "Write a prompt to generate simple state management code",
    difficulty: "intermediate" as const,
    passingScore: 75,
    unlocked: false,
    order: 17,
    moduleTitle: "State",
    requirementBrief: "Create a simple counter state with increment/decrement",
    language: "JavaScript",
    testCases: [
      { input: { action: "increment" }, expectedOutput: { count: 1 }, description: "First increment" },
      { input: { action: "decrement" }, expectedOutput: { count: 0 }, description: "Decrement from 1" },
      { input: { action: "reset" }, expectedOutput: { count: 0 }, description: "Reset action" }
    ],
    points: 150,
    hints: [
      "Specify state structure and methods",
      "Include action handling logic",
      "Describe initial state"
    ],
    estimatedTime: 8,
    tags: ["state", "management", "actions"],
    learningObjectives: [
      "Learn state management prompting",
      "Understand action patterns",
      "Practice state mutation descriptions"
    ]
  },

  // HARD LEVELS (8-10)
  {
    id: "code-8-hard",
    type: "code" as const,
    title: "Debounce Function",
    description: "Generate a debounce utility function",
    difficulty: "advanced" as const,
    passingScore: 80,
    unlocked: false,
    order: 18,
    moduleTitle: "Advanced Patterns",
    requirementBrief: "Create a debounce function that delays function execution",
    language: "JavaScript",
    testCases: [
      { input: { func: "console.log", delay: 500 }, expectedOutput: "function", description: "Returns wrapped function" }
    ],
    points: 250,
    hints: [
      "Specify timing requirements",
      "Include clearTimeout logic",
      "Describe the return function behavior"
    ],
    estimatedTime: 15,
    tags: ["patterns", "timing", "advanced"],
    learningObjectives: [
      "Master advanced pattern prompting",
      "Learn timing function design",
      "Understand wrapper function logic"
    ]
  },
  {
    id: "code-9-hard",
    type: "code" as const,
    title: "Custom Hook",
    description: "Write a prompt to generate a React custom hook",
    difficulty: "advanced" as const,
    passingScore: 80,
    unlocked: false,
    order: 19,
    moduleTitle: "React Hooks",
    requirementBrief: "Create a useLocalStorage hook with getter/setter",
    language: "JavaScript",
    testCases: [
      { input: { key: "theme", defaultValue: "dark" }, expectedOutput: { value: "dark", set: "function" }, description: "Returns value and setter" }
    ],
    points: 250,
    hints: [
      "Specify hook signature and return",
      "Include useEffect dependency requirements",
      "Describe localStorage interaction"
    ],
    estimatedTime: 18,
    tags: ["react", "hooks", "custom"],
    learningObjectives: [
      "Master React hook prompting",
      "Learn effect and state patterns",
      "Understand persistence integration"
    ]
  },
  {
    id: "code-10-hard",
    type: "code" as const,
    title: "Middleware Pattern",
    description: "Generate code for API request middleware",
    difficulty: "advanced" as const,
    passingScore: 80,
    unlocked: false,
    order: 20,
    moduleTitle: "Architecture",
    requirementBrief: "Create middleware that adds auth headers to requests",
    language: "JavaScript",
    testCases: [
      { input: { token: "abc123" }, expectedOutput: "function", description: "Returns enhanced fetch wrapper" }
    ],
    points: 250,
    hints: [
      "Specify the middleware pattern",
      "Include header modification logic",
      "Describe the request/response flow"
    ],
    estimatedTime: 20,
    tags: ["middleware", "api", "architecture"],
    learningObjectives: [
      "Master architecture pattern prompting",
      "Learn middleware design",
      "Understand request/response interception"
    ]
  }
];

// ===== COPYWRITING LEVELS (10 levels) =====

export const copywritingLevels = [
  // EASY LEVELS (1-3)
  {
    id: "copywriting-1-easy",
    type: "copywriting" as const,
    title: "Product Headline",
    description: "Generate a compelling headline for a simple product",
    difficulty: "beginner" as const,
    passingScore: 70,
    unlocked: true,
    order: 21,
    briefTitle: "Basic Product Description",
    briefProduct: "Stainless Steel Water Bottle",
    briefTarget: "Health-conscious adults",
    briefTone: "Energetic and motivating",
    briefGoal: "Encourage daily water intake",
    points: 100,
    metrics: [
      { name: "Clarity", target: 80, weight: 30 },
      { name: "Persuasiveness", target: 75, weight: 40 },
      { name: "Relevance", target: 85, weight: 30 }
    ],
    hints: [
      "Use action verbs and benefits",
      "Keep it under 10 words",
      "Address the target audience directly"
    ],
    estimatedTime: 4,
    tags: ["headlines", "product", "basics"],
    learningObjectives: [
      "Learn basic headline structure",
      "Understand benefit-driven copy",
      "Practice audience targeting"
    ]
  },
  {
    id: "copywriting-2-easy",
    type: "copywriting" as const,
    title: "Social Media Post",
    description: "Create an engaging social media caption",
    difficulty: "beginner" as const,
    passingScore: 70,
    unlocked: true,
    order: 22,
    briefTitle: "Instagram Caption",
    briefProduct: "Fitness App Launch",
    briefTarget: "Young adults starting fitness journey",
    briefTone: "Encouraging and relatable",
    briefGoal: "Drive app downloads",
    points: 100,
    metrics: [
      { name: "Engagement", target: 75, weight: 40 },
      { name: "Hashtag Quality", target: 80, weight: 30 },
      { name: "Clarity", target: 85, weight: 30 }
    ],
    hints: [
      "Include a call-to-action",
      "Use relevant emojis sparingly",
      "Keep under 150 characters"
    ],
    estimatedTime: 5,
    tags: ["social", "captions", "engagement"],
    learningObjectives: [
      "Learn social media copywriting",
      "Understand character limits",
      "Practice CTA inclusion"
    ]
  },
  {
    id: "copywriting-3-easy",
    type: "copywriting" as const,
    title: "Email Subject",
    description: "Write a compelling email subject line",
    difficulty: "beginner" as const,
    passingScore: 70,
    unlocked: true,
    order: 23,
    briefTitle: "Newsletter Subject",
    briefProduct: "Weekly Tech Tips",
    briefTarget: "Busy professionals",
    briefTone: "Valuable and time-saving",
    briefGoal: "Increase open rates",
    points: 100,
    metrics: [
      { name: "Curiosity", target: 80, weight: 50 },
      { name: "Clarity", target: 85, weight: 30 },
      { name: "Relevance", target: 80, weight: 20 }
    ],
    hints: [
      "Create urgency without being spammy",
      "Hint at specific value",
      "Keep under 50 characters"
    ],
    estimatedTime: 3,
    tags: ["email", "subjects", "open rates"],
    learningObjectives: [
      "Learn email subject line writing",
      "Understand curiosity-driven copy",
      "Practice character constraints"
    ]
  },

  // MEDIUM LEVELS (4-7)
  {
    id: "copywriting-4-medium",
    type: "copywriting" as const,
    title: "Product Description",
    description: "Generate a full product description with benefits",
    difficulty: "intermediate" as const,
    passingScore: 75,
    unlocked: false,
    order: 24,
    briefTitle: "E-commerce Description",
    briefProduct: "Wireless Noise-Canceling Headphones",
    briefTarget: "Remote workers and music lovers",
    briefTone: "Professional yet approachable",
    briefGoal: "Highlight key features and value",
    points: 150,
    metrics: [
      { name: "Feature Clarity", target: 85, weight: 25 },
      { name: "Benefit Emphasis", target: 80, weight: 35 },
      { name: "Readability", target: 80, weight: 20 },
      { name: "Call-to-Action", target: 75, weight: 20 }
    ],
    hints: [
      "Lead with the main benefit",
      "Use bullet points for features",
      "Include social proof elements"
    ],
    estimatedTime: 8,
    tags: ["descriptions", "ecommerce", "features"],
    learningObjectives: [
      "Learn product description structure",
      "Understand benefit-driven copy",
      "Practice feature-highlighting"
    ]
  },
  {
    id: "copywriting-5-medium",
    type: "copywriting" as const,
    title: "Landing Page Copy",
    description: "Create persuasive landing page copy",
    difficulty: "intermediate" as const,
    passingScore: 75,
    unlocked: false,
    order: 25,
    briefTitle: "SaaS Signup Page",
    briefProduct: "Project Management Tool",
    briefTarget: "Small business owners",
    briefTone: "Professional and trustworthy",
    briefGoal: "Convert visitors to signups",
    points: 150,
    metrics: [
      { name: "Value Proposition", target: 80, weight: 30 },
      { name: "Trust Signals", target: 75, weight: 25 },
      { name: "Readability", target: 85, weight: 25 },
      { name: "CTA Strength", target: 80, weight: 20 }
    ],
    hints: [
      "Focus on one main benefit per section",
      "Use social proof and testimonials",
      "Create a clear, compelling CTA"
    ],
    estimatedTime: 12,
    tags: ["landing", "SaaS", "conversion"],
    learningObjectives: [
      "Learn landing page structure",
      "Understand conversion optimization",
      "Practice trust-building copy"
    ]
  },
  {
    id: "copywriting-6-medium",
    type: "copywriting" as const,
    title: "Ad Copy",
    description: "Write persuasive advertisement copy",
    difficulty: "intermediate" as const,
    passingScore: 75,
    unlocked: false,
    order: 26,
    briefTitle: "Display Advertisement",
    briefProduct: "Coffee Subscription Service",
    briefTarget: "Coffee enthusiasts",
    briefTone: "Warm and inviting",
    briefGoal: "Drive subscriptions",
    points: 150,
    metrics: [
      { name: "Hook Quality", target: 80, weight: 30 },
      { name: "Benefit Clarity", target: 75, weight: 30 },
      { name: "Emotional Appeal", target: 70, weight: 25 },
      { name: "Urgency", target: 75, weight: 15 }
    ],
    hints: [
      "Start with a strong hook",
      "Focus on one key benefit",
      "Include a time-limited offer"
    ],
    estimatedTime: 10,
    tags: ["ads", "copy", "persuasion"],
    learningObjectives: [
      "Learn ad copy structure",
      "Understand psychological triggers",
      "Practice urgency and scarcity"
    ]
  },
  {
    id: "copywriting-7-medium",
    type: "copywriting" as const,
    title: "Blog Post Intro",
    description: "Generate an engaging blog post introduction",
    difficulty: "intermediate" as const,
    passingScore: 75,
    unlocked: false,
    order: 27,
    briefTitle: "Educational Blog Post",
    briefProduct: "Time Management Techniques",
    briefTarget: "Productivity-focused professionals",
    briefTone: "Authoritative yet accessible",
    briefGoal: "Hook readers and establish value",
    points: 150,
    metrics: [
      { name: "Hook Strength", target: 80, weight: 35 },
      { name: "Value Promise", target: 75, weight: 35 },
      { name: "Flow", target: 80, weight: 30 }
    ],
    hints: [
      "Start with a relatable problem",
      "Promise a specific solution",
      "Use storytelling techniques"
    ],
    estimatedTime: 10,
    tags: ["blog", "intros", "storytelling"],
    learningObjectives: [
      "Learn blog introduction structure",
      "Understand problem-solution format",
      "Practice storytelling in copy"
    ]
  },

  // HARD LEVELS (8-10)
  {
    id: "copywriting-8-hard",
    type: "copywriting" as const,
    title: "Email Campaign",
    description: "Create a complete email campaign sequence",
    difficulty: "advanced" as const,
    passingScore: 80,
    unlocked: false,
    order: 28,
    briefTitle: "Product Launch Sequence",
    briefProduct: "Premium Online Course Platform",
    briefTarget: "Course creators and educators",
    briefTone: "Professional and aspirational",
    briefGoal: "Drive course signups through multi-touch nurture",
    points: 250,
    metrics: [
      { name: "Narrative Flow", target: 80, weight: 25 },
      { name: "Value Progression", target: 75, weight: 25 },
      { name: "Consistency", target: 85, weight: 25 },
      { name: "Conversion Focus", target: 75, weight: 25 }
    ],
    hints: [
      "Tell a story across the sequence",
      "Escalate value and urgency",
      "Each email should stand alone but connect"
    ],
    estimatedTime: 20,
    tags: ["email", "campaigns", "sequences"],
    learningObjectives: [
      "Master email campaign structure",
      "Learn narrative sequencing",
      "Understand nurture vs. sell approaches"
    ]
  },
  {
    id: "copywriting-9-hard",
    type: "copywriting" as const,
    title: "Brand Voice Guide",
    description: "Generate comprehensive brand voice guidelines",
    difficulty: "advanced" as const,
    passingScore: 80,
    unlocked: false,
    order: 29,
    briefTitle: "Brand Voice Document",
    briefProduct: "Sustainable Fashion Brand",
    briefTarget: "Internal marketing team",
    briefTone: "Clear, inspiring, and actionable",
    briefGoal: "Provide consistent brand voice guidelines",
    points: 250,
    metrics: [
      { name: "Voice Clarity", target: 85, weight: 30 },
      { name: "Example Quality", target: 80, weight: 30 },
      { name: "Comprehensiveness", target: 75, weight: 25 },
      { name: "Practicality", target: 80, weight: 15 }
    ],
    hints: [
      "Include dos and don'ts",
      "Provide multiple copy examples",
      "Define personality traits clearly"
    ],
    estimatedTime: 25,
    tags: ["branding", "voice", "guidelines"],
    learningObjectives: [
      "Master brand voice definition",
      "Learn guideline documentation",
      "Understand consistency principles"
    ]
  },
  {
    id: "copywriting-10-hard",
    type: "copywriting" as const,
    title: "Video Script",
    description: "Write a compelling video sales script",
    difficulty: "advanced" as const,
    passingScore: 80,
    unlocked: false,
    order: 30,
    briefTitle: "Product Launch Video",
    briefProduct: "Revolutionary Smart Home Device",
    briefTarget: "Tech-savvy early adopters",
    briefTone: "Exciting and persuasive",
    briefGoal: "Drive pre-orders through emotional connection",
    points: 250,
    metrics: [
      { name: "Hook Quality", target: 85, weight: 25 },
      { name: "Story Arc", target: 80, weight: 25 },
      { name: "Credibility", target: 75, weight: 25 },
      { name: "CTA Impact", target: 80, weight: 25 }
    ],
    hints: [
      "Start with emotional hook",
      "Build credibility throughout",
      "End with powerful, specific CTA"
    ],
    estimatedTime: 22,
    tags: ["video", "scripts", "sales"],
    learningObjectives: [
      "Master video script structure",
      "Learn emotional storytelling",
      "Understand visual-audio-text coordination"
    ]
  }
];

// Export all levels combined
export const allLevels = [
  ...imageLevels,
  ...codeLevels,
  ...copywritingLevels
];
